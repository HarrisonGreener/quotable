// Trade to Supplier mapping for preferred supplier recommendations
// NOTE: Only includes suppliers that allow scraping and are confirmed working
export const TRADE_SUPPLIER_MAPPING: Record<string, string[]> = {
  // Plumbing & Heating
  "plumber": ["Toolstation", "Screwfix", "City Plumbing", "Wolseley"],
  "heating-engineer": ["City Plumbing", "Wolseley", "Toolstation", "Screwfix"],
  "gas-engineer": ["City Plumbing", "Wolseley", "Toolstation", "Screwfix"],
  "boiler-engineer": ["City Plumbing", "Wolseley", "Toolstation"],
  
  // Electrical - REMOVED CEF (408 timeouts), Rexel (blocked by robots.txt)
  "electrician": ["Toolstation", "Screwfix", "Edmundson Electrical", "RS Components"],
  "electrical-engineer": ["RS Components", "Toolstation", "Edmundson Electrical"],
  "ev-charger-installer": ["Toolstation", "Screwfix", "Edmundson Electrical"],
  "solar-panel-installer": ["Toolstation", "Screwfix", "Edmundson Electrical"],
  
  // Building & Construction - ONLY WORKING SUPPLIERS
  "general-builder": ["Toolstation", "Screwfix"],
  "carpenter": ["Toolstation", "Screwfix"],
  "joiner": ["Toolstation", "Screwfix"],
  "roofer": ["Toolstation", "Screwfix"],
  "bricklayer": ["Toolstation", "Screwfix"],
  "groundworker": ["Toolstation", "Screwfix"],
  "plasterer": ["Toolstation", "Screwfix"],
  "tiler": ["Toolstation", "Screwfix"],
  "painter-decorator": ["Toolstation", "Screwfix"],
  
  // HVAC & Refrigeration
  "hvac-engineer": ["Wolseley", "City Plumbing", "Toolstation"],
  "refrigeration-engineer": ["Wolseley", "Toolstation"],
  "air-conditioning-engineer": ["Wolseley", "Toolstation"],
  
  // Automotive - Fallback to general suppliers (auto parts suppliers don't scrape well)
  "auto-mechanic": ["Toolstation", "Screwfix"],
  "hgv-mechanic": ["Toolstation", "Screwfix"],
  "mobile-mechanic": ["Toolstation", "Screwfix"],
  
  // Marine & Aviation
  "marine-engineer": ["RS Components", "Toolstation"],
  "boat-mechanic": ["RS Components", "Toolstation"],
  
  // Mechanical
  "mechanical-engineer": ["RS Components", "Toolstation", "Screwfix"],
  
  // Catering - REMOVED Lockhart Catering (blocked by robots.txt)
  "commercial-catering-engineer": ["Nisbets", "Alliance Online", "Toolstation"],
  
  // General - ONLY WORKING SUPPLIERS
  "handyman": ["Toolstation", "Screwfix"],
  "locksmith": ["Toolstation", "Screwfix"],
  "window-fitter": ["Toolstation", "Screwfix"],
  "flooring-specialist": ["Toolstation", "Screwfix"],
  "landscaper": ["Toolstation", "Screwfix"],
  "fencer": ["Toolstation", "Screwfix"],
  
  // Default for any unmatched trade
  "default": ["Toolstation", "Screwfix"],
};

export interface Supplier {
  id: string;
  name: string;
  description: string;
  website: string;
  searchUrl: string; // Template URL with {query} placeholder
  logo?: string;
  scrapingAllowed: boolean; // Whether we can scrape this supplier
}

// SUPPLIER_DETAILS - Only includes working suppliers
// REMOVED: Lockhart Catering (robots.txt blocked), Rexel (robots.txt blocked), CEF Electrical (408 timeouts)
export const SUPPLIER_DETAILS: Record<string, Supplier> = {
  "Toolstation": {
    id: "toolstation",
    name: "Toolstation",
    description: "General tools, fixings, plumbing & electrical supplies",
    website: "https://www.toolstation.com",
    searchUrl: "https://www.toolstation.com/search?q={query}",
    scrapingAllowed: true,
  },
  "Screwfix": {
    id: "screwfix",
    name: "Screwfix",
    description: "Trade tools, fixings, plumbing & electrical supplies",
    website: "https://www.screwfix.com",
    searchUrl: "https://www.screwfix.com/search?search={query}",
    scrapingAllowed: true,
  },
  "City Plumbing": {
    id: "city-plumbing",
    name: "City Plumbing",
    description: "Specialist plumbing & heating supplies",
    website: "https://www.cityplumbing.co.uk",
    searchUrl: "https://www.cityplumbing.co.uk/search?term={query}",
    scrapingAllowed: true,
  },
  "Jewson": {
    id: "jewson",
    name: "Jewson",
    description: "Building materials & timber supplies",
    website: "https://www.jewson.co.uk",
    searchUrl: "https://www.jewson.co.uk/search?q={query}",
    scrapingAllowed: true,
  },
  "Travis Perkins": {
    id: "travis-perkins",
    name: "Travis Perkins",
    description: "Building materials & construction supplies",
    website: "https://www.travisperkins.co.uk",
    searchUrl: "https://www.travisperkins.co.uk/search?text={query}",
    scrapingAllowed: true,
  },
  "Wolseley": {
    id: "wolseley",
    name: "Wolseley",
    description: "Plumbing & HVAC wholesale",
    website: "https://www.wolseley.co.uk",
    searchUrl: "https://www.wolseley.co.uk/search?q={query}",
    scrapingAllowed: true,
  },
  "Euro Car Parts": {
    id: "euro-car-parts",
    name: "Euro Car Parts",
    description: "Automotive parts & accessories",
    website: "https://www.eurocarparts.com",
    searchUrl: "https://www.eurocarparts.com/search/{query}",
    scrapingAllowed: true,
  },
  "GSF Car Parts": {
    id: "gsf-car-parts",
    name: "GSF Car Parts",
    description: "Automotive parts & motor factors",
    website: "https://www.gsfcarparts.com",
    searchUrl: "https://www.gsfcarparts.com/search?q={query}",
    scrapingAllowed: true,
  },
  "Halfords Trade": {
    id: "halfords-trade",
    name: "Halfords Trade",
    description: "Automotive parts & tools",
    website: "https://www.halfords.com",
    searchUrl: "https://www.halfords.com/search?q={query}",
    scrapingAllowed: true,
  },
  "RS Components": {
    id: "rs-components",
    name: "RS Components",
    description: "Electronic & mechanical components",
    website: "https://uk.rs-online.com",
    searchUrl: "https://uk.rs-online.com/web/c/?searchTerm={query}",
    scrapingAllowed: true,
  },
  "Nisbets": {
    id: "nisbets",
    name: "Nisbets",
    description: "Commercial catering equipment & supplies",
    website: "https://www.nisbets.co.uk",
    searchUrl: "https://www.nisbets.co.uk/search/?text={query}",
    scrapingAllowed: true,
  },
  "Alliance Online": {
    id: "alliance-online",
    name: "Alliance Online",
    description: "Commercial catering equipment",
    website: "https://www.allianceonline.co.uk",
    searchUrl: "https://www.allianceonline.co.uk/catalogsearch/result/?q={query}",
    scrapingAllowed: true,
  },
  "B&Q": {
    id: "bq",
    name: "B&Q",
    description: "DIY & building supplies",
    website: "https://www.diy.com",
    searchUrl: "https://www.diy.com/search?term={query}",
    scrapingAllowed: true,
  },
  "B&Q Trade Point": {
    id: "bq-trade-point",
    name: "B&Q Trade Point",
    description: "Trade DIY & building supplies",
    website: "https://www.tradepoint.co.uk",
    searchUrl: "https://www.tradepoint.co.uk/search?term={query}",
    scrapingAllowed: true,
  },
  "Wickes": {
    id: "wickes",
    name: "Wickes",
    description: "DIY & building supplies",
    website: "https://www.wickes.co.uk",
    searchUrl: "https://www.wickes.co.uk/search?text={query}",
    scrapingAllowed: true,
  },
  "Howdens": {
    id: "howdens",
    name: "Howdens",
    description: "Kitchen & joinery supplies",
    website: "https://www.howdens.com",
    searchUrl: "https://www.howdens.com/search?q={query}",
    scrapingAllowed: true,
  },
  "Plumbase": {
    id: "plumbase",
    name: "Plumbase",
    description: "Plumbing & heating supplies",
    website: "https://www.plumbase.co.uk",
    searchUrl: "https://www.plumbase.co.uk/search?q={query}",
    scrapingAllowed: true,
  },
  "PlumbNation": {
    id: "plumbnation",
    name: "PlumbNation",
    description: "Online plumbing supplies",
    website: "https://www.plumbnation.co.uk",
    searchUrl: "https://www.plumbnation.co.uk/catalogsearch/result/?q={query}",
    scrapingAllowed: true,
  },
  "Edmundson Electrical": {
    id: "edmundson-electrical",
    name: "Edmundson Electrical",
    description: "Electrical wholesale supplies",
    website: "https://www.edmundson-electrical.co.uk",
    searchUrl: "https://www.edmundson-electrical.co.uk/search?q={query}",
    scrapingAllowed: true,
  },
  "Selco": {
    id: "selco",
    name: "Selco",
    description: "Builders merchant",
    website: "https://www.selcobw.com",
    searchUrl: "https://www.selcobw.com/search?q={query}",
    scrapingAllowed: true,
  },
  "IronmongeryDirect": {
    id: "ironmongery-direct",
    name: "IronmongeryDirect",
    description: "Door furniture, locks & fixings",
    website: "https://www.ironmongerydirect.co.uk",
    searchUrl: "https://www.ironmongerydirect.co.uk/search?query={query}",
    scrapingAllowed: true,
  },
  // Fallback for unknown sources
  "Estimated": {
    id: "estimated",
    name: "Estimated",
    description: "AI-generated price estimate",
    website: "https://www.google.com",
    searchUrl: "https://www.google.com/search?q={query}+buy+UK+price",
    scrapingAllowed: false,
  },
};

// Product category detection for smart supplier matching - COMPREHENSIVE KEYWORDS
const PRODUCT_KEYWORDS_TO_CATEGORY: Record<string, string> = {
  // Catering keywords - COMPREHENSIVE
  'combi oven': 'catering', 'combi-oven': 'catering', 'rational': 'catering',
  'hobart': 'catering', 'winterhalter': 'catering', 'dishwasher': 'catering',
  'extraction hood': 'catering', 'fryer': 'catering', 'griddle': 'catering',
  'commercial oven': 'catering', 'bain marie': 'catering', 'pass-through': 'catering',
  'oven': 'catering', 'grill': 'catering', 'steamer': 'catering', 'salamander': 'catering',
  'blast chiller': 'catering', 'prep table': 'catering', 'stainless steel table': 'catering',
  'grease trap': 'catering', 'canopy': 'catering', 'extractor': 'catering',
  'commercial refriger': 'catering', 'display fridge': 'catering', 'ice machine': 'catering',
  'bottle cooler': 'catering', 'chest freezer': 'catering', 'upright freezer': 'catering',
  'hot cupboard': 'catering', 'heated display': 'catering', 'food warmer': 'catering',
  'microwave commercial': 'catering', 'toaster commercial': 'catering', 'mixer commercial': 'catering',
  'slicer': 'catering', 'vacuum packer': 'catering', 'sous vide': 'catering',
  'pot wash': 'catering', 'glasswasher': 'catering', 'conveyor': 'catering',
  'catering': 'catering', 'kitchen equipment': 'catering', 'commercial kitchen': 'catering',
  // Automotive keywords
  'brake pad': 'automotive', 'brake disc': 'automotive', 'oil filter': 'automotive',
  'spark plug': 'automotive', 'timing belt': 'automotive', 'alternator': 'automotive',
  'clutch': 'automotive', 'gearbox': 'automotive', 'suspension': 'automotive',
  'car battery': 'automotive', 'wiper blade': 'automotive', 'brake fluid': 'automotive',
  'engine oil': 'automotive', 'coolant': 'automotive', 'antifreeze': 'automotive',
  // Electrical keywords  
  'consumer unit': 'electrical', 'mcb': 'electrical', 'rcbo': 'electrical',
  'distribution board': 'electrical', 'conduit': 'electrical', 'trunking': 'electrical',
  'socket outlet': 'electrical', 'light switch': 'electrical', 'dimmer': 'electrical',
  // HVAC keywords
  'boiler': 'hvac', 'radiator': 'hvac', 'thermostat': 'hvac', 'heat pump': 'hvac',
  'heating valve': 'hvac', 'trv': 'hvac', 'expansion vessel': 'hvac',
};

// Updated category supplier map - uses only working suppliers
const CATEGORY_SUPPLIER_MAP: Record<string, string> = {
  'catering': 'Nisbets',
  'automotive': 'GSF Car Parts',
  'electrical': 'Edmundson Electrical', // Changed from CEF Electrical
  'hvac': 'City Plumbing',
  'plumbing': 'City Plumbing',
};

// Trade to default category - USE TRADE-SPECIFIC SUPPLIERS AS DEFAULT
const TRADE_DEFAULT_CATEGORY: Record<string, string> = {
  'commercial-catering-engineer': 'catering',
  'auto-mechanic': 'automotive',
  'hgv-mechanic': 'automotive',
  'mobile-mechanic': 'automotive',
  'electrician': 'electrical',
  'electrical-engineer': 'electrical',
  'plumber': 'plumbing',
  'heating-engineer': 'hvac',
  'gas-engineer': 'hvac',
  'hvac-engineer': 'hvac',
};

// General DIY items that CAN come from Toolstation/Screwfix
const GENERAL_ITEMS_KEYWORDS = [
  'screw', 'bolt', 'nut', 'washer', 'plug', 'fixing', 'bracket', 'clip',
  'tape', 'silicone', 'sealant', 'ptfe', 'adhesive', 'glue',
  'cable tie', 'connector', 'terminal', 'junction box',
  'drill bit', 'saw blade', 'sandpaper', 'brush',
];

// Check if item is a general DIY item
const isGeneralItem = (productName: string): boolean => {
  const lowerName = productName.toLowerCase();
  return GENERAL_ITEMS_KEYWORDS.some(keyword => lowerName.includes(keyword));
};

// Detect product category from name - now considers trade context
const detectProductCategory = (productName: string, trade?: string): string | null => {
  const lowerName = productName.toLowerCase();
  
  // First check explicit product keywords
  for (const [keyword, category] of Object.entries(PRODUCT_KEYWORDS_TO_CATEGORY)) {
    if (lowerName.includes(keyword)) {
      return category;
    }
  }
  
  // If no explicit match and NOT a general item, use trade default
  if (trade && !isGeneralItem(productName)) {
    const tradeLower = trade.toLowerCase();
    if (TRADE_DEFAULT_CATEGORY[tradeLower]) {
      return TRADE_DEFAULT_CATEGORY[tradeLower];
    }
  }
  
  return null;
};

// Simplify product name for better search results - more aggressive for broader searches
const simplifyProductName = (fullName: string): string => {
  // Extract brand if present (first word if capitalized)
  const words = fullName.split(' ');
  const brand = /^[A-Z][a-z]+$/.test(words[0]) ? words[0] : '';
  
  const noisePatterns = [
    /\b\d+mm\b/gi,
    /\b\d+m\b/gi,
    /\b\d+v\b/gi,
    /\b\d+-\d+\/\d+\b/gi,
    /\b\d+kw\b/gi,
    /\b\d+a\b/gi,
    /\b\d+x\d+\b/gi,
    /\b\d+l\b/gi,
    /\b\d+w\b/gi,
    /\(.*?\)/g,
    /\b(pack of|box of|set of|pair of)\s*\d+\b/gi,
    /\b(white|black|grey|gray|chrome|brass|copper|stainless|steel|plastic)\b/gi,
    /\b(left|right|handed|indoor|outdoor|external|internal)\b/gi,
    /\btype\s*[a-z0-9]+\b/gi,
    /\b(model|series|range|pro|plus|max|mini)\b/gi,
    /\b\d+[-/]\d+\b/gi,
  ];

  let simplified = fullName;
  noisePatterns.forEach(pattern => {
    simplified = simplified.replace(pattern, '');
  });

  simplified = simplified.replace(/\s+/g, ' ').trim();
  const remainingWords = simplified.split(' ').filter(w => w.length > 2);
  
  // Get 2-3 core words (brand + product type)
  const coreWords = remainingWords.slice(0, 2).join(' ');

  // Return: brand + core type or just core type
  if (brand && !coreWords.toLowerCase().includes(brand.toLowerCase())) {
    return `${brand} ${coreWords}`.trim();
  }
  
  return coreWords.length >= 4 ? coreWords : fullName.split(' ').slice(0, 2).join(' ');
};

// Get supplier search URL for a product - returns both url and supplier name
export const getSupplierSearchUrl = (supplierName: string, productName: string): { url: string; supplier: string } => {
  const searchTerm = simplifyProductName(productName);
  const supplier = SUPPLIER_DETAILS[supplierName];
  if (supplier?.searchUrl) {
    return { 
      url: supplier.searchUrl.replace('{query}', encodeURIComponent(searchTerm)),
      supplier: supplierName
    };
  }
  // Fallback to Google search
  return { 
    url: `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}+buy+UK+price`,
    supplier: 'Estimated'
  };
};

// Generate supplier URL if AI didn't provide one - returns BOTH url and actual supplier for badge sync
export const generateSupplierUrl = (
  productName: string, 
  priceSource?: string,
  trade?: string
): { url: string; supplier: string } => {
  const searchTerm = simplifyProductName(productName);
  const encodedProduct = encodeURIComponent(searchTerm.replace(/\s+/g, '+'));
  
  // Normalize supplier names
  const normalizeSupplierName = (name: string): string => {
    if (name === 'Toolstation Public Catalogue') return 'Toolstation';
    if (name === 'Screwfix Public Catalogue') return 'Screwfix';
    return name;
  };
  
  // INVALID sources for specialized trades - these don't sell trade-specific equipment
  const GENERAL_DIY_SUPPLIERS = ['Toolstation', 'Toolstation Public Catalogue', 'Screwfix', 'Screwfix Public Catalogue', 'B&Q', 'Wickes'];
  
  // Detect product category (now considers trade context)
  const productCategory = detectProductCategory(productName, trade);
  
  // If we detected a specialized category
  if (productCategory && CATEGORY_SUPPLIER_MAP[productCategory]) {
    const categorySupplier = CATEGORY_SUPPLIER_MAP[productCategory];
    
    // Override if priceSource is a general DIY store for specialized items
    if (priceSource && GENERAL_DIY_SUPPLIERS.includes(priceSource) && !isGeneralItem(productName)) {
      const url = SUPPLIER_DETAILS[categorySupplier]?.searchUrl.replace('{query}', encodedProduct) 
        || `https://www.google.com/search?q=${encodedProduct}+buy+UK+price`;
      return { url, supplier: categorySupplier };
    }
    
    // If priceSource is valid and not a mismatch, use it
    const normalizedSource = normalizeSupplierName(priceSource || '');
    if (priceSource && priceSource !== 'Estimated' && SUPPLIER_DETAILS[priceSource] && !GENERAL_DIY_SUPPLIERS.includes(priceSource)) {
      return { 
        url: SUPPLIER_DETAILS[priceSource].searchUrl.replace('{query}', encodedProduct),
        supplier: normalizedSource
      };
    }
    
    // Use category supplier
    const url = SUPPLIER_DETAILS[categorySupplier]?.searchUrl.replace('{query}', encodedProduct) 
      || `https://www.google.com/search?q=${encodedProduct}+buy+UK+price`;
    return { url, supplier: categorySupplier };
  }
  
  // For general items or unknown categories, use priceSource if valid
  if (priceSource && priceSource !== 'Estimated' && SUPPLIER_DETAILS[priceSource]) {
    const normalizedSource = normalizeSupplierName(priceSource);
    return { 
      url: SUPPLIER_DETAILS[priceSource].searchUrl.replace('{query}', encodedProduct),
      supplier: normalizedSource
    };
  }
  
  // Fall back to Screwfix for general items
  return { 
    url: SUPPLIER_DETAILS['Screwfix']?.searchUrl.replace('{query}', encodedProduct) 
      || `https://www.google.com/search?q=${encodedProduct}+buy+UK+price`,
    supplier: 'Screwfix'
  };
};

// Get recommended suppliers for a trade
export const getRecommendedSuppliers = (trade: string): string[] => {
  const normalizedTrade = trade.toLowerCase().replace(/\s+/g, '-');
  return TRADE_SUPPLIER_MAPPING[normalizedTrade] || TRADE_SUPPLIER_MAPPING['default'];
};

// Get supplier details by name
export const getSupplierDetails = (supplierName: string): Supplier | undefined => {
  return SUPPLIER_DETAILS[supplierName];
};
