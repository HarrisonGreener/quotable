// Page titles, descriptions and structured data — shared by the browser
// (usePageMeta) and the build-time prerender, so both always agree.

import { useEffect } from "react";
import { SITE_URL, GUIDES, GUIDE_BY_SLUG, TEMPLATES, TEMPLATE_BY_SLUG, PRICES_CHECKED, workGuide } from "./content";

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  jsonLd?: object[];
  noindex?: boolean;
}

const ORG = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#org`,
  name: "Quotable",
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.png`,
};

const breadcrumbs = (items: [string, string][]) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, path], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE_URL}${path}` })),
});

export const LANDING_FAQ: [string, string][] = [
  ["How does Quotable work out a quote?",
    "You describe the job in your own words, typed or spoken. Quotable lists the materials and quantities, finds today's price for each one on UK merchant websites, and works out labour from your own hourly or day rate. You check it, change anything, and send it."],
  ["Where do the prices come from?",
    "From the product pages of UK merchants including Toolstation, Wickes and Travis Perkins, read live and linked on every line. Your own stock and prices are always used first, and anything Quotable couldn't price is marked for you to check."],
  ["Does it work for my trade?",
    "Yes. It quotes any job you price by materials and time: electricians, plumbers, plasterers, decorators, carpenters, tilers, builders, landscapers and more."],
  ["Can my customer accept the quote online?",
    "Every quote has a link your customer opens on their phone. They accept with a tap and can pay a deposit through your own payment link. When the work's done, the quote becomes an invoice in one click."],
  ["Does it handle VAT and Making Tax Digital?",
    "VAT is worked out on every line if you're registered, and invoices export in the format Xero, QuickBooks and FreeAgent expect."],
  ["How much does it cost?",
    "£14.99 a month or £159.99 a year, with the first month free. You can also look around a sample account without signing up."],
];

export const landingMeta = (): PageMeta => ({
  path: "/",
  title: "Quotable: quoting software for UK tradespeople, with live material prices",
  description: "Type the job and get a priced quote: materials priced live at UK merchants, labour at your rate, a link your customer can accept and pay. Invoicing and scheduling included. First month free.",
  jsonLd: [
    ORG,
    {
      "@type": "SoftwareApplication",
      name: "Quotable",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, iOS, Android",
      url: SITE_URL,
      description: "Quoting, invoicing and scheduling for UK tradespeople, with materials priced live at UK merchants.",
      offers: [
        { "@type": "Offer", price: "14.99", priceCurrency: "GBP", name: "Monthly" },
        { "@type": "Offer", price: "159.99", priceCurrency: "GBP", name: "Yearly" },
      ],
      publisher: { "@id": `${SITE_URL}/#org` },
    },
    {
      "@type": "FAQPage",
      mainEntity: LANDING_FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ],
});

export const guidesIndexMeta = (): PageMeta => ({
  path: "/guides",
  title: "How to price jobs: UK pricing guides for tradespeople (2026)",
  description: "Materials, quantities, labour hours and worked examples for pricing common jobs, from adding a socket to skimming a room. Typical UK prices for 2026.",
  jsonLd: [breadcrumbs([["Home", "/"], ["Pricing guides", "/guides"]])],
});

export const guideMeta = (slug: string): PageMeta | null => {
  const g = GUIDE_BY_SLUG.get(slug);
  if (!g) return null;
  const w = workGuide(g);
  return {
    path: `/guides/${g.slug}`,
    title: `${g.h1}: materials, labour and a worked example (UK, 2026)`,
    description: g.description,
    jsonLd: [
      {
        "@type": "Article",
        headline: g.h1,
        description: g.description,
        dateModified: "2026-11-06",
        author: { "@id": `${SITE_URL}/#org` },
        publisher: { "@id": `${SITE_URL}/#org` },
        mainEntityOfPage: `${SITE_URL}/guides/${g.slug}`,
        about: `${g.trade.name}: pricing ${w.recipe.title.toLowerCase()}`,
      },
      breadcrumbs([["Home", "/"], ["Pricing guides", "/guides"], [g.h1, `/guides/${g.slug}`]]),
    ],
  };
};

export const templatesIndexMeta = (): PageMeta => ({
  path: "/quote-templates",
  title: "Free quote templates for UK tradespeople",
  description: "Free, printable quote templates for electricians, plumbers, plasterers, decorators, tilers, builders and more, filled in with a real worked example.",
  jsonLd: [breadcrumbs([["Home", "/"], ["Quote templates", "/quote-templates"]])],
});

export const templateMeta = (slug: string): PageMeta | null => {
  const t = TEMPLATE_BY_SLUG.get(slug);
  if (!t) return null;
  const name = t.trade.singular.charAt(0).toUpperCase() + t.trade.singular.slice(1);
  return {
    path: `/quote-templates/${t.slug}`,
    title: `Free ${t.trade.singular} quote template (UK): printable example`,
    description: `A free ${t.trade.singular} quote template for the UK with a real worked example: materials with ${PRICES_CHECKED} prices, labour, VAT, payment terms and what every ${t.trade.singular} quote should include. Print it or save as PDF.`,
    jsonLd: [
      {
        "@type": "Article",
        headline: `${name} quote template`,
        dateModified: "2026-11-06",
        publisher: { "@id": `${SITE_URL}/#org` },
        mainEntityOfPage: `${SITE_URL}/quote-templates/${t.slug}`,
      },
      breadcrumbs([["Home", "/"], ["Quote templates", "/quote-templates"], [`${name} quote template`, `/quote-templates/${t.slug}`]]),
    ],
  };
};

export const ALL_SEO_PATHS = () => [
  "/", "/guides", ...GUIDES.map((g) => `/guides/${g.slug}`),
  "/quote-templates", ...TEMPLATES.map((t) => `/quote-templates/${t.slug}`),
];

/** Set title, description, canonical, social tags and JSON-LD in the browser. */
export const applyMeta = (m: PageMeta) => {
  if (typeof document === "undefined") return;
  document.title = m.title;
  const set = (attr: "name" | "property", key: string, value: string) => {
    let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.content = value;
  };
  set("name", "description", m.description);
  set("property", "og:title", m.title);
  set("property", "og:description", m.description);
  set("property", "og:url", `${SITE_URL}${m.path}`);
  set("name", "twitter:title", m.title);
  set("name", "twitter:description", m.description);
  set("name", "robots", m.noindex ? "noindex" : "index,follow");
  let canon = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canon) { canon = document.createElement("link"); canon.rel = "canonical"; document.head.appendChild(canon); }
  canon.href = `${SITE_URL}${m.path === "/" ? "/" : m.path}`;
  document.head.querySelectorAll('script[data-seo="page"]').forEach((s) => s.remove());
  if (m.jsonLd?.length) {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.dataset.seo = "page";
    s.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": m.jsonLd });
    document.head.appendChild(s);
  }
};

export const usePageMeta = (m: PageMeta | null) => {
  useEffect(() => { if (m) applyMeta(m); }, [m?.path]); // eslint-disable-line react-hooks/exhaustive-deps
};
