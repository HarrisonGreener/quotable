// ═══════════════════════════════════════════════════════════════════
// SHARED SCRAPER — free direct fetch first, Firecrawl only as a fallback
//
// Most UK merchants publish schema.org Product data (JSON-LD) on product
// and search pages, so a plain HTTP request is usually enough. Firecrawl
// (paid) is only used when a site blocks plain requests or needs JS, and
// only if FIRECRAWL_API_KEY is set.
//
// Every request:
//   • checks robots.txt (cached per domain for the life of the function)
//   • waits between requests to the same domain (crawl-delay, min 2s)
//   • identifies itself honestly via SCRAPER_USER_AGENT
// ═══════════════════════════════════════════════════════════════════

export interface ScrapedProduct {
  name: string;
  price: number;
  url?: string;
  sku?: string;
  brand?: string;
  image?: string;
  inStock?: boolean;
}

export interface FetchResult {
  ok: boolean;
  html: string;
  status: number;
  via: "direct" | "firecrawl" | "none";
  error?: string;
}

const UA = () =>
  Deno.env.get("SCRAPER_USER_AGENT") ||
  "QuotableBot/1.0 (+price comparison for UK tradespeople)";

const firecrawlKey = () =>
  Deno.env.get("FIRECRAWL_API_KEY") || Deno.env.get("Web_Scrape_FIRECRAWL") || "";

// ─── robots.txt ────────────────────────────────────────────────────

interface Robots { disallow: string[]; allow: string[]; delayMs: number }
const robotsCache = new Map<string, Robots>();

async function getRobots(origin: string): Promise<Robots> {
  const cached = robotsCache.get(origin);
  if (cached) return cached;

  const rules: Robots = { disallow: [], allow: [], delayMs: 0 };
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { "User-Agent": UA() },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      let applies = false;
      for (const raw of (await res.text()).split("\n")) {
        const line = raw.split("#")[0].trim();
        const idx = line.indexOf(":");
        if (idx === -1) continue;
        const key = line.slice(0, idx).trim().toLowerCase();
        const val = line.slice(idx + 1).trim();
        if (key === "user-agent") applies = val === "*" || /quotable/i.test(val);
        else if (applies && key === "disallow" && val) rules.disallow.push(val);
        else if (applies && key === "allow" && val) rules.allow.push(val);
        else if (applies && key === "crawl-delay") rules.delayMs = Math.max(rules.delayMs, (parseFloat(val) || 0) * 1000);
      }
    }
  } catch (_) { /* unreachable robots.txt → treat as no rules */ }
  robotsCache.set(origin, rules);
  return rules;
}

const ruleMatches = (rule: string, path: string) => {
  // Supports the common * wildcard and $ end anchor
  const re = new RegExp("^" + rule.replace(/[.+?^${}()|[\]\\]/g, (c) => (c === "$" ? "$" : "\\" + c)).replace(/\*/g, ".*"));
  return re.test(path);
};

export async function isAllowed(url: string): Promise<boolean> {
  const u = new URL(url);
  const r = await getRobots(u.origin);
  const path = u.pathname + u.search;
  const allow = r.allow.filter((a) => ruleMatches(a, path)).sort((a, b) => b.length - a.length)[0];
  const deny = r.disallow.filter((d) => ruleMatches(d, path)).sort((a, b) => b.length - a.length)[0];
  if (!deny) return true;
  return !!allow && allow.length >= deny.length; // longest match wins, like Google
}

// ─── polite rate limiting ─────────────────────────────────────────

const lastHit = new Map<string, number>();
const MIN_DELAY_MS = 2000;

async function waitTurn(origin: string) {
  const r = await getRobots(origin);
  const delay = Math.max(MIN_DELAY_MS, r.delayMs);
  const wait = (lastHit.get(origin) ?? 0) + delay - Date.now();
  if (wait > 0) await new Promise((res) => setTimeout(res, wait));
  lastHit.set(origin, Date.now());
}

// ─── fetching ─────────────────────────────────────────────────────

const BLOCK_SIGNS = /just a moment|attention required|access denied|captcha|cf-chl|px-captcha|enable javascript and cookies/i;

async function direct(url: string): Promise<FetchResult> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
      headers: {
        "User-Agent": UA(),
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-GB,en;q=0.9",
      },
    });
    const html = await res.text();
    const blocked = !res.ok || (html.length < 20_000 && BLOCK_SIGNS.test(html));
    return { ok: !blocked, html: blocked ? "" : html, status: res.status, via: "direct", error: blocked ? `blocked (${res.status})` : undefined };
  } catch (e) {
    return { ok: false, html: "", status: 0, via: "direct", error: e instanceof Error ? e.message : String(e) };
  }
}

async function viaFirecrawl(url: string): Promise<FetchResult> {
  const key = firecrawlKey();
  if (!key) return { ok: false, html: "", status: 0, via: "none", error: "no Firecrawl key" };
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      signal: AbortSignal.timeout(60_000),
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["rawHtml"], onlyMainContent: false, waitFor: 2000 }),
    });
    if (!res.ok) return { ok: false, html: "", status: res.status, via: "firecrawl", error: `Firecrawl ${res.status}` };
    const data = await res.json();
    const html = data?.data?.rawHtml || data?.data?.html || "";
    return { ok: !!html, html, status: 200, via: "firecrawl" };
  } catch (e) {
    return { ok: false, html: "", status: 0, via: "firecrawl", error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Fetch a page politely. Tries a free direct request first, then Firecrawl
 * (if configured). Returns ok:false with a reason instead of throwing.
 */
export async function fetchPage(url: string, opts: { allowFirecrawl?: boolean } = {}): Promise<FetchResult> {
  if (!(await isAllowed(url))) {
    return { ok: false, html: "", status: 0, via: "none", error: "disallowed by robots.txt" };
  }
  await waitTurn(new URL(url).origin);
  const first = await direct(url);
  if (first.ok) return first;
  if (opts.allowFirecrawl === false) return first;
  const second = await viaFirecrawl(url);
  return second.ok ? second : { ...first, error: `${first.error}; ${second.error}` };
}

// ─── extraction ───────────────────────────────────────────────────

const toNumber = (v: unknown): number | null => {
  if (typeof v === "number") return isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[£,\s]/g, ""));
    return isFinite(n) ? n : null;
  }
  return null;
};

const absolute = (href: unknown, base: string): string | undefined => {
  if (typeof href !== "string" || !href) return undefined;
  try { return new URL(href, base).toString(); } catch { return undefined; }
};

function fromSchemaProduct(item: any, base: string): ScrapedProduct | null {
  if (!item?.name) return null;
  const offers = Array.isArray(item.offers) ? item.offers : item.offers ? [item.offers] : [];
  let price: number | null = null;
  let inStock: boolean | undefined;
  for (const o of offers) {
    const list = o?.["@type"] === "AggregateOffer" ? [{ price: o.lowPrice ?? o.price }] : [o];
    for (const off of list) {
      if (off?.priceCurrency && off.priceCurrency !== "GBP") continue;
      const p = toNumber(off?.price ?? off?.priceSpecification?.price);
      if (p && p > 0) { price = p; break; }
    }
    if (o?.availability) inStock = !/OutOfStock|Discontinued/i.test(String(o.availability));
    if (price) break;
  }
  if (!price || price > 100_000) return null;
  return {
    name: String(item.name).replace(/\s+/g, " ").trim(),
    price,
    url: absolute(item.url ?? offers[0]?.url, base),
    sku: item.sku ? String(item.sku) : item.mpn ? String(item.mpn) : undefined,
    brand: typeof item.brand === "string" ? item.brand : item.brand?.name,
    image: Array.isArray(item.image) ? item.image[0] : typeof item.image === "string" ? item.image : item.image?.url,
    inStock,
  };
}

function walk(node: any, base: string, out: ScrapedProduct[], depth = 0) {
  if (!node || depth > 12) return;
  if (Array.isArray(node)) { for (const n of node) walk(n, base, out, depth + 1); return; }
  if (typeof node !== "object") return;
  const type = node["@type"];
  const isProduct = type === "Product" || (Array.isArray(type) && type.includes("Product"));
  if (isProduct) {
    const p = fromSchemaProduct(node, base);
    if (p) out.push(p);
  }
  for (const key of ["@graph", "itemListElement", "item", "mainEntity", "hasVariant"]) {
    if (node[key]) walk(node[key], base, out, depth + 1);
  }
}

/** Pull every product with a GBP price out of a page's structured data. */
export function extractProducts(html: string, baseUrl: string): ScrapedProduct[] {
  const out: ScrapedProduct[] = [];

  // 1. JSON-LD blocks
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try { walk(JSON.parse(m[1].trim()), baseUrl, out); } catch { /* malformed block */ }
  }

  // 2. Microdata fallback for single product pages
  if (out.length === 0) {
    const name = html.match(/itemprop=["']name["'][^>]*content=["']([^"']+)/i)?.[1]
      ?? html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1];
    const price = toNumber(
      html.match(/itemprop=["']price["'][^>]*content=["']([\d.,]+)/i)?.[1]
      ?? html.match(/<meta[^>]+property=["'](?:product|og):price:amount["'][^>]+content=["']([\d.,]+)/i)?.[1],
    );
    if (name && price && price > 0) out.push({ name: decode(name), price, url: baseUrl });
  }

  // De-duplicate by url+name
  const seen = new Set<string>();
  return out.filter((p) => {
    const k = `${p.url ?? ""}|${p.name.toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return p.name.length >= 4 && p.name.split(" ").length >= 2;
  });
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

// ─── sitemaps ─────────────────────────────────────────────────────

/** Read a sitemap or sitemap index and return product URLs matching the pattern. */
export async function readSitemap(url: string, pattern: RegExp, limit = 5000, depth = 0): Promise<string[]> {
  const page = await fetchPage(url, { allowFirecrawl: false });
  if (!page.ok) return [];
  const locs = [...page.html.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => decode(m[1]));
  if (/<sitemapindex/i.test(page.html) && depth < 2) {
    const out: string[] = [];
    const children = locs.filter((l) => /product|catalog|item|p-/i.test(l)).slice(0, 10);
    for (const child of children.length ? children : locs.slice(0, 5)) {
      out.push(...(await readSitemap(child, pattern, limit - out.length, depth + 1)));
      if (out.length >= limit) break;
    }
    return out.slice(0, limit);
  }
  return locs.filter((l) => pattern.test(l)).slice(0, limit);
}

// ─── matching ─────────────────────────────────────────────────────

const STOP = new Set(["the", "and", "for", "with", "per", "each", "pack", "x"]);
export const tokens = (s: string) =>
  s.toLowerCase().replace(/&/g, " and ").replace(/(\d)\s*mm(?:2|²)/g, "$1mm")
    .replace(/(\d)\s*(?:litres?|liters?|ltr)\b/g, "$1l").replace(/(\d)\s*(?:metres?|meters?|mtr)\b/g, "$1m")
    .replace(/(\d)\s+(mm|kg|ml|m|l)\b/g, "$1$2")
    .replace(/[^a-z0-9.\s]/g, " ").split(/\s+/).map((w) => w.replace(/\.$/, "")).filter((w) => w.length > 1 && !STOP.has(w));

/**
 * 0–1 similarity between what the quote asked for and a product name.
 * Sizes/ratings (15mm, 2.5mm, 32a, 3kw) must agree when both sides have them.
 */
export function similarity(wanted: string, candidate: string): number {
  const a = tokens(wanted);
  const b = new Set(tokens(candidate));
  if (!a.length || !b.size) return 0;
  // Spec sizes must agree; pack sizes (litres, kg, metres) are converted later, so they don't veto
  const dim = /^\d+(\.\d+)?(mm|a|kw|w|v)$/;
  const aDims = a.filter((t) => dim.test(t));
  const bDims = [...b].filter((t) => dim.test(t));
  if (aDims.length && bDims.length && !aDims.some((d) => b.has(d))) return 0; // wrong size
  const hits = a.filter((t) => b.has(t) || [...b].some((c) => c.length > 3 && (c.startsWith(t) || t.startsWith(c)))).length;
  const recall = hits / a.length;
  const precision = hits / b.size;
  return Math.round((0.75 * recall + 0.25 * precision) * 1000) / 1000;
}
