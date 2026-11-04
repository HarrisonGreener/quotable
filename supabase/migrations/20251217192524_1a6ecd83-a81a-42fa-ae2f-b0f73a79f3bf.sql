-- Remove duplicate market_prices keeping only the most recent for each product_name + source_id
DELETE FROM public.market_prices a
USING public.market_prices b
WHERE a.id < b.id
  AND a.product_name = b.product_name
  AND a.source_id = b.source_id
  AND a.source_id IS NOT NULL;

-- Add unique constraint on product_name and source_id for proper upsert support
ALTER TABLE public.market_prices 
ADD CONSTRAINT market_prices_product_source_unique 
UNIQUE (product_name, source_id);