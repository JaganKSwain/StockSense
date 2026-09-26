-- StockSense Seed Script
-- Calibrated for the 180s live pitch demo

-- Clear existing data
truncate table stock_moves cascade;
truncate table stock_levels cascade;
truncate table locations cascade;
truncate table warehouses cascade;
truncate table products cascade;

-- 1. Warehouses
insert into warehouses (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Central Warehouse'),
  ('22222222-2222-2222-2222-222222222222', 'East Logistics Hub');

-- 2. Locations
insert into locations (id, warehouse_id, name) values
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Main Store'),
  ('aaaa2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Production Rack'),
  ('aaaa3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Shipping Bay'),
  ('bbbb1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Bulk Storage');

-- 3. Products
-- Product A: Steel Rods (Seeded at 15; delivering 8 drops it to 7 < threshold 10 -> triggers Low Stock alert)
insert into products (id, sku, name, category, unit, low_stock_threshold) values
  ('ffff1111-1111-1111-1111-111111111111', 'RAW-STL-001', 'Steel Rods 12mm', 'Raw Materials', 'kg', 10),
  ('ffff2222-2222-2222-2222-222222222222', 'PRT-HYD-102', 'Hydraulic Pumps HP-20', 'Components', 'unit', 5),
  ('ffff3333-3333-3333-3333-333333333333', 'ENG-MNT-550', 'Engine Mount Brackets', 'Chassis', 'unit', 8),
  ('ffff4444-4444-4444-4444-444444444444', 'WHL-AL-018', 'Alloy Wheel Rims 18in', 'Accessories', 'unit', 12),
  ('ffff5555-5555-5555-5555-555555555555', 'FL-OIL-530', 'Synthetic Engine Oil 5W-30', 'Fluids', 'L', 20),
  ('ffff6666-6666-6666-6666-666666666666', 'BRK-PAD-09', 'Brake Pads Premium Set', 'Brakes', 'set', 15);

-- 4. Initial Stock Movements
-- Inserting completed moves automatically invokes trg_apply_stock_move to seed stock_levels!
insert into stock_moves (doc_type, status, product_id, from_location_id, to_location_id, quantity, reference, created_at) values
  -- Initial receipt for Steel Rods (15 kg into Main Store)
  ('receipt', 'done', 'ffff1111-1111-1111-1111-111111111111', null, 'aaaa1111-1111-1111-1111-111111111111', 15, 'Initial Vendor PO#1001', now() - interval '2 days'),
  
  -- Initial receipt for Hydraulic Pumps (80 units into Main Store)
  ('receipt', 'done', 'ffff2222-2222-2222-2222-222222222222', null, 'aaaa1111-1111-1111-1111-111111111111', 80, 'Initial Vendor PO#1002', now() - interval '2 days'),

  -- Initial receipt for Engine Mounts (25 units into Main Store)
  ('receipt', 'done', 'ffff3333-3333-3333-3333-333333333333', null, 'aaaa1111-1111-1111-1111-111111111111', 25, 'Initial Vendor PO#1003', now() - interval '1 day'),

  -- Initial receipt for Alloy Wheels (40 units into Bulk Storage)
  ('receipt', 'done', 'ffff4444-4444-4444-4444-444444444444', null, 'bbbb1111-1111-1111-1111-111111111111', 40, 'Initial Vendor PO#1004', now() - interval '1 day'),

  -- Initial receipt for Engine Oil (100 L into Main Store)
  ('receipt', 'done', 'ffff5555-5555-5555-5555-555555555555', null, 'aaaa1111-1111-1111-1111-111111111111', 100, 'Initial Vendor PO#1005', now() - interval '1 day'),

  -- Initial receipt for Brake Pads (6 units - already seeded low stock for immediate demo visual)
  ('receipt', 'done', 'ffff6666-6666-6666-6666-666666666666', null, 'aaaa1111-1111-1111-1111-111111111111', 6, 'Initial Vendor PO#1006', now() - interval '12 hours');
