import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fetchPage, extractProducts } from "../_shared/scraper.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedProduct {
  name: string;
  sku?: string;
  price: number;
  unit: string;
  category: string;
  subcategory?: string;
  url?: string;
}

interface RobotsTxtRule {
  userAgent: string;
  disallow: string[];
  allow: string[];
  crawlDelay?: number;
}

// ═══════════════════════════════════════════════════════════════════
// RATE LIMITING - Respect Firecrawl's 10 req/min limit
// ═══════════════════════════════════════════════════════════════════

const lastRequestTime: Record<string, number> = {};
const DEFAULT_CRAWL_DELAY = 6000; // 6 seconds = 10 req/min for Firecrawl
const requestQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;

// Exponential backoff for retries
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const isRateLimit = error instanceof Error && 
        (error.message.includes('429') || error.message.includes('rate limit'));
      
      if (isRateLimit && attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, baseDelay));
      }
    }
  }
  
  throw lastError;
}

// Apply rate limiting per domain
async function applyRateLimit(domain: string, crawlDelay?: number): Promise<void> {
  const delay = Math.max(crawlDelay || DEFAULT_CRAWL_DELAY, DEFAULT_CRAWL_DELAY);
  const lastTime = lastRequestTime[domain] || 0;
  const timeSinceLastRequest = Date.now() - lastTime;
  
  if (timeSinceLastRequest < delay) {
    const waitTime = delay - timeSinceLastRequest;
    console.log(`Rate limiting: waiting ${waitTime}ms before next request to ${domain}`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime[domain] = Date.now();
}

// ═══════════════════════════════════════════════════════════════════
// ROBOTS.TXT COMPLIANCE
// ═══════════════════════════════════════════════════════════════════

function parseRobotsTxt(content: string): RobotsTxtRule[] {
  const rules: RobotsTxtRule[] = [];
  let currentRule: RobotsTxtRule | null = null;
  
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim().toLowerCase();
    
    if (trimmed.startsWith('user-agent:')) {
      if (currentRule) rules.push(currentRule);
      currentRule = {
        userAgent: trimmed.replace('user-agent:', '').trim(),
        disallow: [],
        allow: [],
      };
    } else if (currentRule && trimmed.startsWith('disallow:')) {
      const path = trimmed.replace('disallow:', '').trim();
      if (path) currentRule.disallow.push(path);
    } else if (currentRule && trimmed.startsWith('allow:')) {
      const path = trimmed.replace('allow:', '').trim();
      if (path) currentRule.allow.push(path);
    } else if (currentRule && trimmed.startsWith('crawl-delay:')) {
      const delay = parseInt(trimmed.replace('crawl-delay:', '').trim());
      if (!isNaN(delay)) currentRule.crawlDelay = delay * 1000;
    }
  }
  
  if (currentRule) rules.push(currentRule);
  return rules;
}

function isPathAllowed(rules: RobotsTxtRule[], path: string): { allowed: boolean; crawlDelay?: number } {
  const applicableRules = rules.filter(r => r.userAgent === '*' || r.userAgent.includes('bot'));
  
  if (applicableRules.length === 0) {
    return { allowed: true };
  }
  
  for (const rule of applicableRules) {
    for (const allowPath of rule.allow) {
      if (path.startsWith(allowPath)) {
        return { allowed: true, crawlDelay: rule.crawlDelay };
      }
    }
    
    for (const disallowPath of rule.disallow) {
      if (disallowPath === '/' || path.startsWith(disallowPath)) {
        return { allowed: false, crawlDelay: rule.crawlDelay };
      }
    }
  }
  
  return { allowed: true, crawlDelay: applicableRules[0]?.crawlDelay };
}

async function checkRobotsTxt(baseUrl: string, targetPath: string): Promise<{ allowed: boolean; reason: string; crawlDelay?: number }> {
  try {
    const robotsUrl = `${baseUrl}/robots.txt`;
    console.log(`Fetching robots.txt from: ${robotsUrl}`);
    
    const response = await fetch(robotsUrl, {
      headers: { 'User-Agent': 'QuotableBot/1.0 (price comparison; respectful scraping)' }
    });
    
    if (!response.ok) {
      console.log(`No robots.txt found (${response.status}), assuming allowed`);
      return { allowed: true, reason: 'No robots.txt found - assuming allowed' };
    }
    
    const content = await response.text();
    const rules = parseRobotsTxt(content);
    const result = isPathAllowed(rules, targetPath);
    
    console.log(`Robots.txt check for ${targetPath}: ${result.allowed ? 'ALLOWED' : 'BLOCKED'}`);
    
    return {
      allowed: result.allowed,
      reason: result.allowed ? 'Allowed by robots.txt' : 'Blocked by robots.txt',
      crawlDelay: result.crawlDelay,
    };
  } catch (error) {
    console.error('Error fetching robots.txt:', error);
    return { allowed: true, reason: 'Could not fetch robots.txt - proceeding cautiously' };
  }
}

// ═══════════════════════════════════════════════════════════════════
// JSON-LD EXTRACTION - E-commerce sites use structured data
// ═══════════════════════════════════════════════════════════════════

interface JsonLdProduct {
  '@type': string;
  name?: string;
  sku?: string;
  offers?: {
    price?: string | number;
    priceCurrency?: string;
  } | Array<{
    price?: string | number;
    priceCurrency?: string;
  }>;
}

function extractJsonLdProducts(html: string, category: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];
  
  // Find all JSON-LD script blocks
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonData = JSON.parse(match[1]);
      const items = Array.isArray(jsonData) ? jsonData : [jsonData];
      
      for (const item of items) {
        if (item['@type'] === 'Product' || item['@type'] === 'ItemList') {
          const extracted = extractProductFromJsonLd(item, category);
          if (extracted) products.push(...extracted);
        }
        
        // Handle ItemList containing products
        if (item.itemListElement && Array.isArray(item.itemListElement)) {
          for (const listItem of item.itemListElement) {
            if (listItem.item && listItem.item['@type'] === 'Product') {
              const extracted = extractProductFromJsonLd(listItem.item, category);
              if (extracted) products.push(...extracted);
            }
          }
        }
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  }
  
  return products;
}

function extractProductFromJsonLd(item: JsonLdProduct, category: string): ScrapedProduct[] | null {
  if (!item.name) return null;
  
  let price: number | null = null;
  
  if (item.offers) {
    const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
    for (const offer of offers) {
      if (offer.price) {
        price = typeof offer.price === 'string' ? parseFloat(offer.price) : offer.price;
        if (!isNaN(price) && price > 0) break;
      }
    }
  }
  
  if (!price || price <= 0) return null;
  
  const product: ScrapedProduct = {
    name: item.name.trim(),
    price,
    unit: extractUnitFromName(item.name),
    category,
    sku: item.sku,
  };
  
  if (isValidScrapedProduct(product)) {
    return [product];
  }
  
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// MARKDOWN PATTERN PARSING - Improved price extraction
// ═══════════════════════════════════════════════════════════════════

function parseProductsFromMarkdown(markdown: string, sourceName: string, category?: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];
  
  // Multiple price patterns for different formats
  const pricePatterns = [
    /£(\d+(?:,\d{3})*(?:\.\d{2})?)/g,                    // £99.99 or £1,234.56
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:ex\.?\s*VAT|inc\.?\s*VAT)/gi,  // 99.99 ex VAT
    /(?:Price|From|Now)[:\s]*£?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,       // Price: £99.99
  ];
  
  // Product name patterns
  const productPatterns = [
    /^##\s+(.+)$/gm,                    // ## Product Name
    /^###\s+(.+)$/gm,                   // ### Product Name
    /^\*\*(.+?)\*\*/gm,                 // **Product Name**
    /^\[([^\]]+)\]\([^)]+\)/gm,         // [Product Name](url)
    /^[-•]\s+(.+?)(?:\s*[-–]\s*£|\s*£)/gm,  // - Product Name - £
  ];
  
  // Split into lines for context-aware parsing
  const lines = markdown.split('\n');
  let currentProduct: Partial<ScrapedProduct> = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check for product name patterns
    let foundProductName = false;
    for (const pattern of productPatterns) {
      pattern.lastIndex = 0;
      const nameMatch = pattern.exec(line);
      if (nameMatch && nameMatch[1]) {
        // Save previous product if valid
        if (currentProduct.name && currentProduct.price) {
          const product: ScrapedProduct = {
            name: currentProduct.name,
            price: currentProduct.price,
            unit: currentProduct.unit || 'each',
            category: category || 'general',
            sku: currentProduct.sku,
          };
          if (isValidScrapedProduct(product)) {
            products.push(product);
          }
        }
        
        // Start new product
        const cleanName = nameMatch[1].replace(/[#*\[\]]/g, '').trim();
        if (cleanName.length > 5 && !cleanName.startsWith('£')) {
          currentProduct = { name: cleanName, unit: extractUnitFromName(cleanName) };
          foundProductName = true;
        }
        break;
      }
    }
    
    // Look for prices in current line
    for (const pattern of pricePatterns) {
      pattern.lastIndex = 0;
      const priceMatch = pattern.exec(line);
      if (priceMatch) {
        const priceStr = priceMatch[1].replace(/,/g, '');
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price > 0 && price < 100000) {
          if (currentProduct.name) {
            currentProduct.price = price;
          } else if (!foundProductName) {
            // Try to extract product name from same line
            const beforePrice = line.split('£')[0].trim();
            const cleanName = beforePrice.replace(/[#*\[\]|]/g, '').trim();
            if (cleanName.length > 5) {
              currentProduct = { 
                name: cleanName, 
                price, 
                unit: extractUnitFromName(cleanName) 
              };
            }
          }
        }
        break;
      }
    }
    
    // Look for SKU patterns
    const skuMatch = line.match(/(?:SKU|Code|Ref|Item)[:\s#]*([A-Z0-9][-A-Z0-9]+)/i);
    if (skuMatch && currentProduct.name) {
      currentProduct.sku = skuMatch[1];
    }
  }
  
  // Don't forget the last product
  if (currentProduct.name && currentProduct.price) {
    const product: ScrapedProduct = {
      name: currentProduct.name,
      price: currentProduct.price,
      unit: currentProduct.unit || 'each',
      category: category || 'general',
      sku: currentProduct.sku,
    };
    if (isValidScrapedProduct(product)) {
      products.push(product);
    }
  }
  
  return products;
}

function extractUnitFromName(name: string): string {
  const lowerName = name.toLowerCase();
  
  // Bulk quantities
  if (/\b100m\b/.test(lowerName)) return '100m';
  if (/\b50m\b/.test(lowerName)) return '50m';
  if (/\b25m\b/.test(lowerName)) return '25m';
  if (/\b10m\b/.test(lowerName)) return '10m';
  
  // Pack sizes
  const packMatch = lowerName.match(/pack\s*(?:of\s*)?(\d+)/);
  if (packMatch) return `pack of ${packMatch[1]}`;
  
  // Box quantities
  const boxMatch = lowerName.match(/box\s*(?:of\s*)?(\d+)/);
  if (boxMatch) return `box of ${boxMatch[1]}`;
  
  // Per unit patterns
  if (/per\s*m(?:etre)?|\bm\b|\/m/.test(lowerName)) return 'm';
  if (/per\s*roll/.test(lowerName)) return 'roll';
  if (/per\s*kg/.test(lowerName)) return 'kg';
  if (/per\s*l(?:itre)?/.test(lowerName)) return 'litre';
  
  return 'each';
}

// ═══════════════════════════════════════════════════════════════════
// PRODUCT VALIDATION
// ═══════════════════════════════════════════════════════════════════

function isValidScrapedProduct(product: ScrapedProduct): boolean {
  // Name validation
  if (!product.name || product.name.length < 5) return false;
  if (product.name.length > 200) return false;
  if (product.name.startsWith('£')) return false;
  if (product.name.startsWith('Code:')) return false;
  if (/^(Just a moment|Please enable|JavaScript|Cloudflare|Access denied)/i.test(product.name)) return false;
  if (/^[A-Z]{2,4}\d{3,}/.test(product.name)) return false; // SKU codes
  if (/^\d+$/.test(product.name)) return false; // Pure numbers
  if (product.name.split(' ').length < 2) return false; // Single word
  if (product.name.includes('\\')) return false;
  
  // Price validation
  if (!product.price || product.price <= 0) return false;
  if (product.price > 100000) return false;
  if (product.price < 0.01) return false;
  
  // Category-specific validation
  const lowerName = product.name.toLowerCase();
  if ((lowerName.includes('cable') || lowerName.includes('wire')) && product.price > 500) {
    console.log(`Suspicious cable price rejected: ${product.name} @ £${product.price}`);
    return false;
  }
  
  return true;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { sourceId, category, searchQuery } = await req.json();

    // Get the price source details
    const { data: source, error: sourceError } = await supabase
      .from('price_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError || !source) {
      return new Response(
        JSON.stringify({ success: false, error: 'Price source not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if source is enabled
    if (!source.is_enabled) {
      return new Response(
        JSON.stringify({ success: false, error: `Source ${source.name} is disabled`, reason: source.last_fetch_status }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Scraping from ${source.name} for category: ${category || 'all'}`);

    const urlObj = new URL(source.base_url);
    const domain = urlObj.hostname;

    // Build search URL
    const q = (searchQuery || category || '').trim();
    const query = encodeURIComponent(q);

    const buildSearchPath = (sourceName: string, encodedQuery: string) => {
      const n = sourceName.toLowerCase();
      if (n.includes('toolstation')) return `/search?searchstr=${encodedQuery}`;
      if (n.includes('screwfix')) return `/search?search=${encodedQuery}`;
      if (n.includes('city plumbing')) return `/search?text=${encodedQuery}`;
      if (n.includes('nisbets')) return `/search/?text=${encodedQuery}`;
      if (n.includes('euro car')) return `/search/${encodedQuery}`;
      if (n.includes('gsf')) return `/search?q=${encodedQuery}`;
      return `/search?q=${encodedQuery}`;
    };

    const searchPath = buildSearchPath(source.name, query);
    const searchUrl = `${source.base_url}${searchPath}`;

    // Check robots.txt compliance
    console.log(`Checking robots.txt compliance for ${source.name}...`);
    const robotsCheck = await checkRobotsTxt(source.base_url, searchPath);
    
    if (!robotsCheck.allowed) {
      console.warn(`⚠️ BLOCKED by robots.txt: ${source.name}`);
      
      await supabase
        .from('price_sources')
        .update({
          last_fetch_at: new Date().toISOString(),
          last_fetch_status: 'blocked_by_robots_txt',
          robots_txt_compliant: false,
          is_enabled: false, // Auto-disable blocked sources
        })
        .eq('id', source.id);
      
      return new Response(
        JSON.stringify({ success: false, error: 'Blocked by robots.txt', source: source.name }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Apply rate limiting
    await applyRateLimit(domain, robotsCheck.crawlDelay);

    console.log(`✅ Robots.txt check passed, scraping: ${searchUrl}`);

    // Fetch the page (free direct request first, Firecrawl fallback if configured)
    const page = await fetchPage(searchUrl);
    if (!page.ok) {
      await supabase.from('price_sources').update({
        last_fetch_at: new Date().toISOString(),
        last_fetch_status: `fetch_failed: ${page.error}`.slice(0, 200),
      }).eq('id', source.id);
      return new Response(
        JSON.stringify({ success: false, error: page.error, source: source.name }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const html = page.html;
    const markdown = '';
    console.log(`Fetched ${html.length} chars via ${page.via}`);

    // Structured data first (most accurate)
    let products: ScrapedProduct[] = extractProducts(html, searchUrl).map((p) => ({
      name: p.name,
      price: p.price,
      sku: p.sku,
      url: p.url,
      unit: extractUnitFromName(p.name),
      category: category || 'general',
    })).filter(isValidScrapedProduct);
    if (products.length === 0) products = extractJsonLdProducts(html, category || 'general');
    console.log(`Structured data found ${products.length} products`);

    // Fall back to markdown parsing if JSON-LD didn't work
    if (products.length === 0) {
      products = parseProductsFromMarkdown(markdown, source.name, category);
      console.log(`Markdown parsing found ${products.length} products`);
    }

    // Store products
    let insertedCount = 0;
    let updatedCount = 0;

    for (const product of products) {
      const { data: existing } = await supabase
        .from('market_prices')
        .select('id, unit_price')
        .eq('product_name', product.name)
        .eq('source_id', source.id)
        .maybeSingle();

      if (existing) {
        const priceDiff = Math.abs(existing.unit_price - product.price) / existing.unit_price;
        if (priceDiff > 0.02) {
          await supabase.from('price_history').insert({
            market_price_id: existing.id,
            price: product.price,
            source_id: source.id,
          });

          await supabase
            .from('market_prices')
            .update({
              unit_price: product.price,
              min_price: Math.min(product.price, product.price * 0.95),
              max_price: Math.max(product.price, product.price * 1.05),
              confidence_score: 0.90,
              last_updated: new Date().toISOString(),
            })
            .eq('id', existing.id);
          
          updatedCount++;
        }
      } else {
        await supabase.from('market_prices').insert({
          product_name: product.name,
          category: product.category,
          subcategory: product.subcategory,
          unit: product.unit,
          unit_price: product.price,
          min_price: product.price * 0.95,
          max_price: product.price * 1.05,
          source_id: source.id,
          confidence_score: 0.90,
          sku: product.sku,
          product_url: product.url ?? null,
          is_active: true,
        });
        insertedCount++;
      }
    }

    // Update source status
    await supabase
      .from('price_sources')
      .update({
        last_fetch_at: new Date().toISOString(),
        last_fetch_status: 'success',
        robots_txt_compliant: true,
      })
      .eq('id', source.id);

    return new Response(
      JSON.stringify({
        success: true,
        source: source.name,
        productsFound: products.length,
        inserted: insertedCount,
        updated: updatedCount,
        robotsCompliant: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in scrape-merchant-prices:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
