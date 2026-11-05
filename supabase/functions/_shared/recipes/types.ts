// ═══════════════════════════════════════════════════════════════════
// JOB RECIPES — the deterministic core of the quoting engine
//
// The AI only reads the job ("which recipe, what measurements"). A recipe
// turns those measurements into exact materials (in the units merchants
// sell them), labour hours and overheads. Same job in → same quote out.
//
// Prices on recipe lines are *typical UK retail prices including VAT*
// (late 2026). They are only used when no real supplier price is found,
// and such lines are always flagged "Verify".
// ═══════════════════════════════════════════════════════════════════

export type Trade = "plumbing" | "electrical" | "carpentry" | "decorating";

export interface Param {
  key: string;
  label: string;
  kind: "number" | "choice" | "boolean";
  unit?: string;            // "m²", "m", "each" …
  default: number | string | boolean;
  min?: number;
  max?: number;
  choices?: string[];
  /** Question to ask when the job description doesn't say */
  ask: string;
  /** When true, a missing value is a big enough guess that the user is asked */
  important?: boolean;
}

export type Params = Record<string, number | string | boolean>;

export interface RecipeMaterial {
  name: string;
  quantity: number;
  unit: string;
  /** Typical retail price per unit, inc VAT. Fallback only. */
  typical: number;
  optional?: boolean;
}

export interface RecipeLabour {
  name: string;
  /** Person-hours for one competent tradesperson */
  hours: number;
}

export interface RecipeOutput {
  materials: RecipeMaterial[];
  labour: RecipeLabour[];
  overheads: string[];
  notes?: string[];
}

export interface Recipe {
  id: string;
  trade: Trade;
  title: string;
  /** One line for the AI job reader */
  covers: string;
  /** Lower-case phrases that strongly suggest this recipe (offline fallback) */
  keywords: string[];
  params: Param[];
  build: (p: Params) => RecipeOutput;
}

// ── helpers used by recipes ───────────────────────────────────────

export const ceil = (n: number) => Math.ceil(n - 1e-9);
/** Number of packs needed to cover `need` when each pack gives `per`. */
export const packs = (need: number, per: number) => Math.max(1, ceil(need / per));
export const r1 = (n: number) => Math.round(n * 10) / 10;
export const num = (p: Params, k: string) => Number(p[k]) || 0;
export const yes = (p: Params, k: string) => p[k] === true || p[k] === "yes" || p[k] === "true";
export const str = (p: Params, k: string) => String(p[k] ?? "");

export const mat = (name: string, quantity: number, unit: string, typical: number, optional = false): RecipeMaterial =>
  ({ name, quantity, unit, typical, ...(optional && { optional }) });
export const lab = (name: string, hours: number): RecipeLabour => ({ name, hours: r1(hours) });
