-- Add include_vat column to app_settings table
ALTER TABLE app_settings
ADD COLUMN include_vat boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN app_settings.include_vat IS 'Whether to include VAT in quotes and invoices';
