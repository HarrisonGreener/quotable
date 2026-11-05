// Recipe-engine benchmark: real job descriptions → the recipe engine → the
// price a customer would pay, checked against INDEPENDENT published UK cost
// guides (not figures we made up). We price as a typical sole trader who is
// not VAT-registered (most small domestic jobs): materials at retail inc VAT,
// labour at the guide's typical trade rate, no markup.
//
// These ranges are what a homeowner is told to expect. A quote inside the
// range is plausible; outside it means a recipe's quantities or hours are off.

export interface RecipeBenchJob {
  id: string;
  description: string;
  trade: string;
  hourlyRate: number;
  /** The job reader's output (fixed, so the test measures pricing logic, not AI luck) */
  reading: { title: string; jobs: { recipe: string; params: Record<string, unknown> }[] };
  guide: { low: number; high: number; source: string; note?: string };
}

export const RECIPE_JOBS: RecipeBenchJob[] = [
  {
    id: "socket-1",
    description: "Add a new double socket in the living room, spurred off the existing ring",
    trade: "electrician", hourlyRate: 50,
    reading: { title: "New double socket", jobs: [{ recipe: "sockets_add", params: { count: 1 } }] },
    guide: { low: 100, high: 200, source: "https://www.checkatrade.com/blog/cost-guides/adding-plug-socket-room-cost/" },
  },
  {
    id: "consumer-unit",
    description: "Replace old fuse box with a new consumer unit, 8 circuits",
    trade: "electrician", hourlyRate: 50,
    reading: { title: "Consumer unit replacement", jobs: [{ recipe: "consumer_unit", params: { circuits: 8 } }] },
    guide: { low: 550, high: 800, source: "https://www.fantasticservices.com/cost-guides/electrical/fuse-box-replacement/", note: "RCBO board with SPD, outside London" },
  },
  {
    id: "radiator-1",
    description: "Replace one double panel radiator in the bedroom",
    trade: "plumber", hourlyRate: 55,
    reading: { title: "Radiator replacement", jobs: [{ recipe: "radiator_replace", params: { count: 1, size: "medium" } }] },
    guide: { low: 180, high: 300, source: "https://www.checkatrade.com/blog/cost-guides/cost-remove-replace-radiator/" },
  },
  {
    id: "skim-medium",
    description: "Re-skim the walls of a 3m x 3m bedroom",
    trade: "plasterer", hourlyRate: 30,
    reading: { title: "Skim bedroom walls", jobs: [{ recipe: "skim", params: { length: 3, width: 3, height: 2.4, doors: 1, windows: 1 } }] },
    guide: { low: 430, high: 550, source: "https://www.checkatrade.com/blog/cost-guides/cost-skimming-room/" },
  },
  {
    id: "skim-ceiling",
    description: "Skim a 15 m² living room ceiling",
    trade: "plasterer", hourlyRate: 30,
    reading: { title: "Skim ceiling", jobs: [{ recipe: "skim", params: { ceiling_area: 15 } }] },
    guide: { low: 280, high: 440, source: "https://www.checkatrade.com/blog/cost-guides/cost-skimming-room/" },
  },
  {
    id: "paint-medium",
    description: "Paint a medium bedroom about 4.5m x 4m — walls, ceiling, skirting and door",
    trade: "decorator", hourlyRate: 32,
    reading: { title: "Paint bedroom", jobs: [{ recipe: "paint_room", params: { length: 4.5, width: 4, height: 2.4, doors: 1, windows: 1 } }] },
    guide: { low: 315, high: 585, source: "https://www.checkatrade.com/blog/cost-guides/painter-decorator-prices/", note: "medium room average £450 ±30%" },
  },
  {
    id: "doors-3",
    description: "Supply and hang 3 standard white internal doors with handles",
    trade: "carpenter", hourlyRate: 35,
    reading: { title: "Hang 3 internal doors", jobs: [{ recipe: "internal_doors", params: { count: 3, type: "standard" } }] },
    guide: { low: 450, high: 750, source: "https://www.bestbuilders.co.uk/costs/internal-door-fitting-cost-uk", note: "£150–£250 per hollow-core door fitted" },
  },
  {
    id: "fire-door",
    description: "Supply and fit an FD30 fire door between the garage and the house",
    trade: "carpenter", hourlyRate: 35,
    reading: { title: "Fire door", jobs: [{ recipe: "internal_doors", params: { count: 1, type: "fire" } }] },
    guide: { low: 250, high: 550, source: "https://www.bestbuilders.co.uk/costs/internal-door-fitting-cost-uk" },
  },
  {
    id: "bathroom-tiling",
    description: "Tile bathroom walls (about 12 m²) and floor (4 m²), customer supplying the tiles",
    trade: "tiler", hourlyRate: 40,
    reading: {
      title: "Bathroom tiling",
      jobs: [
        { recipe: "tiling", params: { area: 12, surface: "wall", tile_price: 0 } },
        { recipe: "tiling", params: { area: 4, surface: "floor", tile_price: 0 } },
      ],
    },
    guide: { low: 800, high: 1200, source: "https://www.checkatrade.com/blog/cost-guides/tiling-cost/", note: "walls and floor, about 3–4 days" },
  },
];
