export interface Trade {
  value: string;
  label: string;
  category: string;
}

export interface TradeCategory {
  name: string;
  trades: Trade[];
}

export const TRADE_CATEGORIES: TradeCategory[] = [
  {
    name: "Building & Construction",
    trades: [
      { value: "general-builder", label: "General Builder", category: "Building & Construction" },
      { value: "carpenter", label: "Carpenter / Joiner", category: "Building & Construction" },
      { value: "roofer", label: "Roofer", category: "Building & Construction" },
      { value: "plasterer", label: "Plasterer", category: "Building & Construction" },
      { value: "bricklayer", label: "Bricklayer", category: "Building & Construction" },
      { value: "stonemason", label: "Stonemason", category: "Building & Construction" },
      { value: "scaffolder", label: "Scaffolder", category: "Building & Construction" },
      { value: "demolition", label: "Demolition Specialist", category: "Building & Construction" },
      { value: "groundworker", label: "Groundworker", category: "Building & Construction" },
    ]
  },
  {
    name: "Electrical & Power",
    trades: [
      { value: "electrician", label: "Electrician", category: "Electrical & Power" },
      { value: "electrical-engineer", label: "Electrical Engineer", category: "Electrical & Power" },
      { value: "solar-installer", label: "Solar Panel Installer", category: "Electrical & Power" },
      { value: "ev-installer", label: "EV Charger Installer", category: "Electrical & Power" },
      { value: "security-systems", label: "Security Systems Engineer", category: "Electrical & Power" },
    ]
  },
  {
    name: "Plumbing & Heating",
    trades: [
      { value: "plumber", label: "Plumber", category: "Plumbing & Heating" },
      { value: "heating-engineer", label: "Heating Engineer", category: "Plumbing & Heating" },
      { value: "gas-engineer", label: "Gas Engineer", category: "Plumbing & Heating" },
      { value: "boiler-engineer", label: "Boiler Engineer", category: "Plumbing & Heating" },
      { value: "underfloor-heating", label: "Underfloor Heating Specialist", category: "Plumbing & Heating" },
    ]
  },
  {
    name: "HVAC & Climate",
    trades: [
      { value: "hvac-engineer", label: "HVAC Engineer", category: "HVAC & Climate" },
      { value: "air-conditioning", label: "Air Conditioning Engineer", category: "HVAC & Climate" },
      { value: "refrigeration", label: "Refrigeration Engineer", category: "HVAC & Climate" },
      { value: "ventilation", label: "Ventilation Specialist", category: "HVAC & Climate" },
    ]
  },
  {
    name: "Catering & Kitchen",
    trades: [
      { value: "commercial-catering-engineer", label: "Commercial Catering Engineer", category: "Catering & Kitchen" },
      { value: "kitchen-equipment-engineer", label: "Kitchen Equipment Engineer", category: "Catering & Kitchen" },
    ]
  },
  {
    name: "Mechanical & Engineering",
    trades: [
      { value: "mechanical-engineer", label: "Mechanical Engineer", category: "Mechanical & Engineering" },
      { value: "industrial-engineer", label: "Industrial Engineer", category: "Mechanical & Engineering" },
      { value: "maintenance-engineer", label: "Maintenance Engineer", category: "Mechanical & Engineering" },
      { value: "plant-mechanic", label: "Plant Mechanic", category: "Mechanical & Engineering" },
      { value: "hydraulics-engineer", label: "Hydraulics Engineer", category: "Mechanical & Engineering" },
      { value: "pneumatics-engineer", label: "Pneumatics Engineer", category: "Mechanical & Engineering" },
    ]
  },
  {
    name: "Automotive & Marine",
    trades: [
      { value: "auto-mechanic", label: "Auto Mechanic", category: "Automotive & Marine" },
      { value: "vehicle-electrician", label: "Vehicle Electrician", category: "Automotive & Marine" },
      { value: "hgv-mechanic", label: "HGV / Fleet Mechanic", category: "Automotive & Marine" },
      { value: "marine-engineer", label: "Marine Engineer", category: "Automotive & Marine" },
      { value: "agricultural-mechanic", label: "Agricultural Mechanic", category: "Automotive & Marine" },
      { value: "aviation-engineer", label: "Aviation Engineer", category: "Automotive & Marine" },
    ]
  },
  {
    name: "Interior & Finishing",
    trades: [
      { value: "kitchen-fitter", label: "Kitchen Fitter", category: "Interior & Finishing" },
      { value: "bathroom-fitter", label: "Bathroom Fitter", category: "Interior & Finishing" },
      { value: "painter-decorator", label: "Painter & Decorator", category: "Interior & Finishing" },
      { value: "tiler", label: "Tiler", category: "Interior & Finishing" },
      { value: "flooring-specialist", label: "Flooring Specialist", category: "Interior & Finishing" },
      { value: "window-fitter", label: "Window Fitter", category: "Interior & Finishing" },
      { value: "glazier", label: "Glazier", category: "Interior & Finishing" },
    ]
  },
  {
    name: "Exterior & Landscaping",
    trades: [
      { value: "landscaper", label: "Landscaper", category: "Exterior & Landscaping" },
      { value: "fencer", label: "Fencer", category: "Exterior & Landscaping" },
      { value: "driveway-specialist", label: "Driveway Specialist", category: "Exterior & Landscaping" },
      { value: "tree-surgeon", label: "Tree Surgeon", category: "Exterior & Landscaping" },
    ]
  },
  {
    name: "Specialist Trades",
    trades: [
      { value: "locksmith", label: "Locksmith", category: "Specialist Trades" },
      { value: "fire-safety", label: "Fire Safety Engineer", category: "Specialist Trades" },
      { value: "lift-engineer", label: "Lift / Elevator Engineer", category: "Specialist Trades" },
      { value: "pool-spa", label: "Pool / Spa Engineer", category: "Specialist Trades" },
      { value: "cleaning-services", label: "Cleaning Services", category: "Specialist Trades" },
      { value: "pest-control", label: "Pest Control", category: "Specialist Trades" },
    ]
  },
  {
    name: "Other",
    trades: [
      { value: "multi-trade", label: "Multi-Trade (Various)", category: "Other" },
      { value: "other", label: "Other (Specify)", category: "Other" },
    ]
  }
];

export const ALL_TRADES: Trade[] = TRADE_CATEGORIES.flatMap(category => category.trades);

export const TRADE_SPECIALIZATIONS: Record<string, string[]> = {
  "plumber": [
    "Boiler installation & servicing",
    "Bathroom installation",
    "Underfloor heating",
    "Commercial plumbing",
    "Emergency repairs",
    "Gas work (Gas Safe registered)",
    "Renewable energy (heat pumps)"
  ],
  "electrician": [
    "Domestic rewiring",
    "EV charger installation",
    "Smart home systems",
    "Commercial electrical",
    "Solar panel installation",
    "Emergency lighting",
    "Inspection & testing"
  ],
  "carpenter": [
    "Fitted furniture",
    "Kitchen fitting",
    "Flooring",
    "Roofing carpentry",
    "Staircase installation",
    "Shop fitting",
    "Decking & pergolas"
  ],
  "roofer": [
    "Flat roofing",
    "Pitched roofing",
    "Lead work",
    "Chimney repairs",
    "Guttering",
    "Commercial roofing",
    "Green roofs"
  ],
  "auto-mechanic": [
    "Engine repair & servicing",
    "Brakes & suspension",
    "MOT testing",
    "Diagnostics",
    "Transmission work",
    "Air conditioning",
    "Exhaust systems"
  ],
  "marine-engineer": [
    "Inboard engines",
    "Outboard motors",
    "Hull systems",
    "Navigation equipment",
    "Fuel systems",
    "Electrical systems"
  ],
  "hvac-engineer": [
    "Air conditioning installation",
    "Ventilation systems",
    "Heat pumps",
    "Refrigeration",
    "Ductwork design",
    "Commercial HVAC"
  ],
  "mechanical-engineer": [
    "Industrial machinery",
    "Pumps & compressors",
    "Conveyors",
    "Bearings & seals",
    "Hydraulic systems",
    "Preventive maintenance"
  ],
  "commercial-catering-engineer": [
    "Commercial oven repair",
    "Dishwasher servicing",
    "Refrigeration units",
    "Extraction systems",
    "Gas appliances",
    "Ice machines",
    "Coffee machines"
  ],
  "kitchen-equipment-engineer": [
    "Commercial ovens",
    "Fryers & grills",
    "Dishwashers",
    "Refrigeration",
    "Extraction",
    "Gas safety"
  ],
  "fire-safety": [
    "Alarm systems",
    "Sprinklers",
    "Extinguishers",
    "Emergency lighting",
    "Fire doors",
    "Risk assessments"
  ],
  "solar-installer": [
    "Residential PV systems",
    "Commercial PV systems",
    "Battery storage",
    "EV integration",
    "Maintenance & repairs"
  ],
  "lift-engineer": [
    "Passenger lifts",
    "Goods lifts",
    "Escalators",
    "Stairlifts",
    "Platform lifts"
  ],
  "locksmith": [
    "Lock replacement",
    "Emergency lockout",
    "UPVC door repair",
    "Safe installation",
    "Access control",
    "Key cutting"
  ],
  "landscaper": [
    "Paving & patios",
    "Fencing",
    "Decking",
    "Turfing",
    "Garden design",
    "Groundwork"
  ],
  "kitchen-fitter": [
    "Full kitchen installation",
    "Worktop fitting",
    "Appliance installation",
    "Kitchen design",
    "Unit assembly"
  ],
  "bathroom-fitter": [
    "Full bathroom installation",
    "Wet rooms",
    "Shower installation",
    "Tiling",
    "Plumbing",
    "Electrical work"
  ],
  "aviation-engineer": [
    "Aircraft maintenance",
    "Avionics",
    "Engine servicing",
    "Structural repairs",
    "Safety inspections"
  ]
};

export const TRADE_CERTIFICATIONS: Record<string, string[]> = {
  "gas-engineer": ["Gas Safe Registered"],
  "plumber": ["Gas Safe Registered", "CIPHE", "WaterSafe"],
  "electrician": ["NICEIC Approved", "Part P Certified", "City & Guilds", "ECS Card"],
  "electrical-engineer": ["IET Member", "CEng", "NICEIC", "ECS Card"],
  "heating-engineer": ["Gas Safe Registered", "OFTEC", "MCS Certified"],
  "hvac-engineer": ["FGAS Certified", "REFCOM", "City & Guilds"],
  "refrigeration": ["FGAS Certified", "REFCOM"],
  "commercial-catering-engineer": ["Gas Safe Registered (Commercial)", "FGAS Certified", "City & Guilds"],
  "kitchen-equipment-engineer": ["Gas Safe Registered", "FGAS Certified"],
  "auto-mechanic": ["IMI Certified", "MOT Tester License"],
  "roofer": ["NFRC Member", "Competent Roofer Scheme"],
  "fire-safety": ["FIA Certified", "BAFE Approved"],
  "solar-installer": ["MCS Certified", "NICEIC", "G99 Qualified"],
  "lift-engineer": ["LEIA Member", "NVQ Level 3"],
  "locksmith": ["Master Locksmiths Association"],
  "general": ["CSCS Card", "CITB", "First Aid", "Health & Safety"]
};
