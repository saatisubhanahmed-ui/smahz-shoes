-- ================================================================
--  SMAHZ Shoes — Supabase database schema
--  Supabase Dashboard -> SQL Editor -> New query -> paste all -> Run
--  Safe to run more than once.
-- ================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- Helper: keep updated_at fresh
-- ---------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  image_url   text,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------
create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  description      text,
  price            int  not null check (price >= 0),          -- PKR
  compare_at_price int  check (compare_at_price >= 0),         -- old price (optional)
  category_id      uuid references public.categories(id) on delete set null,
  images           text[] not null default '{}',
  sizes            text[] not null default '{}',
  colors           text[] not null default '{}',
  stock            int  not null default 0,
  is_featured      boolean not null default false,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_active_idx   on public.products(is_active, created_at desc);

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  order_number    text not null unique,
  customer_name   text not null,
  phone           text not null,
  email           text,
  city            text not null,
  address         text not null,
  notes           text,
  items           jsonb not null default '[]'::jsonb,  -- [{product_id,name,slug,image,size,color,price,quantity}]
  subtotal        int not null default 0,
  shipping        int not null default 0,
  total           int not null default 0,
  payment_method  text not null default 'cod',          -- cod | bank_transfer | easypaisa | jazzcash
  channel         text not null default 'checkout'
                  check (channel in ('checkout','whatsapp','email','ai')),
  status          text not null default 'pending'
                  check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  tracking_note   text,                                  -- shown to the customer on Track Order
  admin_note      text,                                  -- private
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
-- Allow the AI-assistant channel on databases created with an older version
alter table public.orders drop constraint if exists orders_channel_check;
alter table public.orders add constraint orders_channel_check
  check (channel in ('checkout','whatsapp','email','ai'));

create index if not exists orders_status_idx  on public.orders(status, created_at desc);
create index if not exists orders_created_idx on public.orders(created_at desc);

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- Contact form messages
-- ---------------------------------------------------------------
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  subject     text,
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Row Level Security
--  * Anyone can READ active products and categories.
--  * Orders & messages have NO public policies — the website writes
--    them from the server with the service_role key, so customers can
--    never read other people's orders.
-- ---------------------------------------------------------------
alter table public.categories        enable row level security;
alter table public.products          enable row level security;
alter table public.orders            enable row level security;
alter table public.contact_messages  enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories
  for select using (true);

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products
  for select using (is_active = true);

-- ---------------------------------------------------------------
-- Storage bucket for product images (public read)
-- ---------------------------------------------------------------
-- (A public bucket serves images to everyone; uploads happen from the
--  server with the service_role key, so no extra storage policy is needed.)
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

-- ================================================================
--  Starter data (you can edit / delete all of this from /admin)
-- ================================================================
insert into public.categories (name, slug, description, image_url, sort_order) values
  ('Sneakers', 'sneakers', 'Street-ready everyday sneakers', 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=900&q=80', 1),
  ('Running',  'running',  'Light, cushioned performance runners', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80', 2),
  ('Casual',   'casual',   'Easy slip-ons and everyday comfort', 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=900&q=80', 3),
  ('Formal',   'formal',   'Polished leather for big days', 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=900&q=80', 4)
on conflict (slug) do nothing;

insert into public.products (name, slug, description, price, compare_at_price, category_id, images, sizes, colors, stock, is_featured)
select * from (values
  ('SMAHZ Aero Runner', 'smahz-aero-runner',
   'Featherweight mesh upper with a responsive foam sole. Built for long walks, gym days and everything in between.',
   5499, 6999, (select id from public.categories where slug='running'),
   array['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80','https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1200&q=80'],
   array['39','40','41','42','43','44','45'], array['Red','Black'], 40, true),
  ('SMAHZ Street Classic', 'smahz-street-classic',
   'Clean low-top silhouette with a padded collar and grippy rubber outsole. Pairs with jeans, joggers or shalwar kameez.',
   4299, 4999, (select id from public.categories where slug='sneakers'),
   array['https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=1200&q=80','https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80'],
   array['39','40','41','42','43','44'], array['White','Grey'], 35, true),
  ('SMAHZ Midnight High', 'smahz-midnight-high',
   'High-top street sneaker with ankle support and a bold gold accent heel tab.',
   6299, null, (select id from public.categories where slug='sneakers'),
   array['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=1200&q=80','https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&q=80'],
   array['40','41','42','43','44'], array['Black'], 20, true),
  ('SMAHZ Cloud Slip-On', 'smahz-cloud-slip-on',
   'No laces, no fuss. Knit upper that hugs your foot and a cushioned insole for all-day comfort.',
   3499, 3999, (select id from public.categories where slug='casual'),
   array['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=1200&q=80'],
   array['39','40','41','42','43','44'], array['Navy','Black'], 50, true),
  ('SMAHZ Velocity Pro', 'smahz-velocity-pro',
   'Our fastest trainer — breathable upper, stability heel and energy-return sole.',
   7499, 8999, (select id from public.categories where slug='running'),
   array['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1200&q=80','https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80'],
   array['40','41','42','43','44','45'], array['Multi'], 18, false),
  ('SMAHZ Heritage Oxford', 'smahz-heritage-oxford',
   'Hand-finished genuine leather Oxford with a cushioned footbed. Office, weddings, Eid — sorted.',
   8999, null, (select id from public.categories where slug='formal'),
   array['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=1200&q=80'],
   array['40','41','42','43','44'], array['Brown','Black'], 15, false),
  ('SMAHZ Retro Court', 'smahz-retro-court',
   'Vintage court style with suede overlays and a comfortable cupsole.',
   4799, 5499, (select id from public.categories where slug='sneakers'),
   array['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200&q=80'],
   array['39','40','41','42','43'], array['Cream'], 25, false),
  ('SMAHZ Urban Walker', 'smahz-urban-walker',
   'Everyday walking shoe with memory-foam insole and anti-slip sole.',
   3999, null, (select id from public.categories where slug='casual'),
   array['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&q=80'],
   array['39','40','41','42','43','44'], array['Olive','Black'], 30, false)
) as v(name, slug, description, price, compare_at_price, category_id, images, sizes, colors, stock, is_featured)
where not exists (select 1 from public.products p where p.slug = v.slug);
