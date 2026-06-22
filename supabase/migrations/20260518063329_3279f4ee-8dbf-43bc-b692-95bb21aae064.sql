
-- Enums
create type public.app_role as enum ('customer', 'admin');
create type public.order_status as enum ('placed', 'preparing', 'on_the_way', 'delivered', 'cancelled');
create type public.payment_method as enum ('card', 'cash');

-- updated_at trigger fn
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  default_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

-- Auto profile + customer role on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url');
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Addresses
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Home',
  line1 text not null,
  line2 text,
  city text not null,
  postal_code text,
  notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.addresses enable row level security;

-- Orders
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status public.order_status not null default 'placed',
  subtotal numeric(10,2) not null,
  delivery_fee numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  payment_method public.payment_method not null,
  delivery_name text not null,
  delivery_phone text not null,
  delivery_address text not null,
  delivery_city text not null,
  delivery_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create trigger orders_updated before update on public.orders
  for each row execute function public.set_updated_at();
create index orders_user_idx on public.orders(user_id, created_at desc);

-- Order items
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  food_id text not null,
  name text not null,
  image_url text,
  unit_price numeric(10,2) not null,
  qty integer not null check (qty > 0),
  line_total numeric(10,2) not null
);
alter table public.order_items enable row level security;
create index order_items_order_idx on public.order_items(order_id);

-- RLS policies
-- profiles
create policy "Profiles: self read" on public.profiles for select using (auth.uid() = id);
create policy "Profiles: admin read" on public.profiles for select using (public.has_role(auth.uid(), 'admin'));
create policy "Profiles: self update" on public.profiles for update using (auth.uid() = id);

-- user_roles
create policy "Roles: self read" on public.user_roles for select using (auth.uid() = user_id);
create policy "Roles: admin read" on public.user_roles for select using (public.has_role(auth.uid(), 'admin'));

-- addresses
create policy "Addr: self all" on public.addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- orders
create policy "Orders: self read" on public.orders for select using (auth.uid() = user_id);
create policy "Orders: self insert" on public.orders for insert with check (auth.uid() = user_id);
create policy "Orders: admin read" on public.orders for select using (public.has_role(auth.uid(), 'admin'));
create policy "Orders: admin update" on public.orders for update using (public.has_role(auth.uid(), 'admin'));

-- order_items
create policy "Items: self read" on public.order_items for select using (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "Items: self insert" on public.order_items for insert with check (
  exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
);
create policy "Items: admin read" on public.order_items for select using (public.has_role(auth.uid(), 'admin'));

-- realtime
alter publication supabase_realtime add table public.orders;
