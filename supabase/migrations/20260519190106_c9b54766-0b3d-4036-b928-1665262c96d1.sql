
-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Categories: public read" on public.categories for select using (true);
create policy "Categories: admin insert" on public.categories for insert with check (has_role(auth.uid(), 'admin'));
create policy "Categories: admin update" on public.categories for update using (has_role(auth.uid(), 'admin'));
create policy "Categories: admin delete" on public.categories for delete using (has_role(auth.uid(), 'admin'));

create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- Foods
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  category_slug text not null,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.foods enable row level security;

create policy "Foods: public read" on public.foods for select using (true);
create policy "Foods: admin insert" on public.foods for insert with check (has_role(auth.uid(), 'admin'));
create policy "Foods: admin update" on public.foods for update using (has_role(auth.uid(), 'admin'));
create policy "Foods: admin delete" on public.foods for delete using (has_role(auth.uid(), 'admin'));

create trigger foods_updated_at before update on public.foods
  for each row execute function public.set_updated_at();

-- Seed categories
insert into public.categories (name, slug, sort_order) values
  ('Pizza', 'pizza', 1),
  ('Burgers', 'burgers', 2),
  ('Pasta', 'pasta', 3),
  ('Salads', 'salads', 4),
  ('Desserts', 'desserts', 5),
  ('Shawarma', 'shawarma', 6);

-- Seed foods (mirroring src/lib/foods.ts)
insert into public.foods (name, slug, description, price, category_slug, is_featured) values
  ('Margherita Pizza', 'margherita-pizza', 'Classic tomato, fresh mozzarella, basil, extra virgin olive oil.', 12.50, 'pizza', true),
  ('Truffle Mushroom Pizza', 'truffle-mushroom-pizza', 'Wild mushrooms, truffle oil, mozzarella, parmesan.', 16.90, 'pizza', false),
  ('Signature Smash Burger', 'signature-smash-burger', 'Double smashed beef, aged cheddar, house sauce, brioche bun.', 11.00, 'burgers', true),
  ('Spicy Chicken Burger', 'spicy-chicken-burger', 'Crispy buttermilk chicken, sriracha mayo, pickles.', 10.50, 'burgers', false),
  ('Truffle Tagliatelle', 'truffle-tagliatelle', 'Fresh tagliatelle, black truffle, parmesan cream.', 18.00, 'pasta', true),
  ('Garden Power Bowl', 'garden-power-bowl', 'Quinoa, roasted veg, avocado, lemon tahini.', 9.50, 'salads', false),
  ('Molten Chocolate Cake', 'molten-chocolate-cake', 'Warm chocolate cake, vanilla ice cream.', 7.00, 'desserts', true),
  ('Chicken Shawarma Plate', 'chicken-shawarma-plate', 'Marinated chicken, garlic sauce, rice, pickles.', 13.50, 'shawarma', false);

-- Admin can update order status (already exists per RLS policies)
