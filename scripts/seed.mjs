import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Read .env.local if present
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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment or .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function seed() {
  console.log('🌱 Starting StockSense seed...');

  // 1. Warehouses
  const warehouses = [
    { id: '11111111-1111-1111-1111-111111111111', name: 'Central Warehouse' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'East Logistics Hub' },
  ];
  const { error: wError } = await supabase.from('warehouses').upsert(warehouses);
  if (wError) console.error('Warehouses insert error:', wError.message);
  else console.log('✅ Warehouses seeded');

  // 2. Locations
  const locations = [
    { id: 'aaaa1111-1111-1111-1111-111111111111', warehouse_id: '11111111-1111-1111-1111-111111111111', name: 'Main Store' },
    { id: 'aaaa2222-2222-2222-2222-222222222222', warehouse_id: '11111111-1111-1111-1111-111111111111', name: 'Production Rack' },
    { id: 'aaaa3333-3333-3333-3333-333333333333', warehouse_id: '11111111-1111-1111-1111-111111111111', name: 'Shipping Bay' },
    { id: 'bbbb1111-1111-1111-1111-111111111111', warehouse_id: '22222222-2222-2222-2222-222222222222', name: 'Bulk Storage' },
  ];
  const { error: lError } = await supabase.from('locations').upsert(locations);
  if (lError) console.error('Locations insert error:', lError.message);
  else console.log('✅ Locations seeded');

  // 3. Products
  const products = [
    { id: 'ffff1111-1111-1111-1111-111111111111', sku: 'RAW-STL-001', name: 'Steel Rods 12mm', category: 'Raw Materials', unit: 'kg', low_stock_threshold: 10 },
    { id: 'ffff2222-2222-2222-2222-222222222222', sku: 'PRT-HYD-102', name: 'Hydraulic Pumps HP-20', category: 'Components', unit: 'unit', low_stock_threshold: 5 },
    { id: 'ffff3333-3333-3333-3333-333333333333', sku: 'ENG-MNT-550', name: 'Engine Mount Brackets', category: 'Chassis', unit: 'unit', low_stock_threshold: 8 },
    { id: 'ffff4444-4444-4444-4444-444444444444', sku: 'WHL-AL-018', name: 'Alloy Wheel Rims 18in', category: 'Accessories', unit: 'unit', low_stock_threshold: 12 },
    { id: 'ffff5555-5555-5555-5555-555555555555', sku: 'FL-OIL-530', name: 'Synthetic Engine Oil 5W-30', category: 'Fluids', unit: 'L', low_stock_threshold: 20 },
    { id: 'ffff6666-6666-6666-6666-666666666666', sku: 'BRK-PAD-09', name: 'Brake Pads Premium Set', category: 'Brakes', unit: 'set', low_stock_threshold: 15 },
  ];
  const { error: pError } = await supabase.from('products').upsert(products);
  if (pError) console.error('Products insert error:', pError.message);
  else console.log('✅ Products seeded');

  // 4. Initial Stock Movements
  const moves = [
    { doc_type: 'receipt', status: 'done', product_id: 'ffff1111-1111-1111-1111-111111111111', from_location_id: null, to_location_id: 'aaaa1111-1111-1111-1111-111111111111', quantity: 15, reference: 'Initial Vendor PO#1001' },
    { doc_type: 'receipt', status: 'done', product_id: 'ffff2222-2222-2222-2222-222222222222', from_location_id: null, to_location_id: 'aaaa1111-1111-1111-1111-111111111111', quantity: 80, reference: 'Initial Vendor PO#1002' },
    { doc_type: 'receipt', status: 'done', product_id: 'ffff3333-3333-3333-3333-333333333333', from_location_id: null, to_location_id: 'aaaa1111-1111-1111-1111-111111111111', quantity: 25, reference: 'Initial Vendor PO#1003' },
    { doc_type: 'receipt', status: 'done', product_id: 'ffff4444-4444-4444-4444-444444444444', from_location_id: null, to_location_id: 'bbbb1111-1111-1111-1111-111111111111', quantity: 40, reference: 'Initial Vendor PO#1004' },
    { doc_type: 'receipt', status: 'done', product_id: 'ffff5555-5555-5555-5555-555555555555', from_location_id: null, to_location_id: 'aaaa1111-1111-1111-1111-111111111111', quantity: 100, reference: 'Initial Vendor PO#1005' },
    { doc_type: 'receipt', status: 'done', product_id: 'ffff6666-6666-6666-6666-666666666666', from_location_id: null, to_location_id: 'aaaa1111-1111-1111-1111-111111111111', quantity: 6, reference: 'Initial Vendor PO#1006' },
  ];
  const { error: mError } = await supabase.from('stock_moves').insert(moves);
  if (mError) console.error('Moves insert error:', mError.message);
  else console.log('✅ Initial stock moves & derived levels seeded');

  console.log('🎉 Seed complete! Ready for live demo.');
}

seed().catch(console.error);
