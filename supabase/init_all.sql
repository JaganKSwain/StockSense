-- ==============================================================================
-- StockSense All-in-One Database Setup (DDL + Triggers + Realtime + Seed Data)
-- Paste this entire file into your Supabase SQL Editor and click "Run".
-- ==============================================================================

-- 1. Warehouses
create table if not exists warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Locations within a warehouse (e.g. "Main Store", "Production Rack", "Shipping Bay")
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid references warehouses(id) on delete cascade not null,
  name text not null
);

-- 3. Products
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  name text not null,
  category text,
  unit text default 'unit',
  low_stock_threshold int default 10,
  created_at timestamptz default now()
);

-- 4. Derived Per-Location Stock Levels
create table if not exists stock_levels (
  product_id uuid references products(id) on delete cascade not null,
  location_id uuid references locations(id) on delete cascade not null,
  quantity numeric not null default 0,
  primary key (product_id, location_id)
);

-- 5. Append-Only Stock Movement Ledger
create table if not exists stock_moves (
  id uuid primary key default gen_random_uuid(),
  doc_type text not null check (doc_type in ('receipt', 'delivery', 'transfer', 'adjustment')),
  status text not null default 'done' check (status in ('draft', 'waiting', 'ready', 'done', 'canceled')),
  product_id uuid references products(id) on delete cascade not null,
  from_location_id uuid references locations(id),   -- null for receipts
  to_location_id uuid references locations(id),     -- null for deliveries
  quantity numeric not null,
  reference text,                                    -- supplier, sales order, or reason code
  created_at timestamptz default now()
);

-- 6. Trigger Function: Atomically maintains derived stock_levels on every completed move
create or replace function apply_stock_move() returns trigger as $$
begin
  -- Deduct from source location
  if new.from_location_id is not null then
    insert into stock_levels (product_id, location_id, quantity)
    values (new.product_id, new.from_location_id, -new.quantity)
    on conflict (product_id, location_id)
    do update set quantity = stock_levels.quantity - new.quantity;
  end if;

  -- Add to destination location
  if new.to_location_id is not null then
    insert into stock_levels (product_id, location_id, quantity)
    values (new.product_id, new.to_location_id, new.quantity)
    on conflict (product_id, location_id)
    do update set quantity = stock_levels.quantity + new.quantity;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_apply_stock_move on stock_moves;
create trigger trg_apply_stock_move
after insert on stock_moves
for each row when (new.status = 'done')
execute function apply_stock_move();

-- 7. High-Performance Indexes
create index if not exists idx_moves_doc_type on stock_moves(doc_type);
create index if not exists idx_moves_status on stock_moves(status);
create index if not exists idx_moves_created on stock_moves(created_at desc);
create index if not exists idx_moves_product on stock_moves(product_id);
create index if not exists idx_levels_product on stock_levels(product_id);

-- 8. Enable Realtime Replication for CDC
alter publication supabase_realtime add table stock_moves;
alter publication supabase_realtime add table stock_levels;

-- 9. Seed Demo Data (Calibrated for the 180s live pitch)
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
