import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { chat, parseJsonReply, AIError } from "../_shared/ai.ts";
import {
  detectTradeCategory,
  getDefaultLabourRate,
  getComplianceRules,
  getSystemPrompt,
  validateAndEnhanceQuote,
  LIVE_LOOKUP_LIMIT,
  applyPricingToQuote,
  type PricingOptions,
} from "../_shared/quote-engine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const quoteRequestSchema = z.object({
  jobDescription: z.string().min(10, "Job description must be at least 10 characters").max(2000, "Job description too long"),
  location: z.string().min(2, "Location required").max(200, "Location too long"),
  category: z.string().min(2, "Category required").max(100, "Category too long"),
  paymentType: z.enum(["hourly", "day", "job"], { errorMap: () => ({ message: "Payment type must be 'hourly', 'day', or 'job'" }) }),
  hourlyRate: z.number().min(1).max(1000).optional().nullable(),
  dayRate: z.number().min(1).max(5000).optional().nullable(),
  equipmentRental: z.boolean(),
  equipmentRentalDetails: z.string().optional().nullable(),
  numWorkers: z.number().int().min(1, "At least 1 worker required").max(100, "Maximum 100 workers allowed"),
  adjustmentMode: z.boolean().optional(),
  adjustmentPrompt: z.string().optional(),
  currentQuote: z.any().optional(),
  quoteGenerationMode: z.enum(["minimal", "detailed"]).optional(),
  skipAiPricing: z.boolean().optional(),
  requireVerifiedPrices: z.boolean().optional(),
  tradeProfile: z.object({
    primaryTrade: z.string().optional().nullable(),
    businessType: z.string().optional().nullable(),
    typicalJobSize: z.string().optional().nullable(),
    specializations: z.array(z.string()).optional().nullable(),
    certifications: z.array(z.string()).optional().nullable(),
    tradeNotes: z.string().optional().nullable(),
    otherTradeName: z.string().optional().nullable(),
    otherTradeDescription: z.string().optional().nullable(),
    otherTradeSimilarTo: z.string().optional().nullable(),
    preferredSuppliers: z.array(z.string()).optional().nullable(),
  }).optional().nullable(),
  inventory: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string().optional().nullable(),
    unit: z.string(),
    unit_price: z.number()
  })).optional()
});

// The tradesperson's commercial settings, read server-side so they can't be spoofed.
const loadPricingOptions = async (supabase: any, userId: string): Promise<PricingOptions> => {
  const { data } = await supabase
    .from('app_settings')
    .select('include_vat, material_markup_percent, trade_discount_percent, charge_whole_packs, hours_per_day, overhead_rates')
    .eq('user_id', userId)
    .maybeSingle();
  return {
    vatRegistered: data?.include_vat ?? true,
    materialMarkupPercent: Number(data?.material_markup_percent) || 0,
    tradeDiscountPercent: Number(data?.trade_discount_percent) || 0,
    chargeWholePacks: !!data?.charge_whole_packs,
    hoursPerDay: Number(data?.hours_per_day) || 8,
    overheadRates: data?.overhead_rates && typeof data.overhead_rates === 'object' ? data.overhead_rates : {},
  };
};

// ═══════════════════════════════════════════════════════════════════
// MAIN REQUEST HANDLER
// ═══════════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const rawBody = await req.json();
    const validated = quoteRequestSchema.parse(rawBody);
    const { 
      jobDescription, location, category, paymentType, hourlyRate, dayRate,
      equipmentRental, numWorkers, adjustmentMode, adjustmentPrompt, 
      currentQuote, quoteGenerationMode = 'minimal', skipAiPricing = false, tradeProfile, inventory = [] 
    } = validated;
    

    console.log("Generating quote for:", { jobDescription: jobDescription.slice(0, 50), location, category, paymentType, numWorkers });

    // Fetch ALL market prices for backend pricing
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const fetchAllMarketPricesForMatching = async () => {
      const pageSize = 1000;
      const all: any[] = [];
      let from = 0;

      while (true) {
        const { data, error } = await supabaseService
          .from('market_prices')
          .select('product_name, unit, unit_price, confidence_score, source_id, product_url, price_sources(name, source_type)')
          .eq('is_active', true)
          .not('source_id', 'is', null) // CRITICAL: Only fetch verified supplier data
          .order('confidence_score', { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        all.push(...data);
        if (data.length < pageSize) break;

        from += pageSize;
        if (from >= 20000) break; // safety cap
      }

      return all;
    };

    const allPricesForMatching = await fetchAllMarketPricesForMatching();
    resetLiveLookups();

    const { data: unsourcedRows } = await supabaseService
      .from('market_prices')
      .select('product_name, unit, unit_price, confidence_score')
      .eq('is_active', true)
      .is('source_id', null)
      .limit(5000);
    // Rows from our own reference list are estimates, not supplier prices.
    const isReference = (p: any) => p.price_sources?.source_type === 'reference';
    const referenceRows = [...(unsourcedRows || []), ...(allPricesForMatching || []).filter(isReference)];
    setReferencePrices(referenceRows.map((p: any) => ({
      product_name: p.product_name,
      unit: p.unit,
      unit_price: Number(p.unit_price),
      confidence_score: 0.5,
      source_name: 'Estimated',
      product_url: null,
    })));

    const allPricesFlat = (allPricesForMatching || []).filter((p: any) => !isReference(p)).map((p: any) => ({
      product_name: p.product_name,
      unit: p.unit,
      unit_price: p.unit_price,
      confidence_score: p.confidence_score,
      source_name: p.price_sources?.name || 'Market',
      product_url: p.product_url || null // Include direct product URL
    }));
    console.log(`Loaded ${allPricesFlat.length} market prices for backend pricing`);

    // Build system prompt and user content
    let systemPrompt: string;
    let userContent: string;

    if (adjustmentMode && currentQuote && adjustmentPrompt) {
      systemPrompt = getSystemPrompt(quoteGenerationMode, tradeProfile, inventory) + `

═════════════════════════════════════════════════════════════════════
ADJUSTMENT MODE
═════════════════════════════════════════════════════════════════════
You are adjusting an existing quote. Apply the user's requested changes.
Current quote structure:
${JSON.stringify(currentQuote, null, 2)}

Apply the adjustment: "${adjustmentPrompt}"
Return the updated structure with the same format (no prices).`;
      
      userContent = `Adjust this quote: ${adjustmentPrompt}`;
    } else {
      systemPrompt = getSystemPrompt(quoteGenerationMode, tradeProfile, inventory);
      
      userContent = `Generate the structured quote for:
Job: ${jobDescription}
Location: ${location}
Category: ${category}
Workers: ${numWorkers}
${equipmentRental ? 'Equipment rental is required.' : ''}

Return ONLY the JSON structure with materials, optional_materials, labour, overheads, and suggested_overheads. NO PRICES.`;
    }

    const parseAIResponse = (content: string, attemptNumber: number): any => {
      console.log(`Attempt ${attemptNumber} - Raw AI response:`, content.substring(0, 300) + "...");
      const aiResponse = parseJsonReply(content);

      // Validate structure
      if (!Array.isArray(aiResponse.materials)) throw new Error("Missing or invalid 'materials' array");
      if (!Array.isArray(aiResponse.labour)) throw new Error("Missing or invalid 'labour' array");
      if (!Array.isArray(aiResponse.overheads)) throw new Error("Missing or invalid 'overheads' array");
      if (!Array.isArray(aiResponse.optional_materials)) aiResponse.optional_materials = [];
      if (!Array.isArray(aiResponse.suggested_overheads)) aiResponse.suggested_overheads = [];
      return aiResponse;
    };

    const askAI = (retryAttempt: number) => chat({
      json: true,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt + (retryAttempt > 0 ? "\n\nIMPORTANT: Return ONLY valid JSON with ALL required arrays (materials, optional_materials, labour, overheads, suggested_overheads). NO prices, NO explanations." : "") },
        { role: "user", content: userContent },
      ],
    });

    let aiResponse;
    try {
      try {
        aiResponse = parseAIResponse((await askAI(0)).content, 1);
      } catch (firstError) {
        if (firstError instanceof AIError) throw firstError;
        console.log("First attempt returned bad JSON, retrying...", firstError);
        aiResponse = parseAIResponse((await askAI(1)).content, 2);
      }
    } catch (err) {
      if (err instanceof AIError && err.status === 429) {
        return new Response(
          JSON.stringify({ error: "The AI is busy right now. Please try again in a minute." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI quote generation failed:", err);
      throw new Error(`Failed to generate quote: ${err instanceof Error ? err.message : 'Invalid AI response'}`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 2: VALIDATION & SAFETY INJECTION
    // ═══════════════════════════════════════════════════════════════════
    
    // Get compliance rules for this trade/job
    const complianceRules = await getComplianceRules(
      supabaseService, 
      tradeProfile?.primaryTrade || category,
      jobDescription
    );
    
    // Validate and enhance the AI response with missing safety items
    const validationResult = validateAndEnhanceQuote(
      aiResponse,
      jobDescription,
      tradeProfile?.primaryTrade || category,
      complianceRules
    );
    
    // Inject missing materials and labour tasks
    if (validationResult.injectedMaterials.length > 0) {
      aiResponse.materials = [...(aiResponse.materials || []), ...validationResult.injectedMaterials];
    }
    if (validationResult.injectedLabour.length > 0) {
      aiResponse.labour = [...(aiResponse.labour || []), ...validationResult.injectedLabour];
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // EMPTY MATERIALS GUARD - Ensure quotes always have materials
    // ═══════════════════════════════════════════════════════════════════
    if (!aiResponse.materials || aiResponse.materials.length === 0) {
      console.log(`⚠ Empty materials array detected - applying fallback`);
      
      // First, try to move items from optional_materials
      if (aiResponse.optional_materials && aiResponse.optional_materials.length > 0) {
        const itemsToMove = aiResponse.optional_materials.slice(0, 3);
        aiResponse.materials = itemsToMove;
        aiResponse.optional_materials = aiResponse.optional_materials.slice(3);
        console.log(`  Moved ${itemsToMove.length} items from optional_materials to materials`);
      }
      
      // If still empty, inject generic essentials based on trade category
      if (aiResponse.materials.length === 0) {
        const tradeCategory = detectTradeCategory(tradeProfile?.primaryTrade || category);
        
        const FALLBACK_MATERIALS: Record<string, any[]> = {
          'plumbing': [
            { name: 'PTFE tape', quantity: 1, unit: 'roll' },
            { name: 'Pipe clips', quantity: 4, unit: 'pack' },
            { name: 'Plumber\'s putty', quantity: 1, unit: 'tub' }
          ],
          'electrical': [
            { name: 'Cable clips', quantity: 1, unit: 'pack' },
            { name: 'Junction box', quantity: 1, unit: 'each' },
            { name: 'Electrical tape', quantity: 1, unit: 'roll' }
          ],
          'building': [
            { name: 'General fixings pack', quantity: 1, unit: 'pack' },
            { name: 'Dust sheets', quantity: 2, unit: 'each' },
            { name: 'Silicone sealant', quantity: 1, unit: 'tube' }
          ],
          'general': [
            { name: 'Consumables & sundries pack', quantity: 1, unit: 'pack' },
            { name: 'PPE & protection items', quantity: 1, unit: 'set' },
            { name: 'General fixings', quantity: 1, unit: 'pack' }
          ]
        };
        
        aiResponse.materials = FALLBACK_MATERIALS[tradeCategory] || FALLBACK_MATERIALS['general'];
        console.log(`  Injected ${aiResponse.materials.length} fallback materials for ${tradeCategory} trade`);
      }
    }
    
    // Log validation issues (non-blocking, just informational)
    if (validationResult.issues.length > 0) {
      console.log(`⚠ Validation issues: ${validationResult.issues.join(', ')}`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 3: BACKEND PRICING (or skip if user wants to add their own)
    // ═══════════════════════════════════════════════════════════════════
    
    let pricedQuote;
    
    if (skipAiPricing) {
      // Skip AI pricing - return structure with empty prices for manual entry
      console.log("Skip AI pricing mode enabled - returning structure without prices");
      
      const materialsWithEmptyPrices = (aiResponse.materials || []).map((m: any) => ({
        ...m,
        unitPrice: 0,
        cost: 0,
        priceSource: "Add your price",
        priceConfidence: 0,
        supplierUrl: null,
        badge: null,
        badgeConfidence: 0
      }));
      
      const optionalMaterialsWithEmptyPrices = (aiResponse.optional_materials || []).map((m: any) => ({
        ...m,
        unitPrice: 0,
        cost: 0,
        priceSource: "Add your price",
        priceConfidence: 0,
        supplierUrl: null,
        badge: null,
        badgeConfidence: 0
      }));
      
      // For labour, still apply the user's configured rates (day rate or hourly rate)
      // since they've already set these - only material prices should be empty
      let labourWithRates: any[];
      
      if (paymentType === 'day') {
        // Day-rate jobs: 1 day at the configured day rate
        const rate = dayRate || 250;
        const name = aiResponse?.labour?.[0]?.name || 'Labour';
        labourWithRates = [{
          name,
          hours: 1, // interpreted as "days" in the UI
          rate,
          cost: Math.round(rate * 100) / 100
        }];
        console.log(`Labour (day rate, skip pricing): "${name}" - 1 day × £${rate}/day = £${rate}`);
      } else {
        // Hourly rate: apply the configured hourly rate
        const rate = hourlyRate || 45;
        labourWithRates = (aiResponse.labour || []).map((l: any) => {
          const hours = l.hours || 1;
          const cost = Math.round(hours * rate * 100) / 100;
          console.log(`Labour (hourly, skip pricing): "${l.name}" - ${hours}hrs × £${rate}/hr = £${cost}`);
          return {
            ...l,
            rate,
            cost
          };
        });
        
        // Ensure at least one labour item
        if (labourWithRates.length === 0) {
          labourWithRates = [{
            name: 'Labour',
            hours: 1,
            rate,
            cost: rate
          }];
        }
      }
      
      const labourTotal = labourWithRates.reduce((sum: number, l: any) => sum + (l.cost || 0), 0);
      
      const overheadsWithEmptyPrices = (aiResponse.overheads || []).map((o: any) => ({
        ...o,
        cost: 0,
        priceSource: "Add your price"
      }));
      
      pricedQuote = {
        materials: materialsWithEmptyPrices,
        optional_materials: optionalMaterialsWithEmptyPrices,
        labour: labourWithRates,
        overheads: overheadsWithEmptyPrices,
        suggested_overheads: aiResponse.suggested_overheads || [],
        totalMaterials: 0,
        totalOptionalMaterials: 0,
        totalLabour: labourTotal,
        totalOverheads: 0,
        grandTotal: labourTotal
      };
    } else {
      // Apply backend pricing to AI structure (with preferred supplier priority)
      pricedQuote = await applyPricingToQuote(
        aiResponse,
        allPricesFlat,
        inventory,
        hourlyRate || getDefaultLabourRate(tradeProfile?.primaryTrade || category),
        dayRate || 250,
        paymentType,
        numWorkers,
        tradeProfile?.primaryTrade || category,
        category,
        jobDescription,
        tradeProfile?.preferredSuppliers || [], // Pass preferred suppliers for priority matching
        await loadPricingOptions(supabaseService, user.id),
      );
    }

    return new Response(JSON.stringify(pricedQuote), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating quote:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});