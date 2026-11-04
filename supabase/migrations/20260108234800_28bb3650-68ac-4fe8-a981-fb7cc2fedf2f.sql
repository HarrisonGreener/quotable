-- Add default_day_rate to app_settings
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS default_day_rate numeric;

-- Add day_rate to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS day_rate numeric;