-- Create script-references storage bucket (public, for beat reference images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('script-references', 'script-references', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload
DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload script references"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'script-references');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Authenticated users can update/overwrite
DO $$ BEGIN
  CREATE POLICY "Authenticated users can update script references"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'script-references');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Authenticated users can delete
DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete script references"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'script-references');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Public read access (images displayed in editor)
DO $$ BEGIN
  CREATE POLICY "Public read access for script references"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'script-references');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
