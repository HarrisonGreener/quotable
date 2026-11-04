-- Remove products linked to non-supplier sources (GOV.UK and ONS)
DELETE FROM public.market_prices WHERE source_id IN (
  SELECT id FROM public.price_sources WHERE name IN ('GOV.UK Building Materials', 'ONS Construction Price Index')
);

-- Delete the non-supplier sources
DELETE FROM public.price_sources WHERE name IN ('GOV.UK Building Materials', 'ONS Construction Price Index');

-- Disable suppliers that have never successfully scraped
UPDATE public.price_sources 
SET is_enabled = false, last_fetch_status = 'disabled_never_worked'
WHERE name IN (
  'B&Q Trade Point', 'Edmundson Electrical', 'GSF Car Parts', 'Halfords Trade', 
  'Howdens', 'IronmongeryDirect', 'Plumbase', 'PlumbNation', 'Selco', 'Wickes',
  'Travis Perkins', 'Jewson', 'Euro Car Parts'
) AND (last_fetch_at IS NULL OR last_fetch_status = 'error');