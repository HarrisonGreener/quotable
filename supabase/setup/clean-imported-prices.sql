-- Run ONCE in the SQL editor after copying data across from Lovable.
--
-- 1. The old "Toolstation Public Catalogue" source was a hard-coded price list
--    with ±5% random noise added nightly — not real Toolstation prices. Rename
--    it so quotes treat those rows as estimates (they show "Verify ↗").
UPDATE public.price_sources
SET name = 'Quotable Reference Prices', source_type = 'reference'
WHERE name = 'Toolstation Public Catalogue';

-- 2. Its nightly noise isn't real price history.
DELETE FROM public.price_history
WHERE source_id IN (SELECT id FROM public.price_sources WHERE source_type = 'reference');

-- 3. Scraped page furniture saved as products ("Reduced Price", "Shop by...",
--    "What are Plumbing Valves?" …).
UPDATE public.market_prices SET is_active = false
WHERE product_name ~* '\?\s*$'
   OR product_name ~* '^(what|why|how|when|types of|see also|shop by|reduced price|product information|electrical consumer units|exclusive|")'
   OR product_name LIKE '%](%';
