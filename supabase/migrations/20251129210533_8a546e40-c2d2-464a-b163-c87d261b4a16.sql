-- Add onboarding tracking fields to app_settings table
ALTER TABLE public.app_settings
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS setup_checklist JSONB DEFAULT '{"brand_added": false, "quote_created": false, "invoice_created": false, "job_scheduled": false}'::jsonb;