import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Product categories with typical UK trade items - expanded catalog
const productCatalog = {
  plumbing: [
    { name: '15mm copper pipe', unit: 'metre', basePrice: 8.50 },
    { name: '22mm copper pipe', unit: 'metre', basePrice: 12.00 },
    { name: '28mm copper pipe', unit: 'metre', basePrice: 18.00 },
    { name: '15mm speedfit pipe', unit: 'metre', basePrice: 3.50 },
    { name: '22mm speedfit pipe', unit: 'metre', basePrice: 5.50 },
    { name: '15mm compression elbow', unit: 'each', basePrice: 3.50 },
    { name: '15mm compression tee', unit: 'each', basePrice: 4.50 },
    { name: '22mm compression elbow', unit: 'each', basePrice: 5.50 },
    { name: '22mm compression tee', unit: 'each', basePrice: 6.50 },
    { name: '15mm gate valve', unit: 'each', basePrice: 12.00 },
    { name: '22mm gate valve', unit: 'each', basePrice: 18.00 },
    { name: '110mm soil pipe', unit: 'metre', basePrice: 15.00 },
    { name: '40mm waste pipe', unit: 'metre', basePrice: 4.50 },
    { name: 'basin tap', unit: 'each', basePrice: 35.00 },
    { name: 'bath tap', unit: 'pair', basePrice: 65.00 },
    { name: 'shower mixer valve', unit: 'each', basePrice: 85.00 },
    { name: 'toilet cistern', unit: 'each', basePrice: 55.00 },
    { name: 'toilet pan close coupled', unit: 'each', basePrice: 120.00 },
    { name: 'basin pedestal', unit: 'each', basePrice: 85.00 },
    { name: 'bath standard', unit: 'each', basePrice: 180.00 },
    { name: 'immersion heater element', unit: 'each', basePrice: 32.00 },
    { name: 'flexible tap connector', unit: 'each', basePrice: 6.50 },
    { name: 'isolation valve 15mm', unit: 'each', basePrice: 4.50 },
  ],
  electrical: [
    { name: '2.5mm twin and earth', unit: '100m', basePrice: 65.00 },
    { name: '1.5mm twin and earth', unit: '100m', basePrice: 45.00 },
    { name: '6mm twin and earth', unit: '100m', basePrice: 120.00 },
    { name: '10mm twin and earth', unit: '100m', basePrice: 180.00 },
    { name: 'consumer unit 6 way', unit: 'each', basePrice: 65.00 },
    { name: 'consumer unit 12 way', unit: 'each', basePrice: 110.00 },
    { name: 'mcb 6a', unit: 'each', basePrice: 6.50 },
    { name: 'mcb 16a', unit: 'each', basePrice: 6.50 },
    { name: 'mcb 32a', unit: 'each', basePrice: 7.00 },
    { name: 'mcb 40a', unit: 'each', basePrice: 8.00 },
    { name: 'rcbo 16a', unit: 'each', basePrice: 28.00 },
    { name: 'rcbo 32a', unit: 'each', basePrice: 30.00 },
    { name: 'double socket white', unit: 'each', basePrice: 4.50 },
    { name: 'double socket chrome', unit: 'each', basePrice: 12.00 },
    { name: 'single switch white', unit: 'each', basePrice: 2.50 },
    { name: 'dimmer switch', unit: 'each', basePrice: 15.00 },
    { name: 'downlight gu10', unit: 'each', basePrice: 8.00 },
    { name: 'led bulb 5w', unit: 'each', basePrice: 4.00 },
    { name: 'outside light pir', unit: 'each', basePrice: 25.00 },
    { name: 'smoke alarm mains', unit: 'each', basePrice: 22.00 },
    { name: 'fused connection unit', unit: 'each', basePrice: 8.50 },
    { name: 'metal back box', unit: 'each', basePrice: 1.80 },
  ],
  building: [
    { name: 'cement 25kg bag', unit: 'bag', basePrice: 6.50 },
    { name: 'postcrete 20kg', unit: 'bag', basePrice: 8.00 },
    { name: 'sharp sand bulk bag', unit: 'bag', basePrice: 55.00 },
    { name: 'building sand bulk bag', unit: 'bag', basePrice: 52.00 },
    { name: 'ballast bulk bag', unit: 'bag', basePrice: 48.00 },
    { name: 'facing brick', unit: 'each', basePrice: 0.65 },
    { name: 'engineering brick', unit: 'each', basePrice: 0.85 },
    { name: 'concrete block 100mm', unit: 'each', basePrice: 1.50 },
    { name: 'concrete block 140mm', unit: 'each', basePrice: 2.00 },
    { name: 'thermalite block', unit: 'each', basePrice: 3.50 },
    { name: 'lintel 1200mm', unit: 'each', basePrice: 35.00 },
    { name: 'lintel 1800mm', unit: 'each', basePrice: 55.00 },
    { name: 'dpm 4m wide', unit: 'metre', basePrice: 2.50 },
    { name: 'cavity closer', unit: 'metre', basePrice: 4.50 },
    { name: 'wall ties', unit: '250pk', basePrice: 18.00 },
    { name: 'plasterboard 12.5mm', unit: 'sheet', basePrice: 8.50 },
    { name: 'bonding coat 25kg', unit: 'bag', basePrice: 12.00 },
    { name: 'multi finish 25kg', unit: 'bag', basePrice: 14.00 },
  ],
  timber: [
    { name: 'cls 38x63mm', unit: 'metre', basePrice: 2.80 },
    { name: 'cls 38x89mm', unit: 'metre', basePrice: 3.50 },
    { name: 'cls 47x75mm', unit: 'metre', basePrice: 4.20 },
    { name: 'cls 47x100mm', unit: 'metre', basePrice: 5.50 },
    { name: 'treated batten 25x50mm', unit: 'metre', basePrice: 1.20 },
    { name: 'treated batten 50x50mm', unit: 'metre', basePrice: 2.00 },
    { name: 'mdf 18mm 2440x1220', unit: 'sheet', basePrice: 28.00 },
    { name: 'mdf 12mm 2440x1220', unit: 'sheet', basePrice: 22.00 },
    { name: 'plywood 18mm 2440x1220', unit: 'sheet', basePrice: 42.00 },
    { name: 'plywood 12mm 2440x1220', unit: 'sheet', basePrice: 32.00 },
    { name: 'osb 18mm 2440x1220', unit: 'sheet', basePrice: 25.00 },
    { name: 'chipboard 18mm 2440x1220', unit: 'sheet', basePrice: 18.00 },
    { name: 'skirting mdf 120mm', unit: 'metre', basePrice: 2.80 },
    { name: 'architrave mdf 70mm', unit: 'metre', basePrice: 1.80 },
    { name: 'softwood door lining', unit: 'set', basePrice: 25.00 },
  ],
  hvac: [
    { name: 'radiator 400x600', unit: 'each', basePrice: 45.00 },
    { name: 'radiator 600x800', unit: 'each', basePrice: 65.00 },
    { name: 'radiator 600x1000', unit: 'each', basePrice: 85.00 },
    { name: 'radiator 600x1200', unit: 'each', basePrice: 105.00 },
    { name: 'radiator 600x1600', unit: 'each', basePrice: 145.00 },
    { name: 'trv valve 15mm', unit: 'each', basePrice: 18.00 },
    { name: 'lockshield valve', unit: 'each', basePrice: 6.50 },
    { name: 'expansion vessel 8l', unit: 'each', basePrice: 35.00 },
    { name: 'expansion vessel 12l', unit: 'each', basePrice: 45.00 },
    { name: 'filling loop', unit: 'each', basePrice: 25.00 },
    { name: 'system filter', unit: 'each', basePrice: 85.00 },
    { name: 'flue pipe 60/100', unit: 'metre', basePrice: 45.00 },
    { name: 'flue terminal', unit: 'each', basePrice: 55.00 },
    { name: 'programmer 2 channel', unit: 'each', basePrice: 45.00 },
    { name: 'room thermostat', unit: 'each', basePrice: 25.00 },
    { name: 'condensate pipe 22mm', unit: 'metre', basePrice: 3.50 },
    { name: 'gas flex connector', unit: 'each', basePrice: 18.00 },
  ],
  roofing: [
    { name: 'concrete roof tile', unit: 'each', basePrice: 0.85 },
    { name: 'clay roof tile', unit: 'each', basePrice: 1.20 },
    { name: 'slate natural', unit: 'each', basePrice: 2.50 },
    { name: 'slate artificial', unit: 'each', basePrice: 1.50 },
    { name: 'ridge tile half round', unit: 'each', basePrice: 4.50 },
    { name: 'dry ridge kit', unit: 'kit', basePrice: 85.00 },
    { name: 'roofing felt type 1f', unit: 'roll', basePrice: 35.00 },
    { name: 'breathable membrane', unit: 'roll', basePrice: 65.00 },
    { name: 'lead flashing code 3', unit: 'metre', basePrice: 22.00 },
    { name: 'lead flashing code 4', unit: 'metre', basePrice: 28.00 },
    { name: 'lead flashing code 5', unit: 'metre', basePrice: 35.00 },
    { name: 'gutter round 112mm', unit: 'metre', basePrice: 6.50 },
    { name: 'gutter square 114mm', unit: 'metre', basePrice: 7.50 },
    { name: 'downpipe round 68mm', unit: 'metre', basePrice: 5.50 },
    { name: 'fascia board upvc', unit: 'metre', basePrice: 12.00 },
    { name: 'soffit board upvc', unit: 'metre', basePrice: 10.00 },
  ],
  landscaping: [
    { name: 'paving slab 450x450 grey', unit: 'each', basePrice: 3.50 },
    { name: 'paving slab 600x600 grey', unit: 'each', basePrice: 5.50 },
    { name: 'block paving 200x100', unit: 'each', basePrice: 0.45 },
    { name: 'edging kerb', unit: 'metre', basePrice: 4.50 },
    { name: 'fence panel 6x5', unit: 'each', basePrice: 28.00 },
    { name: 'fence panel 6x6', unit: 'each', basePrice: 35.00 },
    { name: 'fence post 75x75x2400', unit: 'each', basePrice: 12.00 },
    { name: 'fence post 100x100x2400', unit: 'each', basePrice: 18.00 },
    { name: 'gravel 20mm decorative', unit: 'bulk bag', basePrice: 65.00 },
    { name: 'topsoil screened', unit: 'bulk bag', basePrice: 55.00 },
    { name: 'membrane weed control', unit: 'roll', basePrice: 25.00 },
    { name: 'sleeper softwood new', unit: 'each', basePrice: 28.00 },
    { name: 'trellis panel 6x2', unit: 'each', basePrice: 18.00 },
    { name: 'post cap', unit: 'each', basePrice: 3.50 },
  ],
  painting: [
    { name: 'emulsion matt white 10l', unit: 'tin', basePrice: 35.00 },
    { name: 'emulsion silk white 10l', unit: 'tin', basePrice: 38.00 },
    { name: 'gloss brilliant white 2.5l', unit: 'tin', basePrice: 28.00 },
    { name: 'satinwood white 2.5l', unit: 'tin', basePrice: 32.00 },
    { name: 'primer undercoat 2.5l', unit: 'tin', basePrice: 18.00 },
    { name: 'wood stain 2.5l', unit: 'tin', basePrice: 22.00 },
    { name: 'fence treatment 5l', unit: 'tin', basePrice: 15.00 },
    { name: 'masonry paint 10l', unit: 'tin', basePrice: 45.00 },
    { name: 'filler powder 5kg', unit: 'bag', basePrice: 8.00 },
    { name: 'filler ready mixed 1l', unit: 'tub', basePrice: 6.50 },
    { name: 'caulk decorators 310ml', unit: 'tube', basePrice: 3.50 },
    { name: 'sandpaper pack assorted', unit: 'pack', basePrice: 5.50 },
    { name: 'dust sheet heavy duty', unit: 'each', basePrice: 8.00 },
    { name: 'masking tape 48mm', unit: 'roll', basePrice: 4.50 },
  ],
  // Commercial Catering Equipment
  catering: [
    { name: 'Rational combi oven 6 grid', unit: 'each', basePrice: 8500.00 },
    { name: 'Rational combi oven 10 grid', unit: 'each', basePrice: 12500.00 },
    { name: 'Rational combi oven 20 grid', unit: 'each', basePrice: 18500.00 },
    { name: 'Hobart dishwasher hood type', unit: 'each', basePrice: 4500.00 },
    { name: 'Hobart dishwasher pass through', unit: 'each', basePrice: 6500.00 },
    { name: 'Winterhalter undercounter dishwasher', unit: 'each', basePrice: 3200.00 },
    { name: 'Winterhalter rack conveyor', unit: 'each', basePrice: 18000.00 },
    { name: 'commercial fryer double', unit: 'each', basePrice: 850.00 },
    { name: 'commercial griddle 600mm', unit: 'each', basePrice: 650.00 },
    { name: 'commercial griddle 900mm', unit: 'each', basePrice: 950.00 },
    { name: 'bain marie 3 pot', unit: 'each', basePrice: 280.00 },
    { name: 'bain marie 4 pot', unit: 'each', basePrice: 350.00 },
    { name: 'salamander grill', unit: 'each', basePrice: 420.00 },
    { name: 'commercial microwave 1000w', unit: 'each', basePrice: 380.00 },
    { name: 'commercial microwave 1800w', unit: 'each', basePrice: 650.00 },
    { name: 'blast chiller 5 tray', unit: 'each', basePrice: 2800.00 },
    { name: 'walk in cold room panel', unit: 'sqm', basePrice: 185.00 },
    { name: 'cold room refrigeration unit', unit: 'each', basePrice: 1450.00 },
    { name: 'extraction canopy stainless', unit: 'metre', basePrice: 420.00 },
    { name: 'gas interlock system', unit: 'each', basePrice: 380.00 },
    { name: 'ansul fire suppression', unit: 'system', basePrice: 2200.00 },
    { name: 'stainless prep table 1200', unit: 'each', basePrice: 285.00 },
    { name: 'stainless prep table 1800', unit: 'each', basePrice: 385.00 },
    { name: 'commercial sink double bowl', unit: 'each', basePrice: 420.00 },
    { name: 'grease trap 50l', unit: 'each', basePrice: 180.00 },
    { name: 'grease trap 100l', unit: 'each', basePrice: 320.00 },
  ],
  // Automotive
  automotive: [
    { name: 'engine oil 5w30 5l', unit: 'container', basePrice: 32.00 },
    { name: 'engine oil 10w40 5l', unit: 'container', basePrice: 28.00 },
    { name: 'brake fluid dot4 1l', unit: 'bottle', basePrice: 12.00 },
    { name: 'coolant antifreeze 5l', unit: 'container', basePrice: 18.00 },
    { name: 'brake pads front set', unit: 'set', basePrice: 45.00 },
    { name: 'brake pads rear set', unit: 'set', basePrice: 38.00 },
    { name: 'brake disc front', unit: 'each', basePrice: 55.00 },
    { name: 'brake disc rear', unit: 'each', basePrice: 48.00 },
    { name: 'oil filter universal', unit: 'each', basePrice: 8.50 },
    { name: 'air filter universal', unit: 'each', basePrice: 15.00 },
    { name: 'cabin filter', unit: 'each', basePrice: 12.00 },
    { name: 'spark plug ngk', unit: 'each', basePrice: 6.50 },
    { name: 'battery 12v 60ah', unit: 'each', basePrice: 85.00 },
    { name: 'battery 12v 75ah', unit: 'each', basePrice: 110.00 },
    { name: 'alternator reconditioned', unit: 'each', basePrice: 145.00 },
    { name: 'starter motor reconditioned', unit: 'each', basePrice: 125.00 },
    { name: 'timing belt kit', unit: 'kit', basePrice: 85.00 },
    { name: 'water pump', unit: 'each', basePrice: 45.00 },
    { name: 'thermostat housing', unit: 'each', basePrice: 28.00 },
    { name: 'clutch kit 3 piece', unit: 'kit', basePrice: 165.00 },
    { name: 'wheel bearing front', unit: 'each', basePrice: 38.00 },
    { name: 'cv joint boot kit', unit: 'kit', basePrice: 18.00 },
    { name: 'shock absorber front', unit: 'each', basePrice: 55.00 },
    { name: 'shock absorber rear', unit: 'each', basePrice: 48.00 },
  ],
  // Marine
  marine: [
    { name: 'antifoul paint 2.5l', unit: 'tin', basePrice: 85.00 },
    { name: 'marine varnish 1l', unit: 'tin', basePrice: 32.00 },
    { name: 'epoxy resin kit 1kg', unit: 'kit', basePrice: 45.00 },
    { name: 'fibreglass mat csm', unit: 'sqm', basePrice: 8.50 },
    { name: 'gelcoat white 1kg', unit: 'tin', basePrice: 28.00 },
    { name: 'marine sealant sikaflex', unit: 'tube', basePrice: 12.00 },
    { name: 'stainless fitting clevis pin', unit: 'each', basePrice: 4.50 },
    { name: 'stainless shackle 8mm', unit: 'each', basePrice: 6.50 },
    { name: 'rope 10mm braid', unit: 'metre', basePrice: 2.80 },
    { name: 'rope 12mm braid', unit: 'metre', basePrice: 3.50 },
    { name: 'marine battery 12v 110ah', unit: 'each', basePrice: 185.00 },
    { name: 'bilge pump 1100gph', unit: 'each', basePrice: 45.00 },
    { name: 'navigation light led', unit: 'each', basePrice: 35.00 },
    { name: 'anode zinc hull', unit: 'each', basePrice: 18.00 },
    { name: 'seacock 1 inch', unit: 'each', basePrice: 65.00 },
  ],
  // Flooring
  flooring: [
    { name: 'laminate flooring 8mm oak', unit: 'sqm', basePrice: 12.00 },
    { name: 'laminate flooring 12mm oak', unit: 'sqm', basePrice: 18.00 },
    { name: 'engineered wood 14mm', unit: 'sqm', basePrice: 35.00 },
    { name: 'solid oak flooring 18mm', unit: 'sqm', basePrice: 55.00 },
    { name: 'underlay laminate 3mm', unit: 'sqm', basePrice: 2.50 },
    { name: 'underlay acoustic 5mm', unit: 'sqm', basePrice: 4.50 },
    { name: 'carpet budget grade', unit: 'sqm', basePrice: 8.50 },
    { name: 'carpet mid range', unit: 'sqm', basePrice: 18.00 },
    { name: 'carpet underlay 10mm', unit: 'sqm', basePrice: 4.00 },
    { name: 'vinyl flooring sheet', unit: 'sqm', basePrice: 12.00 },
    { name: 'lvt luxury vinyl tile', unit: 'sqm', basePrice: 25.00 },
    { name: 'floor tile porcelain 600x600', unit: 'sqm', basePrice: 28.00 },
    { name: 'floor tile ceramic 300x300', unit: 'sqm', basePrice: 15.00 },
    { name: 'tile adhesive flexible 20kg', unit: 'bag', basePrice: 22.00 },
    { name: 'tile grout 5kg', unit: 'bag', basePrice: 12.00 },
    { name: 'self levelling compound 25kg', unit: 'bag', basePrice: 28.00 },
    { name: 'door threshold strip', unit: 'each', basePrice: 8.50 },
    { name: 'scotia beading 2.4m', unit: 'length', basePrice: 3.50 },
  ],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { category } = await req.json().catch(() => ({ category: null }));

    console.log(`Fetching market prices${category ? ` for category: ${category}` : ' (all categories)'}`);

    // Get the merchant feed source
    const { data: merchantSource } = await supabase
      .from('price_sources')
      .select('id')
      .eq('name', 'Quotable Reference Prices')
      .single();

    const sourceId = merchantSource?.id;

    let totalInserted = 0;
    let totalUpdated = 0;

    // Process each category or specific category
    const categoriesToProcess = category 
      ? { [category]: productCatalog[category as keyof typeof productCatalog] }
      : productCatalog;

    for (const [cat, products] of Object.entries(categoriesToProcess)) {
      if (!products) continue;

      for (const product of products) {
        // Reference estimates only — no simulated "market fluctuation".
        // Real prices come from scraped supplier pages (process-crawl-queue,
        // get-realtime-price); these fill gaps and are shown as estimates.
        const price = Math.round(product.basePrice * 100) / 100;

        // Check if product exists
        const { data: existing } = await supabase
          .from('market_prices')
          .select('id, unit_price')
          .eq('product_name', product.name)
          .eq('category', cat)
          .maybeSingle();

        if (existing) {
          // Record history if price changed
          const priceDiff = Math.abs(Number(existing.unit_price) - price) / price;
          if (priceDiff > 0.02) { // >2% change
            await supabase.from('price_history').insert({
              market_price_id: existing.id,
              price: price,
              source_id: sourceId,
            });

            await supabase
              .from('market_prices')
              .update({
                unit_price: price,
                min_price: Math.min(Number(existing.unit_price), price),
                max_price: Math.max(Number(existing.unit_price), price),
                last_updated: new Date().toISOString(),
                confidence_score: 0.80,
              })
              .eq('id', existing.id);

            totalUpdated++;
          }
        } else {
          // Insert new product
          await supabase.from('market_prices').insert({
            product_name: product.name,
            category: cat,
            unit: product.unit,
            unit_price: price,
            min_price: price * 0.95,
            max_price: price * 1.05,
            source_id: sourceId,
            region: 'UK',
            confidence_score: 0.80,
            is_active: true,
          });

          totalInserted++;
        }
      }
    }

    // Update source status
    if (sourceId) {
      await supabase
        .from('price_sources')
        .update({
          last_fetch_at: new Date().toISOString(),
          last_fetch_status: 'success',
        })
        .eq('id', sourceId);
    }

    console.log(`Market prices fetch complete: ${totalInserted} inserted, ${totalUpdated} updated`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Market prices updated: ${totalInserted} new, ${totalUpdated} updated`,
        inserted: totalInserted,
        updated: totalUpdated,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching market prices:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
