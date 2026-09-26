import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 1. Read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valParts] = trimmed.split('=');
      const val = valParts.join('=').trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase URL or Service Role Key');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const defaultUsers = [
  {
    email: 'supervisor@stocksense.io',
    password: 'StockSense2026!',
    user_metadata: {
      full_name: 'Priya Sharma',
      badge_id: 'SUP-01',
      role: 'Supervisor',
      warehouse_id: '11111111-1111-1111-1111-111111111111',
      warehouse_name: 'Central Warehouse (WH-01)',
      terminal: 'Austin Central Ingress Term-01',
    },
  },
  {
    email: 'operator@stocksense.io',
    password: 'StockSense2026!',
    user_metadata: {
      full_name: 'Marcus Vance',
      badge_id: 'OP-88219',
      role: 'Operator',
      warehouse_id: '11111111-1111-1111-1111-111111111111',
      warehouse_name: 'Central Warehouse (WH-01)',
      terminal: 'Floor Terminal Term-WH01-ING-09',
    },
  },
  {
    email: 'auditor@stocksense.io',
    password: 'StockSense2026!',
    user_metadata: {
      full_name: 'Elena Rostova',
      badge_id: 'AUD-04',
      role: 'Auditor',
      warehouse_id: '11111111-1111-1111-1111-111111111111',
      warehouse_name: 'Central Warehouse (WH-01)',
      terminal: 'Audit & Compliance Console',
    },
  },
];

async function seedUsers() {
  console.log('🔐 Seeding Supabase Auth Demo Users with JWT authentication...');

  const { data: existing, error: listErr } = await adminClient.auth.admin.listUsers();
  if (listErr) {
    console.error('Failed to list existing users:', listErr.message);
  }

  const existingEmails = new Set((existing?.users || []).map((u) => u.email));

  for (const user of defaultUsers) {
    if (existingEmails.has(user.email)) {
      console.log(`ℹ User already exists: ${user.email}, updating password & metadata...`);
      const existingUser = existing.users.find((u) => u.email === user.email);
      const { error: updErr } = await adminClient.auth.admin.updateUserById(existingUser.id, {
        password: user.password,
        user_metadata: user.user_metadata,
        email_confirm: true,
      });
      if (updErr) console.error(`Failed to update ${user.email}:`, updErr.message);
      else console.log(`✅ Updated ${user.email} (${user.user_metadata.role})`);
    } else {
      console.log(`✨ Creating new auth user: ${user.email}...`);
      const { data, error: createErr } = await adminClient.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: user.user_metadata,
        email_confirm: true,
      });
      if (createErr) console.error(`Failed to create ${user.email}:`, createErr.message);
      else console.log(`✅ Created ${user.email} (${user.user_metadata.role}) ID: ${data?.user?.id}`);
    }
  }

  console.log('\n🎉 Auth seed complete! Credentials:');
  console.table(
    defaultUsers.map((u) => ({
      Name: u.user_metadata.full_name,
      Role: u.user_metadata.role,
      Email: u.email,
      Password: u.password,
      Badge: u.user_metadata.badge_id,
    }))
  );
}

seedUsers().catch(console.error);
