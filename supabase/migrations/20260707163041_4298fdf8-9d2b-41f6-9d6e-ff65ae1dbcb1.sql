
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment_type text NOT NULL DEFAULT 'delivery' CHECK (fulfillment_type IN ('delivery','pickup'));

CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  city text,
  lat numeric,
  lng numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.waitlist TO authenticated;
GRANT INSERT ON public.waitlist TO anon;
GRANT INSERT ON public.waitlist TO authenticated;
GRANT ALL ON public.waitlist TO service_role;

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist" ON public.waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view waitlist" ON public.waitlist FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
