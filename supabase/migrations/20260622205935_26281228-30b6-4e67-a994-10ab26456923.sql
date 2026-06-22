
-- =====================================================
-- PHASE 1: Multi-Restaurant / Multi-Branch Foundation
-- =====================================================

-- Extend app_role enum
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'restaurant_owner';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'branch_manager';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Status enums
DO $$ BEGIN
  CREATE TYPE public.restaurant_status AS ENUM ('pending','active','inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.branch_status AS ENUM ('pending','active','inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.branch_staff_role AS ENUM ('manager','staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- restaurants
-- =====================================================
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  cover_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  business_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  currency TEXT NOT NULL DEFAULT 'SAR',
  status public.restaurant_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.restaurants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.restaurants TO authenticated;
GRANT ALL ON public.restaurants TO service_role;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- branches
-- =====================================================
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  phone TEXT,
  opening_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
  i18n JSONB NOT NULL DEFAULT '{}'::jsonb,
  delivery_radius_km NUMERIC(6,2) NOT NULL DEFAULT 10,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_order NUMERIC(10,2) NOT NULL DEFAULT 0,
  eta_minutes INTEGER NOT NULL DEFAULT 45,
  status public.branch_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, code)
);

GRANT SELECT ON public.branches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- branch_staff
-- =====================================================
CREATE TABLE IF NOT EXISTS public.branch_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.branch_staff_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (branch_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.branch_staff TO authenticated;
GRANT ALL ON public.branch_staff TO service_role;
ALTER TABLE public.branch_staff ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Security definer helpers (created early; reference tables above)
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_restaurant_owner(_user UUID, _restaurant UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurants WHERE id = _restaurant AND owner_id = _user);
$$;

CREATE OR REPLACE FUNCTION public.is_branch_staff(_user UUID, _branch UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.branch_staff WHERE branch_id = _branch AND user_id = _user
  ) OR EXISTS (
    SELECT 1 FROM public.branches b
    JOIN public.restaurants r ON r.id = b.restaurant_id
    WHERE b.id = _branch AND (b.manager_id = _user OR r.owner_id = _user)
  );
$$;

CREATE OR REPLACE FUNCTION public.is_branch_manager(_user UUID, _branch UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.branches b
    JOIN public.restaurants r ON r.id = b.restaurant_id
    WHERE b.id = _branch AND (b.manager_id = _user OR r.owner_id = _user)
  ) OR EXISTS (
    SELECT 1 FROM public.branch_staff
    WHERE branch_id = _branch AND user_id = _user AND role = 'manager'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_restaurant_member(_user UUID, _restaurant UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.restaurants WHERE id = _restaurant AND owner_id = _user)
  OR EXISTS (
    SELECT 1 FROM public.branch_staff bs
    JOIN public.branches b ON b.id = bs.branch_id
    WHERE bs.user_id = _user AND b.restaurant_id = _restaurant
  )
  OR EXISTS (
    SELECT 1 FROM public.branches WHERE restaurant_id = _restaurant AND manager_id = _user
  );
$$;

-- =====================================================
-- branch_inventory
-- =====================================================
CREATE TABLE IF NOT EXISTS public.branch_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  available BOOLEAN NOT NULL DEFAULT true,
  stock INTEGER,
  price_override NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (branch_id, food_id)
);

GRANT SELECT ON public.branch_inventory TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branch_inventory TO authenticated;
GRANT ALL ON public.branch_inventory TO service_role;
ALTER TABLE public.branch_inventory ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- delivery_zones
-- =====================================================
CREATE TABLE IF NOT EXISTS public.delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  polygon JSONB,
  radius_km NUMERIC(6,2),
  fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  eta_minutes INTEGER NOT NULL DEFAULT 45,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.delivery_zones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_zones TO authenticated;
GRANT ALL ON public.delivery_zones TO service_role;
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Extend existing tables (nullable first for backfill)
-- =====================================================
ALTER TABLE public.foods       ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE;
ALTER TABLE public.categories  ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE;
ALTER TABLE public.orders      ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL;
ALTER TABLE public.orders      ADD COLUMN IF NOT EXISTS branch_id     UUID REFERENCES public.branches(id)    ON DELETE SET NULL;
ALTER TABLE public.coupons     ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_foods_restaurant       ON public.foods(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_categories_restaurant  ON public.categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant      ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_branch          ON public.orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_coupons_restaurant     ON public.coupons(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_branches_restaurant    ON public.branches(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_branch_inventory_branch ON public.branch_inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_inventory_food   ON public.branch_inventory(food_id);

-- =====================================================
-- updated_at triggers
-- =====================================================
DROP TRIGGER IF EXISTS trg_restaurants_updated_at ON public.restaurants;
CREATE TRIGGER trg_restaurants_updated_at BEFORE UPDATE ON public.restaurants
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_branches_updated_at ON public.branches;
CREATE TRIGGER trg_branches_updated_at BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_branch_inventory_updated_at ON public.branch_inventory;
CREATE TRIGGER trg_branch_inventory_updated_at BEFORE UPDATE ON public.branch_inventory
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS trg_delivery_zones_updated_at ON public.delivery_zones;
CREATE TRIGGER trg_delivery_zones_updated_at BEFORE UPDATE ON public.delivery_zones
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =====================================================
-- RLS Policies
-- =====================================================

-- restaurants
DROP POLICY IF EXISTS "restaurants_public_read" ON public.restaurants;
CREATE POLICY "restaurants_public_read" ON public.restaurants
  FOR SELECT USING (status = 'active' OR public.has_role(auth.uid(),'admin') OR owner_id = auth.uid());

DROP POLICY IF EXISTS "restaurants_owner_update" ON public.restaurants;
CREATE POLICY "restaurants_owner_update" ON public.restaurants
  FOR UPDATE USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "restaurants_admin_insert" ON public.restaurants;
CREATE POLICY "restaurants_admin_insert" ON public.restaurants
  FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin') OR owner_id = auth.uid());

DROP POLICY IF EXISTS "restaurants_admin_delete" ON public.restaurants;
CREATE POLICY "restaurants_admin_delete" ON public.restaurants
  FOR DELETE USING (public.has_role(auth.uid(),'admin'));

-- branches
DROP POLICY IF EXISTS "branches_public_read" ON public.branches;
CREATE POLICY "branches_public_read" ON public.branches
  FOR SELECT USING (
    status = 'active'
    OR public.has_role(auth.uid(),'admin')
    OR public.is_restaurant_owner(auth.uid(), restaurant_id)
    OR public.is_branch_staff(auth.uid(), id)
  );

DROP POLICY IF EXISTS "branches_owner_write" ON public.branches;
CREATE POLICY "branches_owner_write" ON public.branches
  FOR ALL USING (
    public.has_role(auth.uid(),'admin')
    OR public.is_restaurant_owner(auth.uid(), restaurant_id)
  ) WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.is_restaurant_owner(auth.uid(), restaurant_id)
  );

-- branch_staff
DROP POLICY IF EXISTS "branch_staff_owner_manage" ON public.branch_staff;
CREATE POLICY "branch_staff_owner_manage" ON public.branch_staff
  FOR ALL USING (
    public.has_role(auth.uid(),'admin')
    OR public.is_branch_manager(auth.uid(), branch_id)
    OR user_id = auth.uid()
  ) WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.is_branch_manager(auth.uid(), branch_id)
  );

-- branch_inventory
DROP POLICY IF EXISTS "branch_inventory_public_read" ON public.branch_inventory;
CREATE POLICY "branch_inventory_public_read" ON public.branch_inventory
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "branch_inventory_staff_write" ON public.branch_inventory;
CREATE POLICY "branch_inventory_staff_write" ON public.branch_inventory
  FOR ALL USING (
    public.has_role(auth.uid(),'admin')
    OR public.is_branch_staff(auth.uid(), branch_id)
  ) WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.is_branch_staff(auth.uid(), branch_id)
  );

-- delivery_zones
DROP POLICY IF EXISTS "delivery_zones_public_read" ON public.delivery_zones;
CREATE POLICY "delivery_zones_public_read" ON public.delivery_zones
  FOR SELECT USING (active = true OR public.has_role(auth.uid(),'admin') OR public.is_branch_staff(auth.uid(), branch_id));

DROP POLICY IF EXISTS "delivery_zones_staff_write" ON public.delivery_zones;
CREATE POLICY "delivery_zones_staff_write" ON public.delivery_zones
  FOR ALL USING (
    public.has_role(auth.uid(),'admin')
    OR public.is_branch_manager(auth.uid(), branch_id)
  ) WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR public.is_branch_manager(auth.uid(), branch_id)
  );

-- =====================================================
-- Backfill: Royal Sweets restaurant + Main Branch
-- =====================================================
DO $$
DECLARE
  v_restaurant UUID;
  v_branch UUID;
BEGIN
  -- Insert the Royal Sweets vendor if missing
  SELECT id INTO v_restaurant FROM public.restaurants WHERE slug = 'royal-sweets';
  IF v_restaurant IS NULL THEN
    INSERT INTO public.restaurants (name, slug, description, status, currency, contact_email)
    VALUES ('Royal Sweets', 'royal-sweets', 'Premium Middle Eastern desserts', 'active', 'SAR', 'hello@royalsweets.example')
    RETURNING id INTO v_restaurant;
  END IF;

  -- Main branch
  SELECT id INTO v_branch FROM public.branches WHERE restaurant_id = v_restaurant AND code = 'MAIN';
  IF v_branch IS NULL THEN
    INSERT INTO public.branches (restaurant_id, name, code, address, city, country, latitude, longitude, status, delivery_radius_km, delivery_fee, eta_minutes)
    VALUES (v_restaurant, 'Main Branch', 'MAIN', 'King Fahd Road', 'Riyadh', 'SA', 24.7136, 46.6753, 'active', 15, 15, 45)
    RETURNING id INTO v_branch;
  END IF;

  -- Link existing rows
  UPDATE public.foods      SET restaurant_id = v_restaurant WHERE restaurant_id IS NULL;
  UPDATE public.categories SET restaurant_id = v_restaurant WHERE restaurant_id IS NULL;
  UPDATE public.coupons    SET restaurant_id = v_restaurant WHERE restaurant_id IS NULL;
  UPDATE public.orders     SET restaurant_id = v_restaurant WHERE restaurant_id IS NULL;
  UPDATE public.orders     SET branch_id = v_branch         WHERE branch_id     IS NULL;

  -- Seed branch_inventory for all foods
  INSERT INTO public.branch_inventory (branch_id, food_id, available)
  SELECT v_branch, f.id, true
  FROM public.foods f
  ON CONFLICT (branch_id, food_id) DO NOTHING;
END $$;

-- Enforce NOT NULL where safe now that data is backfilled
ALTER TABLE public.foods ALTER COLUMN restaurant_id SET NOT NULL;
