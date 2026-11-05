// ═══════════════════════════════════════════════════════════════════
// Background crawl — reads queued product pages and caches their prices.
// Highest priority first (common trade items), oldest crawl first. Each
// page's real product name, price and link go into market_prices, so most
// quotes find a recent price without opening a page at all.
//
//   POST { batchSize?: number, supplier?: string }
// ═══════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchPage, extractProducts } from "../_shared/scraper.ts";
import { storeProduct } from "../_shared/live-price.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RECRAWL_DAYS = Number(Deno.env.get("RECRAWL_DAYS") || 14);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { batchSize = 10, supplier } = await req.json().catch(() => ({}));
    const stale = new Date(Date.now() - RECRAWL_DAYS * 86_400_000).toISOString();

    let query = supabase
      .from("crawl_queue")
      .select("id, url, supplier, category")
      .in("crawl_status", ["pending", "success"])
      .or(`last_crawled.is.null,last_crawled.lt.${stale}`)
      .order("priority", { ascending: false })
      .order("last_crawled", { ascending: true, nullsFirst: true })
      .limit(Math.min(Number(batchSize) || 10, 60));
    if (supplier) query = query.eq("supplier", supplier);

    const { data: items, error } = await query;
    if (error) throw new Error(`Failed to read queue: ${error.message}`);
    if (!items?.length) {
      return new Response(JSON.stringify({ success: true, processed: 0, message: "Queue empty" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = { processed: 0, success: 0, failed: 0, productsAdded: 0 };

    // Different suppliers in parallel; the scraper spaces requests to the same site
    const bySupplier = new Map<string, typeof items>();
    for (const it of items) bySupplier.set(it.supplier, [...(bySupplier.get(it.supplier) ?? []), it]);

    await Promise.all([...bySupplier.values()].map(async (list) => {
      for (const item of list) {
        results.processed++;
        const page = await fetchPage(item.url, { allowFirecrawl: false });
        const product = page.ok ? extractProducts(page.html, item.url)[0] : undefined;
        if (product) {
          await storeProduct(supabase, {
            name: product.name, price: product.price, url: item.url, sku: product.sku,
            supplier: item.supplier, category: item.category,
          });
          results.success++;
          results.productsAdded++;
        } else {
          results.failed++;
          const blocked = page.status === 403 || page.status === 429 || page.status === 503;
          await supabase.from("crawl_queue").update({
            crawl_status: page.status === 404 ? "failed" : "pending",
            error_message: page.error ?? "no price on page",
            last_crawled: new Date().toISOString(),
          }).eq("id", item.id);
          if (blocked) break; // back off this supplier for this run
        }
      }
    }));

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("process-crawl-queue error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
