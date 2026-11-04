import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Supplier sitemap configurations
const SUPPLIER_SITEMAPS: Record<string, { sitemapUrl: string; productPattern: RegExp; category?: string; priority: number }> = {
  'Toolstation': {
    sitemapUrl: 'https://www.toolstation.com/sitemap_index.xml',
    productPattern: /\/p\d+$/,
    priority: 90
  },
  'Screwfix': {
    sitemapUrl: 'https://www.screwfix.com/sitemap_products.xml',
    productPattern: /\/p\/\d+$/,
    priority: 90
  },
  'Jewson': {
    sitemapUrl: 'https://www.jewson.co.uk/sitemap_index.xml',
    productPattern: /\/product\//,
    category: 'building',
    priority: 80
  },
  'Travis Perkins': {
    sitemapUrl: 'https://www.travisperkins.co.uk/sitemap_index.xml',
    productPattern: /\/product\//,
    category: 'building',
    priority: 80
  },
  'Wickes': {
    sitemapUrl: 'https://www.wickes.co.uk/sitemap_index.xml',
    productPattern: /\/p\//,
    priority: 75
  },
  'Nisbets': {
    sitemapUrl: 'https://www.nisbets.co.uk/sitemap_index.xml',
    productPattern: /\/[a-z0-9-]+-[a-z]{2}\d+$/i,
    category: 'catering',
    priority: 85
  },
  'City Plumbing': {
    sitemapUrl: 'https://www.cityplumbing.co.uk/sitemap_index.xml',
    productPattern: /\/product\//,
    category: 'plumbing',
    priority: 85
  },
  'Euro Car Parts': {
    sitemapUrl: 'https://www.eurocarparts.com/sitemap_index.xml',
    productPattern: /\/p\//,
    category: 'automotive',
    priority: 80
  }
};

// Parse XML sitemap and extract URLs
function parseSitemapXml(xml: string): string[] {
  const urls: string[] = [];
  
  // Match <loc> tags
  const locRegex = /<loc>([^<]+)<\/loc>/g;
  let match;
  
  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1].trim());
  }
  
  return urls;
}

// Check if URL is a product page
function isProductUrl(url: string, pattern: RegExp): boolean {
  return pattern.test(url);
}

// Fetch sitemap with retries
async function fetchSitemap(url: string, retries = 3): Promise<string | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PriceBot/1.0; +https://quotable-it.co.uk)',
          'Accept': 'application/xml, text/xml, */*'
        }
      });
      
      if (response.ok) {
        return await response.text();
      }
      
      console.log(`Sitemap fetch failed (${response.status}): ${url}`);
    } catch (error) {
      console.error(`Sitemap fetch error (attempt ${i + 1}): ${error}`);
    }
    
    // Wait before retry
    await new Promise(r => setTimeout(r, 2000 * (i + 1)));
  }
  
  return null;
}

// Discover product URLs from a supplier's sitemap
async function discoverSupplierUrls(
  supplier: string, 
  config: typeof SUPPLIER_SITEMAPS[string],
  limit: number = 500
): Promise<{ urls: string[]; error?: string }> {
  console.log(`Discovering URLs for ${supplier}...`);
  
  // Fetch main sitemap index
  const indexXml = await fetchSitemap(config.sitemapUrl);
  if (!indexXml) {
    return { urls: [], error: 'Failed to fetch sitemap index' };
  }
  
  const allUrls: string[] = [];
  
  // Check if this is a sitemap index (contains other sitemaps)
  if (indexXml.includes('<sitemapindex') || indexXml.includes('sitemap')) {
    const sitemapUrls = parseSitemapXml(indexXml);
    
    // Filter for product sitemaps
    const productSitemaps = sitemapUrls.filter(url => 
      url.includes('product') || 
      url.includes('item') || 
      url.includes('p_') ||
      !url.includes('category') && !url.includes('branch') && !url.includes('store')
    ).slice(0, 5); // Limit to 5 sub-sitemaps
    
    console.log(`Found ${productSitemaps.length} product sitemaps for ${supplier}`);
    
    // Fetch each product sitemap
    for (const sitemapUrl of productSitemaps) {
      if (allUrls.length >= limit) break;
      
      const sitemapXml = await fetchSitemap(sitemapUrl);
      if (sitemapXml) {
        const urls = parseSitemapXml(sitemapXml);
        const productUrls = urls.filter(url => isProductUrl(url, config.productPattern));
        allUrls.push(...productUrls);
        console.log(`Found ${productUrls.length} product URLs in ${sitemapUrl}`);
      }
      
      // Rate limit
      await new Promise(r => setTimeout(r, 1000));
    }
  } else {
    // Direct sitemap (not an index)
    const urls = parseSitemapXml(indexXml);
    const productUrls = urls.filter(url => isProductUrl(url, config.productPattern));
    allUrls.push(...productUrls);
  }
  
  // Deduplicate and limit
  const uniqueUrls = [...new Set(allUrls)].slice(0, limit);
  console.log(`Discovered ${uniqueUrls.length} unique product URLs for ${supplier}`);
  
  return { urls: uniqueUrls };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { supplier: targetSupplier, limit = 500 } = await req.json().catch(() => ({}));

    const results: Record<string, { discovered: number; added: number; error?: string }> = {};
    
    // Get list of suppliers to process
    const suppliersToProcess = targetSupplier 
      ? { [targetSupplier]: SUPPLIER_SITEMAPS[targetSupplier] }
      : SUPPLIER_SITEMAPS;

    for (const [supplier, config] of Object.entries(suppliersToProcess)) {
      if (!config) {
        results[supplier] = { discovered: 0, added: 0, error: 'Unknown supplier' };
        continue;
      }

      try {
        const { urls, error } = await discoverSupplierUrls(supplier, config, limit);
        
        if (error) {
          results[supplier] = { discovered: 0, added: 0, error };
          continue;
        }

        // Batch insert URLs into crawl_queue
        let addedCount = 0;
        const batchSize = 100;
        
        for (let i = 0; i < urls.length; i += batchSize) {
          const batch = urls.slice(i, i + batchSize).map(url => ({
            url,
            supplier,
            category: config.category || null,
            priority: config.priority,
            crawl_status: 'pending'
          }));

          const { error: insertError, data } = await supabase
            .from('crawl_queue')
            .upsert(batch, { 
              onConflict: 'url',
              ignoreDuplicates: true 
            })
            .select('id');

          if (!insertError && data) {
            addedCount += data.length;
          }
        }

        results[supplier] = { 
          discovered: urls.length, 
          added: addedCount 
        };

        console.log(`${supplier}: Discovered ${urls.length}, Added ${addedCount} to queue`);

        // Rate limit between suppliers
        await new Promise(r => setTimeout(r, 2000));

      } catch (error) {
        console.error(`Error processing ${supplier}:`, error);
        results[supplier] = { 
          discovered: 0, 
          added: 0, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }

    // Get queue stats
    const { data: queueStats } = await supabase
      .from('crawl_queue')
      .select('supplier, crawl_status')
      .then(({ data }) => ({
        data: data?.reduce((acc, row) => {
          acc[row.supplier] = acc[row.supplier] || { pending: 0, success: 0, failed: 0 };
          acc[row.supplier][row.crawl_status as 'pending' | 'success' | 'failed']++;
          return acc;
        }, {} as Record<string, Record<string, number>>)
      }));

    return new Response(
      JSON.stringify({
        success: true,
        results,
        queueStats,
        message: `URL discovery complete`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in discover-product-urls:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
