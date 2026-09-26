-- Run this in Supabase SQL Editor to allow both anon and server API keys full read/write access
alter table warehouses disable row level security;
alter table locations disable row level security;
alter table products disable row level security;
alter table stock_levels disable row level security;
alter table stock_moves disable row level security;

-- Seed Demo Data
truncate table stock_moves cascade;
truncate table stock_levels cascade;
truncate table locations cascade;
truncate table warehouses cascade;
truncate table products cascade;

-- Warehouses
insert into warehouses (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Central Warehouse'),
  ('22222222-2222-2222-2222-222222222222', 'East Logistics Hub');

-- Locations
insert into locations (id, warehouse_id, name) values
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Main Store'),
  ('aaaa2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Production Rack'),
  ('aaaa3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Shipping Bay'),
  ('bbbb1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Bulk Storage');

-- Products
insert into products (id, sku, name, category, unit, low_stock_threshold) values
  ('ffff1111-1111-1111-1111-111111111111', 'RAW-STL-001', 'Steel Rods 12mm', 'Raw Materials', 'kg', 10),
  ('ffff2222-2222-2222-2222-222222222222', 'PRT-HYD-102', 'Hydraulic Pumps HP-20', 'Components', 'unit', 5),
  ('ffff3333-3333-3333-3333-333333333333', 'ENG-MNT-550', 'Engine Mount Brackets', 'Chassis', 'unit', 8),
  ('ffff4444-4444-4444-4444-444444444444', 'WHL-AL-018', 'Alloy Wheel Rims 18in', 'Accessories', 'unit', 12),
  ('ffff5555-5555-5555-5555-555555555555', 'FL-OIL-530', 'Synthetic Engine Oil 5W-30', 'Fluids', 'L', 20),
  ('ffff6666-6666-6666-6666-666666666666', 'BRK-PAD-09', 'Brake Pads Premium Set', 'Brakes', 'set', 15);

-- Initial Stock Movements (automatically triggers trg_apply_stock_move to populate stock_levels)
insert into stock_moves (doc_type, status, product_id, from_location_id, to_location_id, quantity, reference, created_at) values
  ('receipt', 'done', 'ffff1111-1111-1111-1111-111111111111', null, 'aaaa1111-1111-1111-1111-111111111111', 15, 'Initial Vendor PO#1001', now() - interval '2 days'),
  ('receipt', 'done', 'ffff2222-2222-2222-2222-222222222222', null, 'aaaa1111-1111-1111-1111-111111111111', 80, 'Initial Vendor PO#1002', now() - interval '2 days'),
  ('receipt', 'done', 'ffff3333-3333-3333-3333-333333333333', null, 'aaaa1111-1111-1111-1111-111111111111', 25, 'Initial Vendor PO#1003', now() - interval '1 day'),
  ('receipt', 'done', 'ffff4444-4444-4444-4444-444444444444', null, 'bbbb1111-1111-1111-1111-111111111111', 40, 'Initial Vendor PO#1004', now() - interval '1 day'),
  ('receipt', 'done', 'ffff5555-5555-5555-5555-555555555555', null, 'aaaa1111-1111-1111-1111-111111111111', 100, 'Initial Vendor PO#1005', now() - interval '1 day'),
  ('receipt', 'done', 'ffff6666-6666-6666-6666-666666666666', null, 'aaaa1111-1111-1111-1111-111111111111', 6, 'Initial Vendor PO#1006', now() - interval '12 hours');
