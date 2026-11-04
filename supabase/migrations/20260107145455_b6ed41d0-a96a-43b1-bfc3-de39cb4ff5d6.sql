-- Add skip_ai_pricing option to app_settings
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS skip_ai_pricing boolean DEFAULT false;