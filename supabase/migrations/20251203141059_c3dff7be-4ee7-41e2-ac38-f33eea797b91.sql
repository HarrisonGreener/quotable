-- Add preferred_suppliers column to app_settings if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_settings' AND column_name = 'preferred_suppliers') THEN
    ALTER TABLE app_settings ADD COLUMN preferred_suppliers JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add applicable_trades column to price_sources if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'price_sources' AND column_name = 'applicable_trades') THEN
    ALTER TABLE price_sources ADD COLUMN applicable_trades TEXT[] DEFAULT '{}';
  END IF;
END $$;