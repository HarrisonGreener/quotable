// Build-time renderer for public pages (run by scripts/prerender.mjs after `vite build --ssr`).
// Everything imported here must be free of browser-only code at import time.
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { Routes, Route } from "react-router-dom";
import { LandingContent } from "@/components/landing/Landing";
import { GuidePage, GuidesIndex, TemplatePage, TemplatesIndex } from "./SeoPages";
import { TradePage, TradesIndex, tradeMeta, tradesIndexMeta, TRADE_SLUGS } from "@/pages/Trades";
import { landingMeta, guideMeta, guidesIndexMeta, templateMeta, templatesIndexMeta, dayRateMeta, dayRatesIndexMeta, type PageMeta } from "./meta";
import { GUIDES, TEMPLATES, SITE_URL } from "./content";
import { DAY_RATES } from "./dayRates";
import { DayRatePage, DayRatesIndex } from "./DayRatePages";
import Terms, { termsMeta } from "@/pages/Terms";
import Privacy, { privacyMeta } from "@/pages/Privacy";
import GetApp, { appMeta } from "@/pages/GetApp";
import { SoftwarePage, SOFTWARE_PATHS, softwareMeta } from "./growth/SoftwarePages";
import { BUSINESS_GUIDES, businessGuideMeta } from "./growth/BusinessGuides";
import { ToolsIndex, ToolPage, TOOL_SLUGS, toolMeta, toolsIndexMeta } from "./growth/tools/ToolPages";
import { InvoiceTemplatesIndex, InvoiceTemplatePage, INVOICE_TEMPLATE_SLUGS, invoiceTemplateMeta, invoiceTemplatesIndexMeta } from "./growth/InvoiceTemplates";
import { useParams } from "react-router-dom";
import { ComparePage, CompareIndex, COMPARE_SLUGS, compareMeta, compareIndexMeta, roundupMeta } from "./growth/Compare";
import { PriceListPage, PriceListsIndex, TradeSoftwarePage, PRICE_LIST_SLUGS, TRADE_SOFTWARE_SLUGS, priceListMeta, priceListsIndexMeta, tradeSoftwareMeta } from "./growth/TradePages";
const PriceListRoute = () => { const { slug = "" } = useParams(); return <PriceListPage slug={slug} />; };
const TradeSoftwareRoute = () => { const { slug = "" } = useParams(); return <TradeSoftwarePage slug={slug} />; };
const CompareRoute = () => { const { slug = "" } = useParams(); return slug === "best-quoting-software-uk" ? <CompareIndex roundup /> : <ComparePage slug={slug} />; };

const ToolRoute = () => { const { slug = "" } = useParams(); return <ToolPage slug={slug} />; };
const InvoiceTemplateRoute = () => { const { slug = "" } = useParams(); return <InvoiceTemplatePage slug={slug} />; };

export { SITE_URL };

export const pages = (): PageMeta[] => [
  landingMeta(),
  guidesIndexMeta(),
  ...GUIDES.map((g) => guideMeta(g.slug)!),
  templatesIndexMeta(),
  ...TEMPLATES.map((t) => templateMeta(t.slug)!),
  tradesIndexMeta(),
  ...TRADE_SLUGS().map((s) => tradeMeta(s)!).filter(Boolean),
  dayRatesIndexMeta(),
  ...DAY_RATES.map((d) => dayRateMeta(d.slug)!),
  ...SOFTWARE_PATHS.map((p) => softwareMeta(p)!),
  ...TRADE_SOFTWARE_SLUGS.map((s) => tradeSoftwareMeta(s)!),
  priceListsIndexMeta(),
  ...PRICE_LIST_SLUGS.map((s) => priceListMeta(s)!),
  ...BUSINESS_GUIDES.map((b) => businessGuideMeta(b.slug)!),
  toolsIndexMeta(),
  ...TOOL_SLUGS.map((s) => toolMeta(s)!),
  compareIndexMeta(),
  roundupMeta(),
  ...COMPARE_SLUGS.map((s) => compareMeta(s)!),
  invoiceTemplatesIndexMeta(),
  ...INVOICE_TEMPLATE_SLUGS.map((s) => invoiceTemplateMeta(s)!),
  appMeta,
  termsMeta,
  privacyMeta,
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
        <Route path="/day-rates" element={<DayRatesIndex />} />
        <Route path="/day-rates/:slug" element={<DayRatePage />} />
        <Route path="/quoting-software" element={<SoftwarePage path="/quoting-software" />} />
        <Route path="/quoting-software/:slug" element={<TradeSoftwareRoute />} />
        <Route path="/price-lists" element={<PriceListsIndex />} />
        <Route path="/price-lists/:slug" element={<PriceListRoute />} />
        <Route path="/invoicing-software" element={<SoftwarePage path="/invoicing-software" />} />
        <Route path="/job-management-software" element={<SoftwarePage path="/job-management-software" />} />
        <Route path="/estimating-software" element={<SoftwarePage path="/estimating-software" />} />
        <Route path="/compare" element={<CompareIndex />} />
        <Route path="/compare/:slug" element={<CompareRoute />} />
        <Route path="/tools" element={<ToolsIndex />} />
        <Route path="/tools/:slug" element={<ToolRoute />} />
        <Route path="/invoice-templates" element={<InvoiceTemplatesIndex />} />
        <Route path="/invoice-templates/:slug" element={<InvoiceTemplateRoute />} />
        <Route path="/app" element={<GetApp />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
    </StaticRouter>,
  );
