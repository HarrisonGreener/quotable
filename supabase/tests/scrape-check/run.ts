// Live scrape check — which supplier sites can Quotable actually read?
// Runs in GitHub Actions (Deno), because supplier sites can't be reached from
// every machine. Uses the real scraper: robots.txt, rate limit, JSON-LD.
//
//   deno run -A supabase/tests/scrape-check/run.ts [out.json]

import { fetchPage, extractProducts, readSitemap, isAllowed } from "../../functions/_shared/scraper.ts";

const Q = ["15mm copper pipe", "double socket", "multi finish plaster", "white emulsion paint", "door hinges"];

const SUPPLIERS: Record<string, { search: (q: string) => string; sitemap?: string; trades: string }> = {
  toolstation:  { search: (q) => `https://www.toolstation.com/search?q=${encodeURIComponent(q)}`, sitemap: "https://www.toolstation.com/sitemap.xml", trades: "all" },
  screwfix:     { search: (q) => `https://www.screwfix.com/search?search=${encodeURIComponent(q)}`, sitemap: "https://www.screwfix.com/sitemap.xml", trades: "all" },
  wickes:       { search: (q) => `https://www.wickes.co.uk/search?text=${encodeURIComponent(q)}`, sitemap: "https://www.wickes.co.uk/sitemap.xml", trades: "all" },
  bandq:        { search: (q) => `https://www.diy.com/search?term=${encodeURIComponent(q)}`, sitemap: "https://www.diy.com/sitemap.xml", trades: "all" },
  selco:        { search: (q) => `https://www.selcobw.com/search?q=${encodeURIComponent(q)}`, trades: "build" },
  travisperkins:{ search: (q) => `https://www.travisperkins.co.uk/search?text=${encodeURIComponent(q)}`, trades: "build" },
  jewson:       { search: (q) => `https://www.jewson.co.uk/search?q=${encodeURIComponent(q)}`, trades: "build" },
  cityplumbing: { search: (q) => `https://www.cityplumbing.co.uk/search?term=${encodeURIComponent(q)}`, trades: "plumbing" },
  plumbnation:  { search: (q) => `https://www.plumbnation.co.uk/catalogsearch/result/?q=${encodeURIComponent(q)}`, trades: "plumbing" },
  plumbase:     { search: (q) => `https://www.plumbase.co.uk/search?q=${encodeURIComponent(q)}`, trades: "plumbing" },
  tlcdirect:    { search: (q) => `https://www.tlc-direct.co.uk/Main/Search.html?q=${encodeURIComponent(q)}`, trades: "electrical" },
  cef:          { search: (q) => `https://www.cef.co.uk/search?q=${encodeURIComponent(q)}`, trades: "electrical" },
  electricaldirect: { search: (q) => `https://www.electricaldirect.co.uk/search?q=${encodeURIComponent(q)}`, trades: "electrical" },
  ironmongerydirect:{ search: (q) => `https://www.ironmongerydirect.co.uk/search?query=${encodeURIComponent(q)}`, trades: "carpentry" },
  duluxdecorator:{ search: (q) => `https://www.duluxdecoratorcentre.co.uk/search?q=${encodeURIComponent(q)}`, trades: "decorating" },
  brewers:      { search: (q) => `https://www.brewers.co.uk/search?q=${encodeURIComponent(q)}`, trades: "decorating" },
};

const out: any[] = [];
for (const [name, s] of Object.entries(SUPPLIERS)) {
  const row: any = { supplier: name, trades: s.trades, searches: [] };
  for (const q of Q.slice(0, 3)) {
    const url = s.search(q);
    const t = Date.now();
    const page = await fetchPage(url, { allowFirecrawl: false });
    const products = page.ok ? extractProducts(page.html, url) : [];
    row.searches.push({
      q, status: page.status, ok: page.ok, error: page.error, bytes: page.html.length,
      ms: Date.now() - t, products: products.length,
      sample: products.slice(0, 2).map((p) => `${p.name} — £${p.price}`),
      blocked: /captcha|access denied|cf-chl|akamai|incapsula|perimeterx/i.test(page.html.slice(0, 20000)),
    });
    if (!page.ok && (page.status === 403 || page.error?.includes("robots"))) break;
  }
  // Find sitemaps from robots.txt
  const origin = new URL(s.search("x")).origin;
  try {
    const robots = await fetch(`${origin}/robots.txt`, { headers: { "User-Agent": "QuotableBot/1.0" } });
    const txt = robots.ok ? await robots.text() : "";
    row.robotsStatus = robots.status;
    row.sitemaps = [...txt.matchAll(/^sitemap:\s*(\S+)/gim)].map((m) => m[1]).slice(0, 5);
    if (!s.sitemap && row.sitemaps[0]) s.sitemap = row.sitemaps[0];
  } catch (e) { row.robotsError = String(e).slice(0, 80); }
  if (s.sitemap) {
    try {
      row.sitemapAllowed = await isAllowed(s.sitemap);
      const urls = row.sitemapAllowed ? await readSitemap(s.sitemap, /\/p\/|\/p\d{4,}|\.prd|\/product|-p-?\d{4,}|\/\d{5,}(?:$|[/?.])/i, 300) : [];
      row.sitemapProductUrls = urls.length;
      if (urls[0]) {
        const page = await fetchPage(urls[0], { allowFirecrawl: false });
        const prods = page.ok ? extractProducts(page.html, urls[0]) : [];
        row.productPage = { url: urls[0], status: page.status, products: prods.length, sample: prods[0] ? `${prods[0].name} — £${prods[0].price}` : null };
      }
    } catch (e) { row.sitemapError = String(e); }
  }
  const best = Math.max(0, ...row.searches.map((x: any) => x.products));
  row.verdict = best > 0 ? "search works" : row.productPage?.products ? "product pages only" : row.searches.some((x: any) => x.status === 403 || x.blocked) ? "blocked" : "no prices found";
  console.log(`${name.padEnd(18)} ${row.verdict.padEnd(20)} ${row.searches.map((x: any) => `${x.status}/${x.products}`).join(" ")}${row.productPage ? `  product page: ${row.productPage.status}/${row.productPage.products}` : ""}`);
  console.log(`   search error: ${row.searches[0]?.error ?? "-"} | robots ${row.robotsStatus ?? "?"} | sitemap ${s.sitemap ?? "none"} allowed=${row.sitemapAllowed} productUrls=${row.sitemapProductUrls ?? 0}${row.sitemapError ? " err=" + row.sitemapError.slice(0, 60) : ""} | sample: ${row.productPage?.sample ?? row.searches[0]?.sample?.[0] ?? "-"}`);
  out.push(row);
}

const file = Deno.args[0];
if (file) await Deno.writeTextFile(file, JSON.stringify(out, null, 2));
