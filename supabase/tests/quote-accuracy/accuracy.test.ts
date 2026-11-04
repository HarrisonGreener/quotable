// bun test supabase/tests/quote-accuracy
import { describe, expect, test } from "bun:test";

(globalThis as any).Deno ??= { env: { get: (k: string) => (k === "LIVE_PRICE_LOOKUPS" ? "off" : undefined) } };
globalThis.fetch = (async () => { throw new Error("offline"); }) as any;
console.log = () => {};
const engine = await import("../../functions/_shared/quote-engine.ts");
const { JOBS } = await import("./jobs.ts");
const { SUPPLIER_ROWS, REFERENCE_ROWS } = await import("./fixtures.ts");

const allPrices = SUPPLIER_ROWS.map(([product_name, unit, unit_price, source_name]) => ({
  product_name, unit, unit_price, source_name, confidence_score: 0.8, product_url: null,
}));
engine.setReferencePrices(REFERENCE_ROWS.map(([product_name, unit, unit_price]) => ({
  product_name, unit, unit_price, source_name: "Estimated", confidence_score: 0.5, product_url: null,
})));

const price = async (job: (typeof JOBS)[number], opts: any = { vatRegistered: true }) => {
  const ai = structuredClone(job.ai);
  const v = engine.validateAndEnhanceQuote(ai, job.description, job.trade, []);
  ai.materials.push(...v.injectedMaterials);
  ai.labour.push(...v.injectedLabour);
  engine.resetLiveLookups(0);
  return engine.applyPricingToQuote(ai, allPrices, [], job.hourlyRate ?? 45, job.dayRate ?? 250, job.paymentType,
    job.numWorkers, job.trade, job.trade, job.description, [], opts);
};
const sum = (xs: any[]) => xs.reduce((s, x) => s + (x.cost || 0), 0);

describe("benchmark jobs land within ±10% of the right price", () => {
  for (const job of JOBS) {
    test(job.id, async () => {
      const q = await price(job);
      const oh = sum(q.overheads);
      const got = (sum(q.materials) + sum(q.labour) + oh) * 1.2;
      const want = (job.truth.materialsExVat + job.truth.labour + oh) * 1.2;
      expect(Math.abs(got - want) / want).toBeLessThanOrEqual(0.1);
    });
  }
});

describe("product matching", () => {
  const ok = engine.isCompatibleProduct;
  test("a door is not a fence panel", () => expect(ok("Internal panel door 762x1981mm", "fence panel 6x6")).toBe(false));
  test("hinges are not a door lining", () => expect(ok("Door hinges 100mm pair", "softwood door lining")).toBe(false));
  test("wall tiles are not floor tiles", () => expect(ok("Ceramic wall tile white", "floor tile ceramic 300x300")).toBe(false));
  test("a 6A RCBO is not a 16A RCBO", () => expect(ok("RCBO 6A", "rcbo 16a")).toBe(false));
  test("10-way board is not 12-way", () => expect(ok("Consumer unit 10 way metal", "consumer unit 12 way")).toBe(false));
  test("tap connector is not a valve", () => expect(ok("15mm flexible tap connector", "isolation valve 15mm")).toBe(false));
  test("flue kit is not flue pipe", () => expect(ok("Boiler flue kit 60/100", "flue pipe 60/100")).toBe(false));
  test("double socket is not single", () => expect(ok("Double socket white", "Single Socket White")).toBe(false));
  test("same product, different wording", () => {
    expect(ok("15mm isolating valve", "isolation valve 15mm")).toBe(true);
    expect(ok("2.5mm twin and earth cable", "2.5mm twin and earth")).toBe(true);
    expect(ok("2.5mm twin and earth cable", "Prysmian 6242Y Grey 2.5mm² Twin & Earth Cable 100m Drum(20967)")).toBe(true);
    expect(ok("Fence post 100x100mm 2.4m", "fence post 100x100x2400")).toBe(true);
    expect(ok("Emulsion matt white 10L", "emulsion matt white 10l")).toBe(true);
  });
  test("scraped junk is rejected", () => {
    for (const n of ["Reduced Price", "Shop by...", "What are Plumbing Valves?", "Electrical Consumer Units"]) {
      expect(engine.isValidProductName(n)).toBe(false);
    }
  });
});

describe("commercial pricing", () => {
  const line = (o: any = {}) => ({ name: "x", quantity: 2, unit: "each", unitPrice: 12, cost: 24, priceSource: "Screwfix", priceConfidence: 0.9, priceBasis: "retail", ...o });
  test("VAT-registered: retail £12 inc VAT costs £10", () => {
    const [m] = engine.applyCommercialPricing([line()], { vatRegistered: true });
    expect(m.costPrice).toBe(10);
    expect(m.cost).toBe(20);
  });
  test("not VAT-registered: pays the VAT, so cost stays £12", () => {
    const [m] = engine.applyCommercialPricing([line()], { vatRegistered: false });
    expect(m.cost).toBe(24);
  });
  test("10% trade discount then 20% markup", () => {
    const [m] = engine.applyCommercialPricing([line()], { vatRegistered: true, tradeDiscountPercent: 10, materialMarkupPercent: 20 });
    expect(m.costPrice).toBe(9);
    expect(m.unitPrice).toBe(10.8);
  });
  test("whole packs: 20 m from a 100 m drum charges the drum", () => {
    const [m] = engine.applyCommercialPricing(
      [line({ quantity: 20, unit: "m", unitPrice: 0.75, cost: 15, packSize: 100, packPrice: 75 })],
      { vatRegistered: false, chargeWholePacks: true },
    );
    expect(m.cost).toBe(75);
  });
  test("own inventory prices aren't VAT-adjusted again", () => {
    const [m] = engine.applyCommercialPricing([line({ priceBasis: "own" })], { vatRegistered: true, materialMarkupPercent: 10 });
    expect(m.cost).toBe(26.4);
  });
});

describe("labour", () => {
  const ai = (hours: number[]) => ({ materials: [], optional_materials: [], overheads: [], suggested_overheads: [], labour: hours.map((h, i) => ({ name: `t${i}`, hours: h })) });
  test("hourly × workers", async () => {
    const q = await engine.applyPricingToQuote(ai([3, 1]), [], [], 50, 250, "hourly", 2, "electrician", "electrician", "job", [], {});
    expect(sum(q.labour)).toBe(400);
  });
  test("day rate rounds to half days and charges every worker", async () => {
    const q = await engine.applyPricingToQuote(ai([4, 8]), [], [], 50, 200, "day", 2, "tiler", "tiler", "job", [], {});
    expect(q.labour[0].hours).toBe(1.5);
    expect(sum(q.labour)).toBe(600);
  });
  test("a slight overrun doesn't add half a day", async () => {
    const q = await engine.applyPricingToQuote(ai([8.5]), [], [], 50, 200, "day", 1, "tiler", "tiler", "job", [], {});
    expect(q.labour[0].hours).toBe(1);
  });
});

describe("overheads", () => {
  test("the user's own rates win", () => {
    expect(engine.getOverheadPrice("Transport", { transport: 18 })).toBe(18);
    expect(engine.getOverheadPrice("Transport")).toBe(25);
  });
});
