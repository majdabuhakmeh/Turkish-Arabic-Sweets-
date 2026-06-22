create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  food_id text not null,
  order_id uuid not null,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, food_id, order_id)
);

create index reviews_food_idx on public.reviews(food_id);
create index reviews_user_idx on public.reviews(user_id);

alter table public.reviews enable row level security;

create policy "Reviews: public read"
  on public.reviews for select using (true);

create policy "Reviews: self insert delivered"
  on public.reviews for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.orders o
      join public.order_items oi on oi.order_id = o.id
      where o.id = reviews.order_id
        and o.user_id = auth.uid()
        and o.status = 'delivered'
        and oi.food_id = reviews.food_id
    )
  );

create policy "Reviews: self update"
  on public.reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Reviews: self delete"
  on public.reviews for delete using (auth.uid() = user_id);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();
