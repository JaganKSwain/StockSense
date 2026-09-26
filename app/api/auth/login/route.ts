import { NextResponse } from 'next/server';
import { PRESET_USERS } from '@/lib/auth/users';
import { signJwt } from '@/lib/auth/jwt';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { identifier, password, facilityNode } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Operator Identity (Email/Badge) and Security PIN are required' },
        { status: 400 }
      );
    }

    const cleanId = String(identifier).trim().toLowerCase();

    // 1. Check in PRESET_USERS
    let matchedUser = PRESET_USERS.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.badgeId.toLowerCase() === cleanId
    );

    // 2. If not in presets, check Supabase Auth
    if (!matchedUser) {
      try {
        const supabase = createAdminClient();
        const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
          email: cleanId,
          password,
        });

        if (!authErr && authData?.user) {
          const meta = authData.user.user_metadata || {};
          matchedUser = {
            id: authData.user.id,
            email: authData.user.email || cleanId,
            passwordHash: '',
            name: meta.full_name || meta.name || 'Operator',
            role: meta.role || 'Operator',
            badgeId: meta.badge_id || 'OP-NEW',
            warehouseId: meta.warehouse_id || '11111111-1111-1111-1111-111111111111',
            warehouseName: facilityNode || 'Central Warehouse (WH-01)',
            terminal: 'Operator Terminal Ingress',
          };
        }
      } catch (e) {
        console.warn('Supabase Auth check fallback:', e);
      }
    }

    // 3. Verify password for preset users
    if (matchedUser && matchedUser.passwordHash && matchedUser.passwordHash !== password) {
      return NextResponse.json(
        { error: 'Invalid security PIN or credentials. Access denied.' },
        { status: 401 }
      );
    }

    if (!matchedUser) {
      return NextResponse.json(
        { error: 'Operator identity not recognized. Request terminal clearance to enroll.' },
        { status: 401 }
      );
    }

    // 4. Generate signed JWT token
    const token = signJwt({
      sub: matchedUser.id,
      email: matchedUser.email,
      name: matchedUser.name,
      role: matchedUser.role,
      badgeId: matchedUser.badgeId,
      warehouseId: matchedUser.warehouseId,
      warehouseName: facilityNode || matchedUser.warehouseName,
    });

    const userProfile = {
      id: matchedUser.id,
      email: matchedUser.email,
      name: matchedUser.name,
      role: matchedUser.role,
      badgeId: matchedUser.badgeId,
      warehouseName: facilityNode || matchedUser.warehouseName,
      terminal: matchedUser.terminal,
    };

    const res = NextResponse.json({
      success: true,
      message: `Authentication successful. Terminal session issued for ${matchedUser.name}.`,
      token,
      user: userProfile,
    });

    // Set cookie for session persistence
    res.cookies.set('stocksense_jwt', token, {
      path: '/',
      maxAge: 43200, // 12 hours
      httpOnly: false, // accessible to client for offline headers
      sameSite: 'lax',
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Authentication error' }, { status: 500 });
  }
}
