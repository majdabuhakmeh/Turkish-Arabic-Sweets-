
-- Add tags array to restaurants for multi-category support
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS restaurants_tags_idx ON public.restaurants USING GIN (tags);

-- Storage RLS for the restaurant-assets bucket (public read; auth write/update/delete)
DO $$ BEGIN
  CREATE POLICY "restaurant_assets_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'restaurant-assets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "restaurant_assets_auth_insert" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'restaurant-assets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "restaurant_assets_auth_update" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'restaurant-assets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "restaurant_assets_auth_delete" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'restaurant-assets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
