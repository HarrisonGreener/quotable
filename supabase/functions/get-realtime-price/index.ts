import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fetchPage, extractProducts, similarity, type ScrapedProduct } from "../_shared/scraper.ts";
import { requireAdminOrService } from "../_shared/guard.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ═══════════════════════════════════════════════════════════════════
// REAL-TIME SINGLE PRODUCT PRICE LOOKUP
// Scrapes a single product when not found in database cache
// ═══════════════════════════════════════════════════════════════════

interface ProductPrice {
  name: string;
  price: number;
  unit: string;
  source: string;
  confidence: number;
  url?: string;
}

// Supplier search URL patterns - 20+ suppliers covering all trades
const SUPPLIER_SEARCH_URLS: Record<string, (query: string) => string> = {
  // General Trade Suppliers
  'toolstation': (q) => `https://www.toolstation.com/search?q=${encodeURIComponent(q)}`,
  'screwfix': (q) => `https://www.screwfix.com/search?search=${encodeURIComponent(q)}`,
  'wickes': (q) => `https://www.wickes.co.uk/search?text=${encodeURIComponent(q)}`,
  'bandq': (q) => `https://www.diy.com/search?term=${encodeURIComponent(q)}`,
  'selco': (q) => `https://www.selcobw.com/search?q=${encodeURIComponent(q)}`,
  
  // Plumbing Specialists
  'cityplumbing': (q) => `https://www.cityplumbing.co.uk/search?term=${encodeURIComponent(q)}`,
  'wolseley': (q) => `https://www.wolseley.co.uk/search/?q=${encodeURIComponent(q)}`,
  'plumbase': (q) => `https://www.plumbase.co.uk/search?q=${encodeURIComponent(q)}`,
  'plumbnation': (q) => `https://www.plumbnation.co.uk/catalogsearch/result/?q=${encodeURIComponent(q)}`,
  
  // Building Materials
  'jewson': (q) => `https://www.jewson.co.uk/search?q=${encodeURIComponent(q)}`,
  'travisperkins': (q) => `https://www.travisperkins.co.uk/search?text=${encodeURIComponent(q)}`,
  
  // Electrical Specialists
  'edmundson': (q) => `https://www.edmundson-electrical.co.uk/search?q=${encodeURIComponent(q)}`,
  'rscomponents': (q) => `https://uk.rs-online.com/web/c/?searchTerm=${encodeURIComponent(q)}`,
  'tlcdirect': (q) => `https://www.tlc-direct.co.uk/Main/Search.html?q=${encodeURIComponent(q)}`,
  
  // Catering Equipment
  'nisbets': (q) => `https://www.nisbets.co.uk/search/?text=${encodeURIComponent(q)}`,
  'allianceonline': (q) => `https://www.allianceonline.co.uk/catalogsearch/result/?q=${encodeURIComponent(q)}`,
  
  // Automotive Parts
  'eurocarparts': (q) => `https://www.eurocarparts.com/search/${encodeURIComponent(q)}`,
  'gsfcarparts': (q) => `https://www.gsfcarparts.com/search?q=${encodeURIComponent(q)}`,
  'halfords': (q) => `https://www.halfords.com/search?q=${encodeURIComponent(q)}`,
  
  // Kitchen & Bathroom
  'howdens': (q) => `https://www.howdens.com/search?q=${encodeURIComponent(q)}`,
  'victoriaplum': (q) => `https://www.victoriaplum.com/search?q=${encodeURIComponent(q)}`,
  
  // Ironmongery & Fixings
  'ironmongerydirect': (q) => `https://www.ironmongerydirect.co.uk/search?query=${encodeURIComponent(q)}`,
};

// Trade-to-supplier mapping - comprehensive coverage
const TRADE_SUPPLIERS: Record<string, string[]> = {
  'plumber': ['cityplumbing', 'wolseley', 'plumbase', 'plumbnation', 'toolstation', 'screwfix'],
  'electrician': ['edmundson', 'rscomponents', 'tlcdirect', 'screwfix', 'toolstation'],
  'builder': ['jewson', 'travisperkins', 'selco', 'bandq', 'toolstation', 'screwfix'],
  'catering': ['nisbets', 'allianceonline'],
  'commercial-catering-engineer': ['nisbets', 'allianceonline'],
  'hvac': ['cityplumbing', 'wolseley', 'plumbnation', 'toolstation'],
  'automotive': ['eurocarparts', 'gsfcarparts', 'halfords'],
  'mechanic': ['eurocarparts', 'gsfcarparts', 'halfords'],
  'kitchen': ['howdens', 'wickes', 'bandq'],
  'bathroom': ['victoriaplum', 'cityplumbing', 'wickes', 'toolstation'],
  'carpenter': ['jewson', 'travisperkins', 'toolstation', 'screwfix'],
  'joiner': ['jewson', 'travisperkins', 'toolstation', 'screwfix'],
  'roofer': ['jewson', 'travisperkins', 'selco', 'toolstation'],
  'locksmith': ['ironmongerydirect', 'screwfix', 'toolstation'],
  'default': ['toolstation', 'screwfix', 'bandq'],
};

// Simplify product name for better search results
function simplifyProductName(name: string): string {
  // Keep critical dimensions (15mm, 22mm, etc.) and electrical ratings (13A, 32A)
  const dimensionMatch = name.match(/(\d+(?:\.\d+)?mm|\d+A\b)/gi);
  const dimensions = dimensionMatch ? dimensionMatch.slice(0, 2).join(' ') : '';
  
  // Remove parenthetical content, colors, pack sizes
  let simplified = name
    .replace(/\([^)]*\)/g, '')
    .replace(/\b(white|black|grey|chrome|brass|nickel|silver|gold|blue|red|green)\b/gi, '')
    .replace(/\bpack\s*(?:of\s*)?\d+/gi, '')
    .replace(/\bbox\s*(?:of\s*)?\d+/gi, '')
    .replace(/\b\d+(?:\.\d+)?(?:mm|cm|m|inch|")/gi, '') // Remove sizes already captured
    .replace(/\s+/g, ' ')
    .trim();
  
  // Extract core product words (first 4-5 meaningful words)
  const words = simplified.split(' ').filter(w => w.length > 2);
  const coreWords = words.slice(0, 5).join(' ');
  
  return dimensions ? `${coreWords} ${dimensions}` : coreWords;
}

// Extract unit from product name
function extractUnit(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (/\b100m\b/.test(lowerName)) return '100m';
  if (/\b50m\b/.test(lowerName)) return '50m';
  if (/\b25m\b/.test(lowerName)) return '25m';
  if (/\b10m\b/.test(lowerName)) return '10m';
  if (/pack\s*(?:of\s*)?(\d+)/i.test(lowerName)) {
    const match = lowerName.match(/pack\s*(?:of\s*)?(\d+)/i);
    return match ? `pack of ${match[1]}` : 'pack';
  }
  if (/per\s*m(?:etre)?|\bm|\/m/.test(lowerName)) return 'm';
  
  return 'each';
}

// Validate scraped product
function isValidProduct(name: string, price: number): boolean {
  if (!name || name.length < 5) return false;
  if (name.startsWith('£') || name.startsWith('Code:')) return false;
  if (/^(Just a moment|Please enable|JavaScript|Cloudflare|Access denied)/i.test(name)) return false;
  if (!price || price <= 0 || price > 50000) return false;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  const denied = await requireAdminOrService(req, corsHeaders);
  if (denied) return denied;

  try {
    const { productName, trade, preferredSuppliers, maxSuppliers = 3 } = await req.json();

    if (!productName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Product name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine which suppliers to try based on trade
    const tradeLower = (trade || 'default').toLowerCase();
    let suppliersToTry = TRADE_SUPPLIERS[tradeLower] || TRADE_SUPPLIERS['default'];

    // Prioritise user's preferred suppliers
    if (preferredSuppliers && preferredSuppliers.length > 0) {
      const preferredLower = preferredSuppliers.map((s: string) => s.toLowerCase().replace(/[\s&]+/g, ''));
      suppliersToTry = [...new Set([...preferredLower.filter((s: string) => SUPPLIER_SEARCH_URLS[s]), ...suppliersToTry])];
    }

    const simplifiedName = simplifyProductName(productName);
    console.log(`Real-time lookup: "${productName}" → "${simplifiedName}" via ${suppliersToTry.slice(0, maxSuppliers).join(', ')}`);

    // Search each supplier, score every product on the results page against
    // what the quote asked for, and keep the best genuine match.
    let best: { supplier: string; product: ScrapedProduct; score: number } | null = null;
    const MIN_SCORE = 0.55;

    for (const supplier of suppliersToTry.slice(0, maxSuppliers)) {
      const urlGenerator = SUPPLIER_SEARCH_URLS[supplier];
      if (!urlGenerator) continue;
      const searchUrl = urlGenerator(simplifiedName);

      const page = await fetchPage(searchUrl);
      if (!page.ok) {
        console.log(`  ${supplier}: ${page.error}`);
        continue;
      }

      const products = extractProducts(page.html, searchUrl).filter((p) => isValidProduct(p.name, p.price));
      for (const product of products) {
        const score = similarity(productName, product.name);
        if (score >= MIN_SCORE && (!best || score > best.score)) best = { supplier, product, score };
      }
      console.log(`  ${supplier} (${page.via}): ${products.length} products, best so far ${best?.score ?? 0}`);
      if (best && best.score >= 0.85) break; // good enough, stop hitting sites
    }

    if (!best) {
      return new Response(
        JSON.stringify({ success: false, error: 'No matching product found at suppliers' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const confidence = Math.min(0.95, 0.6 + 0.35 * best.score);
    const sourceId = await getOrCreateSourceId(supabase, best.supplier);
    const unit = extractUnit(best.product.name);

    // Cache the REAL product (its own name and URL) so future quotes reuse it.
    if (sourceId) {
      await supabase.from('market_prices').upsert({
        product_name: best.product.name,
        unit_price: best.product.price,
        unit,
        category: mapTradeToCategory(trade),
        source_id: sourceId,
        sku: best.product.sku ?? null,
        product_url: best.product.url ?? null,
        confidence_score: confidence,
        is_active: true,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'product_name,source_id' });
    }

    const result: ProductPrice = {
      name: best.product.name,
      price: best.product.price,
      unit,
      source: capitalizeSupplier(best.supplier),
      confidence,
      url: best.product.url,
    };

    return new Response(
      JSON.stringify({ success: true, product: result, matchScore: best.score }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Real-time price lookup error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper to get or create a price source
async function getOrCreateSourceId(supabase: any, supplierName: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from('price_sources')
    .select('id')
    .ilike('name', `%${supplierName}%`)
    .limit(1)
    .single();
  
  if (existing?.id) return existing.id;
  
  // Create new source
  const { data: created } = await supabase
    .from('price_sources')
    .insert({
      name: capitalizeSupplier(supplierName),
      source_type: 'merchant_scrape',
      is_enabled: true,
      priority: 60,
    })
    .select('id')
    .single();
  
  return created?.id || null;
}

function capitalizeSupplier(name: string): string {
  const names: Record<string, string> = {
    'toolstation': 'Toolstation',
    'screwfix': 'Screwfix',
    'cityplumbing': 'City Plumbing',
    'nisbets': 'Nisbets',
    'jewson': 'Jewson',
    'travisperkins': 'Travis Perkins',
    'wickes': 'Wickes',
    'wolseley': 'Wolseley',
    'bandq': 'B&Q',
    'selco': 'Selco',
    'plumbase': 'Plumbase',
    'plumbnation': 'PlumbNation',
    'edmundson': 'Edmundson Electrical',
    'rscomponents': 'RS Components',
    'tlcdirect': 'TLC Direct',
    'allianceonline': 'Alliance Online',
    'eurocarparts': 'Euro Car Parts',
    'gsfcarparts': 'GSF Car Parts',
    'halfords': 'Halfords',
    'howdens': 'Howdens',
    'victoriaplum': 'Victoria Plum',
    'ironmongerydirect': 'IronmongeryDirect',
  };
  return names[name.toLowerCase()] || name;
}

function mapTradeToCategory(trade?: string): string {
  const mapping: Record<string, string> = {
    'plumber': 'Plumbing',
    'electrician': 'Electrical',
    'builder': 'Building',
    'catering': 'Catering',
    'commercial-catering-engineer': 'Catering',
    'hvac': 'HVAC',
    'carpenter': 'Timber',
    'joiner': 'Timber',
    'roofer': 'Roofing',
    'automotive': 'Automotive',
    'mechanic': 'Automotive',
    'kitchen': 'Kitchen',
    'bathroom': 'Bathroom',
    'locksmith': 'Ironmongery',
  };
  return mapping[(trade || '').toLowerCase()] || 'General';
}
