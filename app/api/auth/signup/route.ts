import { NextResponse } from 'next/server';
import { signJwt } from '@/lib/auth/jwt';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { name, badgeId, email, supervisor, role, password, facilityNode } = await req.json();

    if (!name || !badgeId || !email || !password) {
      return NextResponse.json(
        { error: 'All fields marked with an asterisk are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password PIN must be at least 6 characters' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = ['Supervisor', 'Operator', 'Auditor'].includes(role) ? role : 'Operator';
    const userId = `usr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

    // Try creating user in Supabase Auth as well
    try {
      const supabase = createAdminClient();
      await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: name,
            badge_id: badgeId,
            role: cleanRole,
            supervisor_approver: supervisor,
          },
        },
      });
    } catch (e) {
      console.warn('Supabase Auth optional signup note:', e);
    }

    // Generate signed JWT token
    const token = signJwt({
      sub: userId,
      email: cleanEmail,
      name,
      role: cleanRole as any,
      badgeId,
      warehouseName: facilityNode || 'Central Warehouse (WH-01)',
    });

    const userProfile = {
      id: userId,
      email: cleanEmail,
      name,
      role: cleanRole,
      badgeId,
      warehouseName: facilityNode || 'Central Warehouse (WH-01)',
      terminal: 'Operator Clearance Assigned',
    };

    const res = NextResponse.json(
      {
        success: true,
        message: `Clearance granted. Terminal access issued for ${name} (${cleanRole}).`,
        token,
        user: userProfile,
      },
      { status: 201 }
    );

    res.cookies.set('stocksense_jwt', token, {
      path: '/',
      maxAge: 43200,
      httpOnly: false,
      sameSite: 'lax',
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Registration error' }, { status: 500 });
  }
}
