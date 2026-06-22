create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  food_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, food_id)
);

create index favorites_user_id_idx on public.favorites(user_id);

alter table public.favorites enable row level security;

create policy "Favorites: self read"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Favorites: self insert"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Favorites: self delete"
  on public.favorites for delete
  using (auth.uid() = user_id);