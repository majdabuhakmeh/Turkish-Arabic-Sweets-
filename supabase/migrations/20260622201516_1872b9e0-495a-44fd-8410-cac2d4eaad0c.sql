
CREATE OR REPLACE FUNCTION public.tg_upper_coupon_code()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.code := upper(trim(NEW.code)); RETURN NEW; END;
$$;
