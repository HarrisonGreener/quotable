// ═══════════════════════════════════════════════════════════════════
// Product-page index
//
// Reads supplier sitemaps and stores EVERY product page address with the
// words in it ("thistle multi finish plaster 25kg"). At quote time any item
// the AI lists is searched against this index and the best pages are opened
// live for their current price. Pages for common trade items are also
// queued for the background crawl so most prices are already cached.
//
// Suppliers below were checked live (scrape-check workflow, Nov 2026): their
// robots.txt allows product pages and the pages carry schema.org prices.
// Their search pages are disallowed, so we never scrape searches.
//
//   POST {}                       all suppliers (slow — prefer one per call)
//   POST { supplier: "Wickes" }   one supplier
// ═══════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { readSitemap } from "../_shared/scraper.ts";
import { recipeShoppingList, slugText } from "../_shared/recipes/index.ts";
import { searchTerms } from "../_shared/live-price.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const SUPPLIERS: Record<string, { sitemap: string; pattern: RegExp }> = {
  Toolstation: { sitemap: "https://www.toolstation.com/sitemap.xml", pattern: /\/p\d{3,}/ },
  Wickes: { sitemap: "https://www.wickes.co.uk/sitemap.xml", pattern: /\/p\/\d+/ },
  "Travis Perkins": { sitemap: "https://www.travisperkins.co.uk/sitemap.xml", pattern: /\/p\/|\/product|\/\d{5,}(?:$|[/?.])/i },
};

// Words from everyday trade items: pages containing them are crawled first
const COMMON = new Set(recipeShoppingList().flatMap((i) => searchTerms(i.name)));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { supplier: only, sitemapLimit = 80000 } = await req.json().catch(() => ({}));
    const results: Record<string, { indexed: number; common: number; error?: string }> = {};

    for (const [supplier, cfg] of Object.entries(SUPPLIERS)) {
      if (only && only !== supplier) continue;
      try {
        const urls = await readSitemap(cfg.sitemap, cfg.pattern, sitemapLimit);
        const rows = [];
        let common = 0;
        for (const url of urls) {
          const slug = slugText(url).toLowerCase();
          if (slug.length < 6) continue;
          const isCommon = slug.split(" ").some((w) => COMMON.has(w));
          if (isCommon) common++;
          rows.push({ url, supplier, slug, priority: isCommon ? 50 : 20, crawl_status: "pending" });
        }
        let indexed = 0;
        for (let i = 0; i < rows.length; i += 500) {
          const { error, count } = await supabase.from("crawl_queue")
            .upsert(rows.slice(i, i + 500), { onConflict: "url", ignoreDuplicates: false, count: "exact" });
          if (!error) indexed += count ?? 0;
          else console.log(`${supplier} batch ${i}: ${error.message}`);
        }
        results[supplier] = { indexed, common };
        console.log(`${supplier}: ${urls.length} product pages indexed (${common} common trade items)`);
      } catch (err) {
        results[supplier] = { indexed: 0, common: 0, error: err instanceof Error ? err.message : String(err) };
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("discover-product-urls error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
