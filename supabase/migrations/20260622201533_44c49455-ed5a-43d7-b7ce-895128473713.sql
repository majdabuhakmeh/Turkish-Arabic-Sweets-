
ALTER FUNCTION public.tg_set_updated_at()        SECURITY INVOKER;
ALTER FUNCTION public.tg_upper_coupon_code()     SECURITY INVOKER;
ALTER FUNCTION public.tg_log_order_status_change() SECURITY INVOKER;
-- handle_new_user must stay SECURITY DEFINER (writes profile from auth trigger)
-- has_role / preview_coupon / validate_coupon must stay callable by authenticated for the app to work
