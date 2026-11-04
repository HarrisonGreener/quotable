-- Add bank details columns to brand_settings table
ALTER TABLE public.brand_settings 
ADD COLUMN IF NOT EXISTS account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS sort_code TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS swift_bic TEXT,
ADD COLUMN IF NOT EXISTS payment_notes TEXT;