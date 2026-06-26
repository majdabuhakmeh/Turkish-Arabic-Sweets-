
-- Auth users can write/update/delete to restaurant-assets; everyone can read via signed URLs (server signs them)
DO $$ BEGIN
  CREATE POLICY "ra_auth_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'restaurant-assets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ra_auth_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'restaurant-assets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ra_auth_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'restaurant-assets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "ra_auth_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'restaurant-assets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
