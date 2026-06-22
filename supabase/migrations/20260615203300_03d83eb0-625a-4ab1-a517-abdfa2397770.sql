-- Track each order status change with a timestamp
CREATE TABLE public.order_status_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.order_status_events TO authenticated;
GRANT ALL ON public.order_status_events TO service_role;

ALTER TABLE public.order_status_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read events for their own orders"
ON public.order_status_events FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = order_status_events.order_id AND o.user_id = auth.uid()
));

CREATE POLICY "Admins read all order events"
ON public.order_status_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Log status changes automatically
CREATE OR REPLACE FUNCTION public.log_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.order_status_events(order_id, status) VALUES (NEW.id, NEW.status);
  ELSIF (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.order_status_events(order_id, status) VALUES (NEW.id, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_order_status
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.log_order_status();

-- Estimated delivery time on orders
ALTER TABLE public.orders ADD COLUMN estimated_delivery_at timestamptz;
UPDATE public.orders SET estimated_delivery_at = created_at + interval '45 minutes'
  WHERE estimated_delivery_at IS NULL;
ALTER TABLE public.orders ALTER COLUMN estimated_delivery_at SET DEFAULT (now() + interval '45 minutes');

-- Backfill a "placed" event for existing orders
INSERT INTO public.order_status_events(order_id, status, created_at)
SELECT id, 'placed', created_at FROM public.orders;

-- Live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_status_events;