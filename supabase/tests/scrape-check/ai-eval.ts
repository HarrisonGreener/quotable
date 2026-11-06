// FULL pipeline accuracy (real AI + live prices vs published UK price ranges), per AI provider.
// → live supplier prices → customer price, compared with published UK cost
// guide ranges for the same jobs. Needs GEMINI_API_KEY (repo secret).
//
//   GEMINI_API_KEY=... deno run -A supabase/tests/scrape-check/ai-eval.ts

import { readSitemap } from "../../functions/_shared/scraper.ts";
import { slugText } from "../../functions/_shared/recipes/index.ts";
import { chat, parseJsonReply } from "../../functions/_shared/ai.ts";
import * as engine from "../../functions/_shared/quote-engine.ts";
import { RECIPE_JOBS } from "../quote-accuracy/recipe-bench.ts";
import { liveOffers } from "../../functions/_shared/live-price.ts";
const totals: any[] = [];

// AI_ONLY=groq|cerebras|gemini tests one provider on its own, to compare quality
const only = Deno.env.get("AI_ONLY");
const keyFor: Record<string, string> = { groq: "GROQ_API_KEY", cerebras: "CEREBRAS_API_KEY", gemini: "GEMINI_API_KEY" };
if (only) {
  if (!Deno.env.get(keyFor[only] ?? "")) { console.log(`No ${keyFor[only]} secret set — skipping ${only}.`); Deno.exit(0); }
  Deno.env.set("AI_ORDER", only);
  for (const [n, k] of Object.entries(keyFor)) if (n !== only) Deno.env.delete(k);
} else if (!Object.values(keyFor).some((k) => Deno.env.get(k))) {
  console.log("No AI key secrets set — skipping the full AI evaluation.");
  Deno.exit(0);
}

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
const db: any = {
  rpc: async (fn: string, args: any) => {
    if (fn !== "search_product_pages") return { data: [] };
    const terms: string[] = args.terms;
    const must: string | null = args.must ?? null;
    const rows = index
      .filter((r: any) => !must || r.words.some((w: string) => w.startsWith(must)))
      .map((r) => ({ ...r, rank: terms.filter((t) => r.words.some((w) => w.startsWith(t))).length / (1 + r.words.length / 40) }))
      .filter((r) => r.rank > 0).sort((a, b) => b.rank - a.rank).slice(0, args.lim ?? 100);
    return { data: rows.map(({ url, supplier, slug, rank }) => ({ url, supplier, slug, rank })) };
  },
  from: () => { const c: any = { select: () => c, eq: () => c, insert: () => c, update: () => c, upsert: async () => ({}), maybeSingle: async () => ({ data: { id: "x" } }) }; return c; },
};
engine.setPriceClient(db);

const sum = (xs: any[]) => xs.reduce((s, x) => s + (x.cost || 0), 0);
let inside = 0;
const quiet = console.log;
for (const job of RECIPE_JOBS) {
  let res;
  try {
    res = await chat({
    json: true, temperature: 0.2,
    messages: [
      { role: "system", content: engine.getSystemPrompt("minimal", { primaryTrade: job.trade }, []) },
      { role: "user", content: `Generate the structured quote for:\nJob: ${job.description}\nLocation: Manchester\nCategory: ${job.trade}\nWorkers: 1\n\nReturn ONLY the JSON.` },
    ],
    });
  } catch (err) {
    console.log(`\n## ${job.id}: AI FAILED — ${err instanceof Error ? err.message : err}`);
    continue;
  }
  const ai = parseJsonReply(res.content);
  engine.resetLiveLookups(12);
  console.log = () => {};
  const q = await engine.applyPricingToQuote(ai, [], [], job.hourlyRate, job.hourlyRate * 8, "hourly", 1, job.trade, job.trade, job.description, [], { vatRegistered: false });
  console.log = quiet;
  const mat = sum(q.materials), lab = sum(q.labour), oh = sum(q.overheads), total = mat + lab + oh;
  const hours = q.labour.reduce((s: number, l: any) => s + (l.hours || 0), 0);
  const ok = total >= job.guide.low * 0.9 && total <= job.guide.high * 1.1;
  if (ok) inside++;
  console.log(`\n## ${job.id}: £${total.toFixed(0)} (materials £${mat.toFixed(0)}, labour £${lab.toFixed(0)} = ${hours}h, overheads £${oh.toFixed(0)}) — guide £${job.guide.low}–£${job.guide.high} ${ok ? "✓" : total < job.guide.low ? "LOW" : "HIGH"}  [${res.provider ?? ""} ${res.model ?? ""}]`);
  for (const m of q.materials) {
    console.log(`   ${m.quantity} ${m.unit} ${m.name} → £${m.unitPrice} ${m.priceSource}${m.matchedProduct ? `: ${m.matchedProduct}` : ""}${m.needsVerification ? " [VERIFY]" : ""}`);
    if (m.needsVerification) {
      // why wasn't a live price found? re-run the lookup with tracing
      const trace: string[] = [];
      const offers = await liveOffers(db, { name: m.name, unit: m.unit }, { pages: 4, compatible: engine.isCompatibleProduct, head: engine.headWord, trace });
      console.log(`      why: ${trace.join(" ; ").slice(0, 600)}${offers.length ? ` | offers: ${offers.map((o) => `${o.name} £${o.price} (${engine.incompatibility(m.name, o.name) ?? "unit/size"})`).join(" | ")}` : ""}`);
    }
  }
  totals.push({ id: job.id, total, low: job.guide.low, high: job.guide.high, hours });
  for (const l of q.labour) console.log(`   labour: ${l.name} ${l.hours}h`);
}
console.log(`\nQuotes inside the published range (±10%): ${inside}/${RECIPE_JOBS.length}`);
for (const t of totals) console.log(`  ${t.id.padEnd(16)} £${t.total.toFixed(0).padStart(5)}  guide £${t.low}–£${t.high}  ${t.hours}h`);
