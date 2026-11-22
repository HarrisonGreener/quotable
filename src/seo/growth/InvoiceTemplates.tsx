// Free invoice templates by trade: /invoice-templates and /invoice-templates/:slug.
// Each is a complete UK invoice filled in with a real worked example.
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/NotFound";
import { OFFER } from "@/config/offer";
import { Shell, Crumbs, Cta } from "../layout";
import { breadcrumbs, usePageMeta, type PageMeta } from "../meta";
import { GUIDE_BY_SLUG, TEMPLATES, gbp, workGuide, SITE_URL } from "../content";
import { EXPLORE_LINKS, FaqList, LinkGrid, faqSchema, type Faq } from "./shared";

const INVOICES = TEMPLATES.map((t) => ({ ...t, slug: t.slug.replace("-quote-template", "-invoice-template") }));
const BY_SLUG = new Map(INVOICES.map((t) => [t.slug, t]));
export const INVOICE_TEMPLATE_SLUGS = INVOICES.map((t) => t.slug);

const FAQS = (singular: string): Faq[] => [
  [`What should a ${singular} invoice include?`, "A unique invoice number, your business name and contact details, the customer's name and address, a description of the work, the date the work was done, the invoice date, the amounts, any VAT and the total. Add your payment terms and bank details or a payment link so it's easy to pay."],
  ["Do I have to charge VAT?", "Only if you're VAT-registered. You must register once your taxable turnover goes over £90,000 in any rolling 12 months."],
  ["When should I send the invoice?", "The day you finish the job. The sooner it arrives, the sooner you're paid."],
];

export const invoiceTemplatesIndexMeta = (): PageMeta => ({
  path: "/invoice-templates",
  title: "Free invoice templates for UK tradespeople",
  description: "Free, printable invoice templates for electricians, plumbers, plasterers, decorators, tilers, builders and more, filled in with a real example and UK invoice rules.",
  jsonLd: [breadcrumbs([["Home", "/"], ["Invoice templates", "/invoice-templates"]])],
});

export const invoiceTemplateMeta = (slug: string): PageMeta | null => {
  const t = BY_SLUG.get(slug);
  if (!t) return null;
  const s = t.trade.singular;
  return {
    path: `/invoice-templates/${t.slug}`,
    title: `Free ${s} invoice template (UK): printable example`,
    description: `A free UK ${s} invoice template, filled in with a real example: invoice number, dates, materials, labour, VAT, payment terms. Print it or save as PDF.`,
    jsonLd: [
      { "@type": "Article", headline: `Free ${s} invoice template`, mainEntityOfPage: `${SITE_URL}/invoice-templates/${t.slug}`, publisher: { "@id": `${SITE_URL}/#org` } },
      faqSchema(FAQS(s)),
      breadcrumbs([["Home", "/"], ["Invoice templates", "/invoice-templates"], [`${s} invoice template`, `/invoice-templates/${t.slug}`]]),
    ],
  };
};

export const InvoiceTemplatesIndex = () => {
  usePageMeta(invoiceTemplatesIndexMeta());
  return (
    <Shell>
      <div className="container mx-auto max-w-5xl">
        <Crumbs items={[["Home", "/"], ["Invoice templates"]]} />
        <h1 className="text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05] text-primary">Free invoice templates for tradespeople</h1>
        <p className="mt-5 text-lg leading-relaxed text-foreground/80 max-w-2xl">
          Complete UK invoices for your trade, filled in with a real example. Print them, save them as PDFs, or make your own with the{" "}
          <Link to="/tools/invoice-generator" className="font-medium text-primary underline underline-offset-2">free invoice generator</Link>.
        </p>
        <ul className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INVOICES.map((t) => (
            <li key={t.slug}>
              <Link to={`/invoice-templates/${t.slug}`} className="block h-full rounded-md border border-border bg-card p-5 hover:border-primary transition-colors">
                <span className="font-heading text-lg text-primary capitalize">{t.trade.singular} invoice template</span>
                <span className="mt-1 block text-sm text-muted-foreground">For {t.trade.name.toLowerCase()}</span>
              </Link>
            </li>
          ))}
        </ul>
        <LinkGrid title="More from Quotable" links={EXPLORE_LINKS} />
      </div>
    </Shell>
  );
};

export const InvoiceTemplatePage = ({ slug }: { slug: string }) => {
  const t = BY_SLUG.get(slug);
  usePageMeta(t ? invoiceTemplateMeta(slug) : null);
  if (!t) return <NotFound />;
  const g = GUIDE_BY_SLUG.get(t.guide)!;
  const w = workGuide(g);
  const vat = Math.round(w.total * 0.2 * 100) / 100;
  const Name = t.trade.singular.charAt(0).toUpperCase() + t.trade.singular.slice(1);
  const quoteSlug = t.slug.replace("-invoice-template", "-quote-template");

  return (
    <Shell>
      <article className="container mx-auto max-w-4xl">
        <div className="print:hidden">
          <Crumbs items={[["Invoice templates", "/invoice-templates"], [`${Name} invoice template`]]} />
          <h1 className="text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05] text-primary">Free {t.trade.singular} invoice template</h1>
          <p className="mt-5 text-lg leading-relaxed text-foreground/80 max-w-2xl">
            A complete UK {t.trade.singular} invoice with everything gov.uk says an invoice needs, filled in with a real example.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="default" size="lg" className="h-11" onClick={() => typeof window !== "undefined" && window.print()}>Print or save as PDF</Button>
            <Button asChild variant="outline" size="lg" className="h-11"><Link to="/tools/invoice-generator">Fill in your own (free)</Link></Button>
          </div>
        </div>

        <section aria-label={`${Name} invoice template`} className="print-sheet mt-10 rounded-md border border-border bg-card shadow-md p-6 sm:p-10 text-[0.95rem]">
          <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-border">
            <div>
              <p className="font-heading text-xl text-primary">Your Business Name</p>
              <p className="text-muted-foreground mt-1 leading-relaxed">Address line, Town, Postcode<br />07000 000000<br />you@yourbusiness.co.uk</p>
            </div>
            <div className="sm:text-right">
              <p className="font-heading text-2xl text-primary">Invoice</p>
              <p className="text-muted-foreground mt-1 tabular leading-relaxed">No. INV-0001<br />Invoice date: 20 November 2026<br />Work done: 18 November 2026<br />Due: 4 December 2026</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 py-6 border-b border-border">
            <div><p className="text-sm text-muted-foreground">Bill to</p><p className="mt-1 leading-relaxed">Customer name<br />Customer address</p></div>
            <div><p className="text-sm text-muted-foreground">Work carried out</p><p className="mt-1 leading-relaxed">{g.example}</p></div>
          </div>
          <table className="w-full mt-4 tabular">
            <caption className="sr-only">Invoice lines</caption>
            <thead>
              <tr className="text-left text-sm text-muted-foreground">
                <th scope="col" className="py-2 font-normal">Description</th>
                <th scope="col" className="py-2 font-normal text-right">Qty</th>
                <th scope="col" className="py-2 font-normal text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {w.materials.map((m) => (
                <tr key={m.name} className="border-t border-border/70">
                  <td className="py-2 pr-2">{m.name}</td>
                  <td className="py-2 text-right whitespace-nowrap">{m.quantity} {m.unit === "each" ? "" : m.unit}</td>
                  <td className="py-2 text-right">{gbp(m.cost)}</td>
                </tr>
              ))}
              <tr className="border-t border-border/70"><td className="py-2 pr-2">Labour</td><td className="py-2 text-right">{w.hours} h</td><td className="py-2 text-right">{gbp(w.labourTotal)}</td></tr>
              {w.overheads > 0 && <tr className="border-t border-border/70"><td className="py-2">Transport</td><td /><td className="py-2 text-right">{gbp(w.overheads)}</td></tr>}
            </tbody>
            <tfoot>
              <tr className="border-t border-border"><th scope="row" className="pt-3 text-left font-normal">Subtotal</th><td /><td className="pt-3 text-right">{gbp(w.total)}</td></tr>
              <tr><th scope="row" className="py-1 text-left font-normal text-muted-foreground">VAT at 20% (if you're VAT-registered)</th><td /><td className="py-1 text-right text-muted-foreground">{gbp(vat)}</td></tr>
              <tr className="border-t-2 border-primary"><th scope="row" className="py-3 text-left font-heading text-primary">Total due</th><td /><td className="py-3 text-right font-heading text-xl text-primary">{gbp(w.total + vat)}</td></tr>
            </tfoot>
          </table>
          <div className="mt-6 border-t border-border pt-5 text-sm leading-relaxed text-foreground/80">
            <p><strong className="text-primary">Payment terms:</strong> due within 14 days of the invoice date.</p>
            <p className="mt-1"><strong className="text-primary">Pay by bank transfer:</strong> Your Business Name, sort code 00-00-00, account 00000000, reference INV-0001.</p>
            <p className="mt-1 text-muted-foreground">If you're VAT-registered, add your VAT number. Limited companies: use your full registered company name.</p>
          </div>
        </section>

        <div className="print:hidden">
          <FaqList faqs={FAQS(t.trade.singular)} />
          <LinkGrid title="Useful next" links={[
            [`${Name} quote template`, `/quote-templates/${quoteSlug}`, "The quote to go with it"],
            ["What to put on an invoice", "/guides/what-to-put-on-an-invoice", "UK rules in full"],
            [`Quotable for ${t.trade.name.toLowerCase()}`, `/trades/${t.trade.slug}`, "Quotes and invoices in minutes"],
          ]} />
          <Cta title="Invoices straight from your quotes" text={`In Quotable, an accepted quote becomes an invoice in one click, with your logo and payment link on it. ${OFFER.line}`} />
        </div>
      </article>
    </Shell>
  );
};
