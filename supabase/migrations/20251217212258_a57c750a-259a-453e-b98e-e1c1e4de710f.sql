-- Make the logos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'logos';

-- Drop existing public read policies
DROP POLICY IF EXISTS "Logos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for logos" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Create user-specific read policy for logos
CREATE POLICY "Users can read their own logos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);