-- Create price_sources table first (referenced by other tables)
CREATE TABLE public.price_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('open_data', 'merchant_feed', 'supplier_api')),
  base_url TEXT,
  priority INTEGER DEFAULT 50,
  is_enabled BOOLEAN DEFAULT true,
  requires_api_key BOOLEAN DEFAULT false,
  robots_txt_compliant BOOLEAN DEFAULT true,
  last_fetch_at TIMESTAMPTZ,
  last_fetch_status TEXT,
  fetch_frequency TEXT DEFAULT 'daily' CHECK (fetch_frequency IN ('daily', 'weekly', 'monthly')),
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create market_prices table
CREATE TABLE public.market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  unit TEXT NOT NULL,
  unit_price NUMERIC NOT NULL,
  min_price NUMERIC,
  max_price NUMERIC,
  source_id UUID REFERENCES public.price_sources(id) ON DELETE SET NULL,
  region TEXT DEFAULT 'UK',
  confidence_score NUMERIC DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Create price_history table
CREATE TABLE public.price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_price_id UUID REFERENCES public.market_prices(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  source_id UUID REFERENCES public.price_sources(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- Create regional_adjustments table
CREATE TABLE public.regional_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  category TEXT,
  adjustment_factor NUMERIC DEFAULT 1.0,
  notes TEXT,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(region, category)
);

-- Create commodity_indices table (using index_date instead of reserved current_date)
CREATE TABLE public.commodity_indices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity TEXT NOT NULL,
  index_value NUMERIC NOT NULL,
  base_date DATE NOT NULL,
  index_date DATE NOT NULL,
  percentage_change NUMERIC,
  source TEXT,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_market_prices_category ON public.market_prices(category);
CREATE INDEX idx_market_prices_product_name ON public.market_prices(product_name);
CREATE INDEX idx_market_prices_region ON public.market_prices(region);
CREATE INDEX idx_market_prices_last_updated ON public.market_prices(last_updated);
CREATE INDEX idx_price_history_market_price_id ON public.price_history(market_price_id);
CREATE INDEX idx_commodity_indices_commodity ON public.commodity_indices(commodity);

-- Enable RLS
ALTER TABLE public.price_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commodity_indices ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Read-only for authenticated users
CREATE POLICY "Authenticated users can view price sources"
  ON public.price_sources FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view market prices"
  ON public.market_prices FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view price history"
  ON public.price_history FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view regional adjustments"
  ON public.regional_adjustments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view commodity indices"
  ON public.commodity_indices FOR SELECT
  USING (auth.uid() IS NOT NULL);