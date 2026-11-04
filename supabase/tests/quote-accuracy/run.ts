// Quote accuracy bench — runs the real pricing engine on the benchmark jobs
// with a fixed AI output, so results reflect pricing logic, not AI luck.
//
//   bun supabase/tests/quote-accuracy/run.ts           (summary)
//   bun supabase/tests/quote-accuracy/run.ts --lines   (every priced line)
//   bun supabase/tests/quote-accuracy/run.ts --json out.json

// Minimal Deno shim so the edge-function module loads under Bun/Node.
const env: Record<string, string> = { LIVE_PRICE_LOOKUPS: "off" };
(globalThis as any).Deno ??= { env: { get: (k: string) => env[k] } };
globalThis.fetch = (async () => { throw new Error("network disabled in bench"); }) as any;
const quiet = console.log;
const engine = await import("../../functions/_shared/quote-engine.ts");
console.log = () => {};

import { JOBS } from "./jobs.ts";
import { REFERENCE_ROWS, SUPPLIER_ROWS } from "./fixtures.ts";

const VAT_REGISTERED = true; // the app adds 20% VAT on top when "Include VAT" is on

const allPrices = SUPPLIER_ROWS.map(([product_name, unit, unit_price, source_name]) => ({
  product_name, unit, unit_price, source_name, confidence_score: 0.8, product_url: null,
}));
engine.setReferencePrices(REFERENCE_ROWS.map(([product_name, unit, unit_price]) => ({
  product_name, unit, unit_price, source_name: "Estimated", confidence_score: 0.5, product_url: null,
})));

const pct = (got: number, want: number) => (want === 0 ? 0 : ((got - want) / want) * 100);
const gbp = (n: number) => `£${n.toFixed(2)}`;
const sign = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

const showLines = process.argv.includes("--lines");
const jsonIdx = process.argv.indexOf("--json");
const jsonOut = jsonIdx >= 0 ? process.argv[jsonIdx + 1] : undefined;

const results: any[] = [];
for (const job of JOBS) {
  const ai = structuredClone(job.ai);
  const v = engine.validateAndEnhanceQuote(ai, job.description, job.trade, []);
  ai.materials.push(...v.injectedMaterials);
  ai.labour.push(...v.injectedLabour);

  engine.resetLiveLookups(0);
  const q = await engine.applyPricingToQuote(
    ai, allPrices, [], job.hourlyRate ?? 45, job.dayRate ?? 250, job.paymentType, job.numWorkers,
    job.trade, job.trade, job.description, [],
    { vatRegistered: VAT_REGISTERED, materialMarkupPercent: 0, tradeDiscountPercent: 0 },
  );

  const mat = q.materials.reduce((s: number, m: any) => s + (m.cost || 0), 0);
  const lab = q.labour.reduce((s: number, l: any) => s + (l.cost || 0), 0);
  const oh = q.overheads.reduce((s: number, o: any) => s + (o.cost || 0), 0);
  // What the customer is charged, as the app does it (VAT added on top of everything)
  const vatOnTop = (q as any).vat_on_top ?? (VAT_REGISTERED ? 0.2 : 0);
  const engineTotal = (mat + lab + oh) * (1 + vatOnTop) + ((q as any).vat_extra ?? 0);
  const truthTotal = (job.truth.materialsExVat + job.truth.labour + oh) * (VAT_REGISTERED ? 1.2 : 1);

  results.push({
    id: job.id, mat, truthMat: job.truth.materialsExVat, lab, truthLab: job.truth.labour,
    engineTotal, truthTotal, lines: q.materials,
  });
}

console.log = quiet;
console.log("\nQUOTE ACCURACY BENCH — pricing engine, fixed AI output, VAT-registered tradesperson\n");
console.log("job      materials (got / true / err)        labour (got / true / err)       customer total err");
for (const r of results) {
  console.log(
    `${r.id.padEnd(8)} ${gbp(r.mat).padStart(9)} / ${gbp(r.truthMat).padStart(9)} / ${sign(pct(r.mat, r.truthMat)).padStart(7)}    ` +
    `${gbp(r.lab).padStart(8)} / ${gbp(r.truthLab).padStart(8)} / ${sign(pct(r.lab, r.truthLab)).padStart(7)}    ` +
    `${sign(pct(r.engineTotal, r.truthTotal)).padStart(7)}`,
  );
  if (showLines) {
    for (const m of r.lines) {
      console.log(`           · ${String(m.quantity).padStart(5)} × ${m.name.padEnd(36).slice(0, 36)} ${gbp(m.cost || 0).padStart(9)}  [${m.priceSource}${m.matchedProduct ? ` → ${m.matchedProduct}` : ""}]`);
    }
  }
}
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const mape = (k: string, t: string) => mean(results.map((r) => Math.abs(pct(r[k], r[t]))));
console.log(`\nMean absolute error — materials ${mape("mat", "truthMat").toFixed(1)}% · labour ${mape("lab", "truthLab").toFixed(1)}% · customer total ${mape("engineTotal", "truthTotal").toFixed(1)}%`);
const within10 = results.filter((r) => Math.abs(pct(r.engineTotal, r.truthTotal)) <= 10).length;
console.log(`Quotes within ±10% of the right price: ${within10}/${results.length}\n`);

if (jsonOut && !jsonOut.startsWith("--")) {
  await Bun.write(jsonOut, JSON.stringify(results.map(({ lines, ...r }) => r), null, 2));
}
