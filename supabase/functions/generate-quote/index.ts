import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { chat, parseJsonReply, AIError } from "../_shared/ai.ts";
import { checkAiAccess } from "../_shared/access.ts";
import {
  detectTradeCategory,
  getDefaultLabourRate,
  getComplianceRules,
  getSystemPrompt,
  validateAndEnhanceQuote,
  LIVE_LOOKUP_LIMIT,
  applyPricingToQuote,
  setPriceClient,
  setReferencePrices,
  resetLiveLookups,
  type PricingOptions,
} from "../_shared/quote-engine.ts";
import { readerPrompt, normaliseReading, guessReading, buildFromReading, type Reading, type RecipeQuote } from "../_shared/recipes/index.ts";

// Only the area is needed to price a job, so the AI never sees the customer's full
// address: "14 Elm Road, Heaton Moor, Stockport SK4 4AB" becomes "Heaton Moor, Stockport SK4".
const areaOnly = (loc: unknown): string => {
  let s = String(loc ?? "").trim();
  if (!s) return "UK";
  s = s.replace(/\b([A-Z]{1,2}\d[A-Z\d]?)\s*\d[A-Z]{2}\b/gi, "$1");
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  const kept = parts.filter((p) => !/^\d/.test(p) && !/^(flat|apartment|unit)\b/i.test(p));
  return (kept.slice(-2).join(", ") || "UK").slice(0, 80);
};
const PRIVATE_KEYS = new Set(["client", "client_name", "client_email", "client_phone", "client_address", "location", "address", "customer", "customer_name", "email", "phone"]);
const withoutPersonal = (q: unknown) => JSON.stringify(q, (k, v) => (PRIVATE_KEYS.has(k) ? undefined : v), 2);

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

    const blocked = await checkAiAccess(user, 'quote', corsHeaders);
    if (blocked) return blocked;

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

    // Real prices are searched per item (database, then live product pages),
    // so we no longer load the whole price table into memory.
    setPriceClient(supabaseService);
    resetLiveLookups();

    // Estimates with no supplier (our reference list) — used only as a last resort
    const { data: referenceSources } = await supabaseService
      .from('price_sources').select('id').eq('source_type', 'reference');
    const refIds = (referenceSources || []).map((r: any) => r.id);
    const { data: referenceRows } = await supabaseService
      .from('market_prices')
      .select('product_name, unit, unit_price')
      .eq('is_active', true)
      .or(refIds.length ? `source_id.is.null,source_id.in.(${refIds.join(',')})` : 'source_id.is.null')
      .limit(5000);
    setReferencePrices((referenceRows || []).map((p: any) => ({
      product_name: p.product_name,
      unit: p.unit,
      unit_price: Number(p.unit_price),
      confidence_score: 0.5,
      source_name: 'Estimated',
      product_url: null,
    })));
    const allPricesFlat: any[] = [];

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
${withoutPersonal(currentQuote)}

Apply the adjustment: "${adjustmentPrompt}"
Return the updated structure with the same format (no prices).`;
      
      userContent = `Adjust this quote: ${adjustmentPrompt}`;
    } else {
      systemPrompt = getSystemPrompt(quoteGenerationMode, tradeProfile, inventory);
      
      userContent = `Generate the structured quote for:
Job: ${jobDescription}
Location: ${areaOnly(location)}
Category: ${category}
Workers: ${numWorkers}
${equipmentRental ? 'Equipment rental is required.' : ''}

Return ONLY the JSON structure with materials, optional_materials, labour, overheads, and suggested_overheads. NO PRICES.`;
    }

    // ═══════════════════════════════════════════════════════════════════
    // PHASE 1a: READ THE JOB → RECIPES
    // The AI only identifies the job and its measurements; recipes produce
    // the materials and hours. Anything no recipe covers goes to the
    // free-form AI below.
    // ═══════════════════════════════════════════════════════════════════
    let reading: Reading | null = null;
    let recipeQuote: RecipeQuote | null = null;
    // Job recipes are off by default: the AI lists materials for any job and each
    // item is priced live. Set USE_RECIPES=on to use recipes for jobs they cover.
    const useRecipes = Deno.env.get('USE_RECIPES') === 'on';
    if (useRecipes && !(adjustmentMode && currentQuote && adjustmentPrompt)) {
      try {
        const res = await chat({
          json: true,
          temperature: 0,
          messages: [
            { role: "system", content: readerPrompt() },
            { role: "user", content: `Trade: ${tradeProfile?.primaryTrade || category}\nJob: ${jobDescription}` },
          ],
        });
        reading = normaliseReading(parseJsonReply(res.content));
      } catch (err) {
        console.log("Job reader failed, using keyword reader:", err instanceof Error ? err.message : err);
        reading = guessReading(jobDescription, tradeProfile?.primaryTrade || category);
      }
      if (reading.jobs.length > 0) {
        recipeQuote = buildFromReading(reading, numWorkers);
        console.log(`Recipes: ${recipeQuote.recipes.join(", ")} | other work: ${reading.otherWork ?? "none"}`);
        if (reading.otherWork) {
          userContent = `Generate the structured quote ONLY for this extra work (the rest is already quoted):
Extra work: ${reading.otherWork}
Full job for context: ${jobDescription}
Location: ${areaOnly(location)}
Category: ${category}

Return ONLY the JSON structure with materials, optional_materials, labour, overheads, and suggested_overheads. NO PRICES.`;
        }
      }
    }
    const needFreeform = !recipeQuote || !!reading?.otherWork;

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

    let aiResponse: any = { materials: [], optional_materials: [], labour: [], overheads: [], suggested_overheads: [] };
    if (needFreeform) try {
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
    
    if (needFreeform) {
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
    if (!recipeQuote && (!aiResponse.materials || aiResponse.materials.length === 0)) {
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
    }

    // Merge recipe-built work in front of any free-form extras
    if (recipeQuote) {
      const extras = needFreeform ? aiResponse : null;
      const seen = new Set(recipeQuote.overheads.map((o) => o.name.toLowerCase()));
      aiResponse = {
        projectTitle: recipeQuote.projectTitle,
        materials: [...recipeQuote.materials, ...(extras?.materials || [])],
        optional_materials: [...recipeQuote.optional_materials, ...(extras?.optional_materials || [])],
        labour: [...recipeQuote.labour, ...(extras?.labour || [])],
        overheads: [...recipeQuote.overheads, ...(extras?.overheads || []).filter((o: any) => !seen.has(String(o?.name).toLowerCase()))],
        suggested_overheads: extras?.suggested_overheads || [],
      };
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

    if (recipeQuote) {
      pricedQuote = {
        ...pricedQuote,
        engine: needFreeform ? "recipes+ai" : "recipes",
        recipes: recipeQuote.recipes,
        assumptions: recipeQuote.assumptions,
        questions: reading?.questions ?? [],
      };
    } else {
      // The measurements the AI worked from; assumed ones first so the user can correct them
      const measurements = Array.isArray(aiResponse?.measurements) ? aiResponse.measurements : [];
      const assumptions = measurements
        .filter((m: any) => m && m.label && m.value != null)
        .slice(0, 12)
        .map((m: any) => ({
          job: '',
          label: String(m.label).slice(0, 60),
          value: `${m.value}${m.unit && m.unit !== 'each' ? ` ${m.unit}` : ''}`,
          question: String(m.question || `What is the ${String(m.label).toLowerCase()}?`).slice(0, 120),
          important: m.assumed !== false,
        }))
        .sort((a: any, b: any) => Number(b.important) - Number(a.important));
      pricedQuote = { ...pricedQuote, engine: "ai", assumptions, questions: [] };
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