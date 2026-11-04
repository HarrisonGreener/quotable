import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting tiered price refresh...');

    const results: { step: string; status: string; details?: string; error?: string }[] = [];

    // ===========================================
    // TIER 1: Open Data Feeds (always runs)
    // ===========================================
    try {
      console.log('TIER 1: Fetching open data feeds...');
      const fetchResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-market-prices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (fetchResponse.ok) {
        results.push({ step: 'tier1-open-feeds', status: 'success' });
        console.log('Tier 1 complete: Open data feeds updated');
      } else {
        const errorText = await fetchResponse.text();
        results.push({ step: 'tier1-open-feeds', status: 'error', error: errorText });
      }
    } catch (error) {
      results.push({ 
        step: 'tier1-open-feeds', 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    // ===========================================
    // TIER 2: Sitemap Discovery (weekly)
    // ===========================================
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0) { // Sunday = discovery day
      try {
        console.log('TIER 2: Discovering product URLs from sitemaps...');
        const discoverResponse = await fetch(`${supabaseUrl}/functions/v1/discover-product-urls`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ limit: 500 }),
        });

        if (discoverResponse.ok) {
          const data = await discoverResponse.json();
          results.push({ 
            step: 'tier2-sitemap-discovery', 
            status: 'success',
            details: JSON.stringify(data.results)
          });
          console.log('Tier 2 complete: URL discovery done');
        } else {
          const errorText = await discoverResponse.text();
          results.push({ step: 'tier2-sitemap-discovery', status: 'error', error: errorText });
        }
      } catch (error) {
        results.push({ 
          step: 'tier2-sitemap-discovery', 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    } else {
      results.push({ step: 'tier2-sitemap-discovery', status: 'skipped', details: 'Only runs on Sundays' });
    }

    // ===========================================
    // TIER 2: Process Crawl Queue (daily)
    // ===========================================
    {
      try {
        console.log('TIER 2: Processing crawl queue...');
        
        // Process in batches to respect rate limits
        // 10 items per batch, 6 seconds each = 60 seconds per batch
        const batchesToProcess = Number(Deno.env.get('CRAWL_BATCHES_PER_RUN') || 5); // 10 URLs per batch
        let totalProcessed = 0;
        let totalSuccess = 0;
        let totalProducts = 0;

        for (let batch = 0; batch < batchesToProcess; batch++) {
          const crawlResponse = await fetch(`${supabaseUrl}/functions/v1/process-crawl-queue`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ batchSize: 10 }),
          });

          if (crawlResponse.ok) {
            const data = await crawlResponse.json();
            totalProcessed += data.processed || 0;
            totalSuccess += data.success || 0;
            totalProducts += data.productsAdded || 0;
            
            if (data.processed === 0) break; // Queue empty
          } else {
            console.error(`Batch ${batch + 1} failed:`, await crawlResponse.text());
            break;
          }

          // Wait between batches to avoid overwhelming
          await new Promise(r => setTimeout(r, 5000));
        }

        results.push({ 
          step: 'tier2-crawl-queue', 
          status: 'success',
          details: `Processed: ${totalProcessed}, Success: ${totalSuccess}, Products: ${totalProducts}`
        });
        console.log(`Tier 2 crawl complete: ${totalProcessed} processed, ${totalProducts} products added`);

      } catch (error) {
        results.push({ 
          step: 'tier2-crawl-queue', 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    // ===========================================
    // TIER 2b: Turn estimated reference prices into real supplier prices
    // Looks up a handful of seeded estimates each night (oldest checked first)
    // and caches the real product it finds, so quotes stop relying on guesses.
    // ===========================================
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const perRun = Number(Deno.env.get('REFERENCE_LOOKUPS_PER_RUN') || 8);
      const { data: refs } = await supabase
        .from('market_prices')
        .select('id, product_name, category')
        .is('source_id', null)
        .eq('is_active', true)
        .order('last_updated', { ascending: true, nullsFirst: true })
        .limit(perRun);

      let resolved = 0;
      for (const ref of refs || []) {
        const res = await fetch(`${supabaseUrl}/functions/v1/get-realtime-price`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${supabaseServiceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName: ref.product_name, trade: ref.category, maxSuppliers: 2 }),
        }).catch(() => null);
        const data = res && res.ok ? await res.json().catch(() => null) : null;
        if (data?.success) resolved++;
        // Mark as checked either way so the next run moves on to other items
        await supabase.from('market_prices').update({ last_updated: new Date().toISOString() }).eq('id', ref.id);
      }
      results.push({ step: 'tier2b-resolve-estimates', status: 'success', details: `Checked ${refs?.length || 0}, matched ${resolved}` });
    } catch (error) {
      results.push({ step: 'tier2b-resolve-estimates', status: 'error', error: error instanceof Error ? error.message : 'Unknown error' });
    }

    // ===========================================
    // TIER 3: Update Price Indices
    // ===========================================
    try {
      console.log('TIER 3: Updating price indices...');
      const indexResponse = await fetch(`${supabaseUrl}/functions/v1/update-price-index`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (indexResponse.ok) {
        results.push({ step: 'tier3-price-indices', status: 'success' });
        console.log('Tier 3 complete: Price indices updated');
      } else {
        const errorText = await indexResponse.text();
        results.push({ step: 'tier3-price-indices', status: 'error', error: errorText });
      }
    } catch (error) {
      results.push({ 
        step: 'tier3-price-indices', 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    // ===========================================
    // Summary
    // ===========================================
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;

    console.log(`Tiered refresh complete: ${successCount} success, ${errorCount} errors, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tiered price refresh complete',
        results,
        summary: {
          success: successCount,
          errors: errorCount,
          skipped: skippedCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in refresh-prices-cron:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
