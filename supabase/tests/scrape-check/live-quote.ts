// End-to-end live pricing check: AI-style material lists for real jobs →
// product-page index → live page fetch → match + pack conversion.
// Uses an in-memory stand-in for the database, so it runs anywhere with
// internet access (GitHub Actions).
//
//   deno run -A supabase/tests/scrape-check/live-quote.ts

import { readSitemap } from "../../functions/_shared/scraper.ts";
import { slugText } from "../../functions/_shared/recipes/index.ts";
import { liveOffers, chooseOffer } from "../../functions/_shared/live-price.ts";
import { isCompatibleProduct, headWord } from "../../functions/_shared/quote-engine.ts";

const SUPPLIERS: Record<string, { sitemap: string; pattern: RegExp }> = {
  Toolstation: { sitemap: "https://www.toolstation.com/sitemap.xml", pattern: /\/p\d{3,}/ },
  Wickes: { sitemap: "https://www.wickes.co.uk/sitemap.xml", pattern: /\/p\/\d+/ },
  "Travis Perkins": { sitemap: "https://www.travisperkins.co.uk/sitemap.xml", pattern: /\/p\/|\/product|\/\d{5,}(?:$|[/?.])/i },
};

const index: { url: string; supplier: string; slug: string; words: Set<string> }[] = [];
await Promise.all(Object.entries(SUPPLIERS).map(async ([supplier, cfg]) => {
  for (const url of await readSitemap(cfg.sitemap, cfg.pattern, 80000)) {
    const slug = slugText(url).toLowerCase();
    if (slug.length >= 6) index.push({ url, supplier, slug, words: new Set(slug.split(/\s+/)) });
  }
}));
console.log(`Index: ${index.length} product pages`);

// In-memory stand-in for the two database calls live pricing makes
const db: any = {
  rpc: async (fn: string, args: any) => {
    if (fn !== "search_product_pages") return { data: [] };
    const terms: string[] = args.terms;
    const must: string | null = args.must ?? null;
    const rows = index
      .filter((r: any) => !must || [...r.words].some((w: string) => w.startsWith(must)))
      .map((r) => ({ ...r, rank: terms.filter((t) => [...r.words].some((w) => w.startsWith(t))).length }))
      .filter((r) => r.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, args.lim ?? 60);
    return { data: rows.map(({ url, supplier, slug, rank }) => ({ url, supplier, slug, rank })) };
  },
  from: () => {
    const chain: any = { select: () => chain, eq: () => chain, insert: () => chain, update: () => chain, upsert: async () => ({}), maybeSingle: async () => ({ data: { id: "x" } }) };
    return chain;
  },
};

// What the AI produces for typical jobs (names/units per the new prompt)
const JOBS: Record<string, { name: string; unit: string; quantity: number }[]> = {
  "Bathroom: retile walls 12 m², new basin tap": [
    { name: "Ready mixed wall tile adhesive 15kg", unit: "tub", quantity: 3 },
    { name: "Wall tile grout 5kg", unit: "bag", quantity: 1 },
    { name: "Tile trim 2.5m", unit: "length", quantity: 3 },
    { name: "Sanitary silicone sealant white", unit: "tube", quantity: 1 },
    { name: "Basin mono mixer tap", unit: "each", quantity: 1 },
    { name: "15mm isolating valve", unit: "each", quantity: 2 },
  ],
  "Electrics: 3 new double sockets on a new radial": [
    { name: "Double switched socket white", unit: "each", quantity: 3 },
    { name: "Metal back box 35mm double", unit: "each", quantity: 3 },
    { name: "2.5mm twin and earth cable", unit: "m", quantity: 27 },
    { name: "RCBO 32A", unit: "each", quantity: 1 },
    { name: "Green yellow earth sleeving", unit: "pack", quantity: 1 },
  ],
  "Decorating: paint 4 x 3.5m bedroom": [
    { name: "Trade vinyl matt emulsion 10L", unit: "tub", quantity: 1 },
    { name: "White matt ceiling emulsion 5L", unit: "tub", quantity: 1 },
    { name: "Satinwood paint 750ml", unit: "tin", quantity: 1 },
    { name: "Decorators caulk", unit: "tube", quantity: 2 },
    { name: "Flexible filler", unit: "each", quantity: 1 },
    { name: "Masking tape 50m", unit: "roll", quantity: 1 },
  ],
  "Plastering: skim 30 m² walls": [
    { name: "Multi-finish plaster 25kg", unit: "bag", quantity: 3 },
    { name: "PVA bonding agent 5L", unit: "tub", quantity: 1 },
    { name: "Plasterboard scrim tape", unit: "roll", quantity: 1 },
    { name: "Thin coat angle bead 2.4m", unit: "length", quantity: 2 },
  ],
  "Carpentry: hang 3 doors, 14 m skirting": [
    { name: "Internal door 1981 x 762mm", unit: "each", quantity: 3 },
    { name: "Butt hinges 3in", unit: "pair", quantity: 5 },
    { name: "Tubular mortice latch 64mm", unit: "each", quantity: 3 },
    { name: "MDF torus skirting board 119mm", unit: "m", quantity: 16 },
    { name: "Grab adhesive", unit: "tube", quantity: 2 },
  ],
  "Plumbing: replace 2 radiators": [
    { name: "Double panel convector radiator 600 x 1000mm", unit: "each", quantity: 2 },
    { name: "Thermostatic radiator valve 15mm", unit: "each", quantity: 2 },
    { name: "Central heating inhibitor 500ml", unit: "each", quantity: 1 },
    { name: "15mm copper pipe", unit: "m", quantity: 3 },
  ],
};

let found = 0, total = 0;
for (const [job, items] of Object.entries(JOBS)) {
  console.log(`\n${job}`);
  let sum = 0;
  for (const item of items) {
    total++;
    const t = Date.now();
    const offers = await liveOffers(db, item, { pages: 4, compatible: isCompatibleProduct, head: headWord });
    const hit = chooseOffer(item, offers, isCompatibleProduct, { live: true });
    const ms = Date.now() - t;
    if (hit) {
      found++;
      sum += hit.unitPrice * item.quantity;
      console.log(`  ✓ ${item.quantity} ${item.unit} ${item.name}  →  £${hit.unitPrice}/${item.unit}  ${hit.supplier}: ${hit.matchedProduct}${hit.note ? `  [${hit.note}]` : ""}  (${ms} ms)`);
    } else {
      console.log(`  ✗ ${item.quantity} ${item.unit} ${item.name}  →  no match  (looked at: ${offers.map((o) => `${o.name} £${o.price}`).join(" | ") || "nothing"}; ${ms} ms)`);
    }
  }
  console.log(`  materials found: £${sum.toFixed(2)} inc VAT`);
}
console.log(`\nLive prices found for ${found}/${total} items (${Math.round((found / total) * 100)}%)`);
