import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";
import { requireAdminOrService } from "../_shared/guard.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UK Construction material baseline prices (GBP) - regularly updated from industry sources
// These serve as fallback/baseline when live data is unavailable
const baselinePrices: Record<string, { price: number; unit: string; category: string; subcategory?: string }> = {
  // Plumbing
  '15mm copper pipe': { price: 8.50, unit: 'metre', category: 'plumbing', subcategory: 'pipes' },
  '22mm copper pipe': { price: 12.00, unit: 'metre', category: 'plumbing', subcategory: 'pipes' },
  '15mm compression fitting': { price: 2.50, unit: 'each', category: 'plumbing', subcategory: 'fittings' },
  '22mm compression fitting': { price: 4.00, unit: 'each', category: 'plumbing', subcategory: 'fittings' },
  '15mm isolation valve': { price: 6.50, unit: 'each', category: 'plumbing', subcategory: 'valves' },
  '22mm isolation valve': { price: 9.00, unit: 'each', category: 'plumbing', subcategory: 'valves' },
  'flexi tap connector': { price: 5.50, unit: 'each', category: 'plumbing', subcategory: 'connectors' },
  'ptfe tape': { price: 1.20, unit: 'roll', category: 'plumbing', subcategory: 'consumables' },
  'basin waste': { price: 8.00, unit: 'each', category: 'plumbing', subcategory: 'wastes' },
  'bath waste': { price: 15.00, unit: 'each', category: 'plumbing', subcategory: 'wastes' },
  'toilet pan connector': { price: 12.00, unit: 'each', category: 'plumbing', subcategory: 'connectors' },
  'radiator valve 15mm': { price: 8.50, unit: 'pair', category: 'plumbing', subcategory: 'valves' },
  'radiator valve trv': { price: 18.00, unit: 'each', category: 'plumbing', subcategory: 'valves' },
  
  // Electrical
  'twin and earth 2.5mm': { price: 65.00, unit: '100m', category: 'electrical', subcategory: 'cables' },
  'twin and earth 1.5mm': { price: 45.00, unit: '100m', category: 'electrical', subcategory: 'cables' },
  '6mm twin and earth': { price: 120.00, unit: '100m', category: 'electrical', subcategory: 'cables' },
  'consumer unit 10 way': { price: 85.00, unit: 'each', category: 'electrical', subcategory: 'distribution' },
  'mcb 6a type b': { price: 6.50, unit: 'each', category: 'electrical', subcategory: 'protection' },
  'mcb 16a type b': { price: 6.50, unit: 'each', category: 'electrical', subcategory: 'protection' },
  'mcb 32a type b': { price: 7.00, unit: 'each', category: 'electrical', subcategory: 'protection' },
  'rcbo 16a 30ma': { price: 28.00, unit: 'each', category: 'electrical', subcategory: 'protection' },
  'double socket outlet': { price: 4.50, unit: 'each', category: 'electrical', subcategory: 'accessories' },
  'single gang switch': { price: 2.50, unit: 'each', category: 'electrical', subcategory: 'accessories' },
  'downlight led 5w': { price: 8.00, unit: 'each', category: 'electrical', subcategory: 'lighting' },
  'ceiling rose': { price: 3.50, unit: 'each', category: 'electrical', subcategory: 'accessories' },
  'junction box 20a': { price: 2.00, unit: 'each', category: 'electrical', subcategory: 'accessories' },
  
  // Building/Construction
  'cement 25kg': { price: 6.50, unit: 'bag', category: 'building', subcategory: 'cement' },
  'sand sharp': { price: 45.00, unit: 'tonne', category: 'building', subcategory: 'aggregates' },
  'sand soft': { price: 42.00, unit: 'tonne', category: 'building', subcategory: 'aggregates' },
  'ballast': { price: 38.00, unit: 'tonne', category: 'building', subcategory: 'aggregates' },
  'brick facing': { price: 0.65, unit: 'each', category: 'building', subcategory: 'bricks' },
  'brick engineering': { price: 0.85, unit: 'each', category: 'building', subcategory: 'bricks' },
  'breeze block 100mm': { price: 1.50, unit: 'each', category: 'building', subcategory: 'blocks' },
  'breeze block 140mm': { price: 2.00, unit: 'each', category: 'building', subcategory: 'blocks' },
  'plasterboard 12.5mm': { price: 7.50, unit: 'sheet', category: 'building', subcategory: 'boards' },
  'plasterboard 15mm': { price: 9.00, unit: 'sheet', category: 'building', subcategory: 'boards' },
  'multifinish plaster 25kg': { price: 12.00, unit: 'bag', category: 'building', subcategory: 'plaster' },
  'bonding plite 25kg': { price: 10.50, unit: 'bag', category: 'building', subcategory: 'plaster' },
  
  // Timber
  'cls timber 38x63mm': { price: 2.80, unit: 'metre', category: 'timber', subcategory: 'structural' },
  'cls timber 38x89mm': { price: 3.50, unit: 'metre', category: 'timber', subcategory: 'structural' },
  'cls timber 47x75mm': { price: 4.20, unit: 'metre', category: 'timber', subcategory: 'structural' },
  'mdf 18mm': { price: 28.00, unit: 'sheet', category: 'timber', subcategory: 'boards' },
  'plywood 18mm': { price: 42.00, unit: 'sheet', category: 'timber', subcategory: 'boards' },
  'osb 18mm': { price: 25.00, unit: 'sheet', category: 'timber', subcategory: 'boards' },
  'skirting board mdf': { price: 2.50, unit: 'metre', category: 'timber', subcategory: 'mouldings' },
  'architrave mdf': { price: 1.80, unit: 'metre', category: 'timber', subcategory: 'mouldings' },
  
  // Roofing
  'roof tile concrete': { price: 0.85, unit: 'each', category: 'roofing', subcategory: 'tiles' },
  'roof tile clay': { price: 1.20, unit: 'each', category: 'roofing', subcategory: 'tiles' },
  'roofing felt': { price: 35.00, unit: 'roll', category: 'roofing', subcategory: 'underlays' },
  'ridge tile': { price: 4.50, unit: 'each', category: 'roofing', subcategory: 'accessories' },
  'lead flashing code 4': { price: 28.00, unit: 'metre', category: 'roofing', subcategory: 'flashings' },
  
  // HVAC
  'radiator 600x1000': { price: 85.00, unit: 'each', category: 'hvac', subcategory: 'radiators' },
  'radiator 600x1200': { price: 105.00, unit: 'each', category: 'hvac', subcategory: 'radiators' },
  'boiler flue': { price: 65.00, unit: 'each', category: 'hvac', subcategory: 'flues' },
  'expansion vessel 8l': { price: 35.00, unit: 'each', category: 'hvac', subcategory: 'vessels' },
  'filling loop': { price: 25.00, unit: 'each', category: 'hvac', subcategory: 'accessories' },
  
  // Painting/Decorating
  'emulsion paint white': { price: 22.00, unit: '5l', category: 'painting', subcategory: 'paints' },
  'gloss paint white': { price: 28.00, unit: '2.5l', category: 'painting', subcategory: 'paints' },
  'primer undercoat': { price: 18.00, unit: '2.5l', category: 'painting', subcategory: 'paints' },
  'filler powder': { price: 8.00, unit: '5kg', category: 'painting', subcategory: 'fillers' },
  'caulk decorators': { price: 3.50, unit: 'tube', category: 'painting', subcategory: 'sealants' },
  'sandpaper 120 grit': { price: 1.50, unit: 'sheet', category: 'painting', subcategory: 'abrasives' },
  
  // Landscaping
  'paving slab 450x450': { price: 3.50, unit: 'each', category: 'landscaping', subcategory: 'paving' },
  'block paving': { price: 0.45, unit: 'each', category: 'landscaping', subcategory: 'paving' },
  'fencing panel 6x6': { price: 35.00, unit: 'each', category: 'landscaping', subcategory: 'fencing' },
  'fence post 75x75': { price: 12.00, unit: 'each', category: 'landscaping', subcategory: 'fencing' },
  'gravel 20mm': { price: 45.00, unit: 'tonne', category: 'landscaping', subcategory: 'aggregates' },
  'topsoil': { price: 35.00, unit: 'tonne', category: 'landscaping', subcategory: 'soil' },
  
  // Fixings
  'screw 4x40': { price: 5.50, unit: '200pk', category: 'fixings', subcategory: 'screws' },
  'screw 5x50': { price: 6.50, unit: '200pk', category: 'fixings', subcategory: 'screws' },
  'wall plug brown': { price: 2.50, unit: '100pk', category: 'fixings', subcategory: 'plugs' },
  'nail round wire': { price: 4.50, unit: '500g', category: 'fixings', subcategory: 'nails' },
  'bracket heavy duty': { price: 3.50, unit: 'each', category: 'fixings', subcategory: 'brackets' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  const denied = await requireAdminOrService(req, corsHeaders);
  if (denied) return denied;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting price index update...');

    // Get the baseline source ID
    const { data: baselineSource } = await supabase
      .from('price_sources')
      .select('id')
      .eq('name', 'GOV.UK Building Materials')
      .single();

    const sourceId = baselineSource?.id;

    // Update or insert baseline prices
    let updated = 0;
    let inserted = 0;

    for (const [productName, data] of Object.entries(baselinePrices)) {
      // Check if price exists
      const { data: existing } = await supabase
        .from('market_prices')
        .select('id, unit_price')
        .eq('product_name', productName)
        .maybeSingle();

      if (existing) {
        // Update if price has changed significantly (>5%)
        const priceDiff = Math.abs(Number(existing.unit_price) - data.price) / data.price;
        if (priceDiff > 0.05) {
          // Record history
          await supabase.from('price_history').insert({
            market_price_id: existing.id,
            price: data.price,
            source_id: sourceId,
          });

          // Update price
          await supabase
            .from('market_prices')
            .update({
              unit_price: data.price,
              last_updated: new Date().toISOString(),
            })
            .eq('id', existing.id);

          updated++;
        }
      } else {
        // Insert new price
        await supabase.from('market_prices').insert({
          product_name: productName,
          category: data.category,
          subcategory: data.subcategory,
          unit: data.unit,
          unit_price: data.price,
          source_id: sourceId,
          region: 'UK',
          confidence_score: 0.85, // High confidence for baseline prices
          is_active: true,
        });
        inserted++;
      }
    }

    // Update source status
    await supabase
      .from('price_sources')
      .update({
        last_fetch_at: new Date().toISOString(),
        last_fetch_status: 'success',
      })
      .eq('id', sourceId);

    console.log(`Price index update complete: ${inserted} inserted, ${updated} updated`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Price index updated: ${inserted} new prices, ${updated} updated`,
        inserted,
        updated,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error updating price index:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
