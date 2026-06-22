-- Coupons table
CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'percent',
  discount_value numeric NOT NULL DEFAULT 0,
  min_subtotal numeric NOT NULL DEFAULT 0,
  max_discount numeric,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coupons_discount_type_check CHECK (discount_type IN ('percent','fixed')),
  CONSTRAINT coupons_discount_value_check CHECK (discount_value >= 0)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage coupons"
ON public.coupons FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- keep code uppercase + maintain updated_at
CREATE OR REPLACE FUNCTION public.normalize_coupon()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.code = upper(trim(NEW.code));
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

CREATE TRIGGER coupons_normalize
BEFORE INSERT OR UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION public.normalize_coupon();

-- Order discount columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_code text;

-- Validate a coupon against a subtotal (security definer so codes aren't enumerable)
CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _subtotal numeric)
RETURNS TABLE(valid boolean, code text, discount numeric, message text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons;
  d numeric;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE code = upper(trim(_code)) LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, upper(trim(_code)), 0::numeric, 'Invalid promo code'; RETURN;
  END IF;
  IF NOT c.active THEN
    RETURN QUERY SELECT false, c.code, 0::numeric, 'This code is no longer active'; RETURN;
  END IF;
  IF c.starts_at IS NOT NULL AND now() < c.starts_at THEN
    RETURN QUERY SELECT false, c.code, 0::numeric, 'This code is not active yet'; RETURN;
  END IF;
  IF c.expires_at IS NOT NULL AND now() > c.expires_at THEN
    RETURN QUERY SELECT false, c.code, 0::numeric, 'This code has expired'; RETURN;
  END IF;
  IF c.usage_limit IS NOT NULL AND c.used_count >= c.usage_limit THEN
    RETURN QUERY SELECT false, c.code, 0::numeric, 'This code has reached its usage limit'; RETURN;
  END IF;
  IF _subtotal < c.min_subtotal THEN
    RETURN QUERY SELECT false, c.code, 0::numeric,
      'Spend at least $' || to_char(c.min_subtotal, 'FM999990.00') || ' to use this code'; RETURN;
  END IF;

  IF c.discount_type = 'percent' THEN
    d := _subtotal * c.discount_value / 100;
    IF c.max_discount IS NOT NULL AND d > c.max_discount THEN d := c.max_discount; END IF;
  ELSE
    d := c.discount_value;
  END IF;
  IF d > _subtotal THEN d := _subtotal; END IF;
  d := round(d, 2);

  RETURN QUERY SELECT true, c.code, d, 'Promo applied';
END; $$;

GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;

-- Record a redemption (increments used_count)
CREATE OR REPLACE FUNCTION public.redeem_coupon(_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE code = upper(trim(_code));
END; $$;

GRANT EXECUTE ON FUNCTION public.redeem_coupon(text) TO authenticated;