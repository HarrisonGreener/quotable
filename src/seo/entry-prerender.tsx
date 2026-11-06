// Build-time renderer for public pages (run by scripts/prerender.mjs after `vite build --ssr`).
// Everything imported here must be free of browser-only code at import time.
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Routes, Route } from "react-router-dom";
import { LandingContent } from "@/components/landing/Landing";
import { GuidePage, GuidesIndex, TemplatePage, TemplatesIndex } from "./SeoPages";
import { TradePage, TradesIndex, tradeMeta, tradesIndexMeta, TRADE_SLUGS } from "@/pages/Trades";
import { landingMeta, guideMeta, guidesIndexMeta, templateMeta, templatesIndexMeta, type PageMeta } from "./meta";
import { GUIDES, TEMPLATES, SITE_URL } from "./content";

export { SITE_URL };

export const pages = (): PageMeta[] => [
  landingMeta(),
  guidesIndexMeta(),
  ...GUIDES.map((g) => guideMeta(g.slug)!),
  templatesIndexMeta(),
  ...TEMPLATES.map((t) => templateMeta(t.slug)!),
  tradesIndexMeta(),
  ...TRADE_SLUGS().map((s) => tradeMeta(s)!).filter(Boolean),
];

export const render = (path: string, basename = "") =>
  renderToString(
    <StaticRouter location={`${basename}${path === "/" ? "/" : path}`} basename={basename || undefined}>
      <Routes>
        <Route path="/" element={<LandingContent onSubscribe={() => {}} />} />
        <Route path="/guides" element={<GuidesIndex />} />
        <Route path="/guides/:slug" element={<GuidePage />} />
        <Route path="/quote-templates" element={<TemplatesIndex />} />
        <Route path="/quote-templates/:slug" element={<TemplatePage />} />
        <Route path="/trades" element={<TradesIndex />} />
        <Route path="/trades/:slug" element={<TradePage />} />
      </Routes>
    </StaticRouter>,
  );
