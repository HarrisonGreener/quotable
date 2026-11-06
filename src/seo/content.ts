// ═══════════════════════════════════════════════════════════════════
// SEO content: pricing guides and free quote templates.
//
// Both are generated from the same job recipes Quotable's engine was
// calibrated with (supabase/functions/_shared/recipes), so the quantities,
// hours and prices are real working figures, not filler.
// ═══════════════════════════════════════════════════════════════════

import { RECIPE_BY_ID, resolveParams, type Params } from "../../supabase/functions/_shared/recipes/index.ts";

export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://quotable-it.co.uk").replace(/\/$/, "");
export const PRICES_CHECKED = "November 2026";

export interface PublishedRange { low: number; high: number; source: string; sourceName: string; what: string }

export interface GuideDef {
  slug: string;
  recipe: string;
  /** H1 and <title> stem — written the way people search */
  h1: string;
  description: string;
  trade: { slug: string; name: string };
  /** The worked example: what the customer asked for */
  example: string;
  params: Params;
  rate: number;
  tips: string[];
  published?: PublishedRange;
}

const CK = "Checkatrade cost guide";

export const GUIDES: GuideDef[] = [
  // ── Electrical ────────────────────────────────────────────────────
  {
    slug: "how-to-price-adding-a-socket", recipe: "sockets_add",
    h1: "How to price adding a double socket",
    description: "Materials, labour time and a worked example for quoting a new double socket off an existing ring in the UK, with typical prices for 2026.",
    trade: { slug: "electrician", name: "Electricians" },
    example: "Add a new double socket in the living room, spurred off the existing ring.",
    params: { count: 1, new_circuit: false, flush: true }, rate: 50,
    tips: [
      "Price the first socket as a job and each extra one in the same room as an add-on: the setup, testing and certificate don't repeat.",
      "Chasing into solid walls takes longer than dry-lined walls; ask before you quote.",
      "A new radial from the consumer unit needs an RCBO and building control notification, so quote it separately.",
    ],
    published: { low: 100, high: 200, source: "https://www.checkatrade.com/blog/cost-guides/adding-plug-socket-room-cost/", sourceName: CK, what: "adding a socket" },
  },
  {
    slug: "how-to-price-a-consumer-unit-change", recipe: "consumer_unit",
    h1: "How to price a consumer unit change",
    description: "What to include when quoting a fuse board replacement: RCBOs, SPD, tails, bonding, testing hours and a worked UK example for 2026.",
    trade: { slug: "electrician", name: "Electricians" },
    example: "Replace an old fuse box with a new metal consumer unit, 8 circuits.",
    params: { circuits: 8 }, rate: 50,
    tips: [
      "Count the circuits on site: each one is an RCBO and adds testing time.",
      "Check the main bonding before you quote. Upgrading it is often needed and easy to forget.",
      "Include building control notification. Customers rarely know it's required.",
    ],
    published: { low: 550, high: 800, source: "https://www.fantasticservices.com/cost-guides/electrical/fuse-box-replacement/", sourceName: "Fantastic Services cost guide", what: "a consumer unit replacement" },
  },
  {
    slug: "how-to-price-downlights", recipe: "lights",
    h1: "How to price fitting LED downlights",
    description: "Fire-rated downlights, cable, junction boxes and labour per light: how to quote a UK downlight install, with a worked example.",
    trade: { slug: "electrician", name: "Electricians" },
    example: "Fit 8 fire-rated LED downlights in the lounge ceiling, replacing a single pendant.",
    params: { count: 8, type: "downlight", new_wiring: true }, rate: 50,
    tips: [
      "Check joist direction and loft access first: it changes the time per light more than anything else.",
      "Use fire-rated fittings under a habitable floor or loft.",
      "Price a dimmer separately and check it's compatible with the LED fittings.",
    ],
  },
  {
    slug: "how-to-price-an-electric-shower", recipe: "electric_shower",
    h1: "How to price an electric shower install",
    description: "Shower unit, 10mm cable, 45A RCBO, pull-cord switch and hours: quoting an electric shower on a new circuit in the UK.",
    trade: { slug: "electrician", name: "Electricians" },
    example: "Fit a new 9.5kW electric shower on a new circuit, 15 metres from the consumer unit.",
    params: { new_circuit: true, cable_m: 15 }, rate: 50,
    tips: [
      "Measure the cable run: 10mm cable is the biggest material cost after the shower.",
      "Check there's a spare way in the consumer unit; if not, the job changes.",
      "Agree who does the plumbing side before you quote.",
    ],
  },
  {
    slug: "how-to-price-an-eicr", recipe: "eicr",
    h1: "How to price an EICR",
    description: "How long an electrical installation condition report takes and how to price it by bedrooms and circuits, with a UK worked example.",
    trade: { slug: "electrician", name: "Electricians" },
    example: "Landlord EICR for a 3-bedroom house with 10 circuits.",
    params: { bedrooms: 3, circuits: 10 }, rate: 50,
    tips: [
      "Price by circuits, not bedrooms alone: testing time follows the circuit count.",
      "Say in the quote that remedial work is quoted separately.",
      "Landlords often need it by a date; agree the report turnaround up front.",
    ],
  },
  {
    slug: "how-to-price-an-extractor-fan", recipe: "extractor_fan",
    h1: "How to price fitting a bathroom extractor fan",
    description: "Fan, ducting, isolator, cable and core drilling: how to quote a bathroom extractor fan install in the UK.",
    trade: { slug: "electrician", name: "Electricians" },
    example: "Fit a bathroom extractor fan with timer through an outside wall, new hole needed.",
    params: { count: 1, new_hole: true }, rate: 50,
    tips: [
      "Core drilling a new hole is the slow part; check the wall type.",
      "A fan with an overrun timer needs a switched live and a three-pole isolator.",
    ],
  },
  // ── Plumbing & heating ────────────────────────────────────────────
  {
    slug: "how-to-price-a-radiator-replacement", recipe: "radiator_replace",
    h1: "How to price replacing a radiator",
    description: "Radiator, TRVs, inhibitor and the time to drain down and refill: how to quote a like-for-like radiator swap in the UK.",
    trade: { slug: "plumber", name: "Plumbers" },
    example: "Replace one double panel radiator in the bedroom, same position.",
    params: { count: 1, size: "medium", new_position: false }, rate: 55,
    tips: [
      "Check the pipe centres: a radiator with different centres means moving pipework.",
      "Freezing or isolating saves draining the whole system on a single swap.",
      "Always top up inhibitor after refilling and put it on the quote.",
    ],
    published: { low: 180, high: 300, source: "https://www.checkatrade.com/blog/cost-guides/cost-remove-replace-radiator/", sourceName: CK, what: "replacing a radiator" },
  },
  {
    slug: "how-to-price-adding-a-radiator", recipe: "radiator_add",
    h1: "How to price adding a new radiator",
    description: "Pipe runs, fittings, TRVs and lifting floorboards: how to quote an extra radiator off an existing heating system in the UK.",
    trade: { slug: "plumber", name: "Plumbers" },
    example: "Add a new radiator in the extension, about 6 metres from the nearest heating pipe.",
    params: { count: 1, pipe_m: 6, size: "medium" }, rate: 55,
    tips: [
      "The pipe run decides the price: measure it and note floor coverings.",
      "Check the boiler has capacity for another radiator.",
    ],
  },
  {
    slug: "how-to-price-a-tap-replacement", recipe: "tap_replace",
    h1: "How to price replacing a tap",
    description: "Tap, isolating valves and fitting time: how to quote a basin, kitchen or bath tap swap in the UK.",
    trade: { slug: "plumber", name: "Plumbers" },
    example: "Replace a kitchen mixer tap and fit new isolating valves.",
    params: { count: 1, type: "kitchen", valves: true }, rate: 55,
    tips: [
      "Ask who supplies the tap. Customer-supplied taps are often missing parts.",
      "Seized old tap nuts are the usual overrun; allow for it.",
    ],
  },
  {
    slug: "how-to-price-a-toilet-replacement", recipe: "toilet_replace",
    h1: "How to price replacing a toilet",
    description: "Close-coupled toilet, pan connector, valve and fixings: how to quote removing and fitting a new toilet in the UK.",
    trade: { slug: "plumber", name: "Plumbers" },
    example: "Remove an old toilet and fit a new close-coupled toilet on the existing pipework.",
    params: { count: 1, supply_toilet: true }, rate: 55,
    tips: [
      "Check the soil pipe position against the new pan's set-out before you order.",
      "Include taking the old toilet away; customers expect it.",
    ],
  },
  {
    slug: "how-to-price-an-outside-tap", recipe: "outside_tap",
    h1: "How to price fitting an outside tap",
    description: "Outside tap kit, pipe, isolating valve and core hole: how to quote an outside tap in the UK.",
    trade: { slug: "plumber", name: "Plumbers" },
    example: "Fit an outside tap off the kitchen cold supply, through the back wall.",
    params: { count: 1 }, rate: 55,
    tips: ["Fit a double check valve; it's a water regulations requirement.", "Note where the cold main runs before quoting."],
  },
  {
    slug: "how-to-price-a-mixer-shower", recipe: "shower_mixer",
    h1: "How to price fitting a mixer shower",
    description: "Thermostatic bar mixer, pipework and time: how to quote a mixer shower install in the UK.",
    trade: { slug: "plumber", name: "Plumbers" },
    example: "Fit a thermostatic bar mixer shower over the bath, new hot and cold feeds needed.",
    params: { new_feeds: true }, rate: 55,
    tips: ["Check water pressure and the boiler type first.", "Agree who does tiling and making good."],
  },
  // ── Plastering & decorating ───────────────────────────────────────
  {
    slug: "how-to-price-skimming-a-room", recipe: "skim",
    h1: "How to price skimming a room",
    description: "Bags of multi-finish per m², PVA, scrim, beads and hours: how to quote re-skimming walls in the UK, with a worked example.",
    trade: { slug: "plasterer", name: "Plasterers" },
    example: "Re-skim the walls of a 3 m by 3 m bedroom.",
    params: { length: 3, width: 3, height: 2.4, doors: 1, windows: 1 }, rate: 30,
    tips: [
      "One 25 kg bag of multi-finish covers about 10 m² at 2 mm.",
      "Price protection and prep honestly: furnished rooms take longer.",
      "Ceilings are slower than walls; price them separately.",
    ],
    published: { low: 430, high: 550, source: "https://www.checkatrade.com/blog/cost-guides/cost-skimming-room/", sourceName: CK, what: "skimming a medium room" },
  },
  {
    slug: "how-to-price-skimming-a-ceiling", recipe: "skim",
    h1: "How to price skimming a ceiling",
    description: "Plaster, PVA, scrim and time per m² for a ceiling skim, with a worked UK example.",
    trade: { slug: "plasterer", name: "Plasterers" },
    example: "Skim a 15 m² living room ceiling.",
    params: { ceiling_area: 15 }, rate: 30,
    tips: ["Check for artex: it needs sealing or overboarding first.", "Allow for setting up a stable platform."],
    published: { low: 280, high: 440, source: "https://www.checkatrade.com/blog/cost-guides/cost-skimming-room/", sourceName: CK, what: "skimming a ceiling" },
  },
  {
    slug: "how-to-price-boarding-a-ceiling", recipe: "ceiling_board",
    h1: "How to price replacing a ceiling",
    description: "Plasterboard sheets, screws, scrim, skim and labour: how to quote taking down or overboarding a ceiling in the UK.",
    trade: { slug: "plasterer", name: "Plasterers" },
    example: "Take down a damaged 12 m² bedroom ceiling and replace with plasterboard, taped and skimmed.",
    params: { ceiling_area: 12, remove_old: true }, rate: 30,
    tips: ["Taking down lath and plaster makes a lot of mess: include a skip.", "Check for asbestos in old artex before quoting removal."],
  },
  {
    slug: "how-to-price-painting-a-room", recipe: "paint_room",
    h1: "How to price painting a room",
    description: "Litres of paint, coats, prep and hours for walls, ceiling and woodwork: how decorators quote a room in the UK.",
    trade: { slug: "painter-decorator", name: "Painters & decorators" },
    example: "Paint a 4.5 m by 4 m bedroom: walls, ceiling, skirting and door.",
    params: { length: 4.5, width: 4, height: 2.4, doors: 1, windows: 1 }, rate: 32,
    tips: [
      "Trade emulsion covers roughly 14 m² per litre per coat on sound walls.",
      "Strong colour changes need a third coat; ask about colours before quoting.",
      "Prep is where quotes go wrong. Look at the walls under good light.",
    ],
    published: { low: 315, high: 585, source: "https://www.checkatrade.com/blog/cost-guides/painter-decorator-prices/", sourceName: CK, what: "decorating a medium room" },
  },
  {
    slug: "how-to-price-wallpapering", recipe: "wallpaper",
    h1: "How to price wallpapering a room",
    description: "Rolls per m², paste, stripping and hanging time: how to quote wallpapering in the UK.",
    trade: { slug: "painter-decorator", name: "Painters & decorators" },
    example: "Strip and re-paper a 4 m by 3.5 m bedroom, customer supplying the paper.",
    params: { length: 4, width: 3.5, height: 2.4, doors: 1, windows: 1, strip: true, supply_paper: false }, rate: 32,
    tips: ["Large pattern repeats need more rolls: check the label.", "Price stripping separately; it varies hugely."],
  },
  {
    slug: "how-to-price-exterior-painting", recipe: "exterior_paint",
    h1: "How to price painting the outside of a house",
    description: "Masonry paint per m², fungicidal wash, repairs, access and labour: how to quote exterior painting in the UK.",
    trade: { slug: "painter-decorator", name: "Painters & decorators" },
    example: "Wash down and paint 60 m² of rendered front and side walls, tower needed.",
    params: { area: 60, access: "tower" }, rate: 32,
    tips: ["Access is the biggest variable: price the tower or scaffold explicitly.", "Allow for weather days in your timings."],
  },
  {
    slug: "how-to-price-tiling", recipe: "tiling",
    h1: "How to price wall tiling",
    description: "Adhesive, grout, trims and tiling time per m²: how to quote wall tiling in the UK, with a worked bathroom example.",
    trade: { slug: "tiler", name: "Tilers" },
    example: "Tile 12 m² of bathroom walls, customer supplying the tiles, old tiles removed.",
    params: { area: 12, surface: "wall", tile_price: 0, remove_old: true }, rate: 40,
    tips: [
      "Large-format tiles are slower and need a levelling system.",
      "Removing old tiles often means making good the wall; look before quoting.",
      "Quote per m² for the tiling, plus setting out and grouting.",
    ],
    published: { low: 800, high: 1200, source: "https://www.checkatrade.com/blog/cost-guides/tiling-cost/", sourceName: CK, what: "tiling a bathroom" },
  },
  {
    slug: "how-to-price-floor-tiling", recipe: "tiling",
    h1: "How to price floor tiling",
    description: "Flexible adhesive, primer, grout and time per m²: how to quote floor tiling in the UK.",
    trade: { slug: "tiler", name: "Tilers" },
    example: "Tile a 10 m² kitchen floor with 600 × 600 mm porcelain, customer supplying the tiles.",
    params: { area: 10, surface: "floor", tile_price: 0, large_format: true }, rate: 40,
    tips: ["Check the subfloor: timber floors need overboarding.", "Large-format porcelain needs more adhesive per m²."],
  },
  // ── Carpentry ─────────────────────────────────────────────────────
  {
    slug: "how-to-price-hanging-doors", recipe: "internal_doors",
    h1: "How to price hanging internal doors",
    description: "Doors, hinges, latches, handles and time per door: how carpenters quote hanging internal doors in the UK.",
    trade: { slug: "carpenter", name: "Carpenters & joiners" },
    example: "Supply and hang 3 standard white internal doors with handles.",
    params: { count: 3, type: "standard", supply_doors: true }, rate: 35,
    tips: [
      "Measure every opening: old houses rarely have standard sizes.",
      "Fire doors take longer and need fire-rated ironmongery.",
    ],
    published: { low: 450, high: 750, source: "https://www.bestbuilders.co.uk/costs/internal-door-fitting-cost-uk", sourceName: "BestBuilders cost guide", what: "three hollow-core doors fitted" },
  },
  {
    slug: "how-to-price-skirting-boards", recipe: "skirting",
    h1: "How to price fitting skirting boards",
    description: "Lengths of skirting, adhesive, caulk and time per metre: how to quote skirting in the UK.",
    trade: { slug: "carpenter", name: "Carpenters & joiners" },
    example: "Remove old skirting and fit new MDF torus skirting around a 4 m by 4 m room.",
    params: { metres: 15, remove_old: true }, rate: 35,
    tips: ["Add 10–12% for mitres and offcuts.", "Uneven floors mean scribing, which takes longer."],
  },
  {
    slug: "how-to-price-laminate-flooring", recipe: "laminate_floor",
    h1: "How to price laying laminate flooring",
    description: "Packs of laminate, underlay, beading, door bars and fitting time per m²: how to quote laminate flooring in the UK.",
    trade: { slug: "flooring-specialist", name: "Flooring fitters" },
    example: "Lay 8mm laminate in an 18 m² lounge with one doorway, flooring supplied.",
    params: { area: 18, type: "laminate", doorways: 1, supply_floor: true }, rate: 35,
    tips: ["Add 10% for cuts and waste.", "Check the subfloor is level before you commit to a price."],
  },
  {
    slug: "how-to-price-a-fence", recipe: "fence_panels",
    h1: "How to price fence panel replacement",
    description: "Panels, concrete posts, gravel boards, postcrete and time per panel: how to quote a garden fence in the UK.",
    trade: { slug: "fencer", name: "Fencers" },
    example: "Replace 11 metres of fence with 6ft panels on concrete posts, old fence removed.",
    params: { length: 11, posts: "concrete", remove_old: true }, rate: 35,
    tips: ["Panels are 1.83 m wide: count panels, then posts are panels + 1.", "Two bags of postcrete per post is a safe allowance."],
  },
  {
    slug: "how-to-price-decking", recipe: "decking",
    h1: "How to price building decking",
    description: "Deck boards, joists, screws, membrane and time per m²: how to quote a ground-level timber deck in the UK.",
    trade: { slug: "landscaper", name: "Landscapers" },
    example: "Build a 15 m² ground-level softwood deck.",
    params: { area: 15 }, rate: 35,
    tips: ["Joists at 400 mm centres; check the board manufacturer's spans.", "Ground prep varies hugely: look at the site."],
  },
  {
    slug: "how-to-price-a-stud-wall", recipe: "stud_wall",
    h1: "How to price building a stud wall",
    description: "CLS timber, plasterboard, insulation, screws and time per metre: how to quote a stud partition wall in the UK.",
    trade: { slug: "general-builder", name: "Builders" },
    example: "Build a 3 m long insulated stud wall with a door opening, boarded both sides.",
    params: { length: 3, height: 2.4, insulated: true, door: true }, rate: 35,
    tips: ["Studs at 400 mm centres; add noggins at board joints.", "Plastering is usually quoted separately."],
  },
];

export const GUIDE_BY_SLUG = new Map(GUIDES.map((g) => [g.slug, g]));

/** Works a guide's example through its recipe: quantities, typical prices, hours, totals. */
export const workGuide = (g: GuideDef) => {
  const recipe = RECIPE_BY_ID.get(g.recipe)!;
  const { params } = resolveParams(recipe, g.params as Record<string, unknown>);
  const out = recipe.build(params);
  const materials = out.materials.filter((m) => m.quantity > 0)
    .map((m) => ({ ...m, cost: Math.round(m.quantity * m.typical * 100) / 100 }));
  const hours = Math.round(out.labour.reduce((s, l) => s + l.hours, 0) * 10) / 10;
  const materialsTotal = materials.reduce((s, m) => s + m.cost, 0);
  const labourTotal = Math.round(hours * g.rate * 100) / 100;
  const overheads = out.overheads.includes("Transport") ? 25 : 0;
  return {
    recipe, params, materials, labour: out.labour, hours, materialsTotal, labourTotal, overheads,
    total: Math.round((materialsTotal + labourTotal + overheads) * 100) / 100,
  };
};

// ── Quote templates ──────────────────────────────────────────────

export interface TemplateDef {
  slug: string;
  trade: { slug: string; name: string; singular: string };
  guide: string; // slug of the guide whose example fills the sample quote
  include: string[]; // what this trade's quotes should cover
}

export const TEMPLATES: TemplateDef[] = [
  { slug: "electrician-quote-template", trade: { slug: "electrician", name: "Electricians", singular: "electrician" }, guide: "how-to-price-adding-a-socket",
    include: ["Which circuits are affected and how they're protected", "Testing, the certificate you'll issue and building control notification where needed", "What's excluded: making good, decorating, remedial work found during testing"] },
  { slug: "plumber-quote-template", trade: { slug: "plumber", name: "Plumbers", singular: "plumber" }, guide: "how-to-price-a-radiator-replacement",
    include: ["Who supplies the fixtures (taps, toilets, radiators)", "Draining down, refilling and inhibitor", "Exclusions: boxing in, tiling, making good"] },
  { slug: "plasterer-quote-template", trade: { slug: "plasterer", name: "Plasterers", singular: "plasterer" }, guide: "how-to-price-skimming-a-room",
    include: ["Areas in m², walls and ceilings separately", "Protection, preparation and any beads or boarding", "Drying time and when it can be decorated"] },
  { slug: "painter-decorator-quote-template", trade: { slug: "painter-decorator", name: "Painters & decorators", singular: "decorator" }, guide: "how-to-price-painting-a-room",
    include: ["Surfaces, number of coats and paint brand or grade", "Who chooses and supplies the colours", "Prep included: filling, sanding, caulking"] },
  { slug: "tiler-quote-template", trade: { slug: "tiler", name: "Tilers", singular: "tiler" }, guide: "how-to-price-tiling",
    include: ["Area in m² and tile size", "Who supplies the tiles, and the adhesive and grout used", "Removal of old tiles and making good"] },
  { slug: "carpenter-quote-template", trade: { slug: "carpenter", name: "Carpenters & joiners", singular: "carpenter" }, guide: "how-to-price-hanging-doors",
    include: ["Number of doors, sizes and type", "Ironmongery included", "Whether painting or staining is included"] },
  { slug: "builder-quote-template", trade: { slug: "general-builder", name: "Builders", singular: "builder" }, guide: "how-to-price-a-stud-wall",
    include: ["A clear scope of works, stage by stage", "Who handles building control and any structural calculations", "Payment stages tied to finished work"] },
  { slug: "fencing-quote-template", trade: { slug: "fencer", name: "Fencers", singular: "fencer" }, guide: "how-to-price-a-fence",
    include: ["Length, panel type and post type", "Removal and disposal of the old fence", "Boundary responsibility confirmed with the customer"] },
  { slug: "flooring-quote-template", trade: { slug: "flooring-specialist", name: "Flooring fitters", singular: "flooring fitter" }, guide: "how-to-price-laminate-flooring",
    include: ["Area in m² and the product", "Underlay, beading and door bars", "Subfloor preparation and moving furniture"] },
  { slug: "landscaping-quote-template", trade: { slug: "landscaper", name: "Landscapers", singular: "landscaper" }, guide: "how-to-price-decking",
    include: ["Area and materials", "Ground preparation and waste removal", "Weather and access assumptions"] },
];

export const TEMPLATE_BY_SLUG = new Map(TEMPLATES.map((t) => [t.slug, t]));

export const gbp = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
