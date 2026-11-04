-- Add trade profile columns to app_settings table
ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS primary_trade TEXT,
ADD COLUMN IF NOT EXISTS secondary_trades JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'both',
ADD COLUMN IF NOT EXISTS typical_job_size TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS trade_notes TEXT,
ADD COLUMN IF NOT EXISTS other_trade_name TEXT,
ADD COLUMN IF NOT EXISTS other_trade_description TEXT,
ADD COLUMN IF NOT EXISTS other_trade_similar_to TEXT,
ADD COLUMN IF NOT EXISTS other_trade_attributes JSONB DEFAULT '[]'::jsonb;