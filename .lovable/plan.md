# Remaining Features (excluding email domain setup)

Six focused pieces, ordered so each ships independently and the storefront keeps working throughout.

## 1. Per-branch landing pages — `/r/:slug/:branchCode`

- New public SSR route `src/routes/r.$slug.$branchCode.tsx`.
- Loader calls a new public server fn `getBranchLanding({ slug, branchCode })` using the **server publishable client** — returns `{ restaurant, branch, categories, foods }` filtered by `branch_inventory.available` with `price_override` applied.
- Route `head()` sets branch-specific title/description/OG (name + city + restaurant), `og:image` from branch or restaurant cover.
- Reuses existing `FoodCard`; clicking a food sets active branch in `BranchContext`, then routes to `/food/:id`.
- Link from `/r/:slug` branch list to each branch page.

## 2. Multi-currency display

- Add `currency` (default `SAR`) to `BranchContext` — resolved from the active branch's `restaurants.currency`.
- New `src/lib/currency.ts` with `formatCurrency(amount, code)` (Intl.NumberFormat).
- Replace every hardcoded `SAR` in `cart.tsx`, `checkout.tsx`, `orders.tsx`, `orders.$id.tsx`, `food.$id.tsx`, `menu.tsx`, `FoodCard.tsx`, `branch.orders.tsx`, `vendor.analytics.tsx` with `formatCurrency`.
- Orders already store totals in the restaurant's currency implicitly — display uses the order's `restaurant_id → currency`. Add `currency` to orders read queries.

## 3. Home geolocation + pickup / "coming soon" fallback

- Extend `NearestBranchBanner` (or new `LocationGate` in `src/routes/index.tsx`) to request `navigator.geolocation` with a "Use my location" button + city dropdown fallback.
- New public server fn `resolveNearestBranch({ lat, lng })` → ranks active branches within `delivery_radius_km` using haversine; returns nearest + list of ranked matches.
- If none in range: banner offers **Pickup** (sets branch, flags `mode=pickup` in `BranchContext`, waives delivery fee at checkout) or shows **"Coming soon to your area"** with email capture (writes to a lightweight `waitlist` table).
- Checkout respects `mode=pickup`: hides address fields, sets `delivery_fee=0`, stores `fulfillment_type` on order (new nullable column).

## 4. Vendor dashboard completion

New routes under `src/routes/_authenticated/vendor/`:

- `vendor.products.tsx` — list/create/edit/delete foods scoped to owner's restaurants. Reuses `admin.foods` form logic, filtered by `restaurant_id`.
- `vendor.categories.tsx` — same pattern against `categories` where `restaurant_id = owner's`.
- `vendor.coupons.tsx` — CRUD on `coupons` where `restaurant_id` is theirs.
- `vendor.staff.tsx` — assign users to branches (`branch_staff`) + set branch `manager_id`. Search users by email via a new `searchUsers` admin-only fn scoped to owner's branches.
- `vendor.profile.tsx` — edit restaurant name, description, logo, cover, contact info, business hours, currency.
- New server fns in `src/lib/vendor.functions.ts`: `upsertVendorFood`, `deleteVendorFood`, `upsertVendorCategory`, `deleteVendorCategory`, `upsertVendorCoupon`, `deleteVendorCoupon`, `assignBranchStaff`, `removeBranchStaff`, `updateRestaurantProfile`. Each verifies `is_restaurant_owner(userId, restaurantId)`.
- Sidebar nav in `vendor.tsx` gets Products, Categories, Coupons, Staff, Profile entries.

## 5. Admin approval workflow + global analytics

- `admin.restaurants.tsx` gets Pending tab + Approve/Reject buttons calling `setRestaurantStatus({ id, status })` (admin-only server fn).
- Same for `admin.branches.tsx` (Pending → Active/Inactive).
- New `admin.analytics.tsx` — cross-restaurant view: revenue by restaurant (30/90d), top restaurants by orders, top products platform-wide, active branches count, new signups. Backed by `getPlatformAnalytics` server fn (admin-gated).
- Add nav entries in `admin.tsx` sidebar.

## 6. Analytics server fns (per-branch depth)

Extend `src/lib/vendor.functions.ts`:

- `getBranchRevenueSeries({ restaurantId, days })` — daily revenue per branch (for a line chart in `vendor.analytics.tsx`).
- `getBestSellersPerBranch({ restaurantId })` — top 10 products by qty per branch.
- `getDeliveryPerformance({ restaurantId })` — avg prep + delivery minutes computed from `order_status_events` (placed → preparing, preparing → delivered).
- `getRetention({ restaurantId })` — % of customers with ≥2 orders in last 90d.
- Wire into `vendor.analytics.tsx` with tabs: Comparison (existing) · Revenue trend · Best sellers · Delivery · Retention. Use `recharts` (already in deps if present; else add).

---

## Technical notes

- All new server fns follow the existing `.middleware([requireSupabaseAuth])` + role check pattern; admin fns check `has_role(userId,'admin')`, vendor fns check `is_restaurant_owner`, branch fns check `is_branch_manager`.
- Public server fns for branch landing + nearest resolver use the **server publishable client** (no bearer), backed by narrow public SELECT policies already in place on `restaurants`, `branches`, `foods`, `categories`, `branch_inventory`.
- One migration for: `orders.fulfillment_type text`, new `waitlist(email, city, created_at)` table with GRANTs + RLS (insert-only for anon), no schema changes to core tables.
- No new deps except `recharts` if missing.
- Backward compatible: existing routes untouched; new features are additive.

## Rollout order

1. Migration (fulfillment_type, waitlist) — 1 call.
2. Multi-currency (small, pervasive — do early so new UI uses it).
3. Per-branch landing pages.
4. Geolocation + pickup fallback.
5. Vendor dashboard completion.
6. Admin approval + global analytics.
7. Analytics server fns + charts.

Each step is independently shippable. I'll batch parallel file writes per step to move fast.

Confirm and I'll start with the migration + currency helper on the next turn.
