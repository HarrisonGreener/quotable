import { dbOffers, liveOffers, chooseOffer, isFresh, type Priced } from "./live-price.ts";
// ═══════════════════════════════════════════════════════════════════
// QUOTE PRICING ENGINE
// Everything that turns the AI's job structure into a priced quote.
// Kept free of network imports so it can be tested on its own
// (supabase/tests/quote-accuracy).
// ═══════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════
// DYNAMIC TRADE-AGNOSTIC LABOUR RATE ENGINE
// Works for ALL 45+ trades using category-based defaults
// ═══════════════════════════════════════════════════════════════════

// Trade category mappings for dynamic rate calculation
export const TRADE_CATEGORY_RATES: Record<string, { min: number; max: number; default: number }> = {
  // Specialist/Commercial (highest rates)
  'specialist': { min: 85, max: 150, default: 100 },
  'commercial': { min: 80, max: 130, default: 95 },
  // Technical trades
  'electrical': { min: 75, max: 120, default: 85 },
  'hvac': { min: 80, max: 130, default: 95 },
  'plumbing': { min: 70, max: 115, default: 80 },
  'mechanical': { min: 75, max: 125, default: 90 },
  'automotive': { min: 65, max: 110, default: 75 },
  // Building trades
  'building': { min: 45, max: 90, default: 60 },
  'finishing': { min: 50, max: 95, default: 65 },
  'exterior': { min: 45, max: 85, default: 55 },
  // Default fallback
  'general': { min: 45, max: 100, default: 55 }
};

// Keywords to detect trade category from trade name
export const TRADE_CATEGORY_KEYWORDS: Record<string, string[]> = {
  'specialist': ['commercial-catering', 'kitchen-equipment', 'refrigeration', 'aviation', 'marine', 'lift', 'fire-safety', 'pool-spa', 'solar'],
  'commercial': ['commercial', 'industrial', 'hgv', 'plant'],
  'electrical': ['electr', 'ev-installer', 'security-systems', 'vehicle-electrician'],
  'hvac': ['hvac', 'air-conditioning', 'ventilation', 'heating', 'boiler'],
  'plumbing': ['plumb', 'gas-engineer', 'underfloor-heating'],
  'mechanical': ['mechanical', 'hydraulics', 'pneumatics', 'maintenance'],
  'automotive': ['auto', 'mechanic', 'agricultural'],
  'building': ['builder', 'carpenter', 'roofer', 'plasterer', 'bricklayer', 'stonemason', 'scaffolder', 'demolition', 'groundwork'],
  'finishing': ['kitchen-fitter', 'bathroom-fitter', 'painter', 'decorator', 'tiler', 'flooring', 'window', 'glazier'],
  'exterior': ['landscaper', 'fencer', 'driveway', 'tree-surgeon']
};

export const detectTradeCategory = (trade: string): string => {
  const normalizedTrade = trade.toLowerCase().replace(/\s+/g, '-');
  
  for (const [category, keywords] of Object.entries(TRADE_CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedTrade.includes(keyword)) {
        return category;
      }
    }
  }
  return 'general';
};

export const getValidatedLabourRate = (rate: number, trade: string): number => {
  const category = detectTradeCategory(trade);
  const range = TRADE_CATEGORY_RATES[category] || TRADE_CATEGORY_RATES['general'];
  
  if (rate < range.min) return range.min;
  if (rate > range.max) return range.max;
  return rate;
};

export const getDefaultLabourRate = (trade: string): number => {
  const category = detectTradeCategory(trade);
  return TRADE_CATEGORY_RATES[category]?.default || 55;
};

// ═══════════════════════════════════════════════════════════════════
// DYNAMIC SUPPLIER PRIORITY (Trade-Agnostic with Smart Defaults)
// ═══════════════════════════════════════════════════════════════════

// Category-based supplier priorities
export const CATEGORY_SUPPLIER_PRIORITY: Record<string, string[]> = {
  'specialist': ['Nisbets', 'CaterKwik', 'Partstown', 'Alliance Online', 'Specialist Suppliers'],
  'commercial': ['Partstown', 'Alliance Online', 'City Plumbing', 'Wolseley'],
  'electrical': ['CEF', 'Edmundson', 'Screwfix', 'Toolstation'],
  'hvac': ['City Plumbing', 'Wolseley', 'Partstown', 'Screwfix'],
  'plumbing': ['City Plumbing', 'Wolseley', 'Screwfix', 'Toolstation'],
  'mechanical': ['RS Components', 'Bearings Direct', 'Screwfix', 'Toolstation'],
  'automotive': ['GSF Car Parts', 'Euro Car Parts', 'Halfords Trade'],
  'building': ['Jewson', 'Travis Perkins', 'Toolstation', 'Screwfix'],
  'finishing': ['Toolstation', 'Screwfix', 'Topps Tiles', 'Howdens'],
  'exterior': ['Jewson', 'Travis Perkins', 'Fencing Supplies', 'Landscaping Depot'],
  'general': ['Screwfix', 'Toolstation']
};

export const getTradeSuppliers = (trade: string, preferredSuppliers?: string[]): string[] => {
  const category = detectTradeCategory(trade);
  const categoryDefaults = CATEGORY_SUPPLIER_PRIORITY[category] || CATEGORY_SUPPLIER_PRIORITY['general'];
  
  // User's preferred suppliers take priority, then category defaults
  if (preferredSuppliers && preferredSuppliers.length > 0) {
    const combined = [...preferredSuppliers];
    for (const supplier of categoryDefaults) {
      if (!combined.includes(supplier)) {
        combined.push(supplier);
      }
    }
    return combined;
  }
  
  return categoryDefaults;
};

// ═══════════════════════════════════════════════════════════════════
// TEMPLATE MATCHING INTERFACE
// ═══════════════════════════════════════════════════════════════════

export interface QuoteTemplate {
  template_key: string;
  template_name: string;
  trade: string;
  required_materials: any[];
  optional_materials: any[];
  labour_tasks: any[];
  safety_requirements: any[];
  hidden_tasks: any[];
  compliance_rules: any;
  price_range_min: number;
  price_range_max: number;
  labour_hours_min: number;
  labour_hours_max: number;
  keywords: string[];
}

/**
 * DYNAMIC TEMPLATE MATCHING - Works for ANY trade
 * 
 * 1. First tries exact trade match
 * 2. Falls back to category-based template matching
 * 3. Uses keyword scoring across all templates if no trade match
 */
export const findMatchingTemplate = async (
  supabase: any,
  trade: string,
  jobDescription: string
): Promise<QuoteTemplate | null> => {
  try {
    const lowerDesc = jobDescription.toLowerCase();
    const tradeCategory = detectTradeCategory(trade);
    
    // Step 1: Try exact trade match first
    let { data: templates } = await supabase
      .from('quote_templates_library')
      .select('*')
      .eq('trade', trade)
      .eq('is_active', true);
    
    // Step 2: If no exact match, try similar trades in same category
    if (!templates || templates.length === 0) {
      const similarTrades = TRADE_CATEGORY_KEYWORDS[tradeCategory] || [];
      
      for (const similarTrade of similarTrades) {
        const { data: similarTemplates } = await supabase
          .from('quote_templates_library')
          .select('*')
          .ilike('trade', `%${similarTrade}%`)
          .eq('is_active', true);
        
        if (similarTemplates && similarTemplates.length > 0) {
          templates = similarTemplates;
          console.log(`Found templates from similar trade: ${similarTrade}`);
          break;
        }
      }
    }
    
    // Step 3: If still no match, search by keywords across ALL templates
    if (!templates || templates.length === 0) {
      const { data: allTemplates } = await supabase
        .from('quote_templates_library')
        .select('*')
        .eq('is_active', true);
      
      if (allTemplates && allTemplates.length > 0) {
        templates = allTemplates;
        console.log(`Searching across all ${allTemplates.length} templates`);
      }
    }
    
    if (!templates || templates.length === 0) return null;
    
    // Score each template based on keyword matches
    let bestTemplate: QuoteTemplate | null = null;
    let bestScore = 0;
    
    for (const template of templates) {
      let score = 0;
      const keywords = template.keywords || [];
      
      // Keyword matching
      for (const keyword of keywords) {
        if (lowerDesc.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      
      // Appliance type bonus
      if (template.appliance_type && lowerDesc.includes(template.appliance_type.toLowerCase())) {
        score += 3;
      }
      
      // Trade match bonus (even partial)
      if (template.trade && trade.toLowerCase().includes(template.trade.toLowerCase().split('-')[0])) {
        score += 2;
      }
      
      // Setting match (commercial vs domestic)
      if (template.setting) {
        if (lowerDesc.includes('commercial') && template.setting === 'commercial') score += 2;
        if ((lowerDesc.includes('domestic') || lowerDesc.includes('home') || lowerDesc.includes('residential')) 
            && template.setting === 'domestic') score += 2;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestTemplate = template;
      }
    }
    
    // Lower threshold to 1 to allow more template matches for less common trades
    if (bestScore >= 1) {
      console.log(`Template matched: "${bestTemplate?.template_name}" for trade "${trade}" (score: ${bestScore})`);
      return bestTemplate;
    }
    
    return null;
  } catch (error) {
    console.error('Template matching error:', error);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════
// DYNAMIC COMPLIANCE RULES - Works for ANY trade with context awareness
// ═══════════════════════════════════════════════════════════════════

export interface ComplianceRule {
  rule_code: string;
  regulation: string;
  required_items: string[];
  is_mandatory: boolean;
}

// Keywords that indicate RESIDENTIAL context (skip commercial rules)
export const RESIDENTIAL_KEYWORDS = [
  'home', 'house', 'domestic', 'residential', 'garden', 'hot tub', 'bathroom', 
  'bedroom', 'living room', 'kitchen sink', 'shower', 'toilet', 'garage door',
  'patio', 'conservatory', 'loft', 'attic', 'cellar', 'driveway', 'fence',
  'lawn', 'pool', 'spa', 'jacuzzi', 'clean', 'cleaning', 'maintenance',
  'repair', 'fix', 'replace tap', 'blocked drain', 'leaky', 'dripping',
  'my home', 'my house', 'flat', 'apartment', 'bungalow', 'cottage'
];

// Keywords that indicate COMMERCIAL context (apply commercial rules)
export const COMMERCIAL_KEYWORDS = [
  'commercial', 'restaurant', 'hotel', 'shop', 'office', 'warehouse', 
  'factory', 'industrial', 'business', 'retail', 'pub', 'bar', 'cafe',
  'canteen', 'school kitchen', 'hospital', 'care home', 'extraction canopy',
  'commercial kitchen', 'commercial oven', 'commercial dishwasher',
  'fire suppression', 'ansul', 'building regulations', 'commercial fryer'
];

// Rules that should ONLY apply in commercial contexts
export const COMMERCIAL_ONLY_RULES = [
  'FIRE_SAFETY_ORDER', 'COMM_KITCHEN_001', 'COMM_KITCHEN_002',
  'COMMERCIAL_GAS', 'EXTRACTION_REQS', 'FIRE_SUPPRESSION',
  'HEALTH_SAFETY', 'HACCP', 'FOOD_HYGIENE'
];

// Keywords that indicate SERVICE/MAINTENANCE jobs (minimal materials, mostly labour)
export const SERVICE_JOB_KEYWORDS = [
  'service', 'annual service', 'maintenance', 'inspection', 'check', 'test',
  'survey', 'assessment', 'quote only', 'call out', 'diagnosis', 'fault find',
  'service call', 'routine maintenance', 'preventive maintenance'
];

// Detect if job is primarily a service/maintenance call
export const isServiceJob = (jobDescription: string): boolean => {
  const lowerDesc = jobDescription.toLowerCase();
  return SERVICE_JOB_KEYWORDS.some(keyword => lowerDesc.includes(keyword));
};

// ═══════════════════════════════════════════════════════════════════
// COMMERCIAL EQUIPMENT DETECTION - Prevents domestic jobs getting commercial equipment
// ═══════════════════════════════════════════════════════════════════
export const COMMERCIAL_EQUIPMENT_KEYWORDS = new Set([
  'hobart', 'winterhalter', 'rational', 'lincat', 'blue seal', 'foster',
  'williams', 'true refrigeration', 'gram', 'moffat', 'falcon', 'parry',
  'buffalo', 'caterquip', 'pass through', 'hood type', 'rack conveyor',
  'conveyor', 'commercial dishwasher', 'commercial glasswasher', 'flight',
  'undercounter', 'commercial fridge', 'commercial freezer', 'blast chiller',
  'combi oven', 'commercial range', 'industrial', 'catering equipment'
]);

/**
 * Detects if a job is residential or commercial based on keywords
 */
export const detectJobContext = (jobDescription: string): 'residential' | 'commercial' | 'unknown' => {
  const lowerDesc = jobDescription.toLowerCase();
  
  // Check for explicit commercial keywords first
  const hasCommercialKeyword = COMMERCIAL_KEYWORDS.some(keyword => lowerDesc.includes(keyword));
  if (hasCommercialKeyword) {
    console.log(`📋 Job context: COMMERCIAL (found commercial keywords)`);
    return 'commercial';
  }
  
  // Check for residential keywords
  const hasResidentialKeyword = RESIDENTIAL_KEYWORDS.some(keyword => lowerDesc.includes(keyword));
  if (hasResidentialKeyword) {
    console.log(`📋 Job context: RESIDENTIAL (found residential keywords)`);
    return 'residential';
  }
  
  console.log(`📋 Job context: UNKNOWN (no clear context)`);
  return 'unknown';
};

/**
 * Gets compliance rules dynamically:
 * 1. Exact trade match
 * 2. Category-based rules (e.g., all electrical trades get IET rules)
 * 3. Universal safety rules that apply to all trades
 * 4. FILTERS OUT commercial-only rules for residential jobs
 */
export const getComplianceRules = async (supabase: any, trade: string, jobDescription: string): Promise<ComplianceRule[]> => {
  try {
    const tradeCategory = detectTradeCategory(trade);
    const lowerDesc = jobDescription.toLowerCase();
    const jobContext = detectJobContext(jobDescription);
    
    // Collect all applicable rules
    const allRules: ComplianceRule[] = [];
    
    // Step 1: Exact trade rules
    const { data: tradeRules } = await supabase
      .from('compliance_rules')
      .select('*')
      .eq('trade', trade)
      .eq('is_mandatory', true);
    
    if (tradeRules) allRules.push(...tradeRules);
    
    // Step 2: Category-based rules (e.g., gas rules for all plumbing/heating trades)
    const categoryTrades: Record<string, string[]> = {
      'electrical': ['electrician', 'electrical-engineer'],
      'plumbing': ['plumber', 'gas-engineer', 'heating-engineer'],
      'hvac': ['hvac-engineer', 'refrigeration'],
      'specialist': ['commercial-catering-engineer', 'kitchen-equipment-engineer']
    };
    
    const relatedTrades = categoryTrades[tradeCategory] || [];
    for (const relatedTrade of relatedTrades) {
      if (relatedTrade !== trade) {
        const { data: relatedRules } = await supabase
          .from('compliance_rules')
          .select('*')
          .eq('trade', relatedTrade)
          .eq('is_mandatory', true);
        
        if (relatedRules) {
          // Only add rules not already present
          for (const rule of relatedRules) {
            if (!allRules.some(r => r.rule_code === rule.rule_code)) {
              allRules.push(rule);
            }
          }
        }
      }
    }
    
    // Step 3: Job-specific rules based on description keywords
    if (lowerDesc.includes('gas') || lowerDesc.includes('boiler')) {
      const { data: gasRules } = await supabase
        .from('compliance_rules')
        .select('*')
        .eq('trade', 'gas-engineer')
        .eq('is_mandatory', true);
      if (gasRules) {
        for (const rule of gasRules) {
          if (!allRules.some(r => r.rule_code === rule.rule_code)) {
            allRules.push(rule);
          }
        }
      }
    }
    
    // Step 4: FILTER OUT commercial-only rules for residential jobs
    let filteredRules = allRules;
    if (jobContext === 'residential') {
      const beforeCount = filteredRules.length;
      filteredRules = allRules.filter(rule => {
        const isCommercialOnly = COMMERCIAL_ONLY_RULES.some(
          commercialCode => rule.rule_code.toUpperCase().includes(commercialCode.toUpperCase())
        );
        if (isCommercialOnly) {
          console.log(`⏭️ Skipping commercial-only rule "${rule.rule_code}" for residential job`);
        }
        return !isCommercialOnly;
      });
      console.log(`Filtered ${beforeCount - filteredRules.length} commercial-only rules for residential context`);
    }
    
    console.log(`Found ${filteredRules.length} applicable compliance rules for trade "${trade}" (category: ${tradeCategory}, context: ${jobContext})`);
    return filteredRules;
  } catch (error) {
    console.error('Compliance rules error:', error);
    return [];
  }
};

// ═══════════════════════════════════════════════════════════════════
// PART 1: VALIDATION & TEXT PROCESSING
// ═══════════════════════════════════════════════════════════════════

// SERVICE/CERTIFICATION items that should NOT be matched to physical products
export const SERVICE_ITEM_KEYWORDS = new Set([
  // Certifications & qualifications
  'certificate', 'certification', 'qualification', 'comcat', 'gas safe', 'part p',
  'eicr', 'elecsa', 'napit', 'niceic', 'oftec', 'lgsr', 'cp12', 'fgas',
  // Checks & assessments
  'check', 'assessment', 'inspection', 'survey', 'calculation', 'test',
  'verification', 'rate calculation', 'provision',
  // Procedures & notifications
  'notification', 'approval', 'consent', 'regulation', 'compliance',
  'building control', 'dno', 'registered', 'approved',
  // Labour/service items
  'training', 'handover', 'commission', 'setup', 'install labour',
  'risk assessment', 'method statement', 'fire risk', 'permit',
]);

/**
 * Detects if an item is a service/certification rather than a physical product
 * These items should get fixed prices, not fuzzy-matched to products
 */
export const isServiceItem = (itemName: string): boolean => {
  const lowerName = itemName.toLowerCase();
  for (const keyword of SERVICE_ITEM_KEYWORDS) {
    if (lowerName.includes(keyword)) {
      return true;
    }
  }
  return false;
};

/**
 * Get fixed price for service items that shouldn't be matched to products
 */
export const getServiceItemPrice = (itemName: string): { price: number; source: string } | null => {
  const lowerName = itemName.toLowerCase();
  
  // Certificates and qualifications (these are service fees, not products)
  if (lowerName.includes('certificate') || lowerName.includes('certification')) {
    if (lowerName.includes('gas')) return { price: 75, source: 'Service Fee' };
    if (lowerName.includes('electrical') || lowerName.includes('eicr')) return { price: 150, source: 'Service Fee' };
    return { price: 50, source: 'Service Fee' };
  }
  
  // Qualifications (shouldn't be priced - it's a requirement, not a line item)
  if (lowerName.includes('qualification') || lowerName.includes('comcat')) {
    return null; // These are requirements, not purchasable items
  }
  
  // Checks and inspections (labour items)
  if (lowerName.includes('check') || lowerName.includes('inspection') || lowerName.includes('verification')) {
    return { price: 25, source: 'Service Fee' };
  }
  
  // Calculations (labour)
  if (lowerName.includes('calculation') || lowerName.includes('provision')) {
    return { price: 35, source: 'Service Fee' };
  }
  
  return null;
};

export const isValidProductName = (name: string): boolean => {
  if (!name || name.length < 5) return false;
  if (name.startsWith('Code:') || name.startsWith('£')) return false;
  if (name.startsWith('Just a moment')) return false;
  if (name.includes('Please enable') || name.includes('JavaScript')) return false;
  if (/^[A-Z]{2,4}\d{3,}/.test(name)) return false; // SKU patterns
  if (/^\d+$/.test(name)) return false;
  if (name.split(' ').length < 2) return false;
  // Scraped page furniture and article headings, not products
  if (/\?\s*$/.test(name)) return false;
  if (/^(what|why|how|when|types of|see also|shop by|reduced price|product information|electrical consumer units|exclusive|\")/i.test(name)) return false;
  if (name.includes('](') || /https?:\/\//.test(name)) return false;
  return true;
};

// ═══════════════════════════════════════════════════════════════════
// PRODUCT COMPATIBILITY — a candidate must be the same KIND of thing
// ═══════════════════════════════════════════════════════════════════

const PACK_WORDS = new Set(['pair', 'pack', 'set', 'each', 'roll', 'tin', 'tub', 'bag', 'box', 'tube', 'sheet', 'length',
  'metre', 'meter', 'per', 'of', 'x', 'kit', 'drum', 'coil', 'bottle', 'container', 'litre', 'liter', 'sqm', 'm2', 'approx',
  'cartridge', 'single', 'multipack', 'value']);
const DESCRIPTORS = new Set(['white', 'black', 'grey', 'gray', 'chrome', 'brass', 'silver', 'gold', 'satin', 'matt', 'gloss',
  'silk', 'brushed', 'steel', 'stainless', 'metal', 'plastic', 'pvc', 'upvc', 'timber', 'wood', 'wooden', 'treated',
  'softwood', 'hardwood', 'oak', 'pine', 'copper', 'zinc', 'galvanised', 'lap', 'closeboard', 'new', 'standard',
  'universal', 'heavy', 'duty', 'pro', 'premium', 'basic', 'double', 'single', 'twin', 'flexible', 'rapid', 'set',
  'ready', 'mixed', 'grey', 'magnolia', 'coloured', 'type', 'b', 'a', '30ma', 'grade', 'budget', 'mid', 'range',
  'brilliant', 'mono', 'compliant', 'amendment', 'decorators', 'decorator', 'curve', 'pole', 'trade', 'pure',
  'green', 'yellow', 'brown', 'cream', 'blue', 'red', 'anthracite', 'clear', 'light', 'dark', 'natural', 'smooth',
  'easy', 'quick', 'fast', 'large', 'small', 'medium', 'mini', 'compact', 'slim', 'deep', 'wide', 'long', 'short',
  'molded', 'moulded', 'ce', 'marked', 'ukca', 'bs', 'en', 'kitemarked', 'inch']);
// Words that don't say what the product is: "socket outlet", "surge protection device"
const GENERIC = new Set(['outlet', 'device', 'unit', 'system', 'agent', 'product', 'solution', 'fitting', 'fitt', 'item', 'board',
  'piece', 'component', 'accessory', 'material', 'supply']);
// Where or how it's used — useful context, not a different product
const SOFT = new Set(['floor', 'wall', 'internal', 'interior', 'indoor', 'kitchen', 'bathroom', 'garden', 'general',
  'purpose', 'all', 'domestic', 'home', 'house', 'profile', 'regularised', 'sawn', 'kiln', 'dried', 'finished', 'size',
  'quality', 'top', 'value', 'everyday', 'essential', 'essentials', 'classic', 'modern', 'contemporary', 'style',
  'edge', 'square', 'tapered', 'flush', 'dual', 'rated', 'reversible', 'adjustable', 'certified', 'approved', 'self']);
const OPTIONAL_HEADS = new Set(['cable', 'wire', 'paint']);
// Words saying where/what an item is used for, often left off product titles
const CONTEXT = new Set(['radiator', 'heating', 'central', 'system', 'plumb', 'plumbing', 'electrical', 'building',
  'plasterer', 'plaster', 'pipework', 'wiring', 'joinery', 'decorating', 'bathroom', 'kitchen', 'main', 'mains',
  'lighting', 'circuit', 'domestic']);
const COLOURS = new Set(['white', 'black', 'grey', 'gray', 'green', 'yellow', 'brown', 'cream', 'blue', 'red', 'anthracite', 'magnolia']);
// Same thing, different word (stems)
const SYNONYMS: Record<string, string[]> = {
  joist: ['timber', 'c24', 'c16'], membrane: ['fabric', 'sheet'], fabric: ['membrane'], tail: ['cable'],
  plasterboard: ['wallboard', 'gyproc', 'board'], wallboard: ['plasterboard'], emulsion: ['paint'],
  beading: ['bead', 'moulding'], bead: ['beading'], lever: ['handle'], handle: ['lever'],
  connector: ['connector'], sealant: ['silicone'], silicone: ['sealant'], filler: ['polyfilla'], polyfilla: ['filler'],
  downlight: ['downlighter', 'spotlight'], spotlight: ['downlight'], valve: ['tap'],
};
// Words that make a product a different thing from what was asked (unless asked for)
const EXCLUSIVE = new Set(['afdd', 'smart', 'wifi', 'wireless', 'bluetooth', 'dummy', 'spare', 'replacement', 'blanking',
  'adaptor', 'adapter', 'extension', 'stripper', 'tester', 'tool', 'cutter', 'remover', 'gun', 'refill', 'sample',
  'usb', 'weatherproof', 'bitumen', 'shower', 'cover', 'bracket', 'clip', 'spacer', 'toy', 'repair', 'cleaner',
  'primer', 'undercoat', 'varnish', 'stain', 'masonry', 'radiator', 'appliance', 'washing', 'dishwasher', 'cooker',
  'laser', 'roller', 'brush', 'scraper', 'trowel', 'saw', 'drill', 'hose', 'tray', 'holder', 'hanger', 'cap',
  'washer', 'gasket', 'insert', 'template', 'guide', 'jig', 'pump', 'scissors', 'knife', 'blade', 'spatula',
  'sponge', 'bucket', 'hawk', 'float', 'smoother', 'stripper', 'steamer', 'measure', 'gauge', 'sander', 'towel',
  'fuel', 'towelrad', 'rail']);
// Pricier variants of the same product — only when asked for, and only when they're in the
// product's name itself (not "underlay WITH moisture protection")
const VARIANTS = new Set(['moisture', 'thermal', 'fire', 'foil', 'soundbloc', 'impact', 'vapour', 'twin', 'exterior', 'outdoor', 'external']);
const OPPOSITES: [string, string][] = [['wall', 'floor'], ['internal', 'external'], ['indoor', 'outdoor'],
  ['interior', 'exterior'], ['single', 'double'], ['hot', 'cold'], ['male', 'female'], ['domestic', 'commercial'],
  ['bath', 'basin'], ['bath', 'kitchen'], ['basin', 'kitchen'], ['intermediate', 'corner'], ['matt', 'gloss'], ['matt', 'silk']];

// Compound nouns merchants write as one word
const COMPOUNDS: [RegExp, string][] = [[/\bangle\s+bead/g, 'anglebead'], [/\bback\s+box/g, 'backbox'],
  [/\b(?:flush\s+)?mounting\s+box/g, 'backbox'], [/\bpattress(?:\s+box)?/g, 'backbox'],
  [/\bplaster\s*board/g, 'plasterboard'], [/\bdown\s*light/g, 'downlight'], [/\bt\s*&\s*e\b/g, 'twin earth cable']];

const singular = (w: string, stem = true) => {
  if (w.length <= 3) return w;
  const one = w.replace(/ies$/, 'y').replace(/(ch|sh|x|ss)es$/, '$1').replace(/([^s])s$/, '$1');
  // light stemming so "isolating" = "isolation", "decking" = "deck"
  return stem && one.length > 5 ? one.replace(/(ing|ion|ed)$/, '') : one;
};

const EXCLUSIVE_SINGULAR = new Set([...EXCLUSIVE].map((w) => singular(w, false)));

/** Sizes normalised for comparison: { mm: [15, 2400], a: [32], kw: [9.5] } — metres and feet become mm. */
const sizesOf = (name: string): Record<string, number[]> => {
  const out: Record<string, number[]> = {};
  const add = (k: string, v: number) => { if (isFinite(v) && v > 0) (out[k] ??= []).push(Math.round(v * 100) / 100); };
  const text = name.toLowerCase().replace(/²/g, '2').replace(/(\d)\s*-?\s*(way|gang)\b/g, '$1$2');
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s?(mm2|mm|cm|m|ft|kw|w|v|a|way|gang)\b(?![²2])/g)) {
    const v = parseFloat(m[1]);
    switch (m[2]) {
      case 'mm': add('mm', v); break;
      case 'mm2': add('mm', v); break; // cable csa: "2.5mm²" and "2.5mm" mean the same cable
      case 'cm': add('mm', v * 10); break;
      case 'm': add('mm', v * 1000); break;
      case 'ft': add('mm', v * 304.8); break;
      default: add(m[2], v);
    }
  }
  return out;
};
const sameSize = (a: number, b: number) => Math.abs(a - b) <= Math.max(0.5, 0.025 * Math.max(a, b));

const words = (name: string, stem = true): string[] =>
  COMPOUNDS.reduce((t, [re, w]) => t.replace(re, w), name.toLowerCase()).replace(/&/g, ' and ')
    .replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9.\s/]/g, ' ').split(/\s+/).filter(Boolean)
    .filter((w) => !/\d/.test(w) && w.length > 1 && !['and', 'with', 'for', 'the', 'to', 'in', 'on', 'or'].includes(w)
      && !/^(mm|cm|kg|ml|kw|mtr|ltr|ft|in)$/.test(w))
    .map((w) => singular(w, stem));

/** The words that say what the product is. */
const significant = (name: string) =>
  // filter on the plain word ("molded", "marked"), then stem what's left
  words(name, false).filter((w) => !PACK_WORDS.has(w) && !DESCRIPTORS.has(w) && !GENERIC.has(w) && !SOFT.has(w)
    && !['way', 'gang', 'pole'].includes(w)) // sizes, checked separately
    .map((w) => singular(w))
    .filter((w) => !PACK_WORDS.has(w) && !DESCRIPTORS.has(w) && !GENERIC.has(w) && !SOFT.has(w));

/** The word that says what an item is ("hinge" in "Internal door hinge 3 inch pair"). */
export const headWord = (name: string): string | undefined => {
  const sig = significant(name).filter((w) => w.length >= 3);
  return sig[sig.length - 1];
};

const hasWord = (set: string[], w: string) => {
  const forms = [w, ...(SYNONYMS[w] ?? [])];
  return set.some((x) => forms.some((f) => x === f || (x.length > 3 && f.length > 3 && (x.startsWith(f) || f.startsWith(x)))));
};

/** Why `candidate` can't be the `wanted` product, or null when it can. */
export const incompatibility = (wanted: string, candidate: string): string | null => {
  const want = words(wanted);
  const have = words(candidate);

  // 1. a different kind of thing (an AFDD isn't an RCBO, a stripper isn't cable)
  // (unstemmed, so "brushed chrome" isn't a brush and "moulded door" isn't a mould)
  const wantRaw = words(wanted, false);
  for (const w of words(candidate, false)) if (EXCLUSIVE_SINGULAR.has(w) && !hasWord(wantRaw, w) && !hasWord(want, w)) return `different product (${w})`;
  const mainName = candidate.split(/\b(?:with|incl|including|inc\.?)\b|\+/i)[0] || candidate;
  for (const w of words(mainName, false)) if (VARIANTS.has(w) && !hasWord(wantRaw, w)) return `pricier variant (${w})`;
  // wood filler isn't for walls
  if (want.includes('filler') && have.includes('wood') && !want.includes('wood')) return 'wood filler';
  // "cable stripper FOR twin & earth": what the wanted thing is only appears after "for"
  const forAt = candidate.toLowerCase().search(/\b(for|to suit|suitable for)\b/);
  // What it's FOR isn't what it IS: "earth clamp for pipework" is an earth clamp
  const wantedCore = wanted.split(/\b(?:for|to suit|suitable for|with)\b/i)[0] || wanted;
  const sig = significant(wantedCore);
  const head = sig[sig.length - 1];
  if (forAt > 0 && head && !hasWord(words(candidate.slice(0, forAt)), head) && hasWord(words(candidate.slice(forAt)), head)) return `accessory for ${head}`;

  // 2. opposites (wall vs floor) unless the product says both ("wall and floor tile")
  for (const [a, b] of OPPOSITES) {
    if ((want.includes(a) && have.includes(b) && !have.includes(a)) || (want.includes(b) && have.includes(a) && !have.includes(b))) return `${a} vs ${b}`;
  }
  // 3. a colour was asked for and the product is a different colour
  const wc = want.filter((w) => COLOURS.has(w)), hc = have.filter((w) => COLOURS.has(w));
  if (wc.length && hc.length && !wc.some((c) => hc.includes(c))) return `colour ${hc.join('/')}`;

  // 4. (An accessory of the wanted thing — "wallpaper seam roller", "pipe end cap" — is caught by
  //    the EXCLUSIVE list above rather than by guessing the title's main noun, which merchants
  //    put in any order: "Fence Post Slotted Intermediate", "Thistle Multi Finish Plaster".)

  // 5. every word that says what it is must be there (one may be missing from a long description)
  // (heads often left off titles — "2.5mm twin and earth" is cable — don't count against)
  const missing = sig.filter((w) => !hasWord(have, w) && !OPTIONAL_HEADS.has(w));
  if (head && missing.includes(head)) return `not a ${head}`;
  // A context word ("RADIATOR inhibitor", "PLASTERERS scrim tape") may be missing from the title
  const allowed = (sig.length >= 4 ? 1 : 0) + (missing.some((w) => CONTEXT.has(w)) ? 1 : 0);
  if (missing.length > allowed) return `missing ${missing.join(', ')}`;

  // 6. sizes of the same kind must agree when both state them (2.4 m = 2400 mm = 8 ft)
  const ws = sizesOf(wanted), hs = sizesOf(candidate);
  for (const kind of Object.keys(ws)) {
    if (hs[kind] && !ws[kind].every((v) => hs[kind].some((h) => sameSize(v, h)))) return `size ${kind} ${ws[kind].join('/')} vs ${hs[kind].join('/')}`;
  }
  return null;
};

/** True when `candidate` could genuinely be the `wanted` product. */
export const isCompatibleProduct = (wanted: string, candidate: string): boolean => incompatibility(wanted, candidate) === null;


/** Pack size from the unit ("100m", "pack of 10") or the name ("… 10 Pack"). */
export const packInfo = (name: string, unit: string): { size: number; unitLabel: string } | null => {
  const bulk = parseBulkUnit(unit);
  if (bulk.quantity > 1) return { size: bulk.quantity, unitLabel: bulk.baseUnit };
  const m = name.match(/\b(\d+)\s*(?:pk|pack|pcs|piece)\b/i) || name.match(/\bpack\s*of\s*(\d+)/i);
  if (m && Number(m[1]) > 1) return { size: Number(m[1]), unitLabel: 'each' };
  const len = name.match(/\b(\d+)\s?m\s+(?:drum|coil|roll)\b/i);
  if (len) return { size: Number(len[1]), unitLabel: 'm' };
  return null;
};

export const normalizeProductName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const tokenize = (name: string): string[] => {
  return normalizeProductName(name)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['the', 'and', 'for', 'with', 'per', 'each', 'unit', 'roll', 'metre', 'meter', 'length'].includes(word));
};

// Strong tokens that carry more weight in matching
export const STRONG_TOKENS = new Set([
  // Materials
  'copper', 'pvc', 'plastic', 'brass', 'chrome', 'steel', 'stainless', 'aluminium', 'zinc', 'galvanised',
  // Products
  'pipe', 'cable', 'wire', 'fitting', 'valve', 'tap', 'socket', 'switch', 'elbow', 'tee', 'coupling',
  'boiler', 'radiator', 'pump', 'thermostat', 'oven', 'dishwasher', 'fryer', 'griddle',
  'plasterboard', 'cement', 'timber', 'brick', 'tile', 'insulation',
  'mcb', 'rcbo', 'consumer', 'isolator', 'breaker', 'rcd',
  // Dimensions (common UK trade sizes)
  '15mm', '22mm', '28mm', '32mm', '40mm', '50mm', '110mm',
  '2.5mm', '1.5mm', '4mm', '6mm', '10mm', '16mm',
  // Power/ratings
  '1kw', '2kw', '3kw', '7kw', '22kw', '240v', '415v', '13a', '16a', '32a', '40a',
  // Brands (high weight)
  'rational', 'hobart', 'winterhalter', 'bosch', 'dewalt', 'makita', 'milwaukee',
  'worcester', 'vaillant', 'baxi', 'ideal', 'hep2o', 'speedfit', 'wavin'
]);

// Brand tokens get extra scoring weight
export const BRAND_TOKENS = new Set([
  'rational', 'hobart', 'winterhalter', 'merrychef', 'blue seal', 'lincat',
  'bosch', 'dewalt', 'makita', 'milwaukee', 'festool', 'hikoki',
  'worcester', 'vaillant', 'baxi', 'ideal', 'glow-worm', 'viessmann',
  'hep2o', 'speedfit', 'wavin', 'polypipe', 'osma',
  'hager', 'wylex', 'schneider', 'legrand', 'mk', 'bg'
]);

export const countStrongTokenMatches = (aiTokens: string[], dbTokens: string[]): number => {
  let count = 0;
  for (const aiWord of aiTokens) {
    if (STRONG_TOKENS.has(aiWord)) {
      for (const dbWord of dbTokens) {
        if (dbWord === aiWord || dbWord.includes(aiWord) || aiWord.includes(dbWord)) {
          count++;
          break;
        }
      }
    }
  }
  return count;
};

export const countBrandMatches = (aiTokens: string[], dbTokens: string[]): number => {
  let count = 0;
  for (const aiWord of aiTokens) {
    if (BRAND_TOKENS.has(aiWord)) {
      for (const dbWord of dbTokens) {
        if (dbWord === aiWord || dbWord.includes(aiWord) || aiWord.includes(dbWord)) {
          count++;
          break;
        }
      }
    }
  }
  return count;
};

// Check if a dimension token matches (e.g., "15mm" matches "15mm")
export const countDimensionMatches = (aiTokens: string[], dbTokens: string[]): number => {
  const dimPattern = /^\d+(?:mm|m|kw|v|a|l)$/i;
  let count = 0;
  for (const aiWord of aiTokens) {
    if (dimPattern.test(aiWord)) {
      for (const dbWord of dbTokens) {
        if (dbWord === aiWord) {
          count++;
          break;
        }
      }
    }
  }
  return count;
};

// ═══════════════════════════════════════════════════════════════════
// ACCESSORY WORD PENALTIES - prevent matching accessories when main product requested
// ═══════════════════════════════════════════════════════════════════
export const ACCESSORY_WORDS = new Set([
  // Fittings & connectors
  'connector', 'adaptor', 'adapter', 'coupling', 'fitting', 'fixing',
  // Brackets & clips
  'bracket', 'clip', 'clamp', 'holder', 'mount', 'strap', 'support',
  // Seals & gaskets
  'seal', 'washer', 'gasket', 'o-ring', 'grommet', 'ring',
  // Handles & controls
  'handle', 'lever', 'button', 'knob', 'cover', 'cap', 'plug', 'lid',
  // Parts & spares
  'replacement', 'spare', 'repair', 'kit', 'cartridge', 'insert',
  // Flexible/extension
  'hose', 'flex', 'extension', 'tail', 'flexi', 'braided',
  // Tools & accessories
  'tool', 'key', 'spanner', 'wrench'
]);

// ═══════════════════════════════════════════════════════════════════
// CORE PRODUCT NOUNS - boost main products over accessories
// ═══════════════════════════════════════════════════════════════════
export const CORE_PRODUCT_NOUNS = new Set([
  // Sanitary ware
  'pan', 'cistern', 'basin', 'bath', 'shower', 'toilet', 'wc', 'bidet', 'sink', 'suite',
  // Heating/plumbing main items
  'tap', 'valve', 'radiator', 'boiler', 'pump', 'cylinder', 'tank', 'mixer',
  // Electrical main items
  'socket', 'switch', 'light', 'heater', 'fan', 'motor', 'unit', 'board', 'consumer',
  // Building main items
  'pipe', 'cable', 'panel', 'door', 'window', 'frame', 'timber',
  // Appliances
  'oven', 'dishwasher', 'fridge', 'freezer', 'washer', 'dryer', 'cooker', 'hob',
  // Fixtures
  'cabinet', 'worktop', 'vanity', 'mirror', 'rail', 'towel'
]);

// ═══════════════════════════════════════════════════════════════════
// PRODUCT TYPE DETECTION - main product vs accessory
// ═══════════════════════════════════════════════════════════════════
export const getProductType = (name: string): 'main' | 'accessory' | 'unknown' => {
  const lowerName = name.toLowerCase();
  const tokens = lowerName.split(/[\s\-\/]+/);
  
  // Check for accessory indicators first (more specific)
  for (const token of tokens) {
    if (ACCESSORY_WORDS.has(token)) return 'accessory';
  }
  
  // Check for main product indicators
  for (const token of tokens) {
    if (CORE_PRODUCT_NOUNS.has(token)) return 'main';
  }
  
  return 'unknown';
};

// Words that must match exactly (no partial matching)
export const EXACT_MATCH_WORDS = new Set([
  'washer', 'dishwasher', 'pressure', 'detector', 'detection', 'suppression',
  'domestic', 'commercial', 'inhibitor', 'radiator', 'valve', 'pipe', 'tap',
  'boiler', 'filter', 'pump', 'cable', 'socket', 'switch', 'motor', 'belt'
]);

export const scoreMatch = (aiTokens: string[], dbTokens: string[]): number => {
  if (aiTokens.length === 0 || dbTokens.length === 0) return 0;
  
  // Count forward matches (AI tokens found in DB)
  let forwardMatches = 0;
  for (const aiWord of aiTokens) {
    for (const dbWord of dbTokens) {
      // For words in EXACT_MATCH_WORDS, require exact match only
      if (EXACT_MATCH_WORDS.has(aiWord)) {
        if (dbWord === aiWord) {
          forwardMatches++;
          break;
        }
      } else {
        // For other words, allow partial matching
        if (dbWord === aiWord || dbWord.includes(aiWord) || aiWord.includes(dbWord)) {
          forwardMatches++;
          break;
        }
      }
    }
  }
  
  // Base score (forward direction)
  const baseScore = forwardMatches / Math.max(aiTokens.length, 1);
  
  // Create sets for efficient lookup
  const aiTokenSet = new Set(aiTokens);
  
  // PENALTY: Accessory words in DB that aren't in AI request
  let accessoryPenalty = 0;
  for (const dbWord of dbTokens) {
    if (ACCESSORY_WORDS.has(dbWord) && !aiTokenSet.has(dbWord)) {
      accessoryPenalty += 0.35; // Heavy penalty for unwanted accessories
    }
  }
  
  // BONUS: Both share core product nouns
  let coreNounBonus = 0;
  for (const dbWord of dbTokens) {
    if (CORE_PRODUCT_NOUNS.has(dbWord) && aiTokenSet.has(dbWord)) {
      coreNounBonus += 0.15;
    }
  }
  
  // COVERAGE PENALTY: If DB has many extra words not in AI, reduce score
  const dbTokenSet = new Set(dbTokens);
  let extraWordCount = 0;
  for (const dbWord of dbTokens) {
    if (!aiTokenSet.has(dbWord) && dbWord.length > 2) {
      extraWordCount++;
    }
  }
  const coveragePenalty = extraWordCount > 2 ? (extraWordCount - 2) * 0.06 : 0;
  
  // Calculate final score
  return Math.max(0, Math.min(1, baseScore + coreNounBonus - accessoryPenalty - coveragePenalty));
};

// ═══════════════════════════════════════════════════════════════════
// PART 2: UNIT PRICE NORMALIZATION FOR BULK UNITS
// ═══════════════════════════════════════════════════════════════════

export const parseBulkUnit = (dbUnit: string): { quantity: number; baseUnit: string } => {
  if (!dbUnit) return { quantity: 1, baseUnit: 'each' };
  const lowerUnit = dbUnit.toLowerCase().trim();
  
  // Match patterns like "100m", "50mm", "10kg", "5l"
  const bulkMatch = lowerUnit.match(/^(\d+)(m|mm|kg|l|litre|liter|metre|meter|pcs|pack)$/i);
  if (bulkMatch) {
    const qty = parseFloat(bulkMatch[1]);
    const baseUnit = bulkMatch[2].replace('metre', 'm').replace('meter', 'm').replace('litre', 'l').replace('liter', 'l');
    return { quantity: qty, baseUnit };
  }
  
  // Match "pack of X" patterns
  const packMatch = lowerUnit.match(/pack\s*(?:of\s*)?(\d+)/i);
  if (packMatch) {
    return { quantity: parseFloat(packMatch[1]), baseUnit: 'each' };
  }
  
  // Match "box of X" patterns
  const boxMatch = lowerUnit.match(/box\s*(?:of\s*)?(\d+)/i);
  if (boxMatch) {
    return { quantity: parseFloat(boxMatch[1]), baseUnit: 'each' };
  }
  
  if (['each', 'unit', 'item', 'roll', 'pack', 'm', 'kg', 'l'].includes(lowerUnit)) {
    return { quantity: 1, baseUnit: lowerUnit };
  }
  return { quantity: 1, baseUnit: dbUnit };
};

export const normalizeUnitPrice = (
  dbPrice: number, 
  dbUnit: string, 
  requestedQuantity: number
): { pricePerUnit: number; totalCost: number; normalized: boolean } => {
  const parsed = parseBulkUnit(dbUnit);
  if (parsed.quantity > 1) {
    const pricePerUnit = dbPrice / parsed.quantity;
    const totalCost = pricePerUnit * requestedQuantity;
    return {
      pricePerUnit: Math.round(pricePerUnit * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      normalized: true
    };
  }
  return {
    pricePerUnit: dbPrice,
    totalCost: Math.round(dbPrice * requestedQuantity * 100) / 100,
    normalized: false
  };
};

// ═══════════════════════════════════════════════════════════════════
// PART 3: ADVANCED MULTI-SUPPLIER FUZZY MATCHING WITH PREFERRED SUPPLIER PRIORITY
// ═══════════════════════════════════════════════════════════════════════

export interface BestMatch {
  matchedProduct: string;
  price: number;
  unit: string;
  source: string;
  confidence: number;
  matchScore: number;
  productUrl: string | null; // Direct product URL from database
}

export interface MatchCandidate {
  product_name: string;
  unit_price: number;
  unit: string;
  source_name: string;
  confidence_score: number;
  matchScore: number;
  strongMatches: number;
  brandMatches: number;
  dimensionMatches: number;
  product_url: string | null; // Direct product URL from database
}

// Category-based source filtering: which sources are INVALID for which product types
export const INVALID_SOURCES_BY_CATEGORY: Record<string, string[]> = {
  'catering': ['Toolstation', 'Screwfix', 'B&Q', 'Wickes', 'Jewson', 'Travis Perkins', 'Toolstation Public Catalogue', 'Screwfix Public Catalogue'],
  'automotive': ['Toolstation', 'Screwfix', 'B&Q', 'Wickes', 'Nisbets', 'Toolstation Public Catalogue', 'Screwfix Public Catalogue'],
  'marine': ['Toolstation', 'Screwfix', 'B&Q', 'Nisbets', 'GSF Car Parts', 'Toolstation Public Catalogue', 'Screwfix Public Catalogue'],
  'aviation': ['Toolstation', 'Screwfix', 'B&Q', 'Nisbets', 'Toolstation Public Catalogue', 'Screwfix Public Catalogue'],
};

// Keywords that indicate specialized categories
export const SPECIALIZED_PRODUCT_KEYWORDS: Record<string, string[]> = {
  'catering': ['rational', 'hobart', 'winterhalter', 'combi oven', 'commercial oven', 'dishwasher commercial', 'glasswasher', 'blast chiller', 'bain marie', 'salamander', 'commercial fryer', 'extraction hood', 'grease trap', 'ice machine'],
  'automotive': ['brake pad', 'brake disc', 'oil filter', 'spark plug', 'timing belt', 'alternator', 'clutch', 'starter motor', 'wheel bearing', 'fuel pump', 'cv joint'],
  'marine': ['impeller', 'bilge pump', 'stern gland', 'sea cock', 'propeller', 'anode', 'hull', 'deck fitting'],
  'aviation': ['aircraft', 'avionics', 'airframe'],
};

export const detectSpecializedCategory = (productName: string): string | null => {
  const lowerName = productName.toLowerCase();
  for (const [category, keywords] of Object.entries(SPECIALIZED_PRODUCT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) return category;
    }
  }
  return null;
};

/**
 * CRITICAL: Multi-supplier fuzzy matching with source validation and preferred supplier PRIORITY
 * 
 * Rules:
 * 1. Detect product category and FILTER OUT inappropriate sources
 * 2. Filter commercial equipment for residential jobs
 * 3. Evaluate ALL remaining products from valid suppliers
 * 4. Score candidates based on token matching, brands, dimensions
 * 5. Apply preferred supplier bias at the end
 */
export const findBestPriceAcrossSuppliers = (
  productName: string, 
  allPrices: any[],
  quantity: number,
  unit: string,
  category: string,
  trade: string,
  preferredSuppliers?: string[],
  jobContext?: 'residential' | 'commercial' | 'unknown'
): BestMatch | null => {
  const aiTokens = tokenize(productName);
  if (aiTokens.length === 0) return null;
  
  // Step 0: Detect if this is a specialized product that needs source filtering
  const specializedCategory = detectSpecializedCategory(productName);
  const invalidSources = specializedCategory ? INVALID_SOURCES_BY_CATEGORY[specializedCategory] || [] : [];
  
  if (specializedCategory && invalidSources.length > 0) {
    console.log(`  ⚠️ Specialized product detected: "${productName}" → category "${specializedCategory}"`);
    console.log(`     Excluding sources: ${invalidSources.join(', ')}`);
  }
  
  // Step 1: Filter valid prices, excluding inappropriate sources for specialized products
  const validPrices = allPrices.filter(p => {
    if (!isValidProductName(p.product_name)) return false;
    if (!p.unit_price || p.unit_price <= 0 || p.unit_price > 100000) return false;
    
    // Filter out inappropriate sources for specialized products
    if (invalidSources.length > 0) {
      const sourceName = (p.source_name || '').toLowerCase();
      for (const invalid of invalidSources) {
        if (sourceName.includes(invalid.toLowerCase())) {
          return false; // Exclude this source
        }
      }
    }
    
    // Step 1.5: DOMESTIC VS COMMERCIAL EQUIPMENT GUARD
    // If this is a residential job, reject commercial equipment
    if (jobContext === 'residential') {
      const dbProductLower = (p.product_name || '').toLowerCase();
      for (const commercialKeyword of COMMERCIAL_EQUIPMENT_KEYWORDS) {
        if (dbProductLower.includes(commercialKeyword)) {
          return false; // Skip commercial equipment for residential jobs
        }
      }
    }
    
    return true;
  });
  
  if (validPrices.length === 0) return null;
  
  const candidates: MatchCandidate[] = [];
  
  // Step 2: Score EVERY product from EVERY supplier
  const CANDIDATE_THRESHOLD = 0.25; // Lower threshold to collect more candidates
  
  for (const price of validPrices) {
    if (!isCompatibleProduct(productName, price.product_name)) continue;
    const dbTokens = tokenize(price.product_name);
    const baseScore = scoreMatch(aiTokens, dbTokens);
    
    // Normalized name bonus
    const normalizedAI = normalizeProductName(productName);
    const normalizedDB = normalizeProductName(price.product_name);
    const exactBonus = normalizedDB.includes(normalizedAI) || normalizedAI.includes(normalizedDB) ? 0.1 : 0;
    
    // Strong token bonus (materials, products)
    const strongMatches = countStrongTokenMatches(aiTokens, dbTokens);
    const strongBonus = strongMatches * 0.05;
    
    // Brand bonus (Rational, Hobart, etc. - very important)
    const brandMatches = countBrandMatches(aiTokens, dbTokens);
    const brandBonus = brandMatches * 0.15; // Brands are worth more
    
    // Dimension matching bonus (15mm, 22mm, 2.5mm, etc.)
    const dimensionMatches = countDimensionMatches(aiTokens, dbTokens);
    const dimensionBonus = dimensionMatches * 0.12; // Dimensions are critical for trades
    
    // Unit compatibility bonus
    const aiUnit = unit.toLowerCase();
    const dbUnit = (price.unit || 'each').toLowerCase();
    const unitBonus = (aiUnit === dbUnit || dbUnit.includes(aiUnit) || aiUnit.includes(dbUnit)) ? 0.08 : 0;
    
    const finalScore = Math.min(baseScore + exactBonus + strongBonus + brandBonus + dimensionBonus + unitBonus, 1.0);
    
    if (finalScore >= CANDIDATE_THRESHOLD) {
      candidates.push({
        product_name: price.product_name,
        unit_price: price.unit_price,
        unit: price.unit || 'each',
        source_name: price.source_name || 'Market',
        confidence_score: price.confidence_score || 0.7,
        matchScore: finalScore,
        strongMatches,
        brandMatches,
        dimensionMatches,
        product_url: price.product_url || null // Include direct URL
      });
    }
  }
  
  if (candidates.length === 0) return null;
  
  // Step 2.5: PRODUCT TYPE VALIDATION - reject accessories when main product requested
  const aiProductType = getProductType(productName);
  let filteredCandidates = candidates;
  
  if (aiProductType === 'main') {
    // If AI requested a main product, filter out accessories
    const mainProductCandidates = candidates.filter(c => {
      const dbType = getProductType(c.product_name);
      return dbType !== 'accessory';
    });
    
    // Only use filtered list if we still have candidates
    if (mainProductCandidates.length > 0) {
      console.log(`  🔍 Product type filter: "${productName}" is main product, filtered ${candidates.length - mainProductCandidates.length} accessories`);
      filteredCandidates = mainProductCandidates;
    }
  }
  
  if (filteredCandidates.length === 0) return null;
  
  // Step 3: Sort ALL candidates by quality
  filteredCandidates.sort((a, b) => {
    // Brand matches first (critical for commercial equipment)
    if (b.brandMatches !== a.brandMatches) return b.brandMatches - a.brandMatches;
    // Then dimension matches (critical for trade materials)
    if (b.dimensionMatches !== a.dimensionMatches) return b.dimensionMatches - a.dimensionMatches;
    // Then overall score
    if (Math.abs(b.matchScore - a.matchScore) > 0.03) return b.matchScore - a.matchScore;
    // Then strong matches
    if (b.strongMatches !== a.strongMatches) return b.strongMatches - a.strongMatches;
    // Then confidence
    return (b.confidence_score || 0) - (a.confidence_score || 0);
  });
  
  // Step 4: Apply acceptance thresholds
  const ACCEPT_THRESHOLD = 0.38;
  const LENIENT_THRESHOLD = 0.32;
  
  // Get the absolute best match
  const overallBest = filteredCandidates[0];
  const bestIsAcceptable = overallBest.matchScore >= ACCEPT_THRESHOLD || 
                           (overallBest.matchScore >= LENIENT_THRESHOLD && overallBest.strongMatches >= 2) ||
                           overallBest.brandMatches >= 1;
  
  if (!bestIsAcceptable) return null;
  
  // Step 4.5: CATEGORY MISMATCH GUARD - Runs on ALL items, not just expensive ones
  // This prevents "washer" matching "dishwasher", "detection" matching "suppression", etc.
  const aiLower = productName.toLowerCase();
  const dbLower = overallBest.product_name.toLowerCase();
  
  // Specific mismatches to reject - these run on ALL price levels
  const CATEGORY_MISMATCHES = [
    // Appliance mismatches
    { has: 'washer', notWith: 'dishwasher' },  // "washer" shouldn't match "dishwasher"
    { has: 'pressure washer', notWith: 'dishwasher' },
    { has: 'washing machine', notWith: 'dishwasher' },
    // Fire safety mismatches
    { has: 'detection', notWith: 'suppression' },
    { has: 'smoke detector', notWith: 'fire suppression' },
    { has: 'detector', notWith: 'suppression' },
    { has: 'sensor', notWith: 'system' },
    { has: 'alarm', notWith: 'extinguisher' },
    // Service/product mismatches
    { has: 'cleaning', notWith: 'installation' },
    { has: 'service', notWith: 'equipment' },
    { has: 'certificate', notWith: 'microwave' },
    { has: 'certificate', notWith: 'oven' },
    { has: 'certificate', notWith: 'dishwasher' },
    // Fitting mismatches
    { has: 'clip', notWith: 'copper pipe' },  // Pipe clips shouldn't match to pipes
    { has: 'bracket', notWith: 'radiator' },  // Brackets shouldn't match to radiators
    { has: 'connection', notWith: 'fused' },  // Connection work != fused units
    { has: 'drainage', notWith: 'fused' },  // Drainage work != electrical
    // Chemical/hardware mismatches
    { has: 'inhibitor', notWith: 'radiator' },  // Radiator inhibitor != radiator
    { has: 'chemical', notWith: 'appliance' },
    { has: 'cleaner', notWith: 'oven' },  // Cleaning products != ovens
    { has: 'cleaner', notWith: 'dishwasher' },
    // Domestic/commercial mismatches
    { has: 'domestic', notWith: 'commercial' },
    { has: 'home', notWith: 'commercial' },
  ];
  
  for (const mismatch of CATEGORY_MISMATCHES) {
    if (aiLower.includes(mismatch.has) && dbLower.includes(mismatch.notWith)) {
      // Don't reject if AI also asked for the "notWith" term
      if (!aiLower.includes(mismatch.notWith)) {
        console.log(`  ❌ Rejected category mismatch: AI wants "${mismatch.has}" but matched "${mismatch.notWith}"`);
        return null;
      }
    }
  }
  
  // Step 4.6: PRICE CATEGORY GUARD - Extra checks for expensive items
  const EXPENSIVE_THRESHOLD = 500;
  const HIGH_PRICE_MATCH_THRESHOLD = 0.55;
  
  if (overallBest.unit_price > EXPENSIVE_THRESHOLD) {
    // For expensive items, require higher match score OR brand match
    if (overallBest.matchScore < HIGH_PRICE_MATCH_THRESHOLD && overallBest.brandMatches === 0) {
      console.log(`  ❌ Rejected expensive match: "${overallBest.product_name}" (£${overallBest.unit_price}) - score ${overallBest.matchScore.toFixed(3)} too low for price`);
      return null;
    }
  }
  
  // Step 4.6: SMALL ITEM PRICE GUARD - Reject small items matched to expensive products
  // E.g., "pipe clips" shouldn't cost £21 each
const SMALL_ITEM_KEYWORDS = ['clip', 'bracket', 'screw', 'nail', 'washer', 'gasket', 'o-ring', 'tape', 'sealant', 'fixing', 'plug', 'anchor'];
  const SMALL_ITEM_MAX_PRICE = 35; // Increased to allow valid TRVs, smart plugs, etc.
  
  const aiLowerForSmallCheck = productName.toLowerCase();
  const isSmallItem = SMALL_ITEM_KEYWORDS.some(keyword => aiLowerForSmallCheck.includes(keyword));
  
  if (isSmallItem && overallBest.unit_price > SMALL_ITEM_MAX_PRICE) {
    console.log(`  ❌ Rejected price mismatch: "${productName}" is a small item but matched £${overallBest.unit_price} product "${overallBest.product_name}"`);
    return null;
  }
  
  // Step 5: PREFERRED SUPPLIER PRIORITY (not filter!)
  // If a preferred supplier has a competitive match (within 0.05 of best), use it
  let finalMatch = overallBest;
  
  if (preferredSuppliers && preferredSuppliers.length > 0) {
    const preferredSet = new Set(preferredSuppliers.map(s => s.toLowerCase()));
    
    // Find best match from preferred suppliers
    const preferredCandidates = filteredCandidates.filter(c => 
      preferredSet.has((c.source_name || '').toLowerCase())
    );
    
    if (preferredCandidates.length > 0) {
      const bestPreferred = preferredCandidates[0];
      
      // Preferred supplier wins if within 0.05 of overall best score
      const scoreDiff = overallBest.matchScore - bestPreferred.matchScore;
      if (scoreDiff <= 0.05) {
        finalMatch = bestPreferred;
        console.log(`  → Preferred supplier "${bestPreferred.source_name}" chosen (score diff: ${scoreDiff.toFixed(3)})`);
      } else {
        console.log(`  → Best match "${overallBest.source_name}" wins over preferred (diff: ${scoreDiff.toFixed(3)} > 0.05)`);
      }
    }
  }
  
  const supplierConfidence = finalMatch.confidence_score || 0.7;
  const calculatedConfidence = Math.min(supplierConfidence * finalMatch.matchScore, 0.95);
  
  return {
    matchedProduct: finalMatch.product_name,
    price: finalMatch.unit_price,
    unit: finalMatch.unit,
    source: finalMatch.source_name || 'Market',
    confidence: calculatedConfidence,
    matchScore: finalMatch.matchScore,
    productUrl: finalMatch.product_url || null // Direct product URL
  };
};

// ═══════════════════════════════════════════════════════════════════
// PART 4: UNIVERSAL FALLBACK PRICING HEURISTICS (ALL TRADES)
// Uses product keywords to estimate prices when no database match found
// ═══════════════════════════════════════════════════════════════════

// Universal product price estimates by keyword
export const PRODUCT_PRICE_ESTIMATES: Record<string, number> = {
  // Pipes & Tubes
  'copper pipe': 12, 'plastic pipe': 6, 'pvc pipe': 5, 'mdpe pipe': 4,
  'flexible hose': 15, 'gas hose': 20, 'drain pipe': 8, 'soil pipe': 15,
  
  // Fittings & Connectors
  'elbow': 3, 'tee': 4, 'coupling': 3, 'reducer': 4, 'union': 6,
  'compression fitting': 5, 'push-fit': 4, 'solder ring': 3,
  'flange': 12, 'adaptor': 5, 'nipple': 3,
  
  // Valves
  'ball valve': 15, 'gate valve': 20, 'check valve': 18, 'isolation valve': 12,
  'pressure relief': 25, 'thermostatic valve': 35, 'trv': 18, 'zone valve': 45,
  'gas cock': 15, 'service valve': 10,
  
  // Electrical - Cables
  'cable': 2.50, 'flex': 3, 't&e': 2.50, 'swa cable': 8, 'armoured': 10,
  'data cable': 1.50, 'coax': 2, 'fire cable': 4,
  
  // Electrical - Protection
  'consumer unit': 120, 'distribution board': 200, 'mcb': 15, 'rcbo': 28,
  'rcd': 35, 'surge protector': 45, 'isolator': 25, 'fuse': 3,
  
  // Electrical - Accessories
  'socket': 8, 'switch': 6, 'dimmer': 18, 'back box': 3, 'pattress': 4,
  'face plate': 5, 'conduit': 4, 'trunking': 6, 'junction box': 8,
  
  // HVAC
  'boiler': 800, 'radiator': 120, 'convector': 150, 'thermostat': 45,
  'programmer': 55, 'pump': 80, 'motorised valve': 65, 'expansion vessel': 75,
  'heat exchanger': 250, 'flue': 120, 'condensate pump': 85,
  
  // Commercial Catering
  'combi oven': 5000, 'commercial oven': 2500, 'rational': 6000,
  'dishwasher': 2500, 'glasswasher': 1500, 'fryer': 800, 'griddle': 600,
  'salamander': 450, 'bain marie': 350, 'hot cupboard': 500,
  'extraction hood': 1500, 'canopy': 1200, 'gas interlock': 350,
  'grease trap': 200, 'commercial refrigerator': 1500, 'ice machine': 800,
  
  // Automotive
  'brake pad': 35, 'brake disc': 55, 'caliper': 85, 'master cylinder': 95,
  'oil filter': 12, 'air filter': 15, 'fuel filter': 18, 'cabin filter': 12,
  'spark plug': 8, 'glow plug': 15, 'coil': 45, 'alternator': 150,
  'starter motor': 180, 'timing belt': 45, 'aux belt': 25, 'tensioner': 35,
  'clutch': 120, 'flywheel': 200, 'cv joint': 55, 'wheel bearing': 45,
  
  // Marine
  'impeller': 35, 'raw water pump': 120, 'bilge pump': 85, 'fuel line': 20,
  'zincs': 15, 'anode': 18, 'sea cock': 65, 'stern gland': 45,
  
  // Building Materials
  'timber': 15, 'joist': 25, 'rafter': 20, 'batten': 3, 'cladding': 30,
  'plasterboard': 12, 'insulation board': 25, 'osb': 20, 'mdf': 18, 'plywood': 35,
  'cement': 8, 'concrete': 5, 'mortar': 7, 'render': 12, 'grout': 8,
  'brick': 0.80, 'block': 2, 'lintel': 25, 'dpc': 10,
  
  // Roofing
  'roof tile': 1.50, 'slate': 3, 'ridge tile': 8, 'hip tile': 10,
  'felt': 6, 'membrane': 8, 'flashing': 15, 'lead': 35, 'valley': 20,
  'fascia': 12, 'soffit': 10, 'bargeboard': 15, 'gutter': 8, 'downpipe': 6,
  
  // Decorating
  'paint': 25, 'primer': 20, 'undercoat': 22, 'emulsion': 28, 'gloss': 30,
  'filler': 6, 'caulk': 5, 'decorator caulk': 4, 'wood filler': 8,
  'sandpaper': 4, 'sanding disc': 6, 'brush': 8, 'roller': 6, 'tray': 4,
  'masking tape': 4, 'dust sheet': 8, 'wallpaper': 18, 'paste': 8,
  
  // Flooring
  'laminate': 15, 'vinyl flooring': 20, 'carpet': 25, 'underlay': 8, 'gripper': 3,
  'floor tile': 25, 'tile adhesive': 18, 'tile grout': 8, 'tile spacer': 2, 'floor trim': 8,
  
  // Windows & Doors
  'window frame': 250, 'door panel': 150, 'door handle': 15, 'door lock': 35, 'door hinge': 8,
  'weather seal': 6, 'draught strip': 4, 'glazing bead': 3, 'window silicone': 6,
  
  // Landscaping
  'paving slab': 8, 'block paving': 0.80, 'garden gravel': 4, 'sharp sand': 3,
  'topsoil': 5, 'compost': 6, 'bark': 8, 'weed membrane': 4,
  'fence panel': 35, 'fence post': 12, 'gravel board': 8, 'post cap': 3,
  'decking board': 15, 'deck joist': 8, 'balustrade': 45,
  
  // Fire Safety
  'smoke detector': 25, 'heat detector': 30, 'call point': 45,
  'fire extinguisher': 35, 'fire blanket': 25, 'emergency light': 55,
  'fire door': 180, 'intumescent strip': 8, 'fire door closer': 35,
  
  // Security
  'alarm panel': 150, 'pir sensor': 35, 'door contact': 15, 'alarm siren': 45,
  'cctv camera': 85, 'dvr recorder': 200, 'lock cylinder': 25, 'deadlock': 35,
  
  // Lift/Elevator
  'lift button': 45, 'door operator': 350, 'safety edge': 120,
  'lift encoder': 180, 'brake coil': 150, 'levelling switch': 65,
  
  // Pool/Spa - Including cleaning and maintenance items
  'pool pump': 250, 'pool filter': 180, 'chlorinator': 350,
  'ph controller': 280, 'pool heater': 450, 'spa jet': 25,
  'hot tub cleaner': 15, 'spa cleaner': 15, 'spa chemical': 20,
  'spa shock treatment': 18, 'test strips': 12, 'ph test kit': 15,
  'hot tub filter': 25, 'spa filter': 25, 'cover cleaner': 12,
  'descaler': 10, 'foam reducer': 12, 'clarifier': 15,
  'pool chemical': 25, 'chlorine tablets': 35, 'algaecide': 18,
  'filter cartridge': 35, 'hot tub cover': 180, 'spa cover': 180,
  
  // General Cleaning/Maintenance Supplies
  'cleaning chemical': 12, 'degreaser': 15, 'sanitizer': 10,
  'cleaning cloth': 5, 'disposable gloves': 8, 'cleaning spray': 8,
  'surface cleaner': 12, 'limescale remover': 10, 'drain cleaner': 8,
  
  // Service/Maintenance Job Items
  'service call': 65, 'call out': 45, 'inspection fee': 35,
  'annual service': 85, 'maintenance check': 45, 'diagnostic fee': 55,
  
  // Universal Fixings & Consumables
  'screw box': 5, 'nail pack': 4, 'bolt set': 6, 'nut pack': 2, 'washer pack': 1,
  'wall plug': 4, 'wall anchor': 6, 'rawl bolt': 3, 'metal bracket': 6, 'pipe clip': 3,
  'pipe clamp': 5, 'fixing strap': 4, 'duct tape': 4, 'ptfe tape': 2, 'thread seal tape': 3,
  'grab adhesive': 8, 'wood glue': 7, 'bathroom sealant': 7, 'building silicone': 6, 'mastic gun': 8,
  'wd40': 8, 'bearing grease': 6, 'cutting oil': 10, 'pipe cleaner': 8, 'soldering flux': 6
};

export const estimatePriceFromHeuristics = (name: string, category: string, trade: string): number => {
  const lowerName = name.toLowerCase();
  
  // First, try direct keyword matching from our comprehensive list
  for (const [keyword, price] of Object.entries(PRODUCT_PRICE_ESTIMATES)) {
    if (lowerName.includes(keyword)) {
      return price;
    }
  }
  
  // Fallback based on trade category for unknown items
  const tradeCategory = detectTradeCategory(trade || category);
  
  const CATEGORY_DEFAULT_PRICES: Record<string, number> = {
    'specialist': 50,    // Commercial/specialist equipment tends to be expensive
    'commercial': 40,
    'electrical': 15,
    'hvac': 30,
    'plumbing': 15,
    'mechanical': 25,
    'automotive': 25,
    'building': 12,
    'finishing': 15,
    'exterior': 10,
    'general': 20
  };
  
  return CATEGORY_DEFAULT_PRICES[tradeCategory] || 20;
};

// ═══════════════════════════════════════════════════════════════════
// PART 5: COMPREHENSIVE SUPPLIER URL GENERATION
// ═══════════════════════════════════════════════════════════════════

// Extended product-to-category keywords for smart supplier routing
export const PRODUCT_KEYWORDS_TO_CATEGORY: Record<string, string> = {
  // Catering
  'combi oven': 'catering', 'rational': 'catering', 'hobart': 'catering',
  'winterhalter': 'catering', 'dishwasher commercial': 'catering', 
  'extraction hood': 'catering', 'commercial fryer': 'catering', 
  'griddle': 'catering', 'commercial oven': 'catering', 'bain marie': 'catering',
  'salamander': 'catering', 'ice machine': 'catering', 'blast chiller': 'catering',
  
  // Automotive
  'brake pad': 'automotive', 'brake disc': 'automotive', 'oil filter': 'automotive',
  'spark plug': 'automotive', 'timing belt': 'automotive', 'alternator': 'automotive',
  'clutch': 'automotive', 'starter motor': 'automotive', 'wheel bearing': 'automotive',
  
  // Electrical
  'consumer unit': 'electrical', 'mcb': 'electrical', 'rcbo': 'electrical',
  'distribution board': 'electrical', 'conduit': 'electrical', 'trunking': 'electrical',
  
  // HVAC
  'boiler': 'hvac', 'radiator': 'hvac', 'thermostat': 'hvac', 'heat pump': 'hvac',
  'expansion vessel': 'hvac', 'motorised valve': 'hvac',
  
  // Marine
  'impeller': 'marine', 'bilge pump': 'marine', 'stern gland': 'marine',
  'sea cock': 'marine', 'propeller': 'marine', 'anode': 'marine'
};

// Extended supplier URLs for all trade categories
export const SUPPLIER_URLS: Record<string, string> = {
  // General Trade
  'Toolstation': 'https://www.toolstation.com/search?q=',
  'Screwfix': 'https://www.screwfix.com/search?search=',
  
  // Plumbing & Heating
  'City Plumbing': 'https://www.cityplumbing.co.uk/search?q=',
  'Wolseley': 'https://www.wolseley.co.uk/search?q=',
  'Plumbase': 'https://www.plumbase.co.uk/search?q=',
  
  // Electrical
  'CEF': 'https://www.cef.co.uk/catalogue/search/',
  'Edmundson': 'https://www.edmundson-electrical.co.uk/search?q=',
  
  // Building Merchants
  'Jewson': 'https://www.jewson.co.uk/search/?text=',
  'Travis Perkins': 'https://www.travisperkins.co.uk/search?q=',
  'Buildbase': 'https://www.buildbase.co.uk/search?q=',
  
  // Catering
  'Nisbets': 'https://www.nisbets.co.uk/search/?text=',
  'Lockhart Catering': 'https://www.lockhartcatering.co.uk/search?q=',
  'CaterKwik': 'https://www.caterkwik.co.uk/search?q=',
  
  // Automotive
  'GSF Car Parts': 'https://www.gsfcarparts.com/search?q=',
  'Euro Car Parts': 'https://www.eurocarparts.com/search?q=',
  'Halfords': 'https://www.halfords.com/search?q=',
  
  // Marine
  'Force 4': 'https://www.force4.co.uk/search?q=',
  'Marine Superstore': 'https://www.marinesuperstore.com/search?q=',
  
  // Specialist
  'RS Components': 'https://uk.rs-online.com/web/c/?searchTerm=',
  'Partstown': 'https://www.partstown.co.uk/search?q=',
  
  // Decorating
  'Dulux Trade': 'https://www.duluxtradepaintexpert.co.uk/search?q=',
  
  // Flooring
  'Topps Tiles': 'https://www.toppstiles.co.uk/search?q=',
  
  // Windows/Doors
  'Howdens': 'https://www.howdens.com/search?q='
};

// Category to default supplier mapping
export const CATEGORY_SUPPLIERS: Record<string, string> = {
  'catering': 'Nisbets',
  'automotive': 'GSF Car Parts',
  'electrical': 'CEF',
  'hvac': 'City Plumbing',
  'plumbing': 'City Plumbing',
  'marine': 'Force 4',
  'building': 'Jewson',
  'finishing': 'Topps Tiles',
  'mechanical': 'RS Components',
  'specialist': 'Partstown',
  'general': 'Screwfix'
};

export const detectProductCategory = (productName: string): string | null => {
  const lowerName = productName.toLowerCase();
  for (const [keyword, category] of Object.entries(PRODUCT_KEYWORDS_TO_CATEGORY)) {
    if (lowerName.includes(keyword)) return category;
  }
  return null;
};

export const simplifyProductName = (fullName: string): string => {
  if (!fullName) return '';
  
  // KEEP trade-critical dimensions (pipe sizes, electrical ratings)
  const criticalDimensions = fullName.match(/\b(15mm|22mm|28mm|32mm|40mm|50mm|110mm|13a|32a|45a|3kw|6kw|9kw)\b/gi) || [];
  
  // Remove noise but preserve brand and product type
  const noisePatterns = [
    /\(.*?\)/g, // Parenthetical content
    /\b(pack of|box of)\s*\d+\b/gi,
    /\b(white|black|grey|gray|chrome|brass|copper|nickel)\b/gi, // Colors only
    /\b(model|code|ref|sku|item)\s*:?\s*\w+/gi, // Model numbers
  ];
  
  let simplified = fullName;
  noisePatterns.forEach(pattern => { simplified = simplified.replace(pattern, ''); });
  
  // Clean up and take key words
  simplified = simplified.replace(/\s+/g, ' ').trim();
  const words = simplified.split(' ').filter(w => w.length > 1).slice(0, 5);
  
  // Re-add critical dimensions if they were lost
  const result = words.join(' ');
  const resultLower = result.toLowerCase();
  for (const dim of criticalDimensions) {
    if (!resultLower.includes(dim.toLowerCase())) {
      return `${dim} ${result}`;
    }
  }
  
  return result;
};

export const generateSupplierUrl = (
  productName: string, 
  priceSource?: string, 
  trade?: string
): { url: string; supplier: string } => {
  const simplifiedName = simplifyProductName(productName);
  const encoded = encodeURIComponent(simplifiedName);
  
  // Check if product belongs to a specific category
  const productCategory = detectProductCategory(productName);
  if (productCategory && CATEGORY_SUPPLIERS[productCategory]) {
    const categorySupplier = CATEGORY_SUPPLIERS[productCategory];
    const baseUrl = SUPPLIER_URLS[categorySupplier] || SUPPLIER_URLS['Screwfix'];
    return { url: `${baseUrl}${encoded}`, supplier: categorySupplier };
  }
  
  // Use provided price source if valid
  if (priceSource && SUPPLIER_URLS[priceSource]) {
    return { url: `${SUPPLIER_URLS[priceSource]}${encoded}`, supplier: priceSource };
  }
  
  // Default fallback
  return { url: `${SUPPLIER_URLS['Screwfix']}${encoded}`, supplier: 'Screwfix' };
};

// ═══════════════════════════════════════════════════════════════════
// PART 6: AI SYSTEM PROMPT - STRUCTURE ONLY WITH OPTIONAL MATERIALS
// ═══════════════════════════════════════════════════════════════════

export const getSystemPrompt = (quoteGenerationMode: string, tradeProfile: any, inventory: any[]) => {
  let inventoryContext = '';
  if (inventory && inventory.length > 0) {
    inventoryContext = `
═════════════════════════════════════════════════════════════════════
USER INVENTORY (use these items if applicable to the job)
═════════════════════════════════════════════════════════════════════
${inventory.map(item => `- ${item.name} (${item.unit})${item.category ? ` [${item.category}]` : ''}`).join('\n')}

Only include inventory items if they are genuinely required for this specific job.
═════════════════════════════════════════════════════════════════════
`;
  }

  let tradeProfileContext = '';
  if (tradeProfile?.primaryTrade) {
    tradeProfileContext = `
═════════════════════════════════════════════════════════════════════
TRADE PROFILE
═════════════════════════════════════════════════════════════════════
- Primary Trade: ${tradeProfile.primaryTrade}
- Business Type: ${tradeProfile.businessType || 'Not specified'}
- Typical Job Size: ${tradeProfile.typicalJobSize || 'Not specified'}
${tradeProfile.specializations?.length ? `- Specializations: ${tradeProfile.specializations.join(', ')}` : ''}
${tradeProfile.certifications?.length ? `- Certifications: ${tradeProfile.certifications.join(', ')}` : ''}
${tradeProfile.tradeNotes ? `- Notes: ${tradeProfile.tradeNotes}` : ''}
═════════════════════════════════════════════════════════════════════
`;
  }

  return `You are Quotable's quantity surveyor for UK trades. For ANY job you list exactly what
must be bought and how long the work takes. Quotable looks up live supplier prices for every
item you list, so item names and units must be precise. For each material also give "estimate":
your best guess of the typical UK retail price per unit inc VAT (£). It is only shown, marked as
an estimate, if no live price can be found.

═════════════════════════════════════════════════════════════════════
OUTPUT (valid JSON only, no commentary)
═════════════════════════════════════════════════════════════════════
{
  "projectTitle": "Short title",
  "measurements": [
    { "label": "Wall area", "value": 12, "unit": "m²", "assumed": true, "question": "What's the tiled area?" }
  ],
  "materials": [
    { "name": "Ready mixed wall tile adhesive 15kg", "quantity": 3, "unit": "tub", "basis": "12 m² at ~5 m² per tub", "estimate": 22 }
  ],
  "optional_materials": [ { "name": "...", "quantity": 1, "unit": "each" } ],
  "labour": [ { "name": "Tile walls", "hours": 7 } ],
  "overheads": [ { "name": "Transport" } ],
  "suggested_overheads": [ { "name": "Post-job cleaning service" } ]
}

═════════════════════════════════════════════════════════════════════
1. MEASUREMENTS FIRST
═════════════════════════════════════════════════════════════════════
- List every measurement or count the quantities depend on (areas, lengths, room sizes,
  number of items, heights, existing condition).
- Use the user's figures exactly. Convert feet to metres (× 0.305), sq ft to m² (× 0.093).
- If a figure isn't given, assume a typical UK value, set "assumed": true and give a short
  "question" to ask the user. Never leave a quantity unexplained.
- Lines starting "Details:" are corrections from the tradesperson: they override everything.

═════════════════════════════════════════════════════════════════════
2. MATERIALS — everything that must be bought to do the job
═════════════════════════════════════════════════════════════════════
- Work quantities out from the measurements, with normal waste: tiles/flooring +10%,
  timber/skirting +10%, plasterboard +5%. Put the short sum in "basis".
- Include the materials the job actually uses up in quantity (adhesive, grout, plaster, paint,
  cable, pipe, timber, boards). Leave out tools and PPE.
- VAN STOCK: don't itemise small consumables a tradesperson carries anyway (PTFE tape, wall
  plugs, screws for a few fixings, earth sleeving, cable clips, solder, masking tape, a tube of
  caulk or filler on a small job). Add ONE overhead "Sundries" instead. Only itemise them when the
  job uses a lot (a box of 1000 drywall screws for boarding a room, 20 tubes of adhesive).
- Buy the SMALLEST pack that covers the need — never a 100 m roll for 2 m of sleeving or a
  1 kg tub when a 250 g tube does.
- Pick the product made for the job: "Easy sand wall filler", not wood filler, for walls;
  "6491X 10mm earth cable" (single core), not twin and earth, for bonding.
- NAME = what you'd type into a merchant's website: product type + key size/spec/pack.
  Good: "15mm copper pipe", "2.5mm twin and earth cable", "Multi-finish plaster 25kg",
  "Trade vinyl matt emulsion 10L", "Double switched socket white", "Plasterboard 12.5mm 2400 x 1200mm",
  "Concrete fence post 2.4m", "Wood screws 4 x 40mm box of 200".
  Bad: "pipe", "cable", "paint", "screws", "materials", "sundries". No brands unless the user names one.
- UNIT = how it's bought or measured. Use only: m, m², L, kg, each, pair, pack, box, bag, tub,
  tin, roll, sheet, length, tube.
  Cable, pipe, trunking, timber by the metre → "m". Flooring, tiles, insulation → "m²".
  Paint → the tin/tub size in the name and unit "tin"/"tub". Plaster/adhesive/postcrete → "bag"/"tub".
- One line per distinct product. Don't split the same product across lines.

optional_materials: at most 3 genuine upgrades the client might choose (e.g. chrome instead of
white accessories, a better grade of tap). Never put required items here.

═════════════════════════════════════════════════════════════════════
3. LABOUR
═════════════════════════════════════════════════════════════════════
- Hours ON SITE for the crew size given (Quotable multiplies by the number of workers), for a
  competent, efficient UK tradesperson. Use 1–4 lines; don't pad small jobs with many small steps.
- Calibrate against these typical WHOLE-JOB times (including setup, testing, making good, clearing up):
  · extra double socket off an existing circuit: 1.5–2 h  · each further socket same room: +1 h
  · consumer unit change, 8–10 circuits, with testing & certificate: 6–8 h
  · swap a radiator like-for-like: 1.5 h first, +1 h each after  · swap a tap: 1–1.5 h
  · replace a close-coupled toilet: 2.5–3 h  · hang an internal door with ironmongery: 2–2.5 h
  · skim walls ~2.5 m²/h plus ~1.5 h setup/protection (a 3×3 m room's walls ≈ 1.5 days)
  · skim ceilings ~2.5 m²/h  · board a ceiling ~4 m²/h
  · decorate a medium bedroom — walls + ceiling 2 coats, skirting and one door: ~12 h in total
    (protect/fill/sand 1.5 h, walls ~10 m²/h per coat, ceiling ~8 m²/h per coat, skirting+door ~2 h)
  · wall tiling ~1.5 m²/h, floor tiling ~1.2 m²/h (plus setting out and grouting)
  · lay laminate ~2.5 m²/h  · fence panel with concrete post ~1.25 h each
- If the job is small, the total should be small: a one-socket job is about 2 hours, not 4.

═════════════════════════════════════════════════════════════════════
4. OVERHEADS
═════════════════════════════════════════════════════════════════════
Only what applies: Transport, Sundries, Waste disposal, Skip hire, Parking, Equipment hire,
Access equipment, Scaffolding, Building control notification.
suggested_overheads: optional extras only, never duplicating overheads.
${quoteGenerationMode === 'minimal' ? `
═════════════════════════════════════════════════════════════════════
MINIMAL MODE INSTRUCTIONS
═════════════════════════════════════════════════════════════════════
- Include only essential overheads.
- Include 1-2 optional_materials as genuine upgrade options only.
- Keep labour tasks concise but complete.
` : `
═════════════════════════════════════════════════════════════════════
DETAILED MODE INSTRUCTIONS
═════════════════════════════════════════════════════════════════════
- Break labour into multiple specific tasks.
- Include every material and consumable explicitly.
- Include 2-3 optional_materials as genuine upgrade options only.
- Overheads may include more operational items.
`}
${tradeProfileContext}
${inventoryContext}

═════════════════════════════════════════════════════════════════════
FINAL REQUIREMENT
═════════════════════════════════════════════════════════════════════
Your final output must be valid JSON only. No explanations. No commentary.
Output nothing except the JSON object.`;
};

// ═══════════════════════════════════════════════════════════════════
// PART 7: VALIDATION & SAFETY AUTO-INJECTION SYSTEM
// Works dynamically for ALL trades based on job context
// ═══════════════════════════════════════════════════════════════════

/**
 * Universal safety requirements detected from job context (not hardcoded by trade)
 * These are injected if missing from the AI response
 */
export const SAFETY_KEYWORDS_TO_ITEMS: Record<string, { keywords: string[]; items: { name: string; quantity: number; unit: string }[] }> = {
  // Gas Work Safety
  'gas_work': {
    keywords: ['gas', 'boiler', 'cooker', 'hob', 'lpg', 'natural gas'],
    items: [
      { name: 'Gas Isolation Valve (15mm/22mm)', quantity: 1, unit: 'each' },
      { name: 'Gas Leak Detection Spray', quantity: 1, unit: 'each' }
    ]
  },
  // Electrical Safety
  // Water/Plumbing Safety
  'water_work': {
    keywords: ['water supply', 'mains water', 'stopcock', 'water main'],
    items: [
      { name: 'Water Isolation Valve', quantity: 1, unit: 'each' },
      { name: 'PTFE Tape', quantity: 1, unit: 'roll' }
    ]
  },
  // Commercial Kitchen Safety
  'commercial_kitchen': {
    keywords: ['commercial kitchen', 'restaurant kitchen', 'catering equipment', 'extraction canopy'],
    items: [
      { name: 'Gas Interlock System Check', quantity: 1, unit: 'job' }
    ]
  },
  // Refrigeration/HVAC Safety
  'refrigeration': {
    keywords: ['refrigerant', 'f-gas', 'r410a', 'r32', 'air conditioning unit'],
    items: [
      { name: 'Refrigerant Recovery', quantity: 1, unit: 'job' }
    ]
  },
  // Height Work Safety
  'height_work': {
    keywords: ['roof work', 'gutter replacement', 'chimney repair', 'working at height'],
    items: [
      { name: 'Fall Protection Equipment', quantity: 1, unit: 'job' }
    ]
  },
  // Hot Work Safety
  'hot_work': {
    keywords: ['welding', 'soldering copper', 'brazing', 'torch'],
    items: [
      { name: 'Fire Extinguisher (On-site)', quantity: 1, unit: 'each' }
    ]
  }
};

/**
 * Hidden/forgotten tasks that should be included based on job context
 */
export const HIDDEN_TASKS_BY_CONTEXT: Record<string, { keywords: string[]; tasks: { name: string; hours: number }[] }> = {
  'isolation_testing': {
    keywords: ['install', 'new installation', 'replace existing', 'upgrade'],
    tasks: [
      { name: 'Isolation & Testing', hours: 0.5 },
      { name: 'Commissioning & Handover', hours: 0.5 }
    ]
  },
  'waste_disposal': {
    keywords: ['replace', 'remove old', 'strip out', 'demolition'],
    tasks: [
      { name: 'Waste Disposal & Clean-up', hours: 0.5 }
    ]
  },
  'certification': {
    keywords: ['gas safe', 'electrical certificate', 'building regs', 'part p', 'cp12'],
    tasks: [
      { name: 'Certification & Documentation', hours: 0.25 }
    ]
  }
};

/**
 * Validates and enhances AI response with missing safety items and hidden tasks
 * Works for ANY trade based on job description context
 */
export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  injectedMaterials: any[];
  injectedLabour: any[];
}

export const validateAndEnhanceQuote = (
  aiResponse: any,
  jobDescription: string,
  trade: string,
  complianceRules: ComplianceRule[]
): ValidationResult => {
  const issues: string[] = [];
  const injectedMaterials: any[] = [];
  const injectedLabour: any[] = [];
  
  const lowerDesc = jobDescription.toLowerCase();
  const existingMaterialNames = new Set<string>((aiResponse.materials || []).map((m: any) => m.name.toLowerCase()));
  const existingLabourNames = new Set<string>((aiResponse.labour || []).map((l: any) => l.name.toLowerCase()));
  
  console.log(`\n═══════════════════════════════════════════════════════════════════`);
  console.log(`VALIDATION & SAFETY INJECTION`);
  console.log(`Trade: ${trade}`);
  console.log(`═══════════════════════════════════════════════════════════════════\n`);
  
  // Step 1: Check for missing safety items based on job context
  for (const [safetyType, config] of Object.entries(SAFETY_KEYWORDS_TO_ITEMS)) {
    const matchesJob = config.keywords.some(keyword => lowerDesc.includes(keyword));
    
    if (matchesJob) {
      for (const item of config.items) {
        const alreadyExists = Array.from(existingMaterialNames).some((name: string) => 
          name.includes(item.name.toLowerCase().split(' ')[0]) ||
          item.name.toLowerCase().includes(name.split(' ')[0])
        );
        
        if (!alreadyExists) {
          console.log(`⚠ Safety: Adding "${item.name}" (${safetyType})`);
          injectedMaterials.push(item);
          existingMaterialNames.add(item.name.toLowerCase());
        }
      }
    }
  }
  
  // Step 2: Add commonly-forgotten tasks — but only when the AI hasn't already
  // covered that kind of work, and not clean-up on quick jobs (it's in the task time).
  const THEMES: Record<string, RegExp> = {
    isolation_testing: /\b(test|testing|commission|commissioning|certif|handover|sign.?off)/i,
    waste_disposal: /\b(waste|clean|tidy|clear|disposal|remove old|strip)/i,
    certification: /\b(certif|document|notif|paperwork)/i,
  };
  const aiTaskText = (aiResponse.labour || []).map((l: any) => String(l.name || '')).join(' | ');
  const aiHours = (aiResponse.labour || []).reduce((sum: number, l: any) => sum + (Number(l.hours) || 0), 0);
  for (const [taskType, config] of Object.entries(HIDDEN_TASKS_BY_CONTEXT)) {
    if (!config.keywords.some(keyword => lowerDesc.includes(keyword))) continue;
    if (THEMES[taskType]?.test(aiTaskText)) continue;              // already covered
    if (taskType === 'waste_disposal' && aiHours < 3) continue;     // part of a quick job
    // isolating and testing only applies to services (power, gas, water, heating)
    if (taskType === 'isolation_testing' && !/(electri|socket|circuit|wiring|consumer unit|boiler|gas|plumb|tap|water|heating|radiator|shower|appliance|ev charger|solar)/.test(lowerDesc)) continue;
    for (const task of config.tasks) {
      if (existingLabourNames.has(task.name.toLowerCase())) continue;
      console.log(`⚠ Hidden Task: Adding "${task.name}" (${taskType})`);
      injectedLabour.push(task);
      existingLabourNames.add(task.name.toLowerCase());
    }
  }

  // Step 3: Apply compliance rules from database WITH CONTEXT CHECKING
  // Only apply rules that match the job context
  const RULE_CONTEXT_KEYWORDS: Record<string, string[]> = {
    // Gas/Heating rules
    'BUILDING_REGS_G3': ['unvented', 'cylinder', 'megaflo', 'hot water cylinder', 'immersion'],
    'GAS_SAFE_002': ['commercial', 'restaurant', 'kitchen', 'interlock'],
    'GAS_COMMERCIAL': ['commercial', 'restaurant', 'industrial', 'extraction'],
    // HVAC/Refrigeration rules
    'FGAS_001': ['refrigerant', 'f-gas', 'r410a', 'r32', 'air conditioning', 'hvac', 'refrigeration', 'aircon'],
    'HVAC_001': ['refrigerant', 'f-gas', 'r410a', 'r32', 'air conditioning', 'hvac', 'refrigeration', 'aircon'],
    // Fire safety rules - only for relevant installations
    'BS_5839_6': ['fire alarm', 'smoke detector', 'fire detection', 'alarm system'],
    'FIRE_SAFETY': ['fire alarm', 'fire detection', 'fire suppression', 'sprinkler'],
    // Asbestos - only for old buildings/renovation
    'ASBESTOS_CAR2012': ['old', 'pre-2000', 'period', 'renovation', 'strip out', 'demolition', 'victorian', 'edwardian', 'pre-1990'],
    'CAR-2012': ['old', 'pre-2000', 'period', 'renovation', 'strip out', 'demolition'],
    // Health/safety - only for commercial/larger jobs
    'HEALTH_SAFETY': ['commercial', 'industrial', 'factory', 'warehouse', 'shop', 'restaurant'],
  };
  
  // Items that are documents/procedures, NOT physical products (should not be priced as materials)
  const NON_PHYSICAL_ITEMS = new Set([
    'risk assessment', 'method statement', 'permit', 'licence', 'license',
    'registration', 'approval', 'notification', 'certificate', 'documentation',
    'part p notification', 'building control', 'dno notification', 'planning',
    'consent', 'hse licence', 'air monitoring', 'survey', 'inspection certificate',
    'f10 notification', 'design certificate', 'ec declaration'
  ]);
  
  for (const rule of complianceRules) {
    // Check if this rule requires specific job context keywords
    const requiredKeywords = RULE_CONTEXT_KEYWORDS[rule.rule_code];
    if (requiredKeywords) {
      const hasRequiredContext = requiredKeywords.some(keyword => lowerDesc.includes(keyword));
      if (!hasRequiredContext) {
        console.log(`⏭️ Skipping rule "${rule.rule_code}" - job doesn't match required context`);
        continue; // Skip this rule
      }
    }
    
    const requiredItems = rule.required_items || [];
    for (const item of requiredItems) {
      const itemName = typeof item === 'string' ? item : (item as any).name || String(item);
      const itemLower = itemName.toLowerCase();
      
      // Skip non-physical items (documents, procedures, certifications)
      const isNonPhysical = Array.from(NON_PHYSICAL_ITEMS).some(nonPhys => itemLower.includes(nonPhys));
      if (isNonPhysical) {
        console.log(`⏭️ Skipping non-physical item "${itemName}" from ${rule.rule_code}`);
        continue;
      }
      
      const alreadyExists = Array.from(existingMaterialNames).some((name: string) => 
        name.includes(itemLower.split(' ')[0])
      );
      
      if (!alreadyExists) {
        console.log(`⚠ Compliance (${rule.rule_code}): Adding "${itemName}"`);
        injectedMaterials.push({ name: itemName, quantity: 1, unit: 'each' });
        existingMaterialNames.add(itemLower);
      }
    }
  }
  
  // Step 4: Validate labour hours are realistic (context-aware)
  const totalHours = (aiResponse.labour || []).reduce((sum: number, l: any) => sum + (l.hours || 0), 0);
  
  // Quick fix keywords allow shorter minimum hours
  const QUICK_FIX_KEYWORDS = ['replace washer', 'bleed', 'adjust', 'tighten', 'quick fix', 
    'minor repair', 'simple', 'small repair', 'call out', 'check'];
  const isQuickFix = QUICK_FIX_KEYWORDS.some(keyword => lowerDesc.includes(keyword));
  const isServiceCall = isServiceJob(lowerDesc);
  
  // Allow 0.25 hours (15 mins) minimum for quick fixes, 0.5 otherwise
  const minHours = (isQuickFix || isServiceCall) ? 0.25 : 0.5;
  
  if (totalHours < minHours) {
    issues.push(`Labour hours seem too low (min ${minHours} for this job type)`);
  }
  if (totalHours > 200) {
    issues.push('Labour hours seem unrealistically high');
  }
  
  // Step 5: Validate materials count (service jobs can have 0 materials)
  const materialsCount = (aiResponse.materials || []).length;
  if (materialsCount === 0 && !isServiceCall) {
    issues.push('No materials specified');
  }
  
  console.log(`Validation complete: Injected ${injectedMaterials.length} materials, ${injectedLabour.length} tasks`);
  
  return {
    isValid: issues.length === 0,
    issues,
    injectedMaterials,
    injectedLabour
  };
};

// ═══════════════════════════════════════════════════════════════════
// PART 8: BACKEND PRICING ENGINE
// ═══════════════════════════════════════════════════════════════════

export interface PricedMaterial {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number | null;
  cost: number | null;
  priceSource: string;
  priceConfidence: number;
  supplierUrl?: string;
  matchedProduct?: string;
  fromInventory?: boolean;
  inventoryItemId?: string;
  needsVerification?: boolean;
  /** 'retail' = website price incl. VAT; 'own' = the user's own cost; 'fee' = a service charge */
  priceBasis?: 'retail' | 'own' | 'fee';
  packSize?: number;
  packPrice?: number;
  costPrice?: number;     // what it costs the tradesperson, per unit
  markupPercent?: number;
  livePrice?: boolean;    // read from the supplier's page during this quote
  priceCheckedAt?: string; // when the supplier price was last read
}

export interface PricedLabour {
  name: string;
  hours: number;     // hours, or days when charged by the day
  rate: number;
  cost: number;
  workers?: number;
  unit?: 'hours' | 'days';
}

// ═══════════════════════════════════════════════════════════════════
// PRICING OPTIONS — the tradesperson's own commercial settings
// ═══════════════════════════════════════════════════════════════════

export interface PricingOptions {
  /** VAT-registered: reclaims VAT, so materials are costed ex VAT and VAT is added once at the end */
  vatRegistered?: boolean;
  materialMarkupPercent?: number;   // added on top of cost, e.g. 15
  tradeDiscountPercent?: number;    // off merchant retail, e.g. 10
  chargeWholePacks?: boolean;       // 7 m of a 100 m drum → charge the drum
  hoursPerDay?: number;             // for day-rate jobs, default 8
  overheadRates?: Record<string, number>; // e.g. { transport: 20, 'waste disposal': 40 }
}

const UK_VAT = 0.2;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Turn retail line prices into the tradesperson's cost and then their selling price. */
export const applyCommercialPricing = (lines: PricedMaterial[], opts: PricingOptions): PricedMaterial[] => {
  const vatRegistered = opts.vatRegistered ?? true;
  const discount = Math.min(Math.max(opts.tradeDiscountPercent ?? 0, 0), 90) / 100;
  const markup = Math.max(opts.materialMarkupPercent ?? 0, 0) / 100;

  return lines.map((m) => {
    if (m.priceBasis === 'fee' || m.unitPrice == null || m.priceSource === 'Requirement' || m.priceSource === 'Service Fee') return m;

    // 1. retail total, honouring whole packs where asked
    let retailTotal = (m.unitPrice || 0) * (m.quantity || 0);
    let quantityNote: string | undefined;
    if (opts.chargeWholePacks && m.packSize && m.packSize > 1 && m.packPrice) {
      const packs = Math.ceil((m.quantity || 0) / m.packSize - 1e-9);
      retailTotal = packs * m.packPrice;
      quantityNote = `${packs} × pack of ${m.packSize}`;
    }

    // 2. cost to the tradesperson
    const isRetail = m.priceBasis !== 'own';
    let costTotal = retailTotal;
    if (isRetail) {
      costTotal = costTotal * (1 - discount);
      if (vatRegistered) costTotal = costTotal / (1 + UK_VAT);
    }

    // 3. selling price
    const sellTotal = costTotal * (1 + markup);
    const qty = m.quantity || 1;
    return {
      ...m,
      costPrice: round2(costTotal / qty),
      markupPercent: Math.round(markup * 100),
      unitPrice: round2(sellTotal / qty),
      cost: round2(sellTotal),
      ...(quantityNote && { matchedProduct: `${m.matchedProduct ?? m.name} (${quantityNote})` }),
    };
  });
};

export interface PricedOverhead {
  name: string;
  cost: number;
}

export interface CondensedVersion {
  projectTitle: string;
  summary_description: string;
  materials_total: number;
  labour_total: number;
  overheads_total: number;
  optional_materials_total: number;
  grand_total: number;
}

export const OVERHEAD_PRICING: Record<string, number> = {
  'building control notification': 25,
  'sundries': 10,
  'transport': 25,
  'waste disposal': 35,
  'parking': 15,
  'equipment hire': 50,
  'access equipment': 75,
  'fuel': 20,
  'mileage': 25,
  'scaffolding': 150,
  'skip hire': 250,
  'permit': 50,
  'certification': 75,
  'inspection': 45,
  'premium sealant upgrade': 20,
  'additional waste removal': 40,
  'post-job cleaning service': 35,
  'extended warranty visit': 50,
};

export const getOverheadPrice = (overheadName: string, ownRates: Record<string, number> = {}): number => {
  const lowerName = overheadName.toLowerCase();
  for (const [keyword, price] of Object.entries(ownRates)) {
    if (price != null && lowerName.includes(keyword.toLowerCase())) return Number(price);
  }
  for (const [keyword, price] of Object.entries(OVERHEAD_PRICING)) {
    if (lowerName.includes(keyword)) return price;
  }
  return 30;
};

// Real-time price lookup for items not in database
// Reference prices: estimates with no supplier attached (seeded data). Used
// only after real supplier matches and live lookups fail, and always flagged.
export let REFERENCE_PRICES: any[] = [];

// Live supplier lookups per quote. Each one can take a few seconds, so cap it.
export const LIVE_LOOKUP_LIMIT = Number(Deno.env.get('LIVE_LOOKUPS_PER_QUOTE') || 8);
export let liveLookupsLeft = LIVE_LOOKUP_LIMIT;

export const fetchRealtimePrice = async (
  productName: string,
  trade: string,
  preferredSuppliers?: string[]
): Promise<{ price: number; source: string; confidence: number; url?: string; matchedProduct?: string } | null> => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) return null;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/get-realtime-price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ productName, trade, preferredSuppliers, maxSuppliers: 2 }),
      signal: AbortSignal.timeout(25_000),
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (data.success && data.product) {
      return {
        price: data.product.price,
        source: data.product.source,
        confidence: data.product.confidence || 0.85,
        url: data.product.url,
        matchedProduct: data.product.name,
      };
    }
    return null;
  } catch (error) {
    console.log(`Real-time lookup failed for "${productName}":`, error);
    return null;
  }
};

export const priceMaterials = async (
  materials: any[],
  allPrices: any[],
  inventory: any[],
  primaryTrade: string,
  category: string,
  preferredSuppliers?: string[],
  enableRealtimeLookup: boolean = false,
  jobContext?: 'residential' | 'commercial' | 'unknown'
): Promise<PricedMaterial[]> => {
  console.log(`  Pricing ${materials.length} materials | Context: ${jobContext || 'unknown'} | Preferred: ${preferredSuppliers?.join(', ') || 'none'}`);
  
  
  const pricedMaterials = await Promise.all(materials.map(async (mat: any): Promise<PricedMaterial> => {
    const materialName = mat.name;
    const quantity = mat.quantity || 1;
    const unit = mat.unit || 'each';
    
    // STEP 0: Check if this is a service item (certificates, checks, qualifications)
    // These should NOT be matched to physical products
    if (isServiceItem(materialName)) {
      const servicePrice = getServiceItemPrice(materialName);
      if (servicePrice) {
        console.log(`📋 Service item: "${materialName}" → £${servicePrice.price} [${servicePrice.source}]`);
        return {
          name: materialName,
          quantity,
          unit,
          unitPrice: servicePrice.price,
          cost: Math.round(servicePrice.price * quantity * 100) / 100,
          priceSource: servicePrice.source,
          priceConfidence: 0.9,
          supplierUrl: undefined
        };
      } else {
        // Item is a qualification/requirement - set to 0 cost, user can add manually if needed
        console.log(`📋 Requirement item: "${materialName}" - not a purchasable item`);
        return {
          name: materialName,
          quantity,
          unit,
          unitPrice: 0,
          cost: 0,
          priceSource: 'Requirement',
          priceConfidence: 0,
          needsVerification: false
        };
      }
    }
    
    // Check inventory first
    const inventoryMatch = inventory.find(inv => 
      inv.name.toLowerCase() === materialName.toLowerCase() ||
      inv.name.toLowerCase().includes(materialName.toLowerCase()) ||
      materialName.toLowerCase().includes(inv.name.toLowerCase())
    );
    
    if (inventoryMatch) {
      console.log(`✓ Inventory match: "${materialName}" → "${inventoryMatch.name}" @ £${inventoryMatch.unit_price}/${inventoryMatch.unit}`);
      return {
        name: materialName,
        quantity,
        unit: inventoryMatch.unit || unit,
        unitPrice: inventoryMatch.unit_price,
        cost: Math.round(inventoryMatch.unit_price * quantity * 100) / 100,
        priceSource: 'Inventory',
        priceConfidence: 1.0,
        fromInventory: true,
        inventoryItemId: inventoryMatch.id,
        priceBasis: 'own',
      };
    }
    
    // Real products: what we already know, then live product pages
    if (PRICE_CLIENT) {
      const toLine = (hit: Priced, fetchedAt?: string | null) => ({
        name: materialName,
        quantity,
        unit,
        unitPrice: hit.unitPrice,
        cost: Math.round(hit.unitPrice * quantity * 100) / 100,
        priceSource: hit.supplier,
        priceConfidence: Math.min(0.95, 0.6 + hit.score * 0.35),
        supplierUrl: hit.url || generateSupplierUrl(hit.matchedProduct, hit.supplier, primaryTrade).url,
        matchedProduct: hit.note ? `${hit.matchedProduct} (${hit.note})` : hit.matchedProduct,
        priceBasis: 'retail' as const,
        ...(hit.live ? { livePrice: true } : {}),
        ...(fetchedAt ? { priceCheckedAt: fetchedAt } : {}),
      });
      try {
        const known = await dbOffers(PRICE_CLIENT, materialName);
        const fresh = chooseOffer({ name: materialName, unit }, known.filter(isFresh), isCompatibleProduct, { preferred: preferredSuppliers });
        if (fresh) {
          console.log(`✓ Known price: "${materialName}" → "${fresh.matchedProduct}" £${fresh.unitPrice} [${fresh.supplier}]`);
          return toLine(fresh, known.find((o) => o.name === fresh.matchedProduct)?.fetchedAt);
        }
        if (enableRealtimeLookup && liveLookupsLeft > 0) {
          liveLookupsLeft--;
          const live = chooseOffer({ name: materialName, unit }, await liveOffers(PRICE_CLIENT, { name: materialName, unit }, { category, compatible: isCompatibleProduct, head: headWord }), isCompatibleProduct, { preferred: preferredSuppliers, live: true });
          if (live) {
            console.log(`✓ Live price: "${materialName}" → "${live.matchedProduct}" £${live.unitPrice} [${live.supplier}]`);
            return toLine(live, new Date().toISOString());
          }
        }
        const stale = chooseOffer({ name: materialName, unit }, known, isCompatibleProduct, { preferred: preferredSuppliers });
        if (stale) {
          console.log(`✓ Older price: "${materialName}" → "${stale.matchedProduct}" £${stale.unitPrice}`);
          return { ...toLine(stale, known.find((o) => o.name === stale.matchedProduct)?.fetchedAt), priceConfidence: 0.6 };
        }
      } catch (err) {
        console.log(`Price lookup failed for "${materialName}":`, err instanceof Error ? err.message : err);
      }
    }

    // Try multi-supplier fuzzy matching WITH preferred supplier priority AND job context
    const bestMatch = findBestPriceAcrossSuppliers(
      materialName, 
      allPrices, 
      quantity, 
      unit, 
      category, 
      primaryTrade,
      preferredSuppliers, // Pass preferred suppliers for priority (not filtering!)
      jobContext // Pass job context for domestic/commercial filtering
    );
    
    if (bestMatch) {
      const normalized = normalizeUnitPrice(bestMatch.price, bestMatch.unit, quantity);
      const pack = packInfo(bestMatch.matchedProduct, bestMatch.unit);
      const perItem = pack && parseBulkUnit(bestMatch.unit).quantity <= 1 ? bestMatch.price / pack.size : null;
      
      // Use direct product URL if available, otherwise generate search URL
      let supplierUrl: string;
      let supplier: string;
      
      if (bestMatch.productUrl) {
        // Use the direct product URL from database
        supplierUrl = bestMatch.productUrl;
        supplier = bestMatch.source;
        console.log(`✓ Market match: "${materialName}" → "${bestMatch.matchedProduct}" [${bestMatch.source}]`);
        console.log(`  Direct URL: ${supplierUrl}`);
      } else {
        // Fall back to search URL
        supplierUrl = generateSupplierUrl(bestMatch.matchedProduct, bestMatch.source, primaryTrade).url;
        supplier = bestMatch.source; // the supplier the price actually came from
        console.log(`✓ Market match: "${materialName}" → "${bestMatch.matchedProduct}" [${bestMatch.source}]`);
        console.log(`  Search URL: ${supplierUrl}`);
      }
      
      console.log(`  DB: £${bestMatch.price}/${bestMatch.unit} | Qty: ${quantity} | Per-unit: £${normalized.pricePerUnit} | Total: £${normalized.totalCost}`);
      
      const unitPrice = perItem != null ? Math.round(perItem * 100) / 100 : normalized.pricePerUnit;
      return {
        name: materialName,
        quantity,
        unit,
        unitPrice,
        cost: Math.round(unitPrice * quantity * 100) / 100,
        priceSource: supplier,
        priceConfidence: bestMatch.confidence,
        supplierUrl: supplierUrl,
        matchedProduct: bestMatch.matchedProduct,
        priceBasis: 'retail',
        ...(pack && { packSize: pack.size, packPrice: bestMatch.price }),
      };
    }
    
    // Typical price: from a job recipe, or the AI's own estimate for this exact item.
    // Only used when no real product was found, and always marked Verify.
    const typical = Number(mat.typicalPrice) > 0 ? Number(mat.typicalPrice)
      : Number(mat.estimate) > 0 && Number(mat.estimate) < 5000 ? Number(mat.estimate) : 0;
    if (typical > 0) {
      const unitPrice = typical;
      console.log(`≈ Typical price: "${materialName}" £${unitPrice}/${unit}`);
      return {
        name: materialName,
        quantity,
        unit,
        unitPrice,
        cost: Math.round(unitPrice * quantity * 100) / 100,
        priceSource: Number(mat.typicalPrice) > 0 ? 'Typical price' : 'AI estimate',
        priceConfidence: 0.6,
        supplierUrl: generateSupplierUrl(materialName, undefined, primaryTrade).url,
        needsVerification: true,
        priceBasis: 'retail',
      };
    }

    // Reference price (seeded estimate, no supplier) — better than a keyword guess
    if (REFERENCE_PRICES.length > 0) {
      const ref = findBestPriceAcrossSuppliers(materialName, REFERENCE_PRICES, quantity, unit, category, primaryTrade, undefined, jobContext);
      if (ref && ref.matchScore >= 0.5) {
        const normalized = normalizeUnitPrice(ref.price, ref.unit, quantity);
        console.log(`≈ Reference price: "${materialName}" → "${ref.matchedProduct}" £${normalized.pricePerUnit}`);
        return {
          name: materialName,
          quantity,
          unit,
          unitPrice: normalized.pricePerUnit,
          cost: normalized.totalCost,
          priceSource: 'Estimated',
          priceConfidence: 0.5,
          supplierUrl: generateSupplierUrl(materialName, undefined, primaryTrade).url,
          matchedProduct: ref.matchedProduct,
          needsVerification: true,
          priceBasis: 'retail',
          ...(packInfo(ref.matchedProduct, ref.unit) && { packSize: packInfo(ref.matchedProduct, ref.unit)!.size, packPrice: ref.price }),
        };
      }
    }
    
    // No DB match found - fall back to heuristic estimate (still include prices)
    const estimatedUnitPrice = estimatePriceFromHeuristics(materialName, primaryTrade, category);
    const estimatedCost = Math.round(estimatedUnitPrice * quantity * 100) / 100;

    console.log(`≈ Estimated price: "${materialName}" → £${estimatedUnitPrice}/${unit} (heuristic)`);

    const supplierResult = generateSupplierUrl(materialName, undefined, primaryTrade);

    return {
      name: materialName,
      quantity,
      unit,
      unitPrice: estimatedUnitPrice,
      cost: estimatedCost,
      priceSource: 'Estimated',
      priceConfidence: 0.3,
      supplierUrl: supplierResult.url,
      needsVerification: true,
      priceBasis: 'retail',
    };
  }));
  
  return pricedMaterials;
};

export const applyPricingToQuote = async (
  aiResponse: any,
  allPrices: any[],
  inventory: any[],
  hourlyRate: number,
  dayRate: number,
  paymentType: string,
  numWorkers: number,
  primaryTrade: string,
  category: string,
  jobDescription: string,
  preferredSuppliers?: string[],
  options: PricingOptions = {}
): Promise<{
  projectTitle: string;
  materials: PricedMaterial[];
  optional_materials: PricedMaterial[];
  labour: PricedLabour[];
  overheads: PricedOverhead[];
  suggested_overheads?: PricedOverhead[];
  condensed_version: CondensedVersion;
}> => {
  
  console.log(`\n═══════════════════════════════════════════════════════════════════`);
  console.log(`BACKEND PRICING ENGINE`);
  console.log(`Materials: ${aiResponse.materials?.length || 0}`);
  console.log(`Optional Materials: ${aiResponse.optional_materials?.length || 0}`);
  console.log(`Preferred Suppliers: ${preferredSuppliers?.join(', ') || 'none specified'}`);
  console.log(`═══════════════════════════════════════════════════════════════════\n`);

  // Detect job context for domestic vs commercial filtering
  const jobContext = detectJobContext(jobDescription);

  // Price essential materials (with preferred supplier priority and job context)
  const pricedMaterialsRetail = await priceMaterials(
    aiResponse.materials || [],
    allPrices,
    inventory,
    primaryTrade,
    category,
    preferredSuppliers,
    Deno.env.get('LIVE_PRICE_LOOKUPS') !== 'off', // live supplier lookups for unmatched essentials
    jobContext
  );

  // Price optional materials (with preferred supplier priority and job context)
  const pricedOptionalRetail = await priceMaterials(
    aiResponse.optional_materials || [],
    allPrices,
    inventory,
    primaryTrade,
    category,
    preferredSuppliers,
    false,
    jobContext
  );

  // Retail → cost → selling price (VAT, trade discount, whole packs, markup)
  const pricedMaterials = applyCommercialPricing(pricedMaterialsRetail, options);
  const pricedOptionalMaterials = applyCommercialPricing(pricedOptionalRetail, options);

  // Labour: hours on site × people × rate. Day-rate jobs round up to half days.
  const workers = Math.max(1, Math.round(numWorkers || 1));
  const tasks: { name: string; hours: number }[] = (aiResponse.labour || []).map((t: any) => ({
    name: t.name || 'Labour', hours: Math.max(0, Number(t.hours) || 0),
  }));
  let pricedLabour: PricedLabour[] = [];

  if (paymentType === 'day') {
    const rate = dayRate || 250;
    const hoursPerDay = options.hoursPerDay || 8;
    const totalHours = tasks.reduce((s, t) => s + t.hours, 0) || hoursPerDay;
    // Half-day steps, allowing ~10% overrun before tipping into the next half day
    const days = Math.max(0.5, Math.ceil((totalHours / hoursPerDay - 0.1) * 2 - 1e-9) / 2);
    const name = tasks.length === 1 ? tasks[0].name : tasks.map((t) => t.name).join(', ');
    pricedLabour = [{ name: name || 'Labour', hours: days, rate, workers, unit: 'days', cost: round2(days * rate * workers) }];
    console.log(`Labour (day rate): ${days} day(s) × ${workers} × £${rate} = £${round2(days * rate * workers)}`);
  } else {
    const rate = hourlyRate || 45;
    pricedLabour = tasks.map((t) => ({
      name: t.name, hours: t.hours || 1, rate, workers, unit: 'hours' as const,
      cost: round2((t.hours || 1) * rate * workers),
    }));
  }

  // Price overheads (the user's own rates first)
  const ownRates = options.overheadRates || {};
  const pricedOverheads: PricedOverhead[] = (aiResponse.overheads || []).map((oh: any) => ({
    name: oh.name, cost: getOverheadPrice(oh.name, ownRates),
  }));
  const pricedSuggestedOverheads: PricedOverhead[] = (aiResponse.suggested_overheads || []).map((oh: any) => ({
    name: oh.name, cost: getOverheadPrice(oh.name, ownRates),
  }));

  // Calculate totals (exclude items needing verification)
  const materialsTotal = pricedMaterials.reduce((sum, m) => sum + (m.cost || 0), 0);
  const optionalMaterialsTotal = pricedOptionalMaterials.reduce((sum, m) => sum + (m.cost || 0), 0);
  const labourTotal = pricedLabour.reduce((sum, l) => sum + l.cost, 0);
  const overheadsTotal = pricedOverheads.reduce((sum, o) => sum + o.cost, 0);
  const grandTotal = materialsTotal + labourTotal + overheadsTotal;
  
  // Count items needing verification
  const itemsNeedingVerification = pricedMaterials.filter(m => m.needsVerification).length +
    pricedOptionalMaterials.filter(m => m.needsVerification).length;
  if (itemsNeedingVerification > 0) {
    console.log(`⚠ ${itemsNeedingVerification} items need price verification`);
  }

  // Generate condensed version for PDF export
  const condensedVersion: CondensedVersion = {
    projectTitle: aiResponse.projectTitle || 'Quote',
    summary_description: `Professional ${category.toLowerCase()} work including all materials, labour, and standard overheads. ${jobDescription.slice(0, 100)}${jobDescription.length > 100 ? '...' : ''}`,
    materials_total: Math.round(materialsTotal * 100) / 100,
    labour_total: Math.round(labourTotal * 100) / 100,
    overheads_total: Math.round(overheadsTotal * 100) / 100,
    optional_materials_total: Math.round(optionalMaterialsTotal * 100) / 100,
    grand_total: Math.round(grandTotal * 100) / 100
  };

  console.log(`\n═══════════════════════════════════════════════════════════════════`);
  console.log(`PRICING COMPLETE`);
  console.log(`Materials: £${materialsTotal.toFixed(2)} | Optional: £${optionalMaterialsTotal.toFixed(2)}`);
  console.log(`Labour: £${labourTotal.toFixed(2)} | Overheads: £${overheadsTotal.toFixed(2)}`);
  console.log(`Grand Total: £${grandTotal.toFixed(2)}`);
  console.log(`═══════════════════════════════════════════════════════════════════\n`);

  return {
    projectTitle: aiResponse.projectTitle || 'Quote',
    materials: pricedMaterials,
    optional_materials: pricedOptionalMaterials,
    labour: pricedLabour,
    overheads: pricedOverheads,
    ...(pricedSuggestedOverheads.length > 0 && { suggested_overheads: pricedSuggestedOverheads }),
    condensed_version: condensedVersion
  };
};

// ═══════════════════════════════════════════════════════════════════

// ── state setters used by the request handler ─────────────────────
export const setReferencePrices = (rows: any[]) => { REFERENCE_PRICES = rows; };
export let PRICE_CLIENT: any = null;
/** Supabase client used for price search and live lookups (null = offline, e.g. tests). */
export const setPriceClient = (client: any) => { PRICE_CLIENT = client; };
export const resetLiveLookups = (n: number = LIVE_LOOKUP_LIMIT) => { liveLookupsLeft = n; };

