REVOKE EXECUTE ON FUNCTION public.validate_coupon(text, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_coupon(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(text) TO authenticated;