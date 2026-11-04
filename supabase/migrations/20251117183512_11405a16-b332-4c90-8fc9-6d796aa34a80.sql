-- Keep only the most recent brand_settings record per user
DELETE FROM public.brand_settings
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.brand_settings
  ORDER BY user_id, updated_at DESC
);

-- Add unique constraint on user_id to prevent duplicates
ALTER TABLE public.brand_settings
ADD CONSTRAINT brand_settings_user_id_key UNIQUE (user_id);