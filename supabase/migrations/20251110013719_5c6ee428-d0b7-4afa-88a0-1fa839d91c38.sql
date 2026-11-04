-- Storage policies for 'logos' bucket to allow authenticated uploads and public reads

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public read access for logos'
  ) THEN
    CREATE POLICY "Public read access for logos"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'logos');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload to own folder in logos'
  ) THEN
    CREATE POLICY "Authenticated users can upload to own folder in logos"
    ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'logos'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update own files in logos'
  ) THEN
    CREATE POLICY "Authenticated users can update own files in logos"
    ON storage.objects
    FOR UPDATE TO authenticated
    USING (
      bucket_id = 'logos'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can delete own files in logos'
  ) THEN
    CREATE POLICY "Authenticated users can delete own files in logos"
    ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'logos'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;