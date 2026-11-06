// Targeted crawl check: which recipe items can we find real prices for, and
// how do the recipes' typical prices compare with the real ones?
//
//   deno run -A supabase/tests/scrape-check/targeted.ts [out.json]

import { readSitemap, fetchPage, extractProducts, similarity } from "../../functions/_shared/scraper.ts";
import { recipeShoppingList, slugText } from "../../functions/_shared/recipes/index.ts";
import { isCompatibleProduct, headWord } from "../../functions/_shared/quote-engine.ts";

const SUPPLIERS: Record<string, { sitemap: string; pattern: RegExp }> = {
  Toolstation: { sitemap: "https://www.toolstation.com/sitemap.xml", pattern: /\/p\d{3,}/ },
  Wickes: { sitemap: "https://www.wickes.co.uk/sitemap.xml", pattern: /\/p\/\d+/ },
  "Travis Perkins": { sitemap: "https://www.travisperkins.co.uk/sitemap.xml", pattern: /\/p\/|\/product|\/\d{5,}(?:$|[/?.])/i },
};
const items = recipeShoppingList();
const MAX_FETCH = Number(Deno.env.get("MAX_FETCH") || 70);

const perSupplier = await Promise.all(Object.entries(SUPPLIERS).map(async ([supplier, cfg]) => {
  const urls = await readSitemap(cfg.sitemap, cfg.pattern, 60000);
  const slugs = urls.map((u) => ({ u, t: slugText(u) })).filter((x) => x.t.length >= 6);
  const found: any[] = [];
  const targets: { item: (typeof items)[number]; url: string; score: number }[] = [];
  for (const item of items) {
    let best = { url: "", score: 0 };
    for (const s of slugs) {
      const sc = similarity(item.name, s.t);
      if (sc > best.score) best = { url: s.u, score: sc };
    }
    if (best.score >= 0.6) targets.push({ item, ...best });
  }
  for (const t of targets.slice(0, MAX_FETCH)) {
    const page = await fetchPage(t.url, { allowFirecrawl: false });
    const p = page.ok ? extractProducts(page.html, t.url)[0] : undefined;
    const ok = !!p && isCompatibleProduct(t.item.name, p.name);
    found.push({ item: t.item.name, trade: t.item.trade, typical: t.item.typical, url: t.url, slugScore: t.score, status: page.status, product: p?.name, price: p?.price, compatible: ok });
  }
  console.log(`${supplier}: ${urls.length} product URLs in sitemap; ${targets.length}/${items.length} items matched by URL; fetched ${found.length}, priced ${found.filter((f) => f.price).length}, compatible ${found.filter((f) => f.compatible).length}`);
  return { supplier, sitemapUrls: urls.length, matched: targets.length, found };
}));

console.log("\nItem | typical £ | real £ | supplier | product");
const rows = perSupplier.flatMap((s) => s.found.filter((f) => f.compatible).map((f) => ({ ...f, supplier: s.supplier })));
for (const r of rows.sort((a, b) => a.item.localeCompare(b.item))) {
  const diff = ((r.price - r.typical) / r.typical) * 100;
  console.log(`${r.item} | ${r.typical} | ${r.price} (${diff >= 0 ? "+" : ""}${diff.toFixed(0)}%) | ${r.supplier} | ${r.product}`);
}
const covered = new Set(rows.map((r) => r.item));
console.log(`\nRecipe items with at least one real, compatible price: ${covered.size}/${items.length}`);
console.log(`Not found: ${items.filter((i) => !covered.has(i.name)).map((i) => i.name).join("; ")}`);
if (Deno.args[0]) await Deno.writeTextFile(Deno.args[0], JSON.stringify(perSupplier, null, 2));
