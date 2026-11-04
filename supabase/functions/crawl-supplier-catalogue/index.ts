import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchPage, readSitemap } from "../_shared/scraper.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED MULTI-PAGE SUPPLIER CRAWLER
// ═══════════════════════════════════════════════════════════════════════════
// Features:
// - JSON-LD extraction for structured product data
// - Proper rate limiting (6 seconds between requests)
// - Exponential backoff for 429 errors
// - robots.txt compliance check
// ═══════════════════════════════════════════════════════════════════════════

interface SupplierConfig {
  id: string;
  supplier_name: string;
  base_url: string;
  category_paths: string[];
  pagination_pattern: string;
  max_pages: number;
  applicable_trades: string[];
  priority: number;
  is_enabled: boolean;
}

interface CrawledProduct {
  name: string;
  price: number;
  unit: string;
  sku?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  productType: 'appliance' | 'accessory' | 'consumable' | 'part';
}

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITING - Respect Firecrawl's 10 req/min limit
// ═══════════════════════════════════════════════════════════════════════════

const REQUEST_DELAY = 6000; // 6 seconds = 10 req/min max
let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < REQUEST_DELAY) {
    const waitTime = REQUEST_DELAY - timeSinceLastRequest;
    console.log(`  Rate limiting: waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 3000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await rateLimit();
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const is429 = error instanceof Error && error.message.includes('429');
      
      if (is429 && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`  Rate limited (429), waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, baseDelay));
      }
    }
  }
  
  throw lastError;
}

// ═══════════════════════════════════════════════════════════════════════════
// PRODUCT CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════

const APPLIANCE_KEYWORDS = [
  'oven', 'dishwasher', 'fryer', 'griddle', 'grill', 'range', 'cooker',
  'refrigerator', 'freezer', 'ice machine', 'coffee machine',
  'boiler', 'heat pump', 'air conditioning', 'water heater',
  'consumer unit', 'distribution board'
];

const ACCESSORY_KEYWORDS = [
  'stand', 'rack', 'shelf', 'tray', 'basket', 'cover', 'guard',
  'kit', 'attachment', 'holder', 'bracket'
];

const CONSUMABLE_KEYWORDS = [
  'filter', 'gasket', 'seal', 'hose', 'cable', 'wire', 'pipe',
  'fitting', 'valve', 'connector', 'tape', 'sealant', 'screw', 'fixing'
];

const classifyProduct = (name: string): 'appliance' | 'accessory' | 'consumable' | 'part' => {
  const lowerName = name.toLowerCase();
  
  for (const keyword of APPLIANCE_KEYWORDS) {
    if (lowerName.includes(keyword)) return 'appliance';
  }
  for (const keyword of ACCESSORY_KEYWORDS) {
    if (lowerName.includes(keyword)) return 'accessory';
  }
  for (const keyword of CONSUMABLE_KEYWORDS) {
    if (lowerName.includes(keyword)) return 'consumable';
  }
  
  return 'part';
};

// ═══════════════════════════════════════════════════════════════════════════
// BRAND EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

const KNOWN_BRANDS = [
  'Rational', 'Hobart', 'Winterhalter', 'Meiko', 'Electrolux',
  'Blue Seal', 'Lincat', 'Falcon', 'Garland', 'Valentine',
  'Worcester', 'Vaillant', 'Baxi', 'Ideal', 'Viessmann',
  'Daikin', 'Mitsubishi', 'Fujitsu', 'LG', 'Samsung',
  'Hager', 'Wylex', 'Schneider', 'Legrand', 'MK', 'BG',
  'Bosch', 'Dewalt', 'Makita', 'Milwaukee', 'Festool'
];

const extractBrand = (name: string): string | undefined => {
  const lowerName = name.toLowerCase();
  for (const brand of KNOWN_BRANDS) {
    if (lowerName.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return undefined;
};

// ═══════════════════════════════════════════════════════════════════════════
// UNIT EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

const extractUnit = (text: string): string => {
  const lowerText = text.toLowerCase();
  
  if (/\b100m\b/.test(lowerText)) return '100m';
  if (/\b50m\b/.test(lowerText)) return '50m';
  if (/\b25m\b/.test(lowerText)) return '25m';
  if (lowerText.includes('per metre') || lowerText.includes('per m')) return 'm';
  if (lowerText.includes('per roll')) return 'roll';
  if (lowerText.includes('per pack')) return 'pack';
  if (lowerText.includes('per kg')) return 'kg';
  if (lowerText.includes('per litre')) return 'l';
  
  const packMatch = lowerText.match(/pack\s*(?:of\s*)?(\d+)/);
  if (packMatch) return `pack of ${packMatch[1]}`;
  
  return 'each';
};

// ═══════════════════════════════════════════════════════════════════════════
// JSON-LD EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

function extractJsonLdProducts(html: string, category: string): CrawledProduct[] {
  const products: CrawledProduct[] = [];
  
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonData = JSON.parse(match[1]);
      const items = Array.isArray(jsonData) ? jsonData : [jsonData];
      
      for (const item of items) {
        if (item['@type'] === 'Product' && item.name) {
          let price: number | null = null;
          
          if (item.offers) {
            const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
            for (const offer of offers) {
              if (offer.price) {
                const parsed = typeof offer.price === 'string' ? parseFloat(offer.price) : offer.price;
                if (!isNaN(parsed) && parsed > 0) {
                  price = parsed;
                  break;
                }
              }
            }
          }
          
          if (price && price > 0 && price < 100000) {
            const product: CrawledProduct = {
              name: item.name.trim(),
              price,
              unit: extractUnit(item.name),
              category,
              sku: item.sku,
              brand: extractBrand(item.name),
              productType: classifyProduct(item.name),
            };
            
            if (isValidProduct(product)) {
              products.push(product);
            }
          }
        }
        
        // Handle ItemList
        if (item.itemListElement && Array.isArray(item.itemListElement)) {
          for (const listItem of item.itemListElement) {
            if (listItem.item?.['@type'] === 'Product' && listItem.item?.name) {
              const product = listItem.item;
              let price: number | null = null;
              
              if (product.offers) {
                const offers = Array.isArray(product.offers) ? product.offers : [product.offers];
                for (const offer of offers) {
                  if (offer.price) {
                    const parsed = typeof offer.price === 'string' ? parseFloat(offer.price) : offer.price;
                    if (!isNaN(parsed) && parsed > 0) {
                      price = parsed;
                      break;
                    }
                  }
                }
              }
              
              if (price && price > 0 && price < 100000) {
                const crawled: CrawledProduct = {
                  name: product.name.trim(),
                  price,
                  unit: extractUnit(product.name),
                  category,
                  sku: product.sku,
                  brand: extractBrand(product.name),
                  productType: classifyProduct(product.name),
                };
                
                if (isValidProduct(crawled)) {
                  products.push(crawled);
                }
              }
            }
          }
        }
      }
    } catch {
      // Invalid JSON, skip
    }
  }
  
  return products;
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKDOWN PARSING
// ═══════════════════════════════════════════════════════════════════════════

const parseProductsFromMarkdown = (markdown: string, category: string): CrawledProduct[] => {
  const products: CrawledProduct[] = [];
  
  const pricePatterns = [
    /£(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:ex\.?\s*VAT|inc\.?\s*VAT)/gi,
  ];
  
  const lines = markdown.split('\n');
  let currentProduct: Partial<CrawledProduct> = {};
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    // Product name patterns
    if (trimmedLine.startsWith('##') || trimmedLine.startsWith('**') || trimmedLine.startsWith('###')) {
      if (currentProduct.name && currentProduct.price) {
        const product: CrawledProduct = {
          name: currentProduct.name,
          price: currentProduct.price,
          unit: currentProduct.unit || 'each',
          sku: currentProduct.sku,
          category,
          brand: extractBrand(currentProduct.name),
          productType: classifyProduct(currentProduct.name),
        };
        
        if (isValidProduct(product)) {
          products.push(product);
        }
      }
      
      const name = trimmedLine.replace(/^[#*\s]+/, '').replace(/\*+$/, '').trim();
      if (name.length > 5 && !name.startsWith('£')) {
        currentProduct = { name, unit: extractUnit(name) };
      }
    }
    
    // Price extraction
    for (const pattern of pricePatterns) {
      pattern.lastIndex = 0;
      const priceMatch = pattern.exec(trimmedLine);
      if (priceMatch && currentProduct.name) {
        const priceStr = priceMatch[1].replace(/,/g, '');
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price > 0 && price < 100000) {
          currentProduct.price = price;
        }
        break;
      }
    }
    
    // SKU extraction
    const skuMatch = trimmedLine.match(/(?:SKU|Code|Item)[:\s#]*([A-Z0-9][-A-Z0-9]+)/i);
    if (skuMatch && currentProduct.name) {
      currentProduct.sku = skuMatch[1];
    }
  }
  
  // Last product
  if (currentProduct.name && currentProduct.price) {
    const product: CrawledProduct = {
      name: currentProduct.name,
      price: currentProduct.price,
      unit: currentProduct.unit || 'each',
      sku: currentProduct.sku,
      category,
      brand: extractBrand(currentProduct.name),
      productType: classifyProduct(currentProduct.name),
    };
    
    if (isValidProduct(product)) {
      products.push(product);
    }
  }
  
  return products;
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

const isValidProduct = (product: CrawledProduct): boolean => {
  if (!product.name || product.name.length < 5) return false;
  if (product.name.startsWith('Code:') || product.name.startsWith('£')) return false;
  if (/^(Just a moment|Please enable|JavaScript|Cloudflare)/i.test(product.name)) return false;
  if (/^[A-Z]{2,4}\d{3,}$/.test(product.name)) return false;
  
  if (!product.price || product.price <= 0 || product.price > 100000) return false;
  if (product.productType === 'appliance' && product.price < 50) return false;
  if (product.productType === 'consumable' && product.price > 5000) return false;
  
  return true;
};

// ═══════════════════════════════════════════════════════════════════════════
// FIRECRAWL INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

const crawlPage = async (url: string, _firecrawlKey?: string): Promise<{ markdown: string; html: string } | null> => {
  console.log(`  Crawling: ${url}`);
  const page = await fetchPage(url);
  if (page.status === 429) throw new Error('429 Rate limited');
  if (!page.ok) {
    console.error(`  Fetch failed: ${page.error}`);
    return null;
  }
  return { markdown: '', html: page.html };
};

// Find candidate product URLs: Firecrawl's map if a key is set, otherwise the
// site's own sitemap filtered by the search words (free).
const mapCandidateUrls = async (baseUrl: string, search: string, firecrawlKey?: string): Promise<string[]> => {
  if (firecrawlKey) {
    try {
      const response = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${firecrawlKey}` },
        body: JSON.stringify({ url: baseUrl, search, limit: 30, includeSubdomains: false }),
      });
      if (response.status === 429) throw new Error('429 Rate limited');
      if (response.ok) {
        const result = await response.json();
        const links = result?.data?.links || result?.links || [];
        if (Array.isArray(links) && links.length) return links;
      }
    } catch (error) {
      console.error(`  Map error, falling back to sitemap: ${error}`);
    }
  }
  const words = search.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const origin = new URL(baseUrl).origin;
  const pattern = words.length ? new RegExp(words.join('|'), 'i') : /./;
  const fromIndex = await readSitemap(`${origin}/sitemap_index.xml`, pattern, 30);
  return fromIndex.length ? fromIndex : await readSitemap(`${origin}/sitemap.xml`, pattern, 30);
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN CRAWLER
// ═══════════════════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY') || Deno.env.get('Web_Scrape_FIRECRAWL') || '';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let targetSuppliers: string[] = [];
    try {
      const body = await req.json();
      targetSuppliers = body.suppliers || [];
    } catch {
      // No body
    }

    // Fetch ENABLED supplier configurations only
    let query = supabase
      .from('supplier_configs')
      .select('*')
      .eq('is_enabled', true)
      .order('priority', { ascending: false });
    
    if (targetSuppliers.length > 0) {
      query = query.in('supplier_name', targetSuppliers);
    }
    
    const { data: suppliers, error: supplierError } = await query;
    
    if (supplierError || !suppliers || suppliers.length === 0) {
      console.error('No enabled suppliers found:', supplierError);
      return new Response(
        JSON.stringify({ error: 'No enabled suppliers configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting crawl of ${suppliers.length} enabled suppliers`);
    
    const results = {
      suppliers_crawled: 0,
      pages_crawled: 0,
      products_found: 0,
      products_saved: 0,
      errors: [] as string[],
    };

    // Get or create source IDs
    const supplierSourceMap: Record<string, string> = {};
    
    for (const supplier of suppliers) {
      const { data: existingSource } = await supabase
        .from('price_sources')
        .select('id')
        .eq('name', supplier.supplier_name)
        .maybeSingle();
      
      if (existingSource) {
        supplierSourceMap[supplier.supplier_name] = existingSource.id;
      } else {
        const { data: newSource } = await supabase
          .from('price_sources')
          .insert({
            name: supplier.supplier_name,
            source_type: 'merchant_crawl',
            base_url: supplier.base_url,
            is_enabled: true,
            applicable_trades: supplier.applicable_trades,
          })
          .select('id')
          .single();
        
        if (newSource) {
          supplierSourceMap[supplier.supplier_name] = newSource.id;
        }
      }
    }

    // Crawl each supplier
    for (const supplier of suppliers as SupplierConfig[]) {
      console.log(`\nCrawling supplier: ${supplier.supplier_name}`);
      results.suppliers_crawled++;
      
      const categoryPaths: string[] = Array.isArray(supplier.category_paths) ? supplier.category_paths : [];
      const sourceId = supplierSourceMap[supplier.supplier_name];

      if (!sourceId) {
        results.errors.push(`No source ID for ${supplier.supplier_name}`);
        continue;
      }

      try {
        // Try Map API first to discover product URLs
        let productUrls: string[] = [];

        for (const categoryPath of categoryPaths.slice(0, 3)) { // Limit categories
          console.log(`  Mapping category: ${categoryPath}`);

          try {
            const mappedUrls = await withRetry(() => mapCandidateUrls(supplier.base_url, categoryPath, firecrawlKey));
            
            const productPageUrls = mappedUrls.filter(url => {
              const lower = url.toLowerCase();
              return (
                lower.includes('/product') ||
                lower.includes('/p/') ||
                lower.includes('-p-') ||
                /\/\d{4,}/.test(lower) ||
                /[a-z]+-[a-z]+-\d+/.test(lower)
              );
            }).slice(0, 10); // Limit per category

            productUrls.push(...productPageUrls);
            console.log(`  Map found ${productPageUrls.length} product URLs`);
          } catch (err) {
            console.log(`  Map API failed for ${categoryPath}: ${err}`);
            results.errors.push(`Map failed for ${supplier.supplier_name}/${categoryPath}`);
          }
        }

        // Scrape discovered URLs
        const uniqueUrls = [...new Set(productUrls)].slice(0, supplier.max_pages || 15);
        console.log(`  Scraping ${uniqueUrls.length} URLs`);

        for (const productUrl of uniqueUrls) {
          try {
            const crawlResult = await withRetry(() => crawlPage(productUrl, firecrawlKey));
            if (!crawlResult) continue;

            results.pages_crawled++;

            // Try JSON-LD first
            let products = extractJsonLdProducts(crawlResult.html, categoryPaths[0] || 'general');
            
            // Fall back to markdown parsing
            if (products.length === 0) {
              products = parseProductsFromMarkdown(crawlResult.markdown, categoryPaths[0] || 'general');
            }
            
            results.products_found += products.length;
            console.log(`  Found ${products.length} products from ${productUrl.substring(0, 50)}...`);

            // Save products
            for (const product of products) {
              try {
                const { data: existing } = await supabase
                  .from('market_prices')
                  .select('id, unit_price')
                  .eq('product_name', product.name)
                  .eq('source_id', sourceId)
                  .maybeSingle();

                if (existing) {
                  if (existing.unit_price !== product.price) {
                    await supabase
                      .from('market_prices')
                      .update({ unit_price: product.price, last_updated: new Date().toISOString() })
                      .eq('id', existing.id);

                    await supabase.from('price_history').insert({
                      market_price_id: existing.id,
                      price: product.price,
                      source_id: sourceId,
                    });
                  }
                } else {
                  const { data: inserted } = await supabase
                    .from('market_prices')
                    .insert({
                      product_name: product.name,
                      unit_price: product.price,
                      unit: product.unit,
                      category: product.category,
                      subcategory: product.productType,
                      sku: product.sku,
                      source_id: sourceId,
                      confidence_score: 0.88,
                      is_active: true,
                    })
                    .select('id')
                    .maybeSingle();

                  if (inserted) {
                    results.products_saved++;
                    await supabase.from('price_history').insert({
                      market_price_id: inserted.id,
                      price: product.price,
                      source_id: sourceId,
                    });
                  }
                }
              } catch (productError) {
                console.error(`  Error saving product: ${productError}`);
              }
            }
          } catch (crawlErr) {
            console.log(`  Crawl failed for ${productUrl}: ${crawlErr}`);
          }
        }

        // Update supplier status
        await supabase
          .from('supplier_configs')
          .update({ last_crawl_at: new Date().toISOString(), crawl_status: 'success' })
          .eq('id', supplier.id);

      } catch (supplierError) {
        console.error(`Error crawling ${supplier.supplier_name}:`, supplierError);
        results.errors.push(`${supplier.supplier_name}: ${supplierError}`);
        
        await supabase
          .from('supplier_configs')
          .update({ crawl_status: 'error' })
          .eq('id', supplier.id);
      }
    }

    console.log('\nCrawl complete:', results);

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Crawler error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
