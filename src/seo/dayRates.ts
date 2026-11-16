// Published UK day rates by trade and region (self-employed, domestic work).
// Source: Trade2Base 2026 day-rate guides, read November 2026. Update DAY_RATES_CHECKED
// and the figures together when re-checking.

export const DAY_RATES_CHECKED = "November 2026";

export interface RegionRate { region: string; low: number; high: number }

export interface DayRateDef {
  slug: string;              // URL: /day-rates/<slug>
  trade: string;             // "electrician"
  plural: string;            // "Electricians"
  tradeSlug: string;         // matches /trades/<slug>, guides and templates
  rates: RegionRate[];
  note?: string;             // when the source gives fewer regions
  upFactors: string[];       // what puts you at the top of the range
  source: { name: string; url: string };
}

const T2B = (path: string, name: string) => ({ name, url: `https://www.trade2base.com/blog/${path}` });

export const DAY_RATES: DayRateDef[] = [
  {
    slug: "electrician-day-rate",
    trade: "electrician",
    plural: "Electricians",
    tradeSlug: "electrician",
    rates: [
      { region: "London", low: 400, high: 700 },
      { region: "South East", low: 320, high: 500 },
      { region: "Midlands", low: 250, high: 420 },
      { region: "North West", low: 220, high: 380 },
      { region: "Yorkshire", low: 200, high: 350 },
      { region: "Scotland", low: 230, high: 400 },
      { region: "Wales", low: 190, high: 320 },
    ],
    upFactors: [
      "18th Edition with NICEIC or NAPIT membership puts you at the top of your region's range; no scheme approval sits toward the bottom",
      "EV charger, solar PV and inspection-and-testing work sits at or above the top of the range",
      "Commercial and industrial work typically pays 20–40% more than domestic",
    ],
    source: T2B("electrician-day-rate-uk", "Trade2Base: electrician day rate UK"),
  },
  {
    slug: "plumber-day-rate",
    trade: "plumber",
    plural: "Plumbers",
    tradeSlug: "plumber",
    rates: [
      { region: "London", low: 350, high: 600 },
      { region: "South East", low: 280, high: 450 },
      { region: "South West", low: 240, high: 400 },
      { region: "Midlands", low: 220, high: 380 },
      { region: "North West", low: 200, high: 350 },
      { region: "Yorkshire", low: 180, high: 320 },
      { region: "Scotland", low: 200, high: 360 },
      { region: "Wales", low: 170, high: 300 },
    ],
    upFactors: [
      "Gas Safe registered engineers working on boilers and heating sit at the top of these ranges or above",
      "Local competition and what the local market will bear drive most of the regional difference",
    ],
    source: T2B("plumber-day-rate-uk", "Trade2Base: plumber day rate UK"),
  },
  {
    slug: "plasterer-day-rate",
    trade: "plasterer",
    plural: "Plasterers",
    tradeSlug: "plasterer",
    rates: [
      { region: "London", low: 280, high: 480 },
      { region: "South East", low: 230, high: 400 },
      { region: "Midlands", low: 180, high: 330 },
      { region: "North West", low: 170, high: 300 },
      { region: "Yorkshire", low: 160, high: 280 },
      { region: "Scotland", low: 170, high: 310 },
      { region: "Wales", low: 150, high: 270 },
    ],
    upFactors: [
      "New build, commercial and specialist systems typically add 15–30%",
      "NVQ Level 2/3 or a formal apprenticeship tends to put you at or above the middle of your range",
      "Ornamental plaster, screeding and external wall insulation render are priced in higher bands",
    ],
    source: T2B("plasterer-day-rate-uk", "Trade2Base: plasterer day rate UK"),
  },
  {
    slug: "decorator-day-rate",
    trade: "painter and decorator",
    plural: "Painters and decorators",
    tradeSlug: "painter-decorator",
    rates: [
      { region: "London", low: 280, high: 450 },
      { region: "South East", low: 230, high: 380 },
      { region: "Midlands", low: 180, high: 300 },
      { region: "North West", low: 160, high: 280 },
      { region: "Yorkshire", low: 150, high: 260 },
      { region: "Scotland", low: 170, high: 290 },
      { region: "Wales", low: 140, high: 250 },
    ],
    upFactors: [
      "Exterior work typically commands 15–25% more",
      "Commercial work typically pays 20–30% more per day than domestic",
      "Spray painting and Venetian plaster sit at or above the top of the range",
    ],
    source: T2B("decorator-day-rate-uk", "Trade2Base: decorator day rate UK"),
  },
  {
    slug: "tiler-day-rate",
    trade: "tiler",
    plural: "Tilers",
    tradeSlug: "tiler",
    rates: [
      { region: "London", low: 280, high: 500 },
      { region: "South East", low: 240, high: 420 },
      { region: "Midlands", low: 190, high: 340 },
      { region: "North West", low: 170, high: 300 },
      { region: "Yorkshire", low: 160, high: 280 },
      { region: "Scotland", low: 180, high: 320 },
      { region: "Wales", low: 150, high: 270 },
    ],
    upFactors: [
      "Large-format porcelain, natural stone, mosaics and heated floors justify the top of the range anywhere",
      "Commercial tiling commands a 20–30% premium over domestic",
      "Glasgow, Edinburgh and Cardiff sit at the upper end of their regions",
    ],
    source: T2B("tiler-day-rate-uk", "Trade2Base: tiler day rate UK"),
  },
  {
    slug: "builder-day-rate",
    trade: "builder",
    plural: "Builders",
    tradeSlug: "general-builder",
    rates: [
      { region: "London", low: 350, high: 600 },
      { region: "South East", low: 280, high: 500 },
      { region: "Midlands", low: 220, high: 380 },
      { region: "North West", low: 200, high: 360 },
      { region: "Yorkshire", low: 180, high: 320 },
      { region: "Scotland", low: 210, high: 370 },
      { region: "Wales", low: 170, high: 300 },
    ],
    note: "Labourers (labour-only, unskilled or semi-skilled) are typically £150–£250 a day.",
    upFactors: [
      "A CSCS Blue or Gold card and specialist skills sit at or above the top of the range",
      "Commercial and industrial work runs 15–30% higher than domestic in the same region",
      "Van running costs and insurance premiums push rates up",
    ],
    source: T2B("builder-day-rate-uk", "Trade2Base: builder day rate UK"),
  },
  {
    slug: "roofer-day-rate",
    trade: "roofer",
    plural: "Roofers",
    tradeSlug: "roofer",
    rates: [
      { region: "London (pitched)", low: 320, high: 580 },
      { region: "London (flat)", low: 300, high: 550 },
      { region: "Midlands (pitched)", low: 230, high: 420 },
      { region: "Midlands (flat)", low: 220, high: 400 },
      { region: "North West (pitched)", low: 200, high: 380 },
      { region: "North West (flat)", low: 200, high: 370 },
    ],
    note: "The South East sits 10–20% below London; Yorkshire and Scotland broadly match the North West. Lead workers earn the most: £350–£600 a day in London, £220–£400 in the North West.",
    upFactors: [
      "Lead work pays the most, then pitched roofing (slate and tile), then flat roofing",
      "Rates are for qualified, self-employed roofers on domestic and light commercial work",
    ],
    source: T2B("roofer-day-rate-uk", "Trade2Base: roofer day rate UK"),
  },
  {
    slug: "carpenter-day-rate",
    trade: "carpenter",
    plural: "Carpenters and joiners",
    tradeSlug: "carpenter",
    rates: [
      { region: "UK (general carpenter)", low: 200, high: 350 },
      { region: "UK (specialist joiner or cabinet maker)", low: 300, high: 450 },
    ],
    note: "In London and the South East, add 20–30% to these national figures.",
    upFactors: [
      "Specialist joinery and cabinet making pays more than general carpentry",
      "London and the South East pay 20–30% more",
    ],
    source: T2B("carpenter-joiner-pricing-guide-uk", "Trade2Base: carpenter and joiner pricing guide UK"),
  },
];

export const DAY_RATE_BY_SLUG = new Map(DAY_RATES.map((d) => [d.slug, d]));

/** Hourly equivalent on an 8-hour day, to the nearest pound. */
export const perHour = (day: number) => Math.round(day / 8);
