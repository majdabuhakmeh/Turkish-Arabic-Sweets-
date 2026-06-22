# Multi-Restaurant & Multi-Branch Architecture

This is a large, foundational change. I'll roll it out in phases so the existing Royal Sweets storefront keeps working at every step. Royal Sweets becomes the first "restaurant" (vendor) and its current catalog the first "branch" — nothing breaks for existing customers.

## Phase 1 — Database foundation (migration)

New tables:

- `restaurants` — id, name, slug (unique), description, logo_url, cover_url, contact_email, contact_phone, business_hours (jsonb), status (`pending|active|inactive`), owner_id → auth.users, currency (default SAR), timestamps.
- `branches` — id, restaurant_id, name, code (unique per restaurant), address, city, country, latitude, longitude, phone, opening_hours (jsonb), delivery_radius_km, manager_id → auth.users, status (`pending|active|inactive`), timestamps.
- `branch_staff` — id, branch_id, user_id, role (`manager|staff`), unique (branch_id, user_id).
- `branch_inventory` — id, branch_id, food_id, available (bool), stock (int nullable), price_override (numeric nullable), unique (branch_id, food_id).
- `delivery_zones` — id, branch_id, polygon (jsonb) or radius fallback, fee, min_subtotal, eta_minutes.

Extend existing tables (nullable first, backfill, then required where safe):

- `foods` → add `restaurant_id` (FK).
- `categories` → add `restaurant_id` nullable (null = global).
- `orders` → add `restaurant_id`, `branch_id`.
- `coupons` → add `restaurant_id` nullable (null = platform-wide).

Extend `app_role` enum: `restaurant_owner`, `branch_manager`, `staff` (keep `admin`, `user`).

Security-definer helpers (avoid RLS recursion):

- `is_restaurant_owner(_user, _restaurant)`
- `is_branch_staff(_user, _branch)` / `is_branch_manager(...)`
- `user_restaurants(_user)` returning restaurant ids

RLS:

- Public can read `active` restaurants, branches, and their available products.
- Owners manage their restaurant + child branches/products/coupons.
- Branch managers manage their branch's inventory + orders.
- Admins manage everything (existing pattern).
- Every new public-schema table gets explicit GRANTs.

Backfill migration: create a "Royal Sweets" restaurant from current data, attach all existing foods/orders/coupons to it, create a default "Main Branch", populate `branch_inventory` for all foods.

## Phase 2 — Customer experience

- Geolocation prompt on home + menu (browser API, fallback to city dropdown).
- Branch resolver: pick nearest active branch within delivery radius; if none, allow pickup or show "coming soon".
- Branch switcher in header (when multiple available).
- Menu/cart/checkout become branch-scoped: show only `branch_inventory.available` items, use price overrides, ETA, and delivery fee from the branch.
- Restaurant landing pages at `/r/:slug` (public, SSR, OG metadata) and branch page at `/r/:slug/:branchCode`.

## Phase 3 — Dashboards

Vendor dashboard (`/_authenticated/vendor/...`) for `restaurant_owner`:

- Restaurant profile, branches CRUD, staff assignment, products, categories, coupons, branch comparison analytics.

Branch manager dashboard (`/_authenticated/branch/...`) for `branch_manager`:

- Branch orders queue, status updates, inventory, branch reports, staff.

Admin dashboard additions (`/_authenticated/admin/...`):

- Restaurants list + approval (pending → active).
- Branches list + approval.
- Global analytics: revenue by restaurant, by branch, top products, retention.

All new server functions use `requireSupabaseAuth` + role/ownership checks via the new security-definer helpers.

## Phase 4 — Analytics

Materialized helpers + server fns:

- Revenue by restaurant / branch / day.
- Best-selling products per branch.
- Delivery performance (avg prep + delivery time from `order_status_events`).
- Customer retention (repeat orders per restaurant).

## Phase 5 — Future scalability hooks

- `currency` on restaurant, `country` on branch — multi-currency display ready.
- i18n dictionary already exists; new entities carry translatable name/description fields (jsonb `i18n` column on restaurants & branches) for future multilingual content.
- Slug-based routing + pagination on listings so we scale to hundreds of branches.
- No assumption of a single tenant anywhere in queries after Phase 1.

## Backward compatibility

- Existing routes (`/`, `/menu`, `/food/:id`, `/cart`, `/checkout`, `/orders`, admin) keep working.
- When no branch is selected, default to the seeded Royal Sweets main branch.
- Existing orders/foods/coupons are migrated, not replaced.

## Technical notes

- TanStack Start server fns for all writes; public reads via server publishable client where SSR is needed.
- New protected layouts: `_authenticated/vendor/route.tsx`, `_authenticated/branch/route.tsx` with role checks in `beforeLoad`.
- Geolocation done client-side; branch resolution is a public server fn taking `{lat, lng}` and returning ranked branches.
- No edge functions; no service-role on client paths.

## Rollout order (each step ships independently)

1. Migration (Phase 1) — schema + backfill.
2. Public branch resolver + branch switcher in header.
3. Menu/cart/checkout become branch-aware.
4. Vendor dashboard.
5. Branch manager dashboard.
6. Admin restaurant/branch management + analytics.

## Out of scope for now (call out so we agree)

- Real polygon delivery zones (start with radius; jsonb column reserved).
- Multi-currency conversion (display only, no FX).
- Mobile native app changes.
- Live payment provider integration per vendor (Stripe Connect-style) — current checkout flow preserved.

Confirm and I'll start with Phase 1 (the migration) on the next turn.
