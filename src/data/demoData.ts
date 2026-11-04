// Coherent demo data for all pages
export interface Quote {
  id: string;
  title: string;
  date: string;
  client: string;
  location: string;
  category: string;
  summary?: string;
  grand_total: number;
  status: "Draft" | "Sent" | "Accepted" | "Rejected";
  materials: number;
  labour: number;
  overheads: number;
  created_at?: string;
}

export interface Invoice {
  id: string;
  quoteId: string;
  client: string;
  title: string;
  summary?: string;
  date: string;
  dueDate: string;
  amount: number;
  tax: number;
  total: number;
  status: "Draft" | "Pending" | "Paid" | "Overdue";
}

export const CATEGORIES = [
  "Kitchen Renovation",
  "Bathroom",
  "Electrical",
  "Plumbing",
  "Flooring",
  "Roofing",
  "Painting & Decorating",
  "Outdoor & Landscaping",
  "Extensions & Conversions",
  "Other",
] as const;

export const UK_LOCATIONS = [
  "London, UK",
  "Manchester, UK",
  "Birmingham, UK",
  "Leeds, UK",
  "Glasgow, UK",
  "Liverpool, UK",
  "Newcastle, UK",
  "Sheffield, UK",
  "Bristol, UK",
  "Edinburgh, UK",
] as const;

export const demoQuotes: Quote[] = [
  {
    id: "Q-001",
    title: "Kitchen Renovation - Oak Cabinets",
    date: "2025-01-15",
    created_at: "2025-01-15T09:30:00Z",
    client: "ABC Construction Ltd",
    location: "London, UK",
    category: "Kitchen Renovation",
    summary: "This quote covers the complete kitchen renovation including supply and installation of premium oak cabinets, countertops, and modern fixtures. Estimated total: £12,500.",
    grand_total: 12500,
    status: "Accepted",
    materials: 7500,
    labour: 4000,
    overheads: 1000,
  },
  {
    id: "Q-002",
    title: "Bathroom Remodel - Modern Suite",
    date: "2025-01-12",
    created_at: "2025-01-12T14:20:00Z",
    client: "HomeBuilders Inc",
    location: "Manchester, UK",
    category: "Bathroom",
    summary: "Complete bathroom remodel featuring a contemporary suite with walk-in shower, vanity unit, and designer tiles. Includes all labour and materials. Estimated total: £8,200.",
    grand_total: 8200,
    status: "Rejected",
    materials: 5000,
    labour: 2700,
    overheads: 500,
  },
  {
    id: "Q-003",
    title: "Composite Deck Installation",
    date: "2025-01-10",
    created_at: "2025-01-10T11:15:00Z",
    client: "Urban Renovations",
    location: "Birmingham, UK",
    category: "Outdoor & Landscaping",
    summary: "Installation of a 30m² composite decking area with premium weather-resistant boards and structural framing. Includes groundwork preparation and finishing. Estimated total: £15,800.",
    grand_total: 15800,
    status: "Accepted",
    materials: 9800,
    labour: 5000,
    overheads: 1000,
  },
  {
    id: "Q-004",
    title: "Electrical Rewiring - 3 Bed House",
    date: "2025-01-08",
    created_at: "2025-01-08T16:45:00Z",
    client: "Property Solutions Group",
    location: "Leeds, UK",
    category: "Electrical",
    summary: "Full electrical rewiring for a 3-bedroom house including new consumer unit, wiring throughout, and modern fittings. Includes certification. Estimated total: £6,500.",
    grand_total: 6500,
    status: "Rejected",
    materials: 3500,
    labour: 2500,
    overheads: 500,
  },
  {
    id: "Q-005",
    title: "Garden Landscaping - Complete Makeover",
    date: "2025-01-05",
    created_at: "2025-01-05T10:30:00Z",
    client: "Green Spaces Ltd",
    location: "Bristol, UK",
    category: "Outdoor & Landscaping",
    summary: "Complete garden transformation including paving, turfing, raised beds, and feature planting. Estimated total: £9,200.",
    grand_total: 9200,
    status: "Accepted",
    materials: 5500,
    labour: 3000,
    overheads: 700,
  },
  {
    id: "Q-006",
    title: "Roof Repair - Tile Replacement",
    date: "2025-01-03",
    created_at: "2025-01-03T13:00:00Z",
    client: "Property Maintenance Co",
    location: "Edinburgh, UK",
    category: "Roofing",
    summary: "Repair and replacement of damaged roof tiles on a semi-detached property including scaffolding and weatherproofing. Estimated total: £4,800.",
    grand_total: 4800,
    status: "Rejected",
    materials: 2800,
    labour: 1700,
    overheads: 300,
  },
  {
    id: "Q-007",
    title: "Painting & Decorating - Full House",
    date: "2024-12-28",
    created_at: "2024-12-28T09:00:00Z",
    client: "Riverside Properties",
    location: "Liverpool, UK",
    category: "Painting & Decorating",
    summary: "Full interior painting and decorating for a 4-bedroom house including preparation, materials, and finishing. Estimated total: £5,500.",
    grand_total: 5500,
    status: "Accepted",
    materials: 2000,
    labour: 3000,
    overheads: 500,
  },
  {
    id: "Q-008",
    title: "Plumbing - New Boiler Installation",
    date: "2024-12-20",
    created_at: "2024-12-20T15:30:00Z",
    client: "HomeComfort Solutions",
    location: "Sheffield, UK",
    category: "Plumbing",
    summary: "Supply and installation of a new combi boiler system including pipework, radiator balancing, and system flush. Estimated total: £3,200.",
    grand_total: 3200,
    status: "Accepted",
    materials: 2000,
    labour: 1000,
    overheads: 200,
  },
  {
    id: "Q-009",
    title: "Office Extension - Ground Floor",
    date: "2024-12-15",
    created_at: "2024-12-15T11:00:00Z",
    client: "Commercial Builders Ltd",
    location: "Newcastle, UK",
    category: "Extensions & Conversions",
    summary: "Ground floor office extension including foundations, structural work, and finishes. Estimated total: £22,500.",
    grand_total: 22500,
    status: "Rejected",
    materials: 14000,
    labour: 7000,
    overheads: 1500,
  },
];

export const demoInvoices: Invoice[] = [
  {
    id: "INV-001",
    quoteId: "Q-001",
    client: "ABC Construction Ltd",
    title: "Kitchen Renovation - Oak Cabinets",
    summary: "Payment for completed kitchen renovation including oak cabinets, countertops, and modern fixtures as per agreed quote.",
    date: "2025-01-18",
    dueDate: "2025-02-17",
    amount: 12500,
    tax: 2500,
    total: 15000,
    status: "Paid",
  },
  {
    id: "INV-002",
    quoteId: "Q-002",
    client: "HomeBuilders Inc",
    title: "Bathroom Remodel - Modern Suite",
    summary: "Invoice for bathroom remodel with contemporary suite, walk-in shower, and designer tiles installation.",
    date: "2025-01-15",
    dueDate: "2025-02-14",
    amount: 8200,
    tax: 1640,
    total: 9840,
    status: "Pending",
  },
  {
    id: "INV-003",
    quoteId: "Q-003",
    client: "Urban Renovations",
    title: "Composite Deck Installation",
    summary: "Payment due for completed 30m² composite decking installation including groundwork and finishing.",
    date: "2025-01-12",
    dueDate: "2025-02-11",
    amount: 15800,
    tax: 3160,
    total: 18960,
    status: "Overdue",
  },
  {
    id: "INV-004",
    quoteId: "Q-005",
    client: "Green Spaces Ltd",
    title: "Garden Landscaping - Complete Makeover",
    summary: "Invoice for complete garden transformation including paving, turfing, and feature planting.",
    date: "2025-01-08",
    dueDate: "2025-02-07",
    amount: 9200,
    tax: 1840,
    total: 11040,
    status: "Paid",
  },
  {
    id: "INV-005",
    quoteId: "Q-007",
    client: "Riverside Properties",
    title: "Painting & Decorating - Full House",
    summary: "Final payment for interior painting and decorating of 4-bedroom property.",
    date: "2025-01-02",
    dueDate: "2025-02-01",
    amount: 5500,
    tax: 1100,
    total: 6600,
    status: "Pending",
  },
  {
    id: "INV-006",
    quoteId: "Q-006",
    client: "Property Maintenance Co",
    title: "Roof Repair - Tile Replacement",
    summary: "Invoice for roof tile repair and replacement work including scaffolding.",
    date: "2025-01-10",
    dueDate: "2025-02-09",
    amount: 4800,
    tax: 960,
    total: 5760,
    status: "Pending",
  },
];

export const demoStats = {
  totalQuotes: demoQuotes.length,
  totalInvoices: demoInvoices.length,
  revenue: demoInvoices.filter(inv => inv.status === "Paid").reduce((sum, inv) => sum + inv.total, 0),
  outstanding: demoInvoices.filter(inv => inv.status !== "Paid").reduce((sum, inv) => sum + inv.total, 0),
  taxCollected: demoInvoices.filter(inv => inv.status === "Paid").reduce((sum, inv) => sum + inv.tax, 0),
};

export const demoTaxSummary = {
  q1: {
    revenue: 26040, // INV-001 (£15,000) + INV-004 (£11,040) - both Paid in January 2025
    taxCollected: 4340, // £2,500 + £1,840
    taxableIncome: 21700, // £12,500 + £9,200
  },
  q2: {
    revenue: 0,
    taxCollected: 0,
    taxableIncome: 0,
  },
  q3: {
    revenue: 0,
    taxCollected: 0,
    taxableIncome: 0,
  },
  q4: {
    revenue: 0,
    taxCollected: 0,
    taxableIncome: 0,
  },
  yearTotal: {
    revenue: 26040,
    taxCollected: 4340,
    taxableIncome: 21700,
  },
};

export const demoClients = [
  {
    id: "demo-1",
    company_name: "ABC Construction Ltd",
    contact_name: "James Wilson",
    email: "james@abcconstruction.co.uk",
    phone: "07700 900123",
  },
  {
    id: "demo-2",
    company_name: "HomeBuilders Inc",
    contact_name: "Sarah Thompson",
    email: "sarah@homebuilders.co.uk",
    phone: "07700 900456",
  },
  {
    id: "demo-3",
    company_name: "Urban Renovations",
    contact_name: "Michael Chen",
    email: "m.chen@urbanreno.co.uk",
    phone: "07700 900789",
  },
  {
    id: "demo-4",
    company_name: "Green Spaces Ltd",
    contact_name: "Emma Roberts",
    email: "emma@greenspaces.co.uk",
    phone: "07700 900321",
  },
];

export const demoInventory = [
  {
    id: "inv-1",
    user_id: "demo",
    name: "15mm Copper Pipe",
    description: "Standard copper pipe for plumbing installations",
    category: "Plumbing",
    unit: "metre",
    unit_price: 4.50,
    sku: "CP-15MM",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "inv-2",
    user_id: "demo",
    name: "Compression Fitting 15mm",
    description: "Brass compression fitting for 15mm copper pipe",
    category: "Plumbing",
    unit: "each",
    unit_price: 2.80,
    sku: "CF-15MM",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "inv-3",
    user_id: "demo",
    name: "LED Downlight GU10",
    description: "5W LED downlight with GU10 fitting",
    category: "Electrical",
    unit: "each",
    unit_price: 12.99,
    sku: "LED-GU10-5W",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "inv-4",
    user_id: "demo",
    name: "2.5mm² Twin & Earth Cable",
    description: "Standard electrical cable for ring mains",
    category: "Electrical",
    unit: "metre",
    unit_price: 1.20,
    sku: "CABLE-2.5MM",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "inv-5",
    user_id: "demo",
    name: "Radiator Valve TRV",
    description: "Thermostatic radiator valve",
    category: "Plumbing",
    unit: "each",
    unit_price: 18.50,
    sku: "TRV-STD",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "inv-6",
    user_id: "demo",
    name: "Plasterboard 12.5mm",
    description: "Standard plasterboard sheet 2400x1200mm",
    category: "Materials",
    unit: "each",
    unit_price: 8.95,
    sku: "PB-12.5",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
];

export const demoTemplates = [
  {
    id: "template-1",
    user_id: "demo",
    name: "Standard Bathroom Refit",
    category: "Bathroom",
    job_description: "Complete bathroom refit including removal of old suite, installation of new suite, tiling, and plumbing work.",
    materials: [
      { name: "Toilet & Cistern", quantity: 1, unit: "each", unitPrice: 250, cost: 250 },
      { name: "Basin & Pedestal", quantity: 1, unit: "each", unitPrice: 150, cost: 150 },
      { name: "Bath Panel", quantity: 1, unit: "each", unitPrice: 45, cost: 45 },
      { name: "Wall Tiles", quantity: 10, unit: "m²", unitPrice: 25, cost: 250 },
    ],
    labour: [
      { description: "Plumbing installation", hours: 8, rate: 45, cost: 360 },
      { description: "Tiling work", hours: 12, rate: 40, cost: 480 },
    ],
    overheads: [
      { description: "Waste disposal", cost: 80 },
    ],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "template-2",
    user_id: "demo",
    name: "Kitchen Unit Installation",
    category: "Kitchen Renovation",
    job_description: "Supply and fit kitchen base and wall units, worktop installation, and appliance connection.",
    materials: [
      { name: "Base Units", quantity: 5, unit: "each", unitPrice: 120, cost: 600 },
      { name: "Wall Units", quantity: 4, unit: "each", unitPrice: 95, cost: 380 },
      { name: "Laminate Worktop", quantity: 3, unit: "metre", unitPrice: 85, cost: 255 },
    ],
    labour: [
      { description: "Unit assembly & fitting", hours: 16, rate: 45, cost: 720 },
      { description: "Worktop cut & fit", hours: 4, rate: 50, cost: 200 },
    ],
    overheads: [
      { description: "Delivery", cost: 45 },
    ],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "template-3",
    user_id: "demo",
    name: "Full House Rewire",
    category: "Electrical",
    job_description: "Complete electrical rewire including new consumer unit, all circuits, sockets, and lighting.",
    materials: [
      { name: "Consumer Unit 12-way", quantity: 1, unit: "each", unitPrice: 180, cost: 180 },
      { name: "Twin & Earth Cable 2.5mm", quantity: 100, unit: "metre", unitPrice: 1.20, cost: 120 },
      { name: "Double Sockets", quantity: 20, unit: "each", unitPrice: 8, cost: 160 },
      { name: "Light Switches", quantity: 10, unit: "each", unitPrice: 6, cost: 60 },
    ],
    labour: [
      { description: "First fix wiring", hours: 24, rate: 50, cost: 1200 },
      { description: "Second fix & testing", hours: 16, rate: 50, cost: 800 },
    ],
    overheads: [
      { description: "NICEIC certification", cost: 150 },
    ],
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
];

export const demoSchedules = [
  {
    id: "sched-1",
    user_id: "demo",
    quote_id: "Q-001",
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration_days: 5,
    duration_hours: null,
    start_time: "08:00",
    notes: "Client prefers morning starts",
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-01-15T00:00:00Z",
  },
  {
    id: "sched-2",
    user_id: "demo",
    quote_id: "Q-003",
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration_days: 4,
    duration_hours: null,
    start_time: "09:00",
    notes: "Weather dependent - deck installation",
    created_at: "2025-01-10T00:00:00Z",
    updated_at: "2025-01-10T00:00:00Z",
  },
  {
    id: "sched-3",
    user_id: "demo",
    quote_id: "Q-008",
    start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration_days: 1,
    duration_hours: 6,
    start_time: "08:30",
    notes: "Boiler installation - gas safe required",
    created_at: "2024-12-20T00:00:00Z",
    updated_at: "2024-12-20T00:00:00Z",
  },
];
