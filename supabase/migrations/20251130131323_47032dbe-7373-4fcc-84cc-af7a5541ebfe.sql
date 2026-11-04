-- Add quote generation settings to app_settings table
ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS default_hourly_rate numeric,
ADD COLUMN IF NOT EXISTS default_callout_fee numeric,
ADD COLUMN IF NOT EXISTS quote_generation_mode text DEFAULT 'minimal' CHECK (quote_generation_mode IN ('minimal', 'detailed'));