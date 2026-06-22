-- Atomic validate + redeem to close the TOCTOU race on coupon usage limits.
CREATE OR REPLACE FUNCTION public.validate_and_redeem_coupon(_code text, _subtotal numeric)
RETURNS TABLE(valid boolean, code text, discount numeric, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c public.coupons;
  d numeric := 0;
BEGIN
  SELECT * INTO c FROM public.coupons
    WHERE code = upper(trim(_code)) LIMIT 1
    FOR UPDATE;  -- lock the row for the duration of the transaction

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

  -- Atomically consume one use under the same lock.
  UPDATE public.coupons SET used_count = used_count + 1 WHERE id = c.id;

  RETURN QUERY SELECT true, c.code, d, 'Promo applied';
END; $$;

-- This function consumes coupon usage: only the server (service_role) may call it.
REVOKE ALL ON FUNCTION public.validate_and_redeem_coupon(text, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_and_redeem_coupon(text, numeric) FROM anon;
REVOKE ALL ON FUNCTION public.validate_and_redeem_coupon(text, numeric) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.validate_and_redeem_coupon(text, numeric) TO service_role;

-- redeem_coupon must not be callable directly by users (lets anyone exhaust limits).
REVOKE ALL ON FUNCTION public.redeem_coupon(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_coupon(text) FROM anon;
REVOKE ALL ON FUNCTION public.redeem_coupon(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text) TO service_role;