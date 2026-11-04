-- Add VAT number to brand settings
ALTER TABLE public.brand_settings 
ADD COLUMN IF NOT EXISTS vat_number text;