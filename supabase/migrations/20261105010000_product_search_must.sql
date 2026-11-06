-- Product-page search: optionally require one word (what the item IS, e.g. "hinge"),
-- ranked by how many of the other words match.
DROP FUNCTION IF EXISTS public.search_product_pages(text[], int);

CREATE OR REPLACE FUNCTION public.search_product_pages(terms text[], lim int DEFAULT 20, must text DEFAULT NULL)
RETURNS TABLE (url text, supplier text, slug text, rank real, last_crawled timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH q AS (
    SELECT to_tsquery('simple', string_agg(quote_literal(t) || ':*', ' | ')) AS anyq
    FROM unnest(terms) t WHERE t ~ '^[a-z0-9.]+$'
  ), m AS (
    SELECT CASE WHEN must ~ '^[a-z0-9]+$' THEN to_tsquery('simple', quote_literal(must) || ':*') END AS mustq
  )
  SELECT c.url, c.supplier, c.slug, ts_rank(c.slug_tsv, q.anyq) AS rank, c.last_crawled
  FROM public.crawl_queue c, q, m
  WHERE q.anyq IS NOT NULL AND c.slug_tsv @@ q.anyq
    AND (m.mustq IS NULL OR c.slug_tsv @@ m.mustq)
  ORDER BY rank DESC, length(c.slug) ASC
  LIMIT least(lim, 100);
$$;

REVOKE ALL ON FUNCTION public.search_product_pages(text[], int, text) FROM public, anon, authenticated;
