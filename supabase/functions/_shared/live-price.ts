// ═══════════════════════════════════════════════════════════════════
// LIVE PRICING — any item the AI lists → a real product and price
//
//   1. Search what we already know (market_prices, by name).
//   2. If nothing fresh, search the product-page index (every product URL
//      from supplier sitemaps), open the best pages live, read the price.
//   3. Check it really is the item (type and size must agree), convert the
//      pack (a 50 m drum, a pack of 5, a 10 L tub) into the unit the quote
//      uses, and cache it for next time.
// ═══════════════════════════════════════════════════════════════════

import { fetchPage, extractProducts, similarity, tokens } from "./scraper.ts";

// ── pack sizes ────────────────────────────────────────────────────

export interface Pack { count?: number; length?: number; area?: number; volume?: number; weight?: number }

const lastNum = (s: string, re: RegExp): number | undefined => {
  let out: number | undefined;
  for (const m of s.matchAll(re)) {
    const n = parseFloat(m[1].replace(",", ""));
    if (isFinite(n) && n > 0) out = n;
  }
  return out;
};

/** Read the pack size from a product name. */
export const parsePack = (raw: string): Pack => {
  const s = raw.toLowerCase().replace(/&amp;/g, "&").replace(/(\d),(\d{3})\b/g, "$1$2");
  const p: Pack = {};
  p.count = lastNum(s, /\b(?:pack|box|tub|bag|tin|set|bundle|case)\s+of\s+(\d+)/g)
    ?? lastNum(s, /\b(\d+)\s*(?:-\s*)?(?:pack|pk|pcs|pieces|piece|no\.?|units|per pack)\b/g)
    ?? lastNum(s, /\((\d+)\s*(?:pcs|pack)?\)/g);
  // lengths in metres — never mm
  p.length = lastNum(s, /(?<![\d.])(\d+(?:\.\d+)?)\s*(?:m|mtr|metres?|meters?|lm)\b(?![²2])/g);
  p.area = lastNum(s, /(?<![\d.])(\d+(?:\.\d+)?)\s*(?:m²|m2|sqm|sq\.?\s*m)\b/g);
  const litres = lastNum(s, /(?<![\d.])(\d+(?:\.\d+)?)\s*(?:l|ltr|litres?|liters?)\b/g);
  const ml = lastNum(s, /(?<![\d.])(\d+(?:\.\d+)?)\s*ml\b/g);
  p.volume = litres ?? (ml ? ml / 1000 : undefined);
  const kg = lastNum(s, /(?<![\d.])(\d+(?:\.\d+)?)\s*kg\b/g);
  const g = lastNum(s, /(?<![\d.])(\d+(?:\.\d+)?)\s*g\b/g);
  p.weight = kg ?? (g ? g / 1000 : undefined);
  if (p.count && p.count > 5000) delete p.count;
  return p;
};

type UnitKind = "length" | "area" | "volume" | "weight" | "count";
export const unitKind = (unit: string): UnitKind => {
  const u = (unit || "each").toLowerCase().trim();
  if (/^(m|metre|metres|meter|meters|lm|linear m|lin m|mtr)$/.test(u)) return "length";
  if (/^(m2|m²|sqm|sq m|square metres?|square meters?)$/.test(u)) return "area";
  if (/^(l|ltr|litre|litres|liter|liters)$/.test(u)) return "volume";
  if (/^(kg|kilo|kilos|kilograms?)$/.test(u)) return "weight";
  return "count";
};

const PACK_UNITS = /^(pack|packs|box|boxes|tub|tubs|bag|bags|set|sets|bundle|case|tin|tins)$/;

/**
 * Price per quote-unit for a product. Returns null when the product can't be
 * expressed in that unit (e.g. quote wants metres but the page has no length).
 */
export const convertPrice = (
  wanted: { name: string; unit: string },
  product: { name: string; price: number },
): { unitPrice: number; note?: string } | null => {
  const kind = unitKind(wanted.unit);
  const pp = parsePack(product.name);
  const wp = parsePack(wanted.name);
  const per = (n: number, label: string, size: number) => ({
    unitPrice: Math.round((product.price / size) * 100) / 100,
    note: `£${product.price.toFixed(2)} for ${size}${label} → £${(product.price / size).toFixed(2)}/${wanted.unit}`,
  });

  if (kind === "length") {
    // "4400mm x 119mm x 18mm" → the longest dimension of a metre or more is the length
    const mmLen = Math.max(0, ...[...product.name.matchAll(/(\d{4,5})\s*mm/gi)].map((m) => parseInt(m[1], 10))) / 1000;
    let L = (pp.count ?? 1) * (pp.length ?? (mmLen >= 1 ? mmLen : 0));
    // Beading and trims are sold in standard 2.4 m lengths and often don't say so
    if (!L && /\b(scotia|quadrant|beading|bead|trim|cover strip|edging)\b/i.test(product.name)) {
      const r = per(product.price, " m (standard length assumed)", 2.4);
      return { ...r, note: `£${product.price.toFixed(2)} per 2.4 m length (assumed) → £${(product.price / 2.4).toFixed(2)}/${wanted.unit}` };
    }
    return L > 0 ? per(product.price, " m", L) : null;
  }
  if (kind === "area") {
    if (pp.area) return per(product.price, " m²", (pp.count ?? 1) * pp.area);
    // "Tile 300 x 600mm Pack of 6" → 6 × 0.18 m²; only for packs (a lone tile price may really be per m²)
    const d = dimensionNumbers(product.name).filter((n) => n >= 50 && n <= 3000);
    if (pp.count && pp.count > 1 && d.length >= 2) return per(product.price, " m²", (pp.count * d[0] * d[1]) / 1e6);
    return null;
  }
  if (kind === "volume") return pp.volume ? per(product.price, " L", (pp.count ?? 1) * pp.volume) : null;
  if (kind === "weight") return pp.weight ? per(product.price, " kg", (pp.count ?? 1) * pp.weight) : null;

  // Counted items: packs, boxes, tubs, "each"
  const u = wanted.unit.toLowerCase().trim();
  let price = product.price;
  let note: string | undefined;
  // Same kind of size on both sides (10 L tub vs 5 L tin, 25 kg vs 20 kg bag, 3 m vs 2 m length)
  for (const k of ["volume", "weight", "area", "length"] as const) {
    if (wp[k] && pp[k] && Math.abs(wp[k]! - pp[k]!) / wp[k]! > 0.02) {
      const ratio = wp[k]! / pp[k]!;
      if (ratio < 0.34 || ratio > 3) return null; // too different to price one from the other
      price = price * ratio;
      note = `scaled from ${pp[k]} to ${wp[k]}`;
      break;
    }
  }
  if (u === "pair" || u === "pairs") {
    const inName = /\bpair\b|\btwin pack\b|\bset of 2\b|(?:&|\band\b)\s*(?:amp;\s*)?lockshield/i.test(product.name);
    const unitPrice = pp.count ? (price / pp.count) * 2 : inName ? price : price * 2;
    return { unitPrice: Math.round(unitPrice * 100) / 100, note: pp.count ? `pack of ${pp.count} → pair` : undefined };
  }
  if (pp.count && pp.count > 1) {
    if (PACK_UNITS.test(u) && wp.count) {
      const ratio = wp.count / pp.count;
      if (ratio < 0.34 || ratio > 3) return null; // a pack of 12 says little about a pack of 100
      price = (price / pp.count) * wp.count; note = `pack of ${pp.count} → pack of ${wp.count}`;
    }
    else if (!PACK_UNITS.test(u) && !wp.count) { price = price / pp.count; note = `£${product.price.toFixed(2)} for ${pp.count} → each`; }
  } else if (wp.count && wp.count > 1 && PACK_UNITS.test(u)) {
    return null; // quote wants a pack of N, product is a single — can't tell the pack price
  }
  return { unitPrice: Math.round(price * 100) / 100, note };
};

// ── choosing the best offer ───────────────────────────────────────

export interface Offer {
  name: string; price: number; url?: string | null; supplier: string;
  fetchedAt?: string | null; confidence?: number;
}
export interface Priced {
  unitPrice: number; matchedProduct: string; supplier: string; url?: string | null;
  score: number; note?: string; live: boolean;
}

/** Dimensions in "600 x 1000mm" / "2.4m x 1.2m" style, in mm. A number without a unit takes the next unit in the group. */
export const dimensionNumbers = (s: string): number[] => {
  const out: number[] = [];
  const toMm = (n: number, u?: string) => (u === "m" ? n * 1000 : u === "cm" ? n * 10 : u === "ft" ? n * 304.8 : n);
  const re = /(\d+(?:\.\d+)?)\s*(mm|cm|m|ft)?\s*x\s*(\d+(?:\.\d+)?)\s*(mm|cm|m|ft)?(?:\s*x\s*(\d+(?:\.\d+)?)\s*(mm|cm|m|ft)?)?/g;
  for (const m of s.toLowerCase().matchAll(re)) {
    const units = [m[2], m[4], m[6]];
    const nums = [m[1], m[3], m[5]];
    nums.forEach((n, i) => {
      if (!n) return;
      const unit = units[i] ?? units.slice(i + 1).find(Boolean) ?? units.slice(0, i).reverse().find(Boolean) ?? "mm";
      out.push(Math.round(toMm(parseFloat(n), unit) * 100) / 100);
    });
  }
  return out;
};
/** When both name W x H dimensions, every wanted dimension must be on the product (2.5% tolerance). */
export const sameDimensions = (wanted: string, candidate: string) => {
  const a = dimensionNumbers(wanted), b = dimensionNumbers(candidate);
  if (!a.length || !b.length) return true;
  const pool = [...b];
  return a.every((n) => {
    const i = pool.findIndex((x) => Math.abs(x - n) <= Math.max(0.5, 0.025 * Math.max(x, n)));
    if (i < 0) return false;
    pool.splice(i, 1);
    return true;
  });
};

/** Best offer for an item: must be the same type and size; among close matches, the cheapest. */
export const chooseOffer = (
  item: { name: string; unit: string },
  offers: Offer[],
  compatible: (wanted: string, candidate: string) => boolean,
  opts: { minScore?: number; preferred?: string[]; live?: boolean } = {},
): Priced | null => {
  const minScore = opts.minScore ?? 0.15; // the compatibility rule does the real filtering; this only drops noise
  const COLOURS = /\b(white|black|grey|gray|green|yellow|brown|cream|magnolia|chrome)\b/gi;
  const scoreOf = (o: Offer) => {
    // a colour the product doesn't mention shouldn't sink an otherwise exact match
    const missing = (item.name.match(COLOURS) ?? []).filter((c) => !new RegExp(`\\b${c}\\b`, "i").test(o.name));
    const wantedName = missing.reduce((n, c) => n.replace(new RegExp(`\\b${c}\\b`, "i"), ""), item.name);
    return similarity(wantedName, o.name) - 0.05 * missing.length;
  };
  const scored = offers
    .map((o) => ({ o, score: scoreOf(o) }))
    .filter((x) => x.score >= minScore && x.o.price > 0 && compatible(item.name, x.o.name) && sameDimensions(item.name, x.o.name))
    .map((x) => ({ ...x, conv: convertPrice(item, x.o) }))
    .filter((x): x is typeof x & { conv: NonNullable<typeof x.conv> } => !!x.conv && x.conv.unitPrice > 0);
  if (!scored.length) return null;
  const top = Math.max(...scored.map((x) => x.score));
  const close = scored.filter((x) => x.score >= top - 0.12);
  const pref = new Set((opts.preferred ?? []).map((s) => s.toLowerCase()));
  close.sort((a, b) =>
    (pref.has(b.o.supplier.toLowerCase()) ? 1 : 0) - (pref.has(a.o.supplier.toLowerCase()) ? 1 : 0)
    || a.conv.unitPrice - b.conv.unitPrice);
  const best = close[0];
  return {
    unitPrice: best.conv.unitPrice, matchedProduct: best.o.name, supplier: best.o.supplier,
    url: best.o.url, score: best.score, note: best.conv.note, live: !!opts.live,
  };
};

// ── VAT basis ─────────────────────────────────────────────────────
// Toolstation and Wickes publish prices including VAT. Travis Perkins (a trade
// merchant) publishes them EXCLUDING VAT — its page shows "£29.55 ex. vat" with
// £35.46 as the main price. Quotes work in retail prices inc VAT, so convert.
export const PRICES_EX_VAT = new Set(["Travis Perkins"]);
export const retailPrice = (supplier: string, price: number) =>
  PRICES_EX_VAT.has(supplier) ? Math.round(price * 1.2 * 100) / 100 : price;

// ── database + live lookups ───────────────────────────────────────

/** Words worth searching on: drop sizes and filler, keep nouns. */
export const searchTerms = (name: string) => {
  const words = tokens(name)
    .filter((t) => /^[a-z]{3,}$/.test(t) && !/^(new|and|with|for|white|each|set|pack|pair|tub|bag|type|way|unit|kit|outlet|device|inch|marked)$/.test(t))
    .map((t) => (t.length > 4 ? t.replace(/(ies)$/, "y").replace(/([^s])s$/, "$1") : t)); // "tails" also finds "tail"
  // panel/door sizes like 1981 x 762 (or 2.4m x 1.2m → 2400, 1200) narrow the search a lot
  const sizes = [
    ...[...name.matchAll(/(?<![\d.])(\d{3,4})(?![\d.])/g)].map((m) => m[1]),
    ...dimensionNumbers(name).filter((n) => n >= 100 && Number.isInteger(n)).map(String),
  ];
  return [...new Set([...words.slice(0, 6), ...sizes.slice(0, 2)])];
};

const FRESH_DAYS = Number(Deno.env.get("PRICE_FRESH_DAYS") || 14);

/** Known prices for an item from the database (already-scraped real products). */
export const dbOffers = async (supabase: any, name: string): Promise<Offer[]> => {
  const terms = searchTerms(name);
  if (!terms.length) return [];
  const { data } = await supabase.rpc("search_market_prices", { terms, lim: 40 });
  return (data ?? [])
    .filter((r: any) => r.source_type !== "reference" && r.source_name)
    .map((r: any) => ({
      name: r.product_name, price: Number(r.unit_price), url: r.product_url, supplier: r.source_name,
      fetchedAt: r.last_updated, confidence: Number(r.confidence_score) || 0.8,
    }));
};

export const isFresh = (o: Offer) =>
  !!o.fetchedAt && Date.now() - new Date(o.fetchedAt).getTime() < FRESH_DAYS * 86_400_000;

const sourceIds = new Map<string, string>();
const sourceId = async (supabase: any, supplier: string): Promise<string | null> => {
  if (sourceIds.has(supplier)) return sourceIds.get(supplier)!;
  let { data } = await supabase.from("price_sources").select("id").eq("name", supplier).maybeSingle();
  if (!data) {
    ({ data } = await supabase.from("price_sources")
      .insert({ name: supplier, source_type: "merchant_scrape", is_active: true }).select("id").maybeSingle());
  }
  if (data?.id) sourceIds.set(supplier, data.id);
  return data?.id ?? null;
};

/** Save a scraped product so the next quote gets it instantly. */
export const storeProduct = async (
  supabase: any,
  p: { name: string; price: number; url: string; sku?: string; supplier: string; category?: string | null },
) => {
  const source_id = await sourceId(supabase, p.supplier);
  const row = {
    product_name: p.name.slice(0, 250), unit_price: p.price, unit: "each", category: p.category || "general",
    sku: p.sku ?? null, source_id, product_url: p.url, region: "UK", confidence_score: 0.9,
    is_active: true, last_updated: new Date().toISOString(),
  };
  const { error } = await supabase.from("market_prices").upsert(row, { onConflict: "product_name,source_id" });
  if (error) console.log(`store failed for ${p.url}: ${error.message}`);
  await supabase.from("crawl_queue").update({ crawl_status: "success", product_count: 1, last_crawled: row.last_updated, error_message: null }).eq("url", p.url);
};

/** Open the best product pages for an item right now and read their prices. */
export const liveOffers = async (
  supabase: any,
  item: { name: string; unit: string },
  opts: {
    pages?: number; category?: string | null; trace?: string[];
    compatible?: (wanted: string, candidate: string) => boolean;
    head?: (name: string) => string | undefined;
  } = {},
): Promise<Offer[]> => {
  const terms = searchTerms(item.name);
  if (!terms.length) return [];
  // Pages must contain what the item IS ("hinge"), so "internal door hinge" doesn't return 100 doors
  const head = opts.head ? opts.head(item.name) : undefined;
  const must = head && /^[a-z]{3,}$/.test(head) ? (head.length > 4 ? head.replace(/(ing|ion|ed|s)$/, "") : head) : null;
  let { data } = await supabase.rpc("search_product_pages", { terms, lim: 100, must });
  if (must && (data?.length ?? 0) < 5) ({ data } = await supabase.rpc("search_product_pages", { terms, lim: 100 }));
  const trace = (m: string) => opts.trace?.push(m);
  trace(`index hits ${data?.length ?? 0}: ${(data ?? []).slice(0, 4).map((r: any) => `${r.slug} [sim ${similarity(item.name, r.slug || "").toFixed(2)}${opts.compatible && !opts.compatible(item.name, r.slug || "") ? " incompatible" : ""}]`).join(" | ")}`);
  const ranked = (data ?? [])
    .map((r: any) => ({ ...r, score: similarity(item.name, r.slug || "") }))
    .filter((r: any) => r.score >= 0.25 && !/\bsample\b/.test(r.slug || ""))
    // don't spend a page fetch on something the address already shows is the wrong thing
    .filter((r: any) => !opts.compatible || opts.compatible(item.name, r.slug || ""))
    .sort((a: any, b: any) => b.score - a.score || (a.slug?.length ?? 0) - (b.slug?.length ?? 0));

  trace(`after similarity+compatibility ${ranked.length}: ${ranked.slice(0, 3).map((r: any) => r.slug).join(" | ")}`);
  // Best page per supplier, then the next best overall, up to `pages`
  const pick: any[] = [];
  const seenSupplier = new Set<string>();
  for (const r of ranked) if (!seenSupplier.has(r.supplier)) { pick.push(r); seenSupplier.add(r.supplier); }
  for (const r of ranked) if (pick.length < (opts.pages ?? 4) && !pick.includes(r)) pick.push(r);

  const offers = await Promise.all(pick.slice(0, opts.pages ?? 4).map(async (r: any) => {
    const page = await fetchPage(r.url, { allowFirecrawl: false });
    const p = page.ok ? extractProducts(page.html, r.url)[0] : undefined;
    trace(`fetched ${r.supplier} ${page.status} ${p ? `${p.name} £${p.price}` : `no product (${page.error ?? "no JSON-LD"})`}`);
    if (!p) {
      await supabase.from("crawl_queue").update({ last_crawled: new Date().toISOString(), error_message: page.error ?? "no price on page" }).eq("url", r.url);
      return null;
    }
    const price = retailPrice(r.supplier, p.price);
    await storeProduct(supabase, { name: p.name, price, url: r.url, sku: p.sku, supplier: r.supplier, category: opts.category });
    return { name: p.name, price, url: r.url, supplier: r.supplier, fetchedAt: new Date().toISOString(), confidence: 0.9 } as Offer;
  }));
  return offers.filter((o): o is Offer => !!o);
};
