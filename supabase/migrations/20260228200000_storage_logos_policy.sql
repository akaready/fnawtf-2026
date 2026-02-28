-- Ensure the logos bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos
DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow authenticated users to update/overwrite logos
DO $$ BEGIN
  CREATE POLICY "Authenticated users can update logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'logos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow authenticated users to delete logos
DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'logos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Allow public read access for logos
DO $$ BEGIN
  CREATE POLICY "Public read access for logos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'logos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
