
-- Add missing columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_address TEXT;
ALTER TABLE public.orders   ADD COLUMN IF NOT EXISTS estimated_delivery_at TIMESTAMPTZ;

-- Order status events (for tracking page)
CREATE TABLE IF NOT EXISTS public.order_status_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status     public.order_status NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.order_status_events TO authenticated;
GRANT ALL    ON public.order_status_events TO service_role;
ALTER TABLE public.order_status_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own order events" ON public.order_status_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid())
);
CREATE POLICY "Admins manage order events" ON public.order_status_events FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Log status changes automatically
CREATE OR REPLACE FUNCTION public.tg_log_order_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.order_status_events (order_id, status) VALUES (NEW.id, NEW.status);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_events (order_id, status) VALUES (NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER orders_log_status AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_log_order_status_change();

-- Lock down EXECUTE on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.preview_coupon(TEXT, NUMERIC) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_coupon(TEXT, NUMERIC) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_and_redeem_coupon(TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;
