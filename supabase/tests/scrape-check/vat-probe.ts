// Do suppliers' structured (JSON-LD) prices include VAT? Prints the evidence.
import { readSitemap, fetchPage } from "../../functions/_shared/scraper.ts";
const SUP: Record<string, [string, RegExp, RegExp]> = {
  Toolstation: ["https://www.toolstation.com/sitemap.xml", /\/p\d{3,}/, /twin-earth|multi-finish|copper-pipe/],
  Wickes: ["https://www.wickes.co.uk/sitemap.xml", /\/p\/\d+/, /Twin-Earth|Multi-Finish|Copper-Pipe/i],
  "Travis Perkins": ["https://www.travisperkins.co.uk/sitemap.xml", /\/p\/|\/product|\/\d{5,}/i, /twin-earth|multi-finish|copper-pipe/i],
};
for (const [name, [sm, pat, pick]] of Object.entries(SUP)) {
  const urls = (await readSitemap(sm, pat, 80000)).filter((u) => pick.test(u)).slice(0, 2);
  for (const u of urls) {
    const p = await fetchPage(u, { allowFirecrawl: false });
    const ld = [...p.html.matchAll(/<script[^>]*ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join(" ");
    const offers = ld.match(/"offers"\s*:\s*[\[{][\s\S]{0,400}/)?.[0]?.replace(/\s+/g, " ");
    const text = p.html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const vat = [...text.matchAll(/.{0,60}(?:inc|exc?)\.?\s*(?:l\.?\s*)?VAT.{0,40}/gi)].slice(0, 5).map((m) => m[0].trim());
    const meta = [...p.html.matchAll(/<meta[^>]+(?:price|amount)[^>]+>/gi)].slice(0, 3).map((m) => m[0]);
    const price = ld.match(/"price"\s*:\s*"?([\d.]+)/)?.[1];
    const near = (v: string) => [...p.html.matchAll(new RegExp(`.{0,160}${v.replace(".", "\\.")}.{0,160}`, "g"))].slice(0, 3).map((m) => m[0].replace(/\s+/g, " "));
    const plusVat = price ? (Number(price) * 1.2).toFixed(2) : "";
    const lessVat = price ? (Number(price) / 1.2).toFixed(2) : "";
    console.log(`\n=== ${name}: ${u}\nOFFERS: ${offers}\nVAT TEXT: ${vat.join(" || ") || "none"}`);
    console.log(`AROUND ${price}: ${near(price ?? "x").join(" ### ")}`);
    console.log(`AROUND ${plusVat} (price+VAT): ${near(plusVat).join(" ### ") || "not on page"}`);
    console.log(`AROUND ${lessVat} (price-VAT): ${near(lessVat).join(" ### ") || "not on page"}`);
  }
}
