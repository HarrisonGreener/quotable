// Writes a real HTML file for every public page — title, description, canonical,
// social tags, structured data and the page content itself — so search engines and
// link previews see the page without running JavaScript. Then writes sitemap.xml.
//
// Runs after: vite build && vite build --ssr src/seo/entry-prerender.tsx --outDir dist-ssr
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dist = path.resolve("dist");
const ssrEntry = fs.readdirSync("dist-ssr").find((f) => /^entry-prerender\.(m?js)$/.test(f));
const { pages, render, SITE_URL } = await import(pathToFileURL(path.resolve("dist-ssr", ssrEntry)).href);

const base = (process.env.VITE_BASE_PATH || "/").replace(/\/$/, "");
const template = fs.readFileSync(path.join(dist, "index.html"), "utf8");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const setTag = (html, re, replacement) => (re.test(html) ? html.replace(re, replacement) : html);

let count = 0;
const urls = [];
for (const m of pages()) {
  const url = `${SITE_URL}${m.path === "/" ? "/" : m.path}`;
  let html = template;
  html = setTag(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(m.title)}</title>`);
  html = setTag(html, /<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(m.description)}" />`);
  html = setTag(html, /<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${esc(url)}" />`);
  html = setTag(html, /<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(m.title)}" />`);
  html = setTag(html, /<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(m.description)}" />`);
  html = setTag(html, /<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${esc(url)}" />`);
  html = setTag(html, /<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${esc(m.title)}" />`);
  html = setTag(html, /<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${esc(m.description)}" />`);
  if (m.jsonLd?.length) {
    const ld = JSON.stringify({ "@context": "https://schema.org", "@graph": m.jsonLd }).replace(/</g, "\\u003c");
    html = html.replace("</head>", `  <script type="application/ld+json" data-seo="page">${ld}</script>\n  </head>`);
  }
  let body = "";
  try { body = render(m.path, base); } catch (e) { console.warn(`render failed for ${m.path}: ${e.message}`); }
  html = html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);

  if (m.path === "/") {
    fs.writeFileSync(path.join(dist, "index.html"), html);
  } else {
    const rel = m.path.replace(/^\//, "");
    fs.mkdirSync(path.join(dist, rel), { recursive: true });
    fs.writeFileSync(path.join(dist, rel, "index.html"), html);
    fs.writeFileSync(path.join(dist, `${rel}.html`), html);
  }
  if (!m.noindex) urls.push(url);
  count++;
}

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(
  path.join(dist, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${esc(u)}</loc><lastmod>${today}</lastmod></url>`)
    .join("\n")}\n</urlset>\n`,
);
fs.writeFileSync(
  path.join(dist, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /q/\nDisallow: /i/\nDisallow: /dashboard\nDisallow: /auth\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
);
fs.rmSync("dist-ssr", { recursive: true, force: true });
console.log(`Prerendered ${count} pages; sitemap has ${urls.length} URLs.`);
