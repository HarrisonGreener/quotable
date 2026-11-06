// Live accuracy evaluation of the pricing pipeline on realistic, messy AI output.
// Prints every item with what it matched, so failures can be diagnosed.
//
//   deno run -A supabase/tests/scrape-check/live-eval.ts [out.json]

import { readSitemap, fetchPage } from "../../functions/_shared/scraper.ts";
import { slugText } from "../../functions/_shared/recipes/index.ts";
import { liveOffers, chooseOffer, searchTerms } from "../../functions/_shared/live-price.ts";
import { isCompatibleProduct, incompatibility, headWord } from "../../functions/_shared/quote-engine.ts";
import { EVAL_JOBS } from "./eval-jobs.ts";

const SUPPLIERS: Record<string, { sitemap: string; pattern: RegExp }> = {
  Toolstation: { sitemap: "https://www.toolstation.com/sitemap.xml", pattern: /\/p\d{3,}/ },
  Wickes: { sitemap: "https://www.wickes.co.uk/sitemap.xml", pattern: /\/p\/\d+/ },
  "Travis Perkins": { sitemap: "https://www.travisperkins.co.uk/sitemap.xml", pattern: /\/p\/|\/product|\/\d{5,}(?:$|[/?.])/i },
};

const index: { url: string; supplier: string; slug: string; words: string[] }[] = [];
await Promise.all(Object.entries(SUPPLIERS).map(async ([supplier, cfg]) => {
  for (const url of await readSitemap(cfg.sitemap, cfg.pattern, 80000)) {
    const slug = slugText(url).toLowerCase();
    if (slug.length >= 6) index.push({ url, supplier, slug, words: slug.split(/\s+/) });
  }
}));
console.log(`Index: ${index.length} product pages`);

// ── VAT check: do the suppliers' structured prices include VAT? ──
for (const [supplier] of Object.entries(SUPPLIERS)) {
  const sample = index.find((r) => r.supplier === supplier && /cable|plaster|socket/.test(r.slug));
  if (!sample) continue;
  const page = await fetchPage(sample.url, { allowFirecrawl: false });
  const h = page.html;
  const ld = [...h.matchAll(/<script[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join(" ");
  const vatFlag = ld.match(/valueAddedTaxIncluded"?\s*:\s*"?(\w+)/)?.[1];
  const ldPrice = ld.match(/"price"\s*:\s*"?([\d.]+)/)?.[1];
  const visible = [...h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").matchAll(/£\s?[\d,]+\.\d{2}[^£]{0,25}(?:inc|ex|exc)\.?\s*VAT/gi)].slice(0, 4).map((m) => m[0]);
  console.log(`VAT ${supplier}: ${sample.slug} | JSON-LD price ${ldPrice} | valueAddedTaxIncluded=${vatFlag ?? "-"} | page shows: ${visible.join(" ; ") || "no inc/ex VAT text"}`);
}

const db: any = {
  rpc: async (fn: string, args: any) => {
    if (fn !== "search_product_pages") return { data: [] };
    const terms: string[] = args.terms;
    const must: string | null = args.must ?? null;
    const rows = index
      .filter((r: any) => !must || r.words.some((w: string) => w.startsWith(must)))
      .map((r) => ({ ...r, rank: terms.filter((t) => r.words.some((w) => w.startsWith(t))).length / (1 + r.words.length / 40) }))
      .filter((r) => r.rank > 0)
      .sort((a, b) => b.rank - a.rank)
      .slice(0, args.lim ?? 100);
    return { data: rows.map(({ url, supplier, slug, rank }) => ({ url, supplier, slug, rank })) };
  },
  from: () => {
    const chain: any = { select: () => chain, eq: () => chain, insert: () => chain, update: () => chain, upsert: async () => ({}), maybeSingle: async () => ({ data: { id: "x" } }) };
    return chain;
  },
};

const out: any[] = [];
let found = 0, total = 0;
for (const job of EVAL_JOBS) {
  console.log(`\n## ${job.title}`);
  for (const item of job.items) {
    total++;
    const trace: string[] = [];
    const offers = await liveOffers(db, item, { pages: 4, compatible: isCompatibleProduct, head: headWord, trace });
    const hit = chooseOffer(item, offers, isCompatibleProduct, { live: true });
    const rejected = offers.filter((o) => o.name !== hit?.matchedProduct).map((o) => `${o.name} £${o.price}`);
    if (hit) found++;
    const line = hit
      ? `✓ ${item.name} [${item.unit}] → £${hit.unitPrice} | ${hit.supplier}: ${hit.matchedProduct}${hit.note ? ` {${hit.note}}` : ""}`
      : `✗ ${item.name} [${item.unit}] → none | terms: ${searchTerms(item.name).join(",")} | saw: ${rejected.map((r) => `${r} (${incompatibility(item.name, r.replace(/ £[\d.]+$/, "")) ?? "size/unit"})`).join(" | ") || "nothing"} | trace: ${trace.join(" ; ")}`;
    console.log(line);
    out.push({ job: job.title, ...item, hit, offers });
  }
}
console.log(`\nLive prices found for ${found}/${total} items (${Math.round((found / total) * 100)}%)`);
if (Deno.args[0]) await Deno.writeTextFile(Deno.args[0], JSON.stringify(out, null, 2));
