import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdminOrService } from "../_shared/guard.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Priority order: most popular trades first
const PRIORITY_CATEGORIES = [
  'Plumbing',    // Most common trade
  'Electrical',  // Very common
  'Heating',     // HVAC/boiler work
  'Building',    // General construction
  'Bathroom',    // Renovations
  'Fixings',     // Used by all trades
  'Catering',    // Commercial catering
  'Automotive',  // Vehicle repairs
];

const SUPPLIER_CATEGORY_URLS: Record<string, Record<string, string>> = {
  'toolstation': {
    'Plumbing': 'https://www.toolstation.com/plumbing',
    'Electrical': 'https://www.toolstation.com/electrical',
    'Building': 'https://www.toolstation.com/building-materials',
    'Fixings': 'https://www.toolstation.com/fixings-fasteners',
    'Heating': 'https://www.toolstation.com/heating-plumbing/heating',
    'Bathroom': 'https://www.toolstation.com/bathrooms',
    'Automotive': 'https://www.toolstation.com/automotive',
  },
  'screwfix': {
    'Plumbing': 'https://www.screwfix.com/c/plumbing-heating/',
    'Electrical': 'https://www.screwfix.com/c/electrical-lighting/',
    'Building': 'https://www.screwfix.com/c/building-doors/',
    'Fixings': 'https://www.screwfix.com/c/screws-nails-fixings/',
  },
  'nisbets': {
    'Catering': 'https://www.nisbets.co.uk/cooking-equipment',
  },
};

const SUPPLIER_EXCLUDE_PATHS: Record<string, string[]> = {
  'toolstation': ['/basket*', '/login*', '/register*', '/account*', '/help*', '/stores*'],
  'screwfix': ['/basket*', '/login*', '/register*', '/account*', '/help*'],
  'nisbets': ['/basket*', '/login*', '/register*', '/account*'],
};

function cleanProductName(name: string): string {
  if (!name) return '';
  let cleaned = name.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  cleaned = cleaned.replace(/^#+\s*/, '');
  cleaned = cleaned.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1');
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  cleaned = cleaned.replace(/\[|\]/g, '');
  cleaned = cleaned.replace(/\(https?:[^)]+\)/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/^[#\-*_|>\s]+/, '').replace(/[#\-*_|>\s]+$/, '');
  return cleaned;
}

function extractProductFromPage(html: string, markdown: string): { 
  price: number | null; 
  name: string | null;
} {
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonData = JSON.parse(match[1]);
      const items = Array.isArray(jsonData) ? jsonData : [jsonData];
      
      for (const item of items) {
        if (item['@type'] === 'Product' && item.name && item.offers) {
          const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
          for (const offer of offers) {
            if (offer.price) {
              const price = typeof offer.price === 'string' ? parseFloat(offer.price) : offer.price;
              if (!isNaN(price) && price > 0 && price < 50000) {
                return { price, name: cleanProductName(item.name) };
              }
            }
          }
        }
      }
    } catch { /* continue */ }
  }
  
  const priceMatch = markdown.match(/£(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  if (priceMatch) {
    const price = parseFloat(priceMatch[1].replace(/,/g, ''));
    if (!isNaN(price) && price > 0 && price < 50000) {
      const nameMatch = markdown.match(/##\s*(.+?)(?:\n|£)/);
      const name = nameMatch ? cleanProductName(nameMatch[1].trim()) : null;
      return { price, name };
    }
  }
  
  return { price: null, name: null };
}

function extractUnit(name: string): string {
  const lowerName = name.toLowerCase();
  if (/\b100m\b/.test(lowerName)) return '100m';
  if (/\b50m\b/.test(lowerName)) return '50m';
  if (/\b25m\b/.test(lowerName)) return '25m';
  if (/\b10m\b/.test(lowerName)) return '10m';
  if (/pack\s*(?:of\s*)?(\d+)/i.test(lowerName)) {
    const m = lowerName.match(/pack\s*(?:of\s*)?(\d+)/i);
    return m ? `pack of ${m[1]}` : 'pack';
  }
  if (/per\s*m(?:etre)?|\bm\b|\/m/.test(lowerName)) return 'm';
  return 'each';
}

function isValidProduct(name: string, price: number): boolean {
  if (!name || name.length < 5 || name.length > 200) return false;
  if (name.startsWith('£') || /^(Just a moment|Please enable|JavaScript|Cloudflare|Access denied|Error|Loading|See also)/i.test(name)) return false;
  if (/\[.*\]\(http/.test(name) || /^#/.test(name) || name.includes('](')) return false;
  if (/^(What|How|Why|When|Types of|Benefits)/i.test(name)) return false; // Skip info pages
  if (!price || price <= 0 || price > 50000) return false;
  return true;
}

function capitalizeSupplier(name: string): string {
  const names: Record<string, string> = {
    'toolstation': 'Toolstation',
    'screwfix': 'Screwfix',
    'nisbets': 'Nisbets',
  };
  return names[name] || name;
}

async function startCrawl(url: string, supplier: string, firecrawlKey: string, maxPages: number): Promise<string | null> {
  const excludePaths = SUPPLIER_EXCLUDE_PATHS[supplier] || [];
  
  console.log(`  Starting crawl: ${url} (max ${maxPages} pages)`);
  
  const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${firecrawlKey}`,
    },
    body: JSON.stringify({
      url,
      limit: maxPages,
      maxDepth: 3,
      excludePaths: excludePaths.length > 0 ? excludePaths : undefined,
      scrapeOptions: {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.log(`  Crawl failed: ${response.status} - ${errorText.substring(0, 100)}`);
    return null;
  }

  const result = await response.json();
  const crawlId = result.id || result.jobId;
  console.log(`  Crawl started: ${crawlId}`);
  return crawlId;
}

async function getCrawlResults(crawlId: string, firecrawlKey: string): Promise<{
  status: string;
  completed: number;
  total: number;
  data: Array<{ html?: string; markdown?: string; metadata?: { sourceURL?: string } }>;
}> {
  const response = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlId}`, {
    headers: { 'Authorization': `Bearer ${firecrawlKey}` },
  });
  if (!response.ok) return { status: 'error', completed: 0, total: 0, data: [] };
  return await response.json();
}

async function waitForCrawl(crawlId: string, firecrawlKey: string, maxWaitMs: number = 120000): Promise<Array<{
  html?: string; markdown?: string; metadata?: { sourceURL?: string };
}>> {
  const startTime = Date.now();
  let lastCompleted = 0;
  
  while (Date.now() - startTime < maxWaitMs) {
    const result = await getCrawlResults(crawlId, firecrawlKey);
    
    if (result.completed !== lastCompleted) {
      console.log(`  Progress: ${result.completed}/${result.total} pages`);
      lastCompleted = result.completed;
    }
    
    if (result.status === 'completed') {
      console.log(`  Completed: ${result.data?.length || 0} pages`);
      return result.data || [];
    }
    
    if (result.status === 'failed' || result.status === 'error') {
      console.log(`  Crawl failed`);
      return [];
    }
    
    await new Promise(r => setTimeout(r, 5000));
  }
  
  const finalResult = await getCrawlResults(crawlId, firecrawlKey);
  return finalResult.data || [];
}

// Background task to crawl all categories
async function crawlAllCategories(firecrawlKey: string, supabaseUrl: string, supabaseKey: string) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log(`\n════════════════════════════════════════════════════════════`);
  console.log(`BACKGROUND SEEDER - Processing ${PRIORITY_CATEGORIES.length} categories`);
  console.log(`════════════════════════════════════════════════════════════\n`);

  let totalInserted = 0;
  let totalUrls = 0;

  for (const category of PRIORITY_CATEGORIES) {
    const suppliers = Object.keys(SUPPLIER_CATEGORY_URLS).filter(s => SUPPLIER_CATEGORY_URLS[s][category]);
    
    console.log(`\n[${category}] Starting with ${suppliers.length} supplier(s)...`);
    
    for (const supplier of suppliers.slice(0, 1)) { // 1 supplier per category
      const categoryUrl = SUPPLIER_CATEGORY_URLS[supplier]?.[category];
      if (!categoryUrl) continue;
      
      // Rate limit: 8 second delay between crawls
      console.log(`  Waiting 8s (rate limit)...`);
      await new Promise(r => setTimeout(r, 8000));
      
      try {
        const crawlId = await startCrawl(categoryUrl, supplier, firecrawlKey, 20);
        if (!crawlId) continue;
        
        const pages = await waitForCrawl(crawlId, firecrawlKey, 90000);
        if (pages.length === 0) continue;
        
        console.log(`  Processing ${pages.length} pages...`);
        
        // Get/create source
        const { data: sourceData } = await supabase
          .from('price_sources')
          .select('id')
          .ilike('name', `%${capitalizeSupplier(supplier)}%`)
          .limit(1)
          .single();
        
        let sourceId = sourceData?.id;
        if (!sourceId) {
          const { data: newSource } = await supabase
            .from('price_sources')
            .insert({
              name: capitalizeSupplier(supplier),
              source_type: 'merchant_crawl',
              is_enabled: true,
              priority: 70,
            })
            .select('id')
            .single();
          sourceId = newSource?.id;
        }
        
        let categoryInserted = 0;
        
        for (const page of pages) {
          const productUrl = page.metadata?.sourceURL;
          if (!productUrl) continue;
          
          const { price, name } = extractProductFromPage(page.html || '', page.markdown || '');
          
          if (price && name && isValidProduct(name, price)) {
            const { error } = await supabase
              .from('market_prices')
              .upsert({
                product_name: name,
                unit_price: price,
                unit: extractUnit(name),
                category,
                source_id: sourceId,
                confidence_score: 0.90,
                is_active: true,
                last_updated: new Date().toISOString(),
                product_url: productUrl,
              }, { onConflict: 'product_name,source_id' });
            
            if (!error) {
              categoryInserted++;
              totalInserted++;
              if (productUrl) totalUrls++;
              console.log(`    ✓ ${name.substring(0, 40)}... £${price}`);
            }
          }
        }
        
        console.log(`  [${category}] Inserted ${categoryInserted} products`);
        
        await supabase
          .from('price_sources')
          .update({
            last_fetch_at: new Date().toISOString(),
            last_fetch_status: `${category}: ${categoryInserted} products`,
          })
          .ilike('name', `%${capitalizeSupplier(supplier)}%`);
          
      } catch (error) {
        console.log(`  Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }
  }

  console.log(`\n════════════════════════════════════════════════════════════`);
  console.log(`SEEDING COMPLETE: ${totalInserted} products, ${totalUrls} with URLs`);
  console.log(`════════════════════════════════════════════════════════════\n`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  const denied = await requireAdminOrService(req, corsHeaders);
  if (denied) return denied;

  try {
    const firecrawlKey = (Deno.env.get('FIRECRAWL_API_KEY') || Deno.env.get('Web_Scrape_FIRECRAWL'));
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Run crawling in background - won't timeout!
    // @ts-ignore - EdgeRuntime is available in Supabase edge functions
    EdgeRuntime.waitUntil(crawlAllCategories(firecrawlKey, supabaseUrl, supabaseKey));

    // Return immediately
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Seeding started in background. Check logs for progress.',
        categories: PRIORITY_CATEGORIES,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Seeder error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
