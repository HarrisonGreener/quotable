-- Product-page index for live pricing.
-- Every product URL from supplier sitemaps is stored with the words from its
-- address, so a quote can find the right product page for any item and read
-- its price live.

ALTER TABLE public.crawl_queue
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS slug_tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(slug, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_crawl_queue_slug_tsv ON public.crawl_queue USING gin (slug_tsv);

-- Prices: searchable by name, and one row per product page
ALTER TABLE public.market_prices
  ADD COLUMN IF NOT EXISTS name_tsv tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(product_name, ''))) STORED;
CREATE INDEX IF NOT EXISTS idx_market_prices_name_tsv ON public.market_prices USING gin (name_tsv);
CREATE UNIQUE INDEX IF NOT EXISTS idx_market_prices_product_url ON public.market_prices (product_url) WHERE product_url IS NOT NULL;

-- Any-word search, best matches first. Terms are plain words (no operators).
CREATE OR REPLACE FUNCTION public.search_product_pages(terms text[], lim int DEFAULT 20)
RETURNS TABLE (url text, supplier text, slug text, rank real, last_crawled timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH q AS (
    SELECT to_tsquery('simple', string_agg(quote_literal(t) || ':*', ' | ')) AS query
    FROM unnest(terms) t WHERE t ~ '^[a-z0-9.]+$'
  )
  SELECT c.url, c.supplier, c.slug, ts_rank(c.slug_tsv, q.query) AS rank, c.last_crawled
  FROM public.crawl_queue c, q
  WHERE q.query IS NOT NULL AND c.slug_tsv @@ q.query
  ORDER BY rank DESC
  LIMIT least(lim, 100);
$$;

CREATE OR REPLACE FUNCTION public.search_market_prices(terms text[], lim int DEFAULT 30)
RETURNS TABLE (product_name text, unit text, unit_price numeric, product_url text, source_name text,
               source_type text, confidence_score numeric, last_updated timestamptz, rank real)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH q AS (
    SELECT to_tsquery('simple', string_agg(quote_literal(t) || ':*', ' | ')) AS query
    FROM unnest(terms) t WHERE t ~ '^[a-z0-9.]+$'
  )
  SELECT m.product_name, m.unit, m.unit_price, m.product_url, s.name, s.source_type,
         m.confidence_score, m.last_updated, ts_rank(m.name_tsv, q.query) AS rank
  FROM public.market_prices m
  LEFT JOIN public.price_sources s ON s.id = m.source_id, q
  WHERE q.query IS NOT NULL AND m.is_active AND m.name_tsv @@ q.query
  ORDER BY rank DESC
  LIMIT least(lim, 100);
$$;

REVOKE ALL ON FUNCTION public.search_product_pages(text[], int) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.search_market_prices(text[], int) FROM public, anon, authenticated;
