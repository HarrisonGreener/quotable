// ═══════════════════════════════════════════════════════════════════
// Recipe registry, the AI job-reader prompt, and recipe → quote builder
// ═══════════════════════════════════════════════════════════════════

import type { Recipe, Params, Param, Trade } from "./types.ts";
import { r1 } from "./types.ts";
import { PLUMBING } from "./plumbing.ts";
import { ELECTRICAL } from "./electrical.ts";
import { CARPENTRY } from "./carpentry.ts";
import { DECORATING } from "./decorating.ts";

export type { Recipe, Params, Trade } from "./types.ts";

export const RECIPES: Recipe[] = [...PLUMBING, ...ELECTRICAL, ...CARPENTRY, ...DECORATING];
export const RECIPE_BY_ID = new Map(RECIPES.map((r) => [r.id, r]));

/** Which recipe trades fit the user's trade (a plumber still gets electrical recipes if the job needs it, but ranked lower). */
export const tradeOf = (trade: string): Trade | null => {
  const t = trade.toLowerCase();
  if (/plumb|heating|gas/.test(t)) return "plumbing";
  if (/electric|spark/.test(t)) return "electrical";
  if (/carpent|joiner|joinery|fenc|floor/.test(t)) return "carpentry";
  if (/plaster|paint|decor|tiler|tiling/.test(t)) return "decorating";
  return null;
};

// ── AI job reader ──────────────────────────────────────────────────

const describeParam = (p: Param) =>
  `${p.key}${p.kind === "choice" ? `=${p.choices!.join("|")}` : p.kind === "boolean" ? "=true|false" : `(${p.unit ?? "number"})`}`;

export const readerPrompt = () => `You read UK trade job descriptions and map them to standard job recipes.
You NEVER price anything and NEVER list materials — the recipes do that.

RECIPES (id — what it covers — parameters):
${RECIPES.map((r) => `- ${r.id} — ${r.covers} — ${r.params.map(describeParam).join(", ") || "no parameters"}`).join("\n")}

Return ONLY JSON:
{
  "title": "short job title",
  "jobs": [ { "recipe": "<id>", "params": { "<key>": <value> }, "said": ["<keys whose values the description actually states>"] } ],
  "other_work": "any part of the job no recipe covers, in plain words, or null",
  "questions": ["at most 3 short questions whose answers would change the price most"]
}

Rules:
- Use several jobs when the description has several distinct tasks (e.g. tiling AND a new toilet).
- Only put a value in params if the description states it or it is clearly implied
  (e.g. "a 4m by 3m bedroom" → length 4, width 3; "three sockets" → count 3). Leave the rest out — defaults are applied and shown to the user as assumptions.
- Convert units: feet → metres (× 0.305), square feet → m² (× 0.093).
- A line starting "Details:" holds corrections from the tradesperson. They override anything earlier and count as stated.
- Do not invent recipes. If nothing fits, return "jobs": [] and describe the work in other_work.`;

export interface ReadJob { recipe: Recipe; params: Params; assumed: Param[] }
export interface Reading { title: string; jobs: ReadJob[]; otherWork: string | null; questions: string[] }

const coerce = (param: Param, v: unknown): number | string | boolean | undefined => {
  if (v == null || v === "") return undefined;
  if (param.kind === "number") {
    const n = typeof v === "number" ? v : parseFloat(String(v));
    if (!isFinite(n)) return undefined;
    return Math.min(param.max ?? Infinity, Math.max(param.min ?? 0, n));
  }
  if (param.kind === "boolean") return v === true || /^(true|yes|y|1)$/i.test(String(v));
  const s = String(v).toLowerCase();
  return param.choices!.find((c) => c === s || s.includes(c));
};

/** Fill defaults and record which values were assumed rather than stated. */
export const resolveParams = (recipe: Recipe, given: Record<string, unknown> = {}, said?: string[]): ReadJob => {
  const params: Params = {};
  const assumed: Param[] = [];
  for (const p of recipe.params) {
    const v = coerce(p, given[p.key]);
    if (v === undefined) { params[p.key] = p.default; assumed.push(p); }
    else { params[p.key] = v; if (said && !said.includes(p.key) && p.important) assumed.push(p); }
  }
  return { recipe, params, assumed };
};

export const normaliseReading = (raw: any): Reading => {
  const jobs: ReadJob[] = [];
  for (const j of Array.isArray(raw?.jobs) ? raw.jobs : []) {
    const recipe = RECIPE_BY_ID.get(String(j?.recipe));
    if (!recipe) continue;
    jobs.push(resolveParams(recipe, j?.params ?? {}, Array.isArray(j?.said) ? j.said.map(String) : undefined));
  }
  return {
    title: String(raw?.title || jobs[0]?.recipe.title || "Quote").slice(0, 80),
    jobs,
    otherWork: raw?.other_work && String(raw.other_work).trim().toLowerCase() !== "null" ? String(raw.other_work).slice(0, 500) : null,
    questions: (Array.isArray(raw?.questions) ? raw.questions : []).map(String).slice(0, 3),
  };
};

// ── offline reader (no AI) — used if the AI is down, and in tests ──

const WORD_NUM: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12 };
const toNum = (s: string) => WORD_NUM[s.toLowerCase()] ?? parseFloat(s);

export const guessReading = (description: string, trade = ""): Reading => {
  const d = description.toLowerCase();
  // "a new circuit from the consumer unit" describes where power comes from, not the job
  const dk = d.replace(/\b(from|off|at|back to) the (consumer unit|fuse ?board|fuse box)/g, " ");
  const home = tradeOf(trade);
  const scored = RECIPES.map((r) => {
    let s = 0;
    for (const k of r.keywords) if (new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(dk)) s += k.split(" ").length + 1;
    if (s && r.trade === home) s += 0.5;
    return { r, s };
  }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
  if (!scored.length) return { title: "Quote", jobs: [], otherWork: description, questions: [] };

  const recipe = scored[0].r;
  const given: Record<string, unknown> = {};
  const n = "(\\d+(?:\\.\\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten|twelve)";
  const area = d.match(/(\d+(?:\.\d+)?)\s*(?:m2|m²|sq\.?\s*m|square met)/);
  const dims = d.match(/(\d+(?:\.\d+)?)\s*m?\s*(?:x|by|×)\s*(\d+(?:\.\d+)?)\s*m\b/);
  const metres = d.match(/(\d+(?:\.\d+)?)\s*(?:m|metres?|meters?)\b(?!\s*(?:x|by|×))/);
  for (const p of recipe.params) {
    if (p.kind !== "number") continue;
    if (p.unit === "m²" && area) given[p.key] = parseFloat(area[1]);
    else if (p.unit === "m²" && dims && !recipe.params.some((q) => q.key === "length")) given[p.key] = parseFloat(dims[1]) * parseFloat(dims[2]);
    else if (p.key === "length" && dims && recipe.params.some((q) => q.key === "width")) given[p.key] = parseFloat(dims[1]);
    else if (p.key === "width" && dims) given[p.key] = parseFloat(dims[2]);
    else if (p.unit === "m" && metres && !dims) given[p.key] = parseFloat(metres[1]);
    else if (p.unit === "each") {
      const nouns = recipe.keywords.filter((k) => !k.includes(" ")).concat(p.label.toLowerCase().split(" ").slice(-1));
      for (const noun of nouns) {
        const m = d.match(new RegExp(`\\b${n}\\s+(?:new\\s+|double\\s+|single\\s+|internal\\s+|\\w+\\s+)?${noun.replace(/s$/, "")}s?\\b`));
        if (m) { given[p.key] = toNum(m[1]); break; }
      }
    }
  }
  for (const p of recipe.params) {
    if (p.kind === "choice") { const c = p.choices!.find((c) => d.includes(c)); if (c) given[p.key] = c; }
    if (p.kind === "boolean" && /new circuit|dedicated circuit|from the consumer unit/.test(d) && p.key === "new_circuit") given[p.key] = true;
    if (p.kind === "boolean" && p.key === "remove_old" && /(remove|strip|rip out|take down|replace)/.test(d)) given[p.key] = true;
  }
  return { title: recipe.title, jobs: [resolveParams(recipe, given)], otherWork: null, questions: [] };
};

// ── recipes → the quote structure the pricing engine expects ──────

export interface RecipeQuote {
  projectTitle: string;
  materials: { name: string; quantity: number; unit: string; typicalPrice: number }[];
  optional_materials: { name: string; quantity: number; unit: string; typicalPrice: number }[];
  labour: { name: string; hours: number }[];
  overheads: { name: string }[];
  suggested_overheads: { name: string }[];
  assumptions: { job: string; label: string; value: string; question: string; important: boolean }[];
  recipes: string[];
}

const show = (p: Param, v: unknown) =>
  p.kind === "boolean" ? (v ? "yes" : "no") : `${v}${p.unit && p.unit !== "each" ? ` ${p.unit}` : ""}`;

/**
 * Build a quote structure from recipes. Labour hours are on-site hours per person:
 * a team of N finishes N× faster, less ~10% for working round each other.
 */
export const buildFromReading = (reading: Reading, numWorkers = 1): RecipeQuote => {
  const workers = Math.max(1, Math.round(numWorkers || 1));
  const teamFactor = workers > 1 ? 1 / (workers * 0.9) : 1;
  const materials = new Map<string, RecipeQuote["materials"][number]>();
  const optional = new Map<string, RecipeQuote["materials"][number]>();
  const labour: RecipeQuote["labour"] = [];
  const overheads = new Set<string>();
  const assumptions: RecipeQuote["assumptions"] = [];
  const multi = reading.jobs.length > 1;

  for (const { recipe, params, assumed } of reading.jobs) {
    const out = recipe.build(params);
    for (const m of out.materials) {
      if (!(m.quantity > 0)) continue;
      const bucket = m.optional ? optional : materials;
      const prev = bucket.get(m.name);
      if (prev) prev.quantity += m.quantity;
      else bucket.set(m.name, { name: m.name, quantity: m.quantity, unit: m.unit, typicalPrice: m.typical });
    }
    for (const l of out.labour) {
      if (l.hours > 0) labour.push({ name: multi ? `${recipe.title}: ${l.name}` : l.name, hours: r1(Math.max(0.25, l.hours * teamFactor)) });
    }
    out.overheads.forEach((o) => overheads.add(o));
    for (const p of assumed) {
      if (!recipe.params.includes(p)) continue;
      assumptions.push({ job: recipe.title, label: p.label, value: show(p, params[p.key]), question: p.ask, important: !!p.important });
    }
  }

  return {
    projectTitle: reading.title,
    materials: [...materials.values()],
    optional_materials: [...optional.values()],
    labour,
    overheads: [...overheads].map((name) => ({ name })),
    suggested_overheads: [],
    assumptions: assumptions.sort((a, b) => Number(b.important) - Number(a.important)),
    recipes: reading.jobs.map((j) => j.recipe.id),
  };
};

// ── shopping list for targeted crawling ───────────────────────────

/** Every distinct product the recipes can ask for (at default and common settings). */
export const recipeShoppingList = (): { name: string; trade: Trade; typical: number }[] => {
  const seen = new Map<string, { name: string; trade: Trade; typical: number }>();
  for (const r of RECIPES) {
    const variants: Params[] = [resolveParams(r, {}).params];
    for (const p of r.params) {
      if (p.kind === "choice") for (const c of p.choices!) variants.push({ ...variants[0], [p.key]: c });
      if (p.kind === "boolean") variants.push({ ...variants[0], [p.key]: !variants[0][p.key] });
      if (p.kind === "number") variants.push({ ...variants[0], [p.key]: Math.min(p.max ?? 100, Math.max(Number(p.default) * 4, 10)) });
    }
    for (const v of variants) {
      for (const m of r.build(v).materials) {
        if (!seen.has(m.name)) seen.set(m.name, { name: m.name, trade: r.trade, typical: m.typical });
      }
    }
  }
  return [...seen.values()];
};

/** Turn a product URL into searchable words: /Gripfill-Grab-Adhesive-350ml/p/123 → "gripfill grab adhesive 350ml" */
export const slugText = (url: string) => {
  try {
    return decodeURIComponent(new URL(url).pathname)
      .replace(/(\d)-(\d)/g, "$1.$2")
      .replace(/[\/_-]+/g, " ")
      .replace(/\b(p|prd|product|products|c)\b/gi, " ")
      .replace(/\b[a-z]?\d{5,}\b/gi, " ")
      .replace(/\.html?$/i, "")
      .trim();
  } catch { return ""; }
};
