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
