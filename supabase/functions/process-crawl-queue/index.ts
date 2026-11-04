import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { fetchPage } from "../_shared/scraper.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: 10 requests per minute = 6 seconds between requests
const REQUEST_DELAY_MS = 6000;

interface CrawlQueueItem {
  id: string;
  url: string;
  supplier: string;
  category: string | null;
  priority: number;
}

interface ExtractedProduct {
  name: string;
  price: number;
  sku?: string;
  unit?: string;
  category?: string;
}

// Extract JSON-LD product data from HTML
function extractJsonLdProduct(html: string): ExtractedProduct | null {
  try {
    // Find all JSON-LD scripts
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const jsonText = match[1].trim()
          .replace(/[\r\n\t]/g, ' ')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']');
        
        const jsonData = JSON.parse(jsonText);
        
        // Handle array of items
        const items = Array.isArray(jsonData) ? jsonData : [jsonData];
        
        for (const item of items) {
          const product = extractProductFromJsonLd(item);
          if (product) return product;
          
          // Check for @graph structure
          if (item['@graph']) {
            for (const graphItem of item['@graph']) {
              const product = extractProductFromJsonLd(graphItem);
              if (product) return product;
            }
          }
        }
      } catch (e) {
        console.log('JSON-LD parse error:', e);
      }
    }
  } catch (error) {
    console.error('JSON-LD extraction error:', error);
  }
  
  return null;
}

function extractProductFromJsonLd(item: any): ExtractedProduct | null {
  if (item['@type'] !== 'Product' && !item['@type']?.includes?.('Product')) {
    return null;
  }
  
  const name = item.name;
  const sku = item.sku || item.productID || item.gtin13 || item.mpn;
  
  // Extract price from offers (handle multiple formats)
  let price = 0;
  const offers = item.offers;
  if (offers) {
    const offer = Array.isArray(offers) ? offers[0] : offers;
    price = parseFloat(offer.price) || 
            parseFloat(offer.lowPrice) || 
            parseFloat(offer.highPrice) ||
            parseFloat(String(offer.priceSpecification?.price)) || 0;
  }
  
  if (name && price > 0 && price < 50000) {
    console.log(`JSON-LD extracted: ${name} - £${price}`);
    return {
      name: name.substring(0, 200),
      price,
      sku,
      unit: 'each'
    };
  }
  
  return null;
}

// Retailer-specific extraction patterns
const RETAILER_PATTERNS: Record<string, { priceRegex: RegExp[]; nameRegex: RegExp[] }> = {
  'Toolstation': {
    priceRegex: [
      /data-price=["'](\d+\.?\d*)["']/i,
      /"price":\s*"?(\d+\.?\d*)"?/,
      /class="[^"]*price[^"]*"[^>]*>\s*£?\s*(\d+\.?\d*)/i,
      /itemprop="price"[^>]*content="(\d+\.?\d*)"/i
    ],
    nameRegex: [
      /<h1[^>]*class="[^"]*product[^"]*"[^>]*>([^<]+)/i,
      /itemprop="name"[^>]*>([^<]+)/i,
      /<title>([^<|–-]+)/i
    ]
  },
  'Screwfix': {
    priceRegex: [
      /data-price="(\d+\.?\d*)"/i,
      /"price":\s*(\d+\.?\d*)/,
      /class="[^"]*price[^"]*"[^>]*>[\s£]*(\d+\.?\d*)/i
    ],
    nameRegex: [
      /<h1[^>]*>([^<]+)</i,
      /itemprop="name"[^>]*>([^<]+)/i
    ]
  },
  'Nisbets': {
    priceRegex: [
      /data-product-price="(\d+\.?\d*)"/i,
      /"price":\s*"?(\d+\.?\d*)"?/,
      /class="[^"]*price[^"]*"[^>]*>[\s£]*(\d+\.?\d*)/i
    ],
    nameRegex: [
      /<h1[^>]*class="[^"]*pdp[^"]*"[^>]*>([^<]+)/i,
      /itemprop="name"[^>]*>([^<]+)/i
    ]
  }
};

// Fallback: extract product from meta tags and HTML patterns
function extractFromHtml(html: string, supplier?: string): ExtractedProduct | null {
  try {
    // Try meta tags first (most reliable)
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1];
    const ogPrice = html.match(/<meta[^>]*property=["']product:price:amount["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']product:price:amount["']/i)?.[1];
    
    if (ogTitle && ogPrice) {
      const price = parseFloat(ogPrice);
      if (price > 0 && price < 50000) {
        console.log(`Meta tag extracted: ${ogTitle} - £${price}`);
        return {
          name: ogTitle.substring(0, 200),
          price,
          unit: 'each'
        };
      }
    }
    
    // Try retailer-specific patterns
    const patterns = supplier ? RETAILER_PATTERNS[supplier] : null;
    if (patterns) {
      let price = 0;
      let name = '';
      
      for (const regex of patterns.priceRegex) {
        const match = html.match(regex);
        if (match) {
          price = parseFloat(match[1]);
          if (price > 0) break;
        }
      }
      
      for (const regex of patterns.nameRegex) {
        const match = html.match(regex);
        if (match) {
          name = match[1].trim();
          if (name.length > 3) break;
        }
      }
      
      if (price > 0 && price < 50000 && name.length > 3) {
        console.log(`Retailer pattern extracted: ${name} - £${price}`);
        return {
          name: name.substring(0, 200),
          price,
          unit: 'each'
        };
      }
    }
    
    // Generic fallback patterns
    const pricePatterns = [
      /"price":\s*"?(\d+\.?\d*)"?/i,
      /data-price=["'](\d+\.?\d*)["']/i,
      /itemprop="price"[^>]*content="(\d+\.?\d*)"/i,
      /class="[^"]*(?:price|cost)[^"]*"[^>]*>[\s£]*(\d+\.?\d*)/i
    ];
    
    const namePatterns = [
      /<h1[^>]*>([^<]+)<\/h1>/i,
      /itemprop="name"[^>]*>([^<]+)/i,
      /<title>([^<|–-]+)/i
    ];
    
    let price = 0;
    let name = '';
    
    for (const regex of pricePatterns) {
      const match = html.match(regex);
      if (match) {
        price = parseFloat(match[1]);
        if (price > 0 && price < 50000) break;
      }
    }
    
    for (const regex of namePatterns) {
      const match = html.match(regex);
      if (match) {
        name = match[1].trim().replace(/\s+/g, ' ');
        if (name.length > 3) break;
      }
    }
    
    if (price > 0 && name.length > 3) {
      console.log(`Generic pattern extracted: ${name} - £${price}`);
      return {
        name: name.substring(0, 200),
        price,
        unit: 'each'
      };
    }
    
    console.log('No product data found in HTML');
  } catch (error) {
    console.error('HTML extraction error:', error);
  }
  
  return null;
}

// Extract unit from product name
function extractUnit(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (/\d+\s*mm/.test(lowerName)) return 'each';
  if (/\d+\s*m\b/.test(lowerName) && !/\d+\s*mm/.test(lowerName)) return 'm';
  if (/per\s*m(?:etre)?/.test(lowerName)) return 'm';
  if (/\d+\s*l(?:itre)?s?\b/.test(lowerName)) return 'litre';
  if (/\d+\s*kg/.test(lowerName)) return 'kg';
  if (/pack\s*(?:of\s*)?\d+|\d+\s*pack/.test(lowerName)) return 'pack';
  if (/box\s*(?:of\s*)?\d+|\d+\s*box/.test(lowerName)) return 'box';
  if (/pair/.test(lowerName)) return 'pair';
  if (/roll/.test(lowerName)) return 'roll';
  if (/sheet/.test(lowerName)) return 'sheet';
  if (/bag/.test(lowerName)) return 'bag';
  if (/tin|can/.test(lowerName)) return 'tin';
  if (/tube/.test(lowerName)) return 'tube';
  if (/m²|sq\s*m/.test(lowerName)) return 'm²';
  
  return 'each';
}

// Categorize product based on name
function categorizeProduct(name: string, supplierCategory?: string | null): string {
  const lowerName = name.toLowerCase();
  
  // Use supplier category as hint
  if (supplierCategory) return supplierCategory;
  
  // Auto-categorize based on keywords
  if (/pipe|valve|tap|fitting|plumb|cistern|toilet|sink|drain/.test(lowerName)) return 'plumbing';
  if (/cable|wire|socket|switch|fuse|breaker|light|led/.test(lowerName)) return 'electrical';
  if (/screw|nail|bolt|fixing|anchor|bracket/.test(lowerName)) return 'fixings';
  if (/paint|primer|varnish|stain/.test(lowerName)) return 'paint';
  if (/timber|wood|mdf|plywood|board/.test(lowerName)) return 'timber';
  if (/brick|cement|concrete|aggregate|sand|gravel/.test(lowerName)) return 'building';
  if (/roof|tile|slate|felt|gutter/.test(lowerName)) return 'roofing';
  if (/insulation|foam|rockwool/.test(lowerName)) return 'insulation';
  if (/tool|drill|saw|hammer|wrench|screwdriver/.test(lowerName)) return 'tools';
  if (/oven|grill|fryer|dishwasher|refrigerat|freezer/.test(lowerName)) return 'catering';
  if (/filter|brake|clutch|oil|coolant|battery/.test(lowerName)) return 'automotive';
  if (/boiler|radiator|thermostat|pump|heating/.test(lowerName)) return 'heating';
  
  return 'general';
}

// Fetch a single URL: free direct request first, Firecrawl fallback if configured
async function crawlUrl(url: string, _firecrawlKey?: string): Promise<{ html?: string; error?: string }> {
  const page = await fetchPage(url);
  if (page.ok) return { html: page.html };
  if (page.status === 429) return { error: 'rate_limited' };
  return { error: page.error || `HTTP ${page.status}` };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY') || Deno.env.get('Web_Scrape_FIRECRAWL') || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { batchSize = 10, supplier: targetSupplier } = await req.json().catch(() => ({}));

    // Get pending items from queue (oldest first, highest priority)
    let query = supabase
      .from('crawl_queue')
      .select('id, url, supplier, category, priority')
      .eq('crawl_status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (targetSupplier) {
      query = query.eq('supplier', targetSupplier);
    }

    const { data: queueItems, error: queueError } = await query;

    if (queueError) {
      throw new Error(`Failed to fetch queue: ${queueError.message}`);
    }

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No pending items in queue', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${queueItems.length} items from crawl queue`);

    const results = {
      processed: 0,
      success: 0,
      failed: 0,
      productsAdded: 0
    };

    for (const item of queueItems as CrawlQueueItem[]) {
      results.processed++;
      
      console.log(`Crawling: ${item.url}`);
      
      // Crawl the URL
      const { html, error: crawlError } = await crawlUrl(item.url, firecrawlKey);
      
      if (crawlError) {
        console.error(`Crawl failed for ${item.url}: ${crawlError}`);
        
        // Update queue item status
        await supabase
          .from('crawl_queue')
          .update({ 
            crawl_status: crawlError === 'rate_limited' ? 'pending' : 'failed',
            error_message: crawlError,
            last_crawled: new Date().toISOString()
          })
          .eq('id', item.id);
        
        if (crawlError === 'rate_limited') {
          console.log('Rate limited - stopping batch');
          break;
        }
        
        results.failed++;
        await new Promise(r => setTimeout(r, REQUEST_DELAY_MS));
        continue;
      }

      // Extract product data
      let product = extractJsonLdProduct(html!);
      if (!product) {
        product = extractFromHtml(html!, item.supplier);
      }

      if (product && product.name && product.price > 0) {
        const unit = extractUnit(product.name);
        const category = categorizeProduct(product.name, item.category);
        
        // Get source_id for this supplier
        const { data: sourceData } = await supabase
          .from('price_sources')
          .select('id')
          .eq('name', item.supplier)
          .single();

        // Upsert to market_prices
        const { error: upsertError } = await supabase
          .from('market_prices')
          .upsert({
            product_name: product.name,
            unit_price: product.price,
            unit,
            category,
            sku: product.sku,
            source_id: sourceData?.id,
            region: 'UK',
            confidence_score: 0.9,
            is_active: true,
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'product_name,category',
            ignoreDuplicates: false
          });

        if (!upsertError) {
          results.productsAdded++;
        }

        // Update queue item
        await supabase
          .from('crawl_queue')
          .update({ 
            crawl_status: 'success',
            product_count: 1,
            last_crawled: new Date().toISOString()
          })
          .eq('id', item.id);

        results.success++;
        console.log(`Extracted: ${product.name} - £${product.price}`);
      } else {
        // No product found
        await supabase
          .from('crawl_queue')
          .update({ 
            crawl_status: 'failed',
            error_message: 'No product data found',
            last_crawled: new Date().toISOString()
          })
          .eq('id', item.id);
        
        results.failed++;
      }

      // Rate limit between requests
      await new Promise(r => setTimeout(r, REQUEST_DELAY_MS));
    }

    console.log(`Batch complete: ${results.success} success, ${results.failed} failed, ${results.productsAdded} products added`);

    return new Response(
      JSON.stringify({
        ...results,
        success: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in process-crawl-queue:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
