CREATE OR REPLACE FUNCTION public.preview_coupon(_code text, _subtotal numeric)
RETURNS TABLE(
  found boolean,
  code text,
  description text,
  discount_type text,
  discount_value numeric,
  min_subtotal numeric,
  max_discount numeric,
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit integer,
  used_count integer,
  active boolean,
  eligible boolean,
  discount numeric,
  message text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons;
  d numeric := 0;
  ok boolean := true;
  msg text := 'Ready to apply';
BEGIN
  SELECT * INTO c FROM public.coupons WHERE code = upper(trim(_code)) LIMIT 1;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, upper(trim(_code)), NULL::text, NULL::text, NULL::numeric,
      NULL::numeric, NULL::numeric, NULL::timestamptz, NULL::timestamptz, NULL::integer,
      NULL::integer, NULL::boolean, false, 0::numeric, 'No promo code matches that.';
    RETURN;
  END IF;

  IF NOT c.active THEN ok := false; msg := 'This code is no longer active';
  ELSIF c.starts_at IS NOT NULL AND now() < c.starts_at THEN ok := false; msg := 'This code is not active yet';
  ELSIF c.expires_at IS NOT NULL AND now() > c.expires_at THEN ok := false; msg := 'This code has expired';
  ELSIF c.usage_limit IS NOT NULL AND c.used_count >= c.usage_limit THEN ok := false; msg := 'This code has reached its usage limit';
  ELSIF _subtotal < c.min_subtotal THEN ok := false;
    msg := 'Spend at least $' || to_char(c.min_subtotal, 'FM999990.00') || ' to use this code';
  END IF;

  IF c.discount_type = 'percent' THEN
    d := _subtotal * c.discount_value / 100;
    IF c.max_discount IS NOT NULL AND d > c.max_discount THEN d := c.max_discount; END IF;
  ELSE
    d := c.discount_value;
  END IF;
  IF d > _subtotal THEN d := _subtotal; END IF;
  d := round(d, 2);
  IF NOT ok THEN d := 0; END IF;

  RETURN QUERY SELECT true, c.code, c.description, c.discount_type, c.discount_value,
    c.min_subtotal, c.max_discount, c.starts_at, c.expires_at, c.usage_limit, c.used_count,
    c.active, ok, d, msg;
END; $$;

REVOKE EXECUTE ON FUNCTION public.preview_coupon(text, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.preview_coupon(text, numeric) TO authenticated;