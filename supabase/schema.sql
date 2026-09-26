-- StockSense Supabase Schema DDL
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
