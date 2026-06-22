
-- ============================================================
-- Royal Sweets — initial schema
-- ============================================================

-- Helper trigger function for updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ----- profiles -------------------------------------------------
CREATE TABLE public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  TEXT,
  phone      TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NULL),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----- roles + permissions -------------------------------------
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role    public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE TYPE public.admin_permission AS ENUM (
  'manage_orders','manage_menu','manage_categories','view_reports','manage_users'
);

CREATE TABLE public.user_permissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission public.admin_permission NOT NULL,
  UNIQUE (user_id, permission)
);
GRANT SELECT ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own perms" ON public.user_permissions FOR SELECT USING (auth.uid() = user_id);

-- ----- categories ----------------------------------------------
CREATE TABLE public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  image_url  TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER categories_set_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ----- foods (sweets) -------------------------------------------
CREATE TABLE public.foods (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT NOT NULL DEFAULT '',
  price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url     TEXT,
  category_slug TEXT NOT NULL REFERENCES public.categories(slug) ON UPDATE CASCADE,
  is_available  BOOLEAN NOT NULL DEFAULT true,
  is_featured   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.foods TO anon, authenticated;
GRANT ALL ON public.foods TO service_role;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read available foods" ON public.foods FOR SELECT USING (true);
CREATE POLICY "Admins manage foods" ON public.foods FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER foods_set_updated_at BEFORE UPDATE ON public.foods FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ----- orders ---------------------------------------------------
CREATE TYPE public.order_status AS ENUM ('placed','preparing','on_the_way','delivered','cancelled');
CREATE TYPE public.payment_method AS ENUM ('card','cash');

CREATE TABLE public.orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status           public.order_status NOT NULL DEFAULT 'placed',
  subtotal         NUMERIC(10,2) NOT NULL,
  discount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  coupon_code      TEXT,
  delivery_fee     NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax              NUMERIC(10,2) NOT NULL DEFAULT 0,
  total            NUMERIC(10,2) NOT NULL,
  payment_method   public.payment_method NOT NULL,
  delivery_name    TEXT NOT NULL,
  delivery_phone   TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_city    TEXT NOT NULL,
  delivery_notes   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ----- order_items ---------------------------------------------
CREATE TABLE public.order_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  food_id    UUID REFERENCES public.foods(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  image_url  TEXT,
  unit_price NUMERIC(10,2) NOT NULL,
  qty        INTEGER NOT NULL CHECK (qty > 0),
  line_total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);
CREATE POLICY "Users insert own order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);
CREATE POLICY "Admins manage order items" ON public.order_items FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ----- favorites ------------------------------------------------
CREATE TABLE public.favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id    UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, food_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON public.favorites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----- reviews --------------------------------------------------
CREATE TABLE public.reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id    UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
  order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, food_id, order_id)
);
GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users insert own reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER reviews_set_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ----- coupons --------------------------------------------------
CREATE TYPE public.coupon_discount_type AS ENUM ('percent','fixed');

CREATE TABLE public.coupons (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT NOT NULL UNIQUE,
  description    TEXT,
  discount_type  public.coupon_discount_type NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  min_subtotal   NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_discount   NUMERIC(10,2),
  usage_limit    INTEGER,
  used_count     INTEGER NOT NULL DEFAULT 0,
  starts_at      TIMESTAMPTZ,
  expires_at     TIMESTAMPTZ,
  active         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage coupons" ON public.coupons FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER coupons_set_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Normalize codes upper-case
CREATE OR REPLACE FUNCTION public.tg_upper_coupon_code()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.code := upper(trim(NEW.code)); RETURN NEW; END;
$$;
CREATE TRIGGER coupons_upper_code BEFORE INSERT OR UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.tg_upper_coupon_code();

-- ----- coupon RPC: preview --------------------------------------
CREATE OR REPLACE FUNCTION public.preview_coupon(_code TEXT, _subtotal NUMERIC)
RETURNS TABLE (
  found BOOLEAN, code TEXT, description TEXT, discount_type public.coupon_discount_type,
  discount_value NUMERIC, min_subtotal NUMERIC, max_discount NUMERIC,
  starts_at TIMESTAMPTZ, expires_at TIMESTAMPTZ, usage_limit INTEGER, used_count INTEGER,
  active BOOLEAN, eligible BOOLEAN, discount NUMERIC, message TEXT
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.coupons%ROWTYPE; d NUMERIC; msg TEXT; elig BOOLEAN;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE code = upper(trim(_code));
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, upper(trim(_code)), NULL::TEXT, NULL::public.coupon_discount_type, NULL::NUMERIC, NULL::NUMERIC, NULL::NUMERIC, NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ, NULL::INTEGER, NULL::INTEGER, NULL::BOOLEAN, false, 0::NUMERIC, 'No promo code matches that.';
    RETURN;
  END IF;
  elig := true; msg := 'Promo code applied.';
  IF NOT c.active THEN elig := false; msg := 'This promo code is not active.';
  ELSIF c.starts_at IS NOT NULL AND now() < c.starts_at THEN elig := false; msg := 'This promo code is not active yet.';
  ELSIF c.expires_at IS NOT NULL AND now() > c.expires_at THEN elig := false; msg := 'This promo code has expired.';
  ELSIF c.usage_limit IS NOT NULL AND c.used_count >= c.usage_limit THEN elig := false; msg := 'This promo code has reached its usage limit.';
  ELSIF _subtotal < c.min_subtotal THEN elig := false; msg := format('Spend at least %s SAR to use this code.', c.min_subtotal::TEXT);
  END IF;
  d := 0;
  IF elig THEN
    IF c.discount_type = 'percent' THEN d := round((_subtotal * c.discount_value / 100)::NUMERIC, 2);
    ELSE d := c.discount_value; END IF;
    IF c.max_discount IS NOT NULL AND d > c.max_discount THEN d := c.max_discount; END IF;
    IF d > _subtotal THEN d := _subtotal; END IF;
  END IF;
  RETURN QUERY SELECT true, c.code, c.description, c.discount_type, c.discount_value, c.min_subtotal, c.max_discount, c.starts_at, c.expires_at, c.usage_limit, c.used_count, c.active, elig, d, msg;
END;
$$;

-- ----- coupon RPC: validate -------------------------------------
CREATE OR REPLACE FUNCTION public.validate_coupon(_code TEXT, _subtotal NUMERIC)
RETURNS TABLE (valid BOOLEAN, code TEXT, discount NUMERIC, message TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE p RECORD;
BEGIN
  SELECT * INTO p FROM public.preview_coupon(_code, _subtotal);
  IF NOT p.found THEN
    RETURN QUERY SELECT false, p.code, 0::NUMERIC, p.message; RETURN;
  END IF;
  RETURN QUERY SELECT p.eligible, p.code, p.discount, p.message;
END;
$$;

-- ----- coupon RPC: validate_and_redeem --------------------------
CREATE OR REPLACE FUNCTION public.validate_and_redeem_coupon(_code TEXT, _subtotal NUMERIC)
RETURNS TABLE (valid BOOLEAN, code TEXT, discount NUMERIC, message TEXT)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.coupons%ROWTYPE; d NUMERIC; msg TEXT; ok BOOLEAN;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE code = upper(trim(_code)) FOR UPDATE;
  IF NOT FOUND THEN RETURN QUERY SELECT false, upper(trim(_code)), 0::NUMERIC, 'Invalid promo code'; RETURN; END IF;
  ok := true; msg := 'Promo code applied.';
  IF NOT c.active THEN ok := false; msg := 'This promo code is not active.';
  ELSIF c.starts_at IS NOT NULL AND now() < c.starts_at THEN ok := false; msg := 'This promo code is not active yet.';
  ELSIF c.expires_at IS NOT NULL AND now() > c.expires_at THEN ok := false; msg := 'This promo code has expired.';
  ELSIF c.usage_limit IS NOT NULL AND c.used_count >= c.usage_limit THEN ok := false; msg := 'This promo code has reached its usage limit.';
  ELSIF _subtotal < c.min_subtotal THEN ok := false; msg := format('Spend at least %s SAR to use this code.', c.min_subtotal::TEXT);
  END IF;
  IF NOT ok THEN RETURN QUERY SELECT false, c.code, 0::NUMERIC, msg; RETURN; END IF;
  IF c.discount_type = 'percent' THEN d := round((_subtotal * c.discount_value / 100)::NUMERIC, 2);
  ELSE d := c.discount_value; END IF;
  IF c.max_discount IS NOT NULL AND d > c.max_discount THEN d := c.max_discount; END IF;
  IF d > _subtotal THEN d := _subtotal; END IF;
  UPDATE public.coupons SET used_count = used_count + 1 WHERE id = c.id;
  RETURN QUERY SELECT true, c.code, d, msg;
END;
$$;

GRANT EXECUTE ON FUNCTION public.preview_coupon(TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon(TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_and_redeem_coupon(TEXT, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, anon, service_role;

-- ============================================================
-- Seed: Royal Sweets catalog
-- ============================================================
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Baklava', 'baklava', 1),
  ('Kunafa', 'kunafa', 2),
  ('Gift Trays', 'trays', 3),
  ('Warbat', 'warbat', 4),
  ('Levantine Cakes', 'cakes', 5);

INSERT INTO public.foods (name, slug, description, price, image_url, category_slug, is_available, is_featured) VALUES
  ('Pistachio Baklava','baklava-pistachio','Forty hand-layered sheets of phyllo brushed with clarified butter, filled with crushed Aleppo pistachios and rose-syrup glaze.',38,NULL,'baklava',true,true),
  ('Kunafa Naabulsiyeh','kunafa-cheese','Crispy semolina threads over fresh akkawi cheese, drowned in orange-blossom syrup, dusted with pistachio.',32,NULL,'kunafa',true,true),
  ('Kunafa Naameh','kunafa-naameh','Velvet layer of fine kataifi piped with ashta cream, crowned with a candied cherry. Boxed warm.',36,NULL,'kunafa',true,true),
  ('Harissa with Ashta','harissa-pistachio','Tender semolina cake split with fresh ashta, drenched in lemon syrup and dusted with pistachio crumb.',28,NULL,'cakes',true,false),
  ('Mafroukeh Pistachio','mafroukeh','Crumbly semolina dough enriched with ghee, layered with thick ashta and blanketed with pistachio.',34,NULL,'cakes',true,true),
  ('Pistachio Fingers','finger-baklava','Hand-rolled kataifi fingers filled with whole pistachios, baked golden, brushed with light syrup.',26,NULL,'baklava',true,false),
  ('Phyllo Rolls (Borma)','baklava-rolls','Tight phyllo cylinders generously stuffed with pistachios, sliced to reveal the bright green centre.',42,NULL,'baklava',true,false),
  ('Warbat with Ashta','warbat','Crisp triangular phyllo pockets with a generous heart of fresh ashta and crushed pistachio.',30,NULL,'warbat',true,false),
  ('Almond Mussels (Asabe)','almond-baklava','Hand-shaped phyllo mussels filled with sweet cream, crowned with a single roasted almond.',36,NULL,'baklava',true,false),
  ('Layali Lubnan','layali-lubnan','Cool semolina pudding layered with ashta and finished with rose-water syrup and pistachio.',24,NULL,'cakes',true,false),
  ('Kunafa Mabrumeh','kunafa-slice','Crisp rolled kunafa sliced to reveal a generous pistachio core, brushed with light syrup.',34,NULL,'kunafa',true,false),
  ('The Royal Mixed Tray','royal-tray','A presentation tray with a tasting of every signature: baklava, mussels, fingers, kunafa, warbat and more.',120,NULL,'trays',true,true);

INSERT INTO public.coupons (code, description, discount_type, discount_value, min_subtotal, active) VALUES
  ('ROYAL20','First-order 20% off your gift box','percent',20,50,true),
  ('GIFT15','15% off gift trays','percent',15,80,true);
