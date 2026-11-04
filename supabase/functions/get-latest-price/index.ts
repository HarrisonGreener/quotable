import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceLookupRequest {
  trade?: string;
  product: string;
  quantity?: number;
  region?: string;
  category?: string;
}

interface PriceLookupResponse {
  found: boolean;
  price: number;
  unit: string;
  adjustedPrice?: number;
  confidence: number;
  source: string;
  lastUpdated: string;
  alternatives?: Array<{
    name: string;
    price: number;
    unit: string;
  }>;
  priceRange?: {
    min: number;
    max: number;
  };
}

// Map trades to categories
const tradeToCategory: Record<string, string[]> = {
  'plumber': ['plumbing', 'heating', 'bathroom'],
  'electrician': ['electrical', 'lighting', 'wiring'],
  'carpenter': ['carpentry', 'timber', 'woodwork'],
  'builder': ['building', 'construction', 'masonry'],
  'roofer': ['roofing', 'guttering'],
  'plasterer': ['plastering', 'drywall'],
  'painter': ['painting', 'decorating'],
  'landscaper': ['landscaping', 'garden', 'outdoor'],
  'hvac': ['hvac', 'heating', 'ventilation', 'air conditioning'],
  'gas engineer': ['gas', 'heating', 'boiler'],
  'commercial catering engineer': ['catering', 'commercial kitchen', 'food service equipment'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { trade, product, quantity = 1, region = 'UK', category } = await req.json() as PriceLookupRequest;

    if (!product) {
      return new Response(
        JSON.stringify({ error: 'Product name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Looking up price for: ${product}, trade: ${trade}, region: ${region}`);

    // Determine categories to search
    let searchCategories: string[] = [];
    if (category) {
      searchCategories = [category.toLowerCase()];
    } else if (trade) {
      searchCategories = tradeToCategory[trade.toLowerCase()] || [];
    }

    // Build search query with fuzzy matching
    const searchTerm = product.toLowerCase().trim();
    
    let query = supabase
      .from('market_prices')
      .select(`
        *,
        price_sources (name)
      `)
      .eq('is_active', true)
      .order('confidence_score', { ascending: false })
      .limit(10);

    // Add category filter if we have categories
    if (searchCategories.length > 0) {
      query = query.in('category', searchCategories);
    }

    // Search by product name (case insensitive partial match)
    query = query.ilike('product_name', `%${searchTerm}%`);

    const { data: prices, error: pricesError } = await query;

    if (pricesError) {
      console.error('Error fetching prices:', pricesError);
      throw pricesError;
    }

    // Get regional adjustment
    const { data: regionalData } = await supabase
      .from('regional_adjustments')
      .select('adjustment_factor')
      .eq('region', region)
      .is('category', null)
      .maybeSingle();

    const adjustmentFactor = regionalData?.adjustment_factor || 1.0;

    // If no exact matches, try broader search
    if (!prices || prices.length === 0) {
      // Try without category filter
      const { data: broadPrices } = await supabase
        .from('market_prices')
        .select(`
          *,
          price_sources (name)
        `)
        .eq('is_active', true)
        .ilike('product_name', `%${searchTerm}%`)
        .order('confidence_score', { ascending: false })
        .limit(10);

      if (!broadPrices || broadPrices.length === 0) {
        // Return fallback response
        return new Response(
          JSON.stringify({
            found: false,
            price: 0,
            unit: 'each',
            confidence: 0,
            source: 'none',
            lastUpdated: new Date().toISOString(),
            message: 'No pricing data found for this product. Please enter price manually.'
          } as PriceLookupResponse),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use broad results
      const bestMatch = broadPrices[0];
      const adjustedPrice = Number(bestMatch.unit_price) * adjustmentFactor * quantity;

      return new Response(
        JSON.stringify({
          found: true,
          price: Number(bestMatch.unit_price),
          unit: bestMatch.unit,
          adjustedPrice: Math.round(adjustedPrice * 100) / 100,
          confidence: Number(bestMatch.confidence_score),
          source: bestMatch.price_sources?.name || 'Unknown',
          lastUpdated: bestMatch.last_updated,
          priceRange: bestMatch.min_price && bestMatch.max_price ? {
            min: Number(bestMatch.min_price),
            max: Number(bestMatch.max_price)
          } : undefined,
          alternatives: broadPrices.slice(1, 4).map(p => ({
            name: p.product_name,
            price: Number(p.unit_price),
            unit: p.unit
          }))
        } as PriceLookupResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Best match found
    const bestMatch = prices[0];
    const adjustedPrice = Number(bestMatch.unit_price) * adjustmentFactor * quantity;

    const response: PriceLookupResponse = {
      found: true,
      price: Number(bestMatch.unit_price),
      unit: bestMatch.unit,
      adjustedPrice: Math.round(adjustedPrice * 100) / 100,
      confidence: Number(bestMatch.confidence_score),
      source: bestMatch.price_sources?.name || 'Unknown',
      lastUpdated: bestMatch.last_updated,
      priceRange: bestMatch.min_price && bestMatch.max_price ? {
        min: Number(bestMatch.min_price),
        max: Number(bestMatch.max_price)
      } : undefined,
      alternatives: prices.slice(1, 4).map(p => ({
        name: p.product_name,
        price: Number(p.unit_price),
        unit: p.unit
      }))
    };

    console.log(`Found price: £${response.price}/${response.unit} (confidence: ${response.confidence})`);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-latest-price:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        found: false,
        price: 0,
        unit: 'each',
        confidence: 0,
        source: 'error',
        lastUpdated: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
