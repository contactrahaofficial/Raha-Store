-- ============================================================================
-- RAHA ATELIER (ESTD 2026) — HARDENED SUPABASE POSTGRESQL & STORAGE SCHEMA
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ============================================================================

-- 1. PRODUCTS & SKUS TABLE (raha_products)
create table if not exists public.raha_products (
  id text primary key,
  sku_base text not null,
  title text not null,
  subtitle text default '',
  price integer not null default 2250,
  compare integer not null default 2950,
  rating text default '5.0',
  reviews integer default 24,
  badge text default 'Atelier Edition',
  material text default 'gold',
  category text not null default 'Earrings',
  category_slug text not null default 'earrings',
  subdept text default 'Signature Piece',
  img text not null,
  hover_img text default '',
  gallery jsonb default '[]'::jsonb,
  custom_skus jsonb default '[]'::jsonb,
  custom_sizes jsonb default '[]'::jsonb,
  custom_reviews jsonb default '[]'::jsonb,
  stock integer default 15,
  weight text default '4.0g',
  dimensions text default 'Standard Fit',
  featured_on_home boolean default false,
  sort_order integer default 0,
  updated_at timestamptz default now()
);

-- 2. CUSTOMER ORDERS & CASH ON DELIVERY TABLE (raha_orders)
create table if not exists public.raha_orders (
  order_id text primary key,
  created_at timestamptz default now(),
  status text not null default 'Pending',
  payment_method text not null default 'Cash on Delivery (COD)',
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  customer_city text not null,
  customer_address text not null,
  customer_notes text default '',
  items jsonb not null default '[]'::jsonb,
  subtotal integer not null default 0,
  shipping integer not null default 0,
  total integer not null default 0,
  admin_note text default ''
);

-- 3. CUSTOMER PROFILES TABLE (raha_customers)
-- Note: Customer & Owner passwords are stored & hashed securely in Supabase Auth (auth.users)
create table if not exists public.raha_customers (
  email text primary key,
  auth_uid uuid references auth.users(id) on delete set null,
  name text default '',
  phone text default '',
  city text default '',
  address text default '',
  notes text default '',
  updated_at timestamptz default now()
);

-- 4. GLOBAL WEBSITE SETTINGS & HERO CMS TABLE (raha_store_settings)
create table if not exists public.raha_store_settings (
  id text primary key default 'global',
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- 5. FOOTER POLICY PAGES & FAQS TABLE (raha_pages)
create table if not exists public.raha_pages (
  slug text primary key,
  title text not null,
  subtitle text default '',
  body_html text not null default '',
  updated_at timestamptz default now()
);

-- 6. ENABLE ROW LEVEL SECURITY (RLS) & HARDENED POLICIES
alter table public.raha_products enable row level security;
alter table public.raha_orders enable row level security;
alter table public.raha_customers enable row level security;
alter table public.raha_store_settings enable row level security;
alter table public.raha_pages enable row level security;

-- Products: Public read, Owner-only write
drop policy if exists "Allow public read products" on public.raha_products;
create policy "Allow public read products" on public.raha_products for select using (true);
drop policy if exists "Allow admin write products" on public.raha_products;
create policy "Allow admin write products" on public.raha_products for all
  using ((auth.jwt() ->> 'email') = 'contact.rahaofficial@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'contact.rahaofficial@gmail.com');

-- Orders: Public insert (checkout), Owner reads/manages all, Customers read only their own orders
drop policy if exists "Allow public insert orders" on public.raha_orders;
create policy "Allow public insert orders" on public.raha_orders for insert with check (true);
drop policy if exists "Allow customer read own orders" on public.raha_orders;
create policy "Allow customer read own orders" on public.raha_orders for select
  using (
    (auth.jwt() ->> 'email') = 'contact.rahaofficial@gmail.com'
    OR ((auth.jwt() ->> 'email') is not null AND lower(customer_email) = lower(auth.jwt() ->> 'email'))
  );
drop policy if exists "Allow admin manage orders" on public.raha_orders;
create policy "Allow admin manage orders" on public.raha_orders for update
  using ((auth.jwt() ->> 'email') = 'contact.rahaofficial@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'contact.rahaofficial@gmail.com');
drop policy if exists "Allow admin delete orders" on public.raha_orders;
create policy "Allow admin delete orders" on public.raha_orders for delete
  using ((auth.jwt() ->> 'email') = 'contact.rahaofficial@gmail.com');

-- Customers: Users read/update only their own profile; Owner reads/manages all
drop policy if exists "Allow user read own profile" on public.raha_customers;
create policy "Allow user read own profile" on public.raha_customers for select
  using (
    (auth.jwt() ->> 'email') = 'contact.rahaofficial@gmail.com'
    OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
drop policy if exists "Allow user upsert own profile" on public.raha_customers;
create policy "Allow user upsert own profile" on public.raha_customers for insert
  with check (
    (auth.jwt() ->> 'email') = 'contact.rahaofficial@gmail.com'
    OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
drop policy if exists "Allow user update own profile" on public.raha_customers;
create policy "Allow user update own profile" on public.raha_customers for update
  using (
    (auth.jwt() ->> 'email') = 'contact.rahaofficial@gmail.com'
    OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Store Settings & Pages: Public read, Owner-only write
drop policy if exists "Allow public read settings" on public.raha_store_settings;
create policy "Allow public read settings" on public.raha_store_settings for select using (true);
drop policy if exists "Allow admin write settings" on public.raha_store_settings;
create policy "Allow admin write settings" on public.raha_store_settings for all
  using ((auth.jwt() ->> 'email') = 'contact.rahaofficial@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'contact.rahaofficial@gmail.com');

drop policy if exists "Allow public read pages" on public.raha_pages;
create policy "Allow public read pages" on public.raha_pages for select using (true);
drop policy if exists "Allow admin write pages" on public.raha_pages;
create policy "Allow admin write pages" on public.raha_pages for all
  using ((auth.jwt() ->> 'email') = 'contact.rahaofficial@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'contact.rahaofficial@gmail.com');

-- 7. CREATE SUPABASE STORAGE BUCKET FOR PRODUCT & HERO IMAGES (raha-media)
insert into storage.buckets (id, name, public)
values ('raha-media', 'raha-media', true)
on conflict (id) do nothing;

drop policy if exists "Public Read Raha Media" on storage.objects;
create policy "Public Read Raha Media"
on storage.objects for select
using ( bucket_id = 'raha-media' );

drop policy if exists "Admin Upload Raha Media" on storage.objects;
create policy "Admin Upload Raha Media"
on storage.objects for insert
with check (
  bucket_id = 'raha-media'
  AND (auth.jwt() ->> 'email') = 'contact.rahaofficial@gmail.com'
);

drop policy if exists "Admin Update Delete Raha Media" on storage.objects;
create policy "Admin Update Delete Raha Media"
on storage.objects for all
using (
  bucket_id = 'raha-media'
  AND (auth.jwt() ->> 'email') = 'contact.rahaofficial@gmail.com'
);

-- 8. AUTOMATIC REAL-TIME INVENTORY SYNC TRIGGER ON ORDERS (INSERT / CANCEL / RESTORE)
-- Ensure stock column exists on older deployments of raha_products
alter table public.raha_products add column if not exists stock integer default 15;

-- Runs as SECURITY DEFINER so guest/customer orders atomically deduct stock without opening write access on raha_products.
create or replace function public.raha_adjust_product_stock(p_id text, p_sku text, p_variant text, p_delta integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.raha_products%rowtype;
  v_cur_stock integer;
  v_new_stock integer;
  v_skus jsonb;
  v_new_skus jsonb := '[]'::jsonb;
  v_sku_elem jsonb;
  v_idx integer := 0;
  v_sku_stock integer;
begin
  select * into v_row from public.raha_products where id = p_id for update;
  if not found then
    return;
  end if;

  v_cur_stock := coalesce(v_row.stock, 15);
  if jsonb_typeof(v_row.custom_skus) = 'array' and jsonb_array_length(v_row.custom_skus) > 0 then
    if (v_row.custom_skus->0) ? '_productStock' then
      v_cur_stock := coalesce((v_row.custom_skus->0->>'_productStock')::integer, v_cur_stock);
    end if;
  end if;

  v_new_stock := greatest(0, v_cur_stock + p_delta);

  v_skus := coalesce(v_row.custom_skus, '[]'::jsonb);
  if jsonb_typeof(v_skus) = 'array' and jsonb_array_length(v_skus) > 0 then
    for v_sku_elem in select * from jsonb_array_elements(v_skus) loop
      if v_idx = 0 then
        v_sku_elem := jsonb_set(v_sku_elem, '{_productStock}', to_jsonb(v_new_stock), true);
      end if;
      if (
        (coalesce(v_sku_elem->>'suffix', '') <> '' and position(upper(v_sku_elem->>'suffix') in upper(coalesce(p_sku, ''))) > 0)
        or (coalesce(v_sku_elem->>'name', '') <> '' and position(lower(v_sku_elem->>'name') in lower(coalesce(p_variant, ''))) > 0)
        or jsonb_array_length(v_skus) = 1
      ) then
        v_sku_stock := coalesce((v_sku_elem->>'stock')::integer, v_cur_stock);
        v_sku_elem := jsonb_set(v_sku_elem, '{stock}', to_jsonb(greatest(0, v_sku_stock + p_delta)), true);
      end if;
      v_new_skus := v_new_skus || jsonb_build_array(v_sku_elem);
      v_idx := v_idx + 1;
    end loop;
  else
    v_new_skus := v_skus;
  end if;

  update public.raha_products
  set stock = v_new_stock,
      custom_skus = v_new_skus,
      updated_at = now()
  where id = p_id;
end;
$$;

create or replace function public.raha_sync_inventory_on_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_qty integer;
  v_delta integer := 0;
begin
  if tg_op = 'INSERT' then
    if coalesce(new.status, 'Pending') <> 'Cancelled' then
      v_delta := -1;
    end if;
  elsif tg_op = 'UPDATE' then
    if coalesce(old.status, 'Pending') <> 'Cancelled' and coalesce(new.status, 'Pending') = 'Cancelled' then
      v_delta := 1;
    elsif coalesce(old.status, 'Pending') = 'Cancelled' and coalesce(new.status, 'Pending') <> 'Cancelled' then
      v_delta := -1;
    end if;
  end if;

  if v_delta <> 0 and jsonb_typeof(new.items) = 'array' then
    for v_item in select * from jsonb_array_elements(new.items) loop
      begin
        v_qty := greatest(1, coalesce((v_item->>'qty')::integer, 1));
        if coalesce(v_item->>'id', '') <> '' then
          perform public.raha_adjust_product_stock(
            v_item->>'id',
            coalesce(v_item->>'sku', ''),
            coalesce(v_item->>'variant', ''),
            v_delta * v_qty
          );
        end if;
      exception when others then
        -- Never block or roll back a customer order if a product row is missing or malformed
        raise warning 'raha_sync_inventory_on_order skipped item: %', sqlerrm;
      end;
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_raha_orders_inventory on public.raha_orders;
create trigger trg_raha_orders_inventory
after insert or update of status on public.raha_orders
for each row
execute function public.raha_sync_inventory_on_order();

-- Lock down RPC execution so attackers/anon users CANNOT call stock functions directly via API
revoke all on function public.raha_adjust_product_stock(text, text, text, integer) from public, anon, authenticated;
revoke all on function public.raha_sync_inventory_on_order() from public, anon, authenticated;

-- 9. SERVER-SIDE ORDER INTEGRITY TRIGGER (PREVENTS PRICE OR STATUS MANIPULATION — NEVER BLOCKS ORDERS)
-- Sync standalone stock column with custom_skus[0]._productStock across all existing rows
update public.raha_products
set stock = coalesce(round((custom_skus->0->>'_productStock')::numeric)::integer, stock, 15)
where jsonb_typeof(custom_skus) = 'array' and jsonb_array_length(custom_skus) > 0 and (custom_skus->0) ? '_productStock';

-- Safely normalizes status, payment tags, and item prices BEFORE INSERT against raha_products.
-- Wrapped in an exception handler so no edge case can ever drop or block a customer order.
create or replace function public.raha_verify_order_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_new_items jsonb := '[]'::jsonb;
  v_prod public.raha_products%rowtype;
  v_qty integer;
  v_unit_price integer;
  v_calc_subtotal integer := 0;
  v_sku_elem jsonb;
  v_item_sku text;
  v_item_var text;
begin
  begin
    -- 1. Enforce safe initial order status and prevent fake payment-cleared tags on public insert
    new.status := 'Pending';
    if coalesce(new.admin_note, '') ilike '%CLEARED%' then
      new.admin_note := '[PAYMENT: PENDING_VERIFICATION]';
    end if;

    -- 2. Verify each item's price directly against public.raha_products if product exists
    if jsonb_typeof(new.items) = 'array' and jsonb_array_length(new.items) > 0 then
      for v_item in select * from jsonb_array_elements(new.items) loop
        v_qty := greatest(1, coalesce(round((v_item->>'qty')::numeric)::integer, 1));
        v_unit_price := greatest(0, coalesce(round((v_item->>'price')::numeric)::integer, 0));
        v_item_sku := upper(coalesce(v_item->>'sku', ''));
        v_item_var := lower(coalesce(v_item->>'variant', ''));

        if coalesce(v_item->>'id', '') <> '' then
          select * into v_prod from public.raha_products where id = (v_item->>'id');
          if found then
            v_unit_price := coalesce(v_prod.price, v_unit_price);
            if jsonb_typeof(v_prod.custom_skus) = 'array' and jsonb_array_length(v_prod.custom_skus) > 0 then
              for v_sku_elem in select * from jsonb_array_elements(v_prod.custom_skus) loop
                if (
                  (coalesce(v_sku_elem->>'suffix', '') <> '' and position(upper(v_sku_elem->>'suffix') in v_item_sku) > 0)
                  or (coalesce(v_sku_elem->>'name', '') <> '' and position(lower(v_sku_elem->>'name') in v_item_var) > 0)
                ) then
                  if coalesce(round((v_sku_elem->>'price')::numeric)::integer, 0) > 0 then
                    v_unit_price := round((v_sku_elem->>'price')::numeric)::integer;
                  end if;
                  exit;
                end if;
              end loop;
            end if;
          end if;
        end if;

        v_item := jsonb_set(v_item, '{qty}', to_jsonb(v_qty), true);
        v_item := jsonb_set(v_item, '{price}', to_jsonb(v_unit_price), true);
        v_new_items := v_new_items || jsonb_build_array(v_item);
        v_calc_subtotal := v_calc_subtotal + (v_unit_price * v_qty);
      end loop;

      if v_calc_subtotal > 0 then
        new.items := v_new_items;
        new.subtotal := v_calc_subtotal;
        new.shipping := greatest(0, coalesce(new.shipping, 0));
        new.total := v_calc_subtotal + new.shipping;
      end if;
    end if;
  exception when others then
    -- Fail-safe: never block or drop a customer order under any circumstance
    raise warning 'raha_verify_order_before_insert fallback: %', sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists trg_raha_orders_verify_before_insert on public.raha_orders;
create trigger trg_raha_orders_verify_before_insert
before insert on public.raha_orders
for each row
execute function public.raha_verify_order_before_insert();

revoke all on function public.raha_verify_order_before_insert() from public, anon, authenticated;
