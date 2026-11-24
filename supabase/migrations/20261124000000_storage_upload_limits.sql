-- Only accept real images, and cap their size, so nothing else can be stored.
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp'],
    file_size_limit = 2097152            -- 2 MB
WHERE id = 'logos';

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'],
    file_size_limit = 10485760           -- 10 MB
WHERE id = 'quote-photos';
