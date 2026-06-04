create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key,
  email text not null,
  full_name text,
  role text not null default 'customer',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.auth_users (
  id uuid primary key references public.profiles(id) on delete cascade,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  odoo_id text unique,
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories(id) on delete set null,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  odoo_id text unique,
  sku text not null,
  name text not null,
  slug text not null unique,
  description text,
  short_description text,
  category_id uuid references public.categories(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  price_cents integer not null default 0,
  compare_at_price_cents integer,
  currency text not null default 'USD',
  stock_quantity integer not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  specifications jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.product_videos (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  title text,
  thumbnail_url text,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  order_number text not null unique,
  status text not null default 'pending',
  payment_status text not null default 'unpaid',
  payment_method text not null default 'manual',
  payment_reference text,
  zelle_request_status text,
  zelle_requested_at timestamptz,
  customer_email text,
  customer_first_name text,
  customer_last_name text,
  customer_phone text,
  subtotal_cents integer not null default 0,
  shipping_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null default 0,
  currency text not null default 'USD',
  shipping_address jsonb,
  billing_address jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  sku text not null,
  name text not null,
  unit_price_cents integer not null,
  quantity integer not null,
  total_cents integer not null,
  product_snapshot jsonb,
  created_at timestamptz default now()
);

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text not null,
  status text not null default 'published',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (product_id, user_id)
);

create index if not exists categories_parent_id_idx on public.categories(parent_id);
create index if not exists products_sku_idx on public.products(sku);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_brand_id_idx on public.products(brand_id);
create index if not exists products_is_active_idx on public.products(is_active);
create index if not exists products_active_in_stock_updated_idx
  on public.products (updated_at desc)
  where is_active = true and stock_quantity > 0;
create index if not exists product_images_product_id_idx on public.product_images(product_id);
create index if not exists product_videos_product_id_idx on public.product_videos(product_id);
create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_customer_email_idx on public.orders(customer_email);
create index if not exists orders_payment_method_idx on public.orders(payment_method);
create index if not exists orders_payment_reference_idx on public.orders(payment_reference);
create index if not exists product_reviews_product_id_idx on public.product_reviews(product_id);
create index if not exists product_reviews_user_id_idx on public.product_reviews(user_id);
create index if not exists product_reviews_status_idx on public.product_reviews(status);
create index if not exists auth_users_email_idx on public.auth_users(email);
