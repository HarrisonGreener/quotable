-- Commercial pricing settings and honest price-source types.

-- The tradesperson's own pricing rules
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS material_markup_percent numeric NOT NULL DEFAULT 0
    CHECK (material_markup_percent >= 0 AND material_markup_percent <= 300),
  ADD COLUMN IF NOT EXISTS trade_discount_percent numeric NOT NULL DEFAULT 0
    CHECK (trade_discount_percent >= 0 AND trade_discount_percent <= 90),
  ADD COLUMN IF NOT EXISTS charge_whole_packs boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hours_per_day numeric NOT NULL DEFAULT 8
    CHECK (hours_per_day > 0 AND hours_per_day <= 14),
  ADD COLUMN IF NOT EXISTS overhead_rates jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Price sources: allow scraped merchants and our own reference list.
-- (get-realtime-price already inserts 'merchant_scrape', which the old
-- constraint rejected.)
ALTER TABLE public.price_sources DROP CONSTRAINT IF EXISTS price_sources_source_type_check;
ALTER TABLE public.price_sources ADD CONSTRAINT price_sources_source_type_check
  CHECK (source_type IN ('open_data', 'merchant_feed', 'supplier_api', 'merchant_scrape', 'reference'));
