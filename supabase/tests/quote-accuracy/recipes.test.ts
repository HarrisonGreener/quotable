// bun test supabase/tests/quote-accuracy
import { describe, expect, test } from "bun:test";

(globalThis as any).Deno ??= { env: { get: (k: string) => (k === "LIVE_PRICE_LOOKUPS" ? "off" : undefined) } };
globalThis.fetch = (async () => { throw new Error("offline"); }) as any;
const quiet = console.log;
console.log = () => {};
const engine = await import("../../functions/_shared/quote-engine.ts");
const R = await import("../../functions/_shared/recipes/index.ts");
const { RECIPE_JOBS } = await import("./recipe-bench.ts");
console.log = quiet;

const sum = (xs: any[]) => xs.reduce((s, x) => s + (x.cost || 0), 0);

export const priceRecipeJob = async (job: (typeof RECIPE_JOBS)[number]) => {
  const reading = R.normaliseReading({ ...job.reading, other_work: null, questions: [] });
  const built = R.buildFromReading(reading, 1);
  engine.resetLiveLookups(0);
  const log = console.log; console.log = () => {};
  const q = await engine.applyPricingToQuote(built, [], [], job.hourlyRate, job.hourlyRate * 8, "hourly", 1,
    job.trade, job.trade, job.description, [], { vatRegistered: false });
  console.log = log;
  const total = sum(q.materials) + sum(q.labour) + sum(q.overheads);
  return { q, built, total };
};

describe("recipe quotes land inside published UK price ranges", () => {
  for (const job of RECIPE_JOBS) {
    test(`${job.id} (£${job.guide.low}–£${job.guide.high})`, async () => {
      const { total } = await priceRecipeJob(job);
      expect(total).toBeGreaterThanOrEqual(job.guide.low * 0.9);
      expect(total).toBeLessThanOrEqual(job.guide.high * 1.1);
    });
  }
});

describe("recipes behave", () => {
  test("every recipe builds with its defaults and gives positive hours", () => {
    for (const r of R.RECIPES) {
      const job = R.resolveParams(r, {});
      const out = r.build(job.params);
      expect(out.labour.reduce((s, l) => s + l.hours, 0)).toBeGreaterThan(0);
      for (const m of out.materials) {
        expect(m.quantity).toBeGreaterThanOrEqual(0);
        expect(m.typical).toBeGreaterThan(0);
        expect(engine.isServiceItem(m.name)).toBe(false); // would be priced as a fee, not a product
      }
    }
  });

  test("same job in, same quote out", () => {
    const a = R.buildFromReading(R.guessReading("Paint a 4m by 3.5m bedroom", "decorator"));
    const b = R.buildFromReading(R.guessReading("Paint a 4m by 3.5m bedroom", "decorator"));
    expect(a).toEqual(b);
  });

  test("bigger jobs cost more", () => {
    const small = R.buildFromReading(R.normaliseReading({ jobs: [{ recipe: "tiling", params: { area: 5 } }] }));
    const big = R.buildFromReading(R.normaliseReading({ jobs: [{ recipe: "tiling", params: { area: 20 } }] }));
    const hrs = (q: any) => q.labour.reduce((s: number, l: any) => s + l.hours, 0);
    expect(hrs(big)).toBeGreaterThan(hrs(small) * 2.5);
  });

  test("a team finishes faster but costs about the same", () => {
    const reading = R.normaliseReading({ jobs: [{ recipe: "fence_panels", params: { length: 18 } }] });
    const solo = R.buildFromReading(reading, 1).labour.reduce((s, l) => s + l.hours, 0);
    const pair = R.buildFromReading(reading, 2).labour.reduce((s, l) => s + l.hours, 0);
    expect(pair).toBeLessThan(solo * 0.6);
    expect(pair * 2).toBeGreaterThan(solo);
    expect(pair * 2).toBeLessThan(solo * 1.2);
  });

  test("unstated measurements are reported as assumptions", () => {
    const q = R.buildFromReading(R.normaliseReading({ jobs: [{ recipe: "laminate_floor", params: {} }] }));
    expect(q.assumptions.some((a) => a.label === "Floor area" && a.important)).toBe(true);
  });

  test("bad AI output is ignored, not trusted", () => {
    const r = R.normaliseReading({ jobs: [{ recipe: "made_up" }, { recipe: "tiling", params: { area: 99999, surface: "roof" } }] });
    expect(r.jobs.length).toBe(1);
    expect(r.jobs[0].params.area).toBe(200);          // clamped to the recipe's max
    expect(r.jobs[0].params.surface).toBe("wall");    // unknown choice → default
  });

  test("offline reader picks the right recipe and numbers", () => {
    const cases: [string, string, string, Record<string, unknown>][] = [
      ["Add three double sockets on a new circuit from the consumer unit", "electrician", "sockets_add", { count: 3, new_circuit: true }],
      ["Retile bathroom walls, about 12 m2", "tiler", "tiling", { area: 12 }],
      ["Replace 15m of fence with concrete posts", "carpenter", "fence_panels", { length: 15, posts: "concrete" }],
      ["Hang 5 internal doors", "carpenter", "internal_doors", { count: 5 }],
      ["Replace two radiators", "plumber", "radiator_replace", { count: 2 }],
      ["Paint a 4m by 3.5m bedroom", "decorator", "paint_room", { length: 4, width: 3.5 }],
    ];
    for (const [d, t, id, params] of cases) {
      const r = R.guessReading(d, t);
      expect(r.jobs[0]?.recipe.id).toBe(id);
      for (const [k, v] of Object.entries(params)) expect(r.jobs[0].params[k]).toEqual(v);
    }
  });
});
