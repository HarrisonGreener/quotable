import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchPage } from "../_shared/scraper.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdminOrService } from "../_shared/guard.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ═══════════════════════════════════════════════════════════════════
// BULK CATEGORY CRAWLER - Scrapes 3000+ products across all suppliers
// Crawls entire category pages instead of individual searches
// ═══════════════════════════════════════════════════════════════════

interface CrawledProduct {
  name: string;
  price: number;
  unit: string;
  sku?: string;
  category: string;
  subcategory?: string;
}

// Expanded category URLs for each supplier - targeting high-volume pages
const SUPPLIER_CATEGORIES: Record<string, { baseUrl: string; categories: Record<string, string[]> }> = {
  'Toolstation': {
    baseUrl: 'https://www.toolstation.com',
    categories: {
      'Plumbing': [
        '/c/plumbing/copper-pipe-fittings',
        '/c/plumbing/plastic-pipe-fittings',
        '/c/plumbing/valves',
        '/c/plumbing/taps-mixers',
        '/c/plumbing/waste-traps',
        '/c/plumbing/cisterns-flush-valves',
        '/c/plumbing/sealants-ptfe',
        '/c/plumbing/toilet-accessories',
        '/c/plumbing/bathroom-accessories',
      ],
      'Electrical': [
        '/c/electrical/cables',
        '/c/electrical/consumer-units-mcbs',
        '/c/electrical/sockets-switches',
        '/c/electrical/wiring-accessories',
        '/c/electrical/cable-management',
        '/c/electrical/lighting',
        '/c/electrical/ev-charging',
      ],
      'Heating': [
        '/c/heating-plumbing/radiators-towel-rails',
        '/c/heating-plumbing/boiler-controls',
        '/c/heating-plumbing/central-heating',
        '/c/heating-plumbing/underfloor-heating',
      ],
      'Building': [
        '/c/building-materials/timber',
        '/c/building-materials/sheet-materials',
        '/c/building-materials/insulation',
        '/c/building-materials/roofing',
        '/c/building-materials/bricks-blocks',
        '/c/building-materials/cement-aggregates',
      ],
      'Fixings': [
        '/c/fixings-fasteners/screws',
        '/c/fixings-fasteners/nails',
        '/c/fixings-fasteners/bolts-nuts',
        '/c/fixings-fasteners/wall-plugs',
        '/c/fixings-fasteners/adhesives',
      ],
    }
  },
  'Screwfix': {
    baseUrl: 'https://www.screwfix.com',
    categories: {
      'Plumbing': [
        '/c/plumbing/bathroom-taps-mixers',
        '/c/plumbing/kitchen-taps-mixers',
        '/c/plumbing/pipe-fittings',
        '/c/plumbing/valves',
        '/c/plumbing/waste-pipe-fittings',
        '/c/plumbing/cisterns-flush',
        '/c/plumbing/sealants-tapes',
      ],
      'Electrical': [
        '/c/electrical/cable-wire',
        '/c/electrical/consumer-units',
        '/c/electrical/switches-sockets',
        '/c/electrical/circuit-protection',
        '/c/electrical/wiring-accessories',
        '/c/electrical/outdoor-lighting',
      ],
      'Heating': [
        '/c/heating-cooling/radiators',
        '/c/heating-cooling/central-heating-controls',
        '/c/heating-cooling/underfloor-heating',
      ],
      'Building': [
        '/c/building-materials/timber-sheet-materials',
        '/c/building-materials/insulation',
        '/c/building-materials/roofing-materials',
        '/c/building-materials/bricks-blocks-lintels',
      ],
    }
  },
  'City Plumbing': {
    baseUrl: 'https://www.cityplumbing.co.uk',
    categories: {
      'Plumbing': [
        '/plumbing-supplies/copper-fittings',
        '/plumbing-supplies/plastic-fittings',
        '/plumbing-supplies/valves',
        '/plumbing-supplies/taps',
        '/plumbing-supplies/waste-fittings',
        '/plumbing-supplies/pipe',
        '/plumbing-supplies/radiator-valves',
      ],
      'Heating': [
        '/heating/boilers',
        '/heating/radiators',
        '/heating/controls',
        '/heating/cylinders',
        '/heating/pumps',
        '/heating/underfloor',
      ],
      'Bathroom': [
        '/bathrooms/toilets',
        '/bathrooms/basins',
        '/bathrooms/baths',
        '/bathrooms/showers',
        '/bathrooms/taps',
      ],
    }
  },
  'Nisbets': {
    baseUrl: 'https://www.nisbets.co.uk',
    categories: {
      'Catering': [
        '/c/catering-equipment/ovens',
        '/c/catering-equipment/fryers',
        '/c/catering-equipment/grills-griddles',
        '/c/catering-equipment/refrigeration',
        '/c/catering-equipment/dishwashers',
        '/c/catering-equipment/food-prep',
        '/c/catering-equipment/hot-holding',
        '/c/catering-equipment/coffee-machines',
      ],
    }
  },
  'Jewson': {
    baseUrl: 'https://www.jewson.co.uk',
    categories: {
      'Building': [
        '/timber/carcassing-timber',
        '/timber/sheet-materials',
        '/timber/mouldings-skirting',
        '/insulation',
        '/roofing',
        '/drainage',
        '/bricks-blocks',
        '/cement-aggregates',
      ],
    }
  },
  // ═══════════════════════════════════════════════════════════════════
  // NEW SUPPLIERS - 12 additional suppliers for full trade coverage
  // ═══════════════════════════════════════════════════════════════════
  'Travis Perkins': {
    baseUrl: 'https://www.travisperkins.co.uk',
    categories: {
      'Building': [
        '/building-materials/timber',
        '/building-materials/sheet-materials',
        '/building-materials/insulation',
        '/building-materials/roofing',
        '/building-materials/bricks-blocks',
        '/building-materials/cement-aggregates',
        '/building-materials/drainage',
      ],
      'Timber': [
        '/timber-sheet-materials/structural-timber',
        '/timber-sheet-materials/plywood',
        '/timber-sheet-materials/mdf',
        '/timber-sheet-materials/decking',
      ],
    }
  },
  'Wickes': {
    baseUrl: 'https://www.wickes.co.uk',
    categories: {
      'Building': [
        '/building-materials/timber',
        '/building-materials/insulation',
        '/building-materials/plasterboard',
        '/building-materials/bricks-blocks',
      ],
      'Bathroom': [
        '/bathrooms/toilets',
        '/bathrooms/basins',
        '/bathrooms/baths',
        '/bathrooms/showers',
        '/bathrooms/taps',
      ],
      'Kitchen': [
        '/kitchens/kitchen-units',
        '/kitchens/worktops',
        '/kitchens/sinks-taps',
      ],
      'Electrical': [
        '/electrical/switches-sockets',
        '/electrical/cable-accessories',
        '/electrical/lighting',
      ],
    }
  },
  'B&Q': {
    baseUrl: 'https://www.diy.com',
    categories: {
      'Building': [
        '/departments/building-materials/timber',
        '/departments/building-materials/insulation',
        '/departments/building-materials/plasterboard',
      ],
      'Bathroom': [
        '/departments/bathrooms/toilets',
        '/departments/bathrooms/basins',
        '/departments/bathrooms/baths',
        '/departments/bathrooms/taps',
      ],
      'Kitchen': [
        '/departments/kitchens/kitchen-units',
        '/departments/kitchens/worktops',
        '/departments/kitchens/sinks-taps',
      ],
      'Electrical': [
        '/departments/electrical/switches-sockets',
        '/departments/electrical/lighting',
      ],
      'Fixings': [
        '/departments/hardware/screws-nails-fixings',
        '/departments/hardware/adhesives-sealants',
      ],
    }
  },
  'Selco': {
    baseUrl: 'https://www.selcobw.com',
    categories: {
      'Building': [
        '/timber',
        '/sheet-materials',
        '/insulation',
        '/roofing',
        '/bricks-blocks-lintels',
        '/cement-aggregates',
      ],
      'Plumbing': [
        '/plumbing/pipe-fittings',
        '/plumbing/valves',
        '/plumbing/waste',
      ],
    }
  },
  'Wolseley': {
    baseUrl: 'https://www.wolseley.co.uk',
    categories: {
      'Plumbing': [
        '/plumbing/pipe-fittings',
        '/plumbing/valves',
        '/plumbing/taps',
        '/plumbing/waste',
        '/plumbing/tools',
      ],
      'Heating': [
        '/heating/boilers',
        '/heating/radiators',
        '/heating/controls',
        '/heating/cylinders',
        '/heating/pumps',
      ],
      'Bathroom': [
        '/bathrooms/toilets',
        '/bathrooms/basins',
        '/bathrooms/taps',
        '/bathrooms/showers',
      ],
    }
  },
  'Plumbase': {
    baseUrl: 'https://www.plumbase.co.uk',
    categories: {
      'Plumbing': [
        '/plumbing/copper-fittings',
        '/plumbing/plastic-fittings',
        '/plumbing/valves',
        '/plumbing/waste-fittings',
        '/plumbing/pipe',
      ],
      'Heating': [
        '/heating/radiators',
        '/heating/controls',
        '/heating/pumps',
      ],
      'Bathroom': [
        '/bathrooms/toilets',
        '/bathrooms/basins',
        '/bathrooms/taps',
      ],
    }
  },
  'PlumbNation': {
    baseUrl: 'https://www.plumbnation.co.uk',
    categories: {
      'Plumbing': [
        '/plumbing-supplies/pipe-fittings',
        '/plumbing-supplies/valves',
        '/plumbing-supplies/taps',
        '/plumbing-supplies/waste',
      ],
      'Heating': [
        '/heating/boilers',
        '/heating/radiators',
        '/heating/thermostats',
        '/heating/pumps',
      ],
    }
  },
  'Edmundson Electrical': {
    baseUrl: 'https://www.edmundson-electrical.co.uk',
    categories: {
      'Electrical': [
        '/cable',
        '/consumer-units',
        '/switches-sockets',
        '/wiring-accessories',
        '/lighting',
        '/circuit-protection',
      ],
    }
  },
  'RS Components': {
    baseUrl: 'https://uk.rs-online.com',
    categories: {
      'Electrical': [
        '/web/c/electrical-components',
        '/web/c/connectors',
        '/web/c/switches',
        '/web/c/cables-wires',
        '/web/c/circuit-breakers',
      ],
    }
  },
  'Euro Car Parts': {
    baseUrl: 'https://www.eurocarparts.com',
    categories: {
      'Automotive': [
        '/car-parts/brakes',
        '/car-parts/filters',
        '/car-parts/suspension',
        '/car-parts/engine',
        '/car-parts/exhaust',
        '/car-parts/cooling',
        '/car-parts/ignition',
        '/car-parts/clutch',
      ],
    }
  },
  'GSF Car Parts': {
    baseUrl: 'https://www.gsfcarparts.com',
    categories: {
      'Automotive': [
        '/brake-pads',
        '/brake-discs',
        '/oil-filters',
        '/air-filters',
        '/spark-plugs',
        '/batteries',
        '/wiper-blades',
        '/bulbs',
      ],
    }
  },
  'Halfords': {
    baseUrl: 'https://www.halfords.com',
    categories: {
      'Automotive': [
        '/motoring/car-parts/brakes',
        '/motoring/car-parts/batteries',
        '/motoring/car-parts/bulbs',
        '/motoring/car-parts/wipers',
        '/motoring/car-parts/oil-fluids',
      ],
    }
  },
  'Alliance Online': {
    baseUrl: 'https://www.allianceonline.co.uk',
    categories: {
      'Catering': [
        '/commercial-ovens',
        '/fryers',
        '/refrigeration',
        '/dishwashers',
        '/food-prep-equipment',
        '/hot-holding',
        '/bar-equipment',
      ],
    }
  },
  'Howdens': {
    baseUrl: 'https://www.howdens.com',
    categories: {
      'Kitchen': [
        '/kitchens/kitchen-ranges',
        '/kitchens/worktops',
        '/kitchens/sinks-taps',
        '/kitchens/appliances',
        '/kitchens/handles-accessories',
      ],
      'Doors': [
        '/doors/internal-doors',
        '/doors/external-doors',
        '/doors/door-furniture',
      ],
    }
  },
  'IronmongeryDirect': {
    baseUrl: 'https://www.ironmongerydirect.co.uk',
    categories: {
      'Ironmongery': [
        '/door-handles',
        '/door-locks',
        '/hinges',
        '/cabinet-hardware',
        '/window-hardware',
        '/letterboxes',
        '/door-closers',
      ],
      'Fixings': [
        '/screws',
        '/bolts-nuts',
        '/wall-fixings',
        '/adhesives',
      ],
    }
  },
  'Victoria Plum': {
    baseUrl: 'https://www.victoriaplum.com',
    categories: {
      'Bathroom': [
        '/toilets',
        '/basins',
        '/baths',
        '/showers',
        '/taps',
        '/bathroom-furniture',
        '/accessories',
      ],
    }
  },
};

// Rate limiting
const REQUEST_DELAY = 6000;
let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const timeSince = now - lastRequestTime;
  if (timeSince < REQUEST_DELAY) {
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY - timeSince));
  }
  lastRequestTime = Date.now();
}

// Data quality validation - STRICT
function isValidProduct(product: CrawledProduct): boolean {
  // Name validation
  if (!product.name || product.name.length < 5) return false;
  if (product.name.length > 200) return false;
  if (product.name.startsWith('£') || product.name.startsWith('Code:')) return false;
  if (/^(Just a moment|Please enable|JavaScript|Cloudflare|Access denied|Product Information|Add to|Buy now|View|See)/i.test(product.name)) return false;
  if (/^[A-Z]{2,4}\d{3,}$/.test(product.name)) return false; // SKU codes
  if (/^\d+$/.test(product.name)) return false; // Pure numbers
  if (product.name.split(' ').length < 2) return false; // Single word
  if (product.name.includes('\\') || product.name.includes('http')) return false;
  if (/[<>]/.test(product.name)) return false; // HTML tags
  
  // Price validation
  if (!product.price || product.price <= 0) return false;
  if (product.price > 50000) return false;
  if (product.price < 0.10) return false;
  
  // Category-specific price validation
  const lowerName = product.name.toLowerCase();
  if ((lowerName.includes('cable') || lowerName.includes('wire')) && product.price > 500) return false;
  if (lowerName.includes('screw') && product.price > 100) return false;
  if ((lowerName.includes('oven') || lowerName.includes('combi')) && product.price < 100) return false;
  
  return true;
}

// Extract unit from product name
function extractUnit(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (/\b100m\b/.test(lowerName)) return '100m';
  if (/\b50m\b/.test(lowerName)) return '50m';
  if (/\b25m\b/.test(lowerName)) return '25m';
  if (/\b10m\b/.test(lowerName)) return '10m';
  
  const packMatch = lowerName.match(/pack\s*(?:of\s*)?(\d+)/);
  if (packMatch) return `pack of ${packMatch[1]}`;
  
  const boxMatch = lowerName.match(/box\s*(?:of\s*)?(\d+)/);
  if (boxMatch) return `box of ${boxMatch[1]}`;
  
  if (/per\s*m(?:etre)?|\bm\b|\/m/.test(lowerName)) return 'm';
  if (/per\s*roll/.test(lowerName)) return 'roll';
  if (/per\s*kg/.test(lowerName)) return 'kg';
  if (/per\s*l(?:itre)?/.test(lowerName)) return 'litre';
  
  return 'each';
}

// Extract products from JSON-LD
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
          
          if (price && price > 0) {
            const product: CrawledProduct = {
              name: item.name.trim(),
              price,
              unit: extractUnit(item.name),
              category,
              sku: item.sku,
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
              const prod = listItem.item;
              let price: number | null = null;
              
              if (prod.offers) {
                const offers = Array.isArray(prod.offers) ? prod.offers : [prod.offers];
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
              
              if (price && price > 0) {
                const product: CrawledProduct = {
                  name: prod.name.trim(),
                  price,
                  unit: extractUnit(prod.name),
                  category,
                  sku: prod.sku,
                };
                
                if (isValidProduct(product)) {
                  products.push(product);
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

// Parse products from markdown
function parseProductsFromMarkdown(markdown: string, category: string): CrawledProduct[] {
  const products: CrawledProduct[] = [];
  const pricePatterns = [
    /£(\d+(?:,\d{3})*(?:\.\d{2})?)/g,
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
          category,
          sku: currentProduct.sku,
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
        if (!isNaN(price) && price > 0 && price < 50000) {
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
      category,
    };
    
    if (isValidProduct(product)) {
      products.push(product);
    }
  }
  
  return products;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  const denied = await requireAdminOrService(req, corsHeaders);
  if (denied) return denied;

  try {
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY') || Deno.env.get('Web_Scrape_FIRECRAWL') || '';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { suppliers, maxPagesPerCategory = 3 } = await req.json();
    
    // Determine which suppliers to crawl (default: all enabled)
    const suppliersToProcess = suppliers || Object.keys(SUPPLIER_CATEGORIES);
    
    console.log(`═══════════════════════════════════════════════════════════════════`);
    console.log(`BULK CATEGORY CRAWL - Starting`);
    console.log(`Suppliers: ${suppliersToProcess.join(', ')}`);
    console.log(`═══════════════════════════════════════════════════════════════════\n`);

    let totalProducts = 0;
    let totalInserted = 0;
    const results: Record<string, { scraped: number; inserted: number; errors: string[] }> = {};

    for (const supplierName of suppliersToProcess) {
      const supplierConfig = SUPPLIER_CATEGORIES[supplierName];
      if (!supplierConfig) {
        console.log(`Unknown supplier: ${supplierName}`);
        continue;
      }

      results[supplierName] = { scraped: 0, inserted: 0, errors: [] };
      
      // Get or create source ID
      const { data: sourceData } = await supabase
        .from('price_sources')
        .select('id')
        .ilike('name', `%${supplierName}%`)
        .limit(1)
        .single();
      
      let sourceId = sourceData?.id;
      
      if (!sourceId) {
        const { data: newSource } = await supabase
          .from('price_sources')
          .insert({
            name: supplierName,
            source_type: 'merchant_scrape',
            base_url: supplierConfig.baseUrl,
            is_enabled: true,
            priority: 70,
          })
          .select('id')
          .single();
        sourceId = newSource?.id;
      }

      // Crawl each category
      for (const [category, paths] of Object.entries(supplierConfig.categories)) {
        console.log(`\n[${supplierName}] Category: ${category}`);
        
        for (const path of paths.slice(0, maxPagesPerCategory)) {
          await rateLimit();
          
          const url = `${supplierConfig.baseUrl}${path}`;
          console.log(`  Crawling: ${url}`);
          
          try {
            const page = await fetchPage(url);
            if (!page.ok) {
              results[supplierName].errors.push(`${path}: ${page.error}`);
              continue;
            }
            const html = page.html;
            const markdown = '';
            
            // Extract products using both methods
            const jsonLdProducts = extractJsonLdProducts(html, category);
            const markdownProducts = parseProductsFromMarkdown(markdown, category);
            
            // Combine and deduplicate by name
            const allProducts = [...jsonLdProducts];
            const existingNames = new Set(allProducts.map(p => p.name.toLowerCase()));
            
            for (const mp of markdownProducts) {
              if (!existingNames.has(mp.name.toLowerCase())) {
                allProducts.push(mp);
                existingNames.add(mp.name.toLowerCase());
              }
            }
            
            results[supplierName].scraped += allProducts.length;
            totalProducts += allProducts.length;
            
            console.log(`  Found ${allProducts.length} products`);
            
            // Insert into database
            if (allProducts.length > 0 && sourceId) {
              const toInsert = allProducts.map(p => ({
                product_name: p.name,
                unit_price: p.price,
                unit: p.unit,
                category: p.category,
                subcategory: p.subcategory,
                sku: p.sku,
                source_id: sourceId,
                confidence_score: 0.85,
                is_active: true,
                last_updated: new Date().toISOString(),
              }));
              
              const { data: inserted, error: insertError } = await supabase
                .from('market_prices')
                .upsert(toInsert, {
                  onConflict: 'product_name,source_id',
                  ignoreDuplicates: false,
                })
                .select('id');
              
              if (insertError) {
                console.log(`  Insert error: ${insertError.message}`);
                results[supplierName].errors.push(`Insert: ${insertError.message}`);
              } else {
                const insertedCount = inserted?.length || 0;
                results[supplierName].inserted += insertedCount;
                totalInserted += insertedCount;
                console.log(`  Inserted/Updated ${insertedCount} products`);
              }
            }
            
          } catch (error) {
            const errMsg = error instanceof Error ? error.message : 'Unknown error';
            console.log(`  Error: ${errMsg}`);
            results[supplierName].errors.push(`${path}: ${errMsg}`);
          }
        }
      }
      
      // Update source last_fetch_at
      if (sourceId) {
        await supabase
          .from('price_sources')
          .update({
            last_fetch_at: new Date().toISOString(),
            last_fetch_status: `Crawled ${results[supplierName].scraped} products, inserted ${results[supplierName].inserted}`,
          })
          .eq('id', sourceId);
      }
    }

    console.log(`\n═══════════════════════════════════════════════════════════════════`);
    console.log(`BULK CRAWL COMPLETE`);
    console.log(`Total scraped: ${totalProducts} | Total inserted: ${totalInserted}`);
    console.log(`═══════════════════════════════════════════════════════════════════\n`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total_scraped: totalProducts,
          total_inserted: totalInserted,
          by_supplier: results,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Bulk category crawl error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
