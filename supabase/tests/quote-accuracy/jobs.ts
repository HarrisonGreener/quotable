// Benchmark jobs. `ai` is the structure the AI returns (materials, labour
// hours, overheads — never prices). `truth` is what the job really costs a
// VAT-registered tradesperson, from typical UK merchant prices (Nov 2026)
// with VAT removed, and labour charged at their rate for every person on site.
//
// The truth figures are a reasonable benchmark, not gospel: replace them with
// real invoices from real jobs as you collect them.

export interface BenchJob {
  id: string;
  description: string;
  trade: string;
  paymentType: "hourly" | "day" | "job";
  hourlyRate?: number;
  dayRate?: number;
  numWorkers: number;
  ai: {
    projectTitle: string;
    materials: { name: string; quantity: number; unit: string }[];
    optional_materials: { name: string; quantity: number; unit: string }[];
    labour: { name: string; hours: number }[];
    overheads: { name: string }[];
    suggested_overheads: { name: string }[];
  };
  truth: {
    materialsExVat: number;   // what the materials cost the tradesperson, ex VAT
    labour: number;           // hours on site × people × rate
    note: string;
  };
}

const none = { optional_materials: [], suggested_overheads: [] };

export const JOBS: BenchJob[] = [
  {
    id: "tap",
    description: "Replace basin mixer tap in bathroom, isolation valves need replacing",
    trade: "plumber", paymentType: "hourly", hourlyRate: 55, numWorkers: 1,
    ai: { ...none, projectTitle: "Basin tap replacement",
      materials: [
        { name: "Basin mono mixer tap", quantity: 1, unit: "each" },
        { name: "15mm isolating valve", quantity: 2, unit: "each" },
        { name: "15mm flexible tap connector", quantity: 2, unit: "each" },
      ],
      labour: [{ name: "Remove old tap and fit new", hours: 1.5 }],
      overheads: [{ name: "Transport" }] },
    truth: { materialsExVat: (45 + 2 * 4.5 + 2 * 6) / 1.2, labour: 1.5 * 55, note: "mid-range mono mixer" },
  },
  {
    id: "sockets",
    description: "Add three double sockets in a home office on a new radial from the consumer unit",
    trade: "electrician", paymentType: "hourly", hourlyRate: 50, numWorkers: 1,
    ai: { ...none, projectTitle: "Three new double sockets",
      materials: [
        { name: "Double socket white", quantity: 3, unit: "each" },
        { name: "Metal back box 35mm double", quantity: 3, unit: "each" },
        { name: "2.5mm twin and earth cable", quantity: 20, unit: "m" },
      ],
      labour: [{ name: "Run cable and fit sockets", hours: 3 }, { name: "Test and certify", hours: 1 }],
      overheads: [{ name: "Transport" }] },
    truth: { materialsExVat: (3 * 4.5 + 3 * 2.8 + 20 * 0.75) / 1.2, labour: 4 * 50, note: "cable at drum price per metre" },
  },
  {
    id: "cu",
    description: "Consumer unit upgrade to a 10-way metal board with RCBOs in a house",
    trade: "electrician", paymentType: "hourly", hourlyRate: 50, numWorkers: 2,
    ai: { ...none, projectTitle: "Consumer unit upgrade",
      materials: [
        { name: "Consumer unit 10 way metal", quantity: 1, unit: "each" },
        { name: "RCBO 32A", quantity: 2, unit: "each" },
        { name: "RCBO 16A", quantity: 2, unit: "each" },
        { name: "RCBO 6A", quantity: 4, unit: "each" },
      ],
      labour: [{ name: "Swap board and terminate circuits", hours: 5 }, { name: "Test and certify", hours: 1 }],
      overheads: [{ name: "Transport" }] },
    truth: { materialsExVat: (85 + 2 * 32 + 2 * 28 + 4 * 28) / 1.2, labour: 6 * 2 * 50, note: "two electricians, 6 h each" },
  },
  {
    id: "tiling",
    description: "Tile bathroom walls, 12 square metres, white ceramic",
    trade: "tiler", paymentType: "day", dayRate: 200, numWorkers: 1,
    ai: { ...none, projectTitle: "Bathroom wall tiling",
      materials: [
        { name: "Ceramic wall tile white", quantity: 13.2, unit: "m2" },
        { name: "Tile adhesive 20kg", quantity: 3, unit: "bag" },
        { name: "Tile grout 5kg", quantity: 1, unit: "bag" },
      ],
      labour: [{ name: "Prepare walls", hours: 4 }, { name: "Tile and grout", hours: 12 }],
      overheads: [{ name: "Transport" }, { name: "Waste disposal" }] },
    truth: { materialsExVat: (13.2 * 12 + 3 * 18 + 12) / 1.2, labour: 2 * 200, note: "two days" },
  },
  {
    id: "paint",
    description: "Paint a living room, walls and woodwork, minor filling",
    trade: "painter-decorator", paymentType: "day", dayRate: 180, numWorkers: 1,
    ai: { ...none, projectTitle: "Living room redecoration",
      materials: [
        { name: "Emulsion matt white 10L", quantity: 2, unit: "tin" },
        { name: "Satinwood white 2.5L", quantity: 1, unit: "tin" },
        { name: "Decorators caulk", quantity: 2, unit: "tube" },
        { name: "Ready mixed filler", quantity: 1, unit: "tub" },
      ],
      labour: [{ name: "Prep and fill", hours: 3 }, { name: "Paint walls and woodwork", hours: 9 }],
      overheads: [{ name: "Transport" }] },
    truth: { materialsExVat: (2 * 35 + 30.5 + 2 * 3.48 + 6.79) / 1.2, labour: 1.5 * 180, note: "a day and a half" },
  },
  {
    id: "boiler",
    description: "Replace old combi boiler with a new 28kW combi boiler in the same position, home",
    trade: "gas-engineer", paymentType: "day", dayRate: 250, numWorkers: 2,
    ai: { ...none, projectTitle: "Combi boiler replacement",
      materials: [
        { name: "Combi boiler 28kW", quantity: 1, unit: "each" },
        { name: "Boiler flue kit 60/100", quantity: 1, unit: "each" },
        { name: "Magnetic system filter 22mm", quantity: 1, unit: "each" },
        { name: "Central heating inhibitor 500ml", quantity: 1, unit: "each" },
      ],
      labour: [{ name: "Remove old boiler", hours: 2 }, { name: "Install and commission new boiler", hours: 6 }],
      overheads: [{ name: "Transport" }, { name: "Waste disposal" }] },
    truth: { materialsExVat: (950 + 65 + 85 + 12) / 1.2, labour: 2 * 1 * 250, note: "two engineers, one day" },
  },
  {
    id: "doors",
    description: "Hang three new internal panel doors in existing frames",
    trade: "carpenter", paymentType: "hourly", hourlyRate: 45, numWorkers: 1,
    ai: { ...none, projectTitle: "Hang three internal doors",
      materials: [
        { name: "Internal panel door 762x1981mm", quantity: 3, unit: "each" },
        { name: "Door hinges 100mm pair", quantity: 5, unit: "pair" },
        { name: "Tubular door latch", quantity: 3, unit: "each" },
        { name: "Door handles pair", quantity: 3, unit: "pair" },
      ],
      labour: [{ name: "Hang and fit doors", hours: 6 }],
      overheads: [{ name: "Transport" }] },
    truth: { materialsExVat: (3 * 65 + 5 * 6.5 + 3 * 4 + 3 * 15) / 1.2, labour: 6 * 45, note: "" },
  },
  {
    id: "fence",
    description: "Install 10 metres of 6ft lap fence panels with timber posts and gravel boards, garden",
    trade: "fencer", paymentType: "day", dayRate: 220, numWorkers: 2,
    ai: { ...none, projectTitle: "10m garden fence",
      materials: [
        { name: "Fence panel 6x6ft lap", quantity: 6, unit: "each" },
        { name: "Fence post 100x100mm 2.4m", quantity: 7, unit: "each" },
        { name: "Postcrete 20kg", quantity: 14, unit: "bag" },
        { name: "Gravel board 150mm 1.8m", quantity: 6, unit: "each" },
      ],
      labour: [{ name: "Dig holes, set posts, fit panels", hours: 8 }],
      overheads: [{ name: "Transport" }, { name: "Waste disposal" }] },
    truth: { materialsExVat: (6 * 32 + 7 * 18 + 14 * 6.5 + 6 * 8.5) / 1.2, labour: 2 * 1 * 220, note: "two people, one day" },
  },
];
