import { Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/NotFound";
import { GUIDES, GUIDE_BY_SLUG, TEMPLATES, TEMPLATE_BY_SLUG, PRICES_CHECKED, gbp, workGuide, type GuideDef } from "./content";
import { guideMeta, guidesIndexMeta, templateMeta, templatesIndexMeta, usePageMeta } from "./meta";

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="px-4 pt-28 sm:pt-32 pb-24">{children}</main>
    <Footer />
  </div>
);

const Crumbs = ({ items }: { items: [string, string?][] }) => (
  <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
    <ol className="flex flex-wrap gap-x-2">
      {items.map(([label, to], i) => (
        <li key={label} className="flex gap-2">
          {to ? <Link to={to} className="hover:text-primary underline-offset-4 hover:underline">{label}</Link> : <span aria-current="page">{label}</span>}
          {i < items.length - 1 && <span aria-hidden>/</span>}
        </li>
      ))}
    </ol>
  </nav>
);

const Cta = ({ title, text }: { title: string; text: string }) => (
  <section className="mt-16 rounded-md bg-primary text-white p-8 sm:p-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
    <div>
      <h2 className="text-2xl sm:text-3xl text-white">{title}</h2>
      <p className="mt-3 text-white/75 max-w-xl leading-relaxed">{text}</p>
    </div>
    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
      <Button asChild variant="accent" size="lg" className="h-12 px-6"><Link to="/auth">Start your free month</Link></Button>
      <Button asChild variant="ghost" size="lg" className="h-12 px-5 text-white hover:bg-white/10 hover:text-white"><Link to="/auth?demo=true">Try the sample account</Link></Button>
    </div>
  </section>
);

// ── Pricing guide ──────────────────────────────────────────────────

const WorkedQuote = ({ g }: { g: GuideDef }) => {
  const w = workGuide(g);
  return (
    <div className="rounded-md border border-border bg-card shadow-md overflow-hidden">
      <div className="px-5 sm:px-6 py-4 border-b border-dashed border-border">
        <p className="font-heading text-primary">Worked example</p>
        <p className="mt-1 text-[0.95rem] italic text-foreground/80">“{g.example}”</p>
      </div>
      <table className="w-full text-sm tabular">
        <caption className="sr-only">Materials, labour and total for the worked example</caption>
        <thead>
          <tr className="text-left text-muted-foreground">
            <th scope="col" className="pl-5 sm:pl-6 py-2 font-normal">Material</th>
            <th scope="col" className="py-2 font-normal text-right">Qty</th>
            <th scope="col" className="py-2 font-normal text-right hidden sm:table-cell">Each</th>
            <th scope="col" className="pr-5 sm:pr-6 py-2 font-normal text-right">Cost</th>
          </tr>
        </thead>
        <tbody>
          {w.materials.map((m) => (
            <tr key={m.name} className="border-t border-border/70">
              <td className="pl-5 sm:pl-6 py-2 pr-2">{m.name}</td>
              <td className="py-2 text-right whitespace-nowrap">{m.quantity} {m.unit === "each" ? "" : m.unit}</td>
              <td className="py-2 text-right hidden sm:table-cell">{gbp(m.typical)}</td>
              <td className="pr-5 sm:pr-6 py-2 text-right">{gbp(m.cost)}</td>
            </tr>
          ))}
          {w.materials.length === 0 && (
            <tr className="border-t border-border/70"><td colSpan={4} className="pl-5 sm:pl-6 py-2 text-muted-foreground">No materials: this job is all labour.</td></tr>
          )}
          <tr className="border-t border-border">
            <td className="pl-5 sm:pl-6 py-2">Labour, {w.hours} hours at {gbp(g.rate)}/hour</td>
            <td /><td className="hidden sm:table-cell" />
            <td className="pr-5 sm:pr-6 py-2 text-right">{gbp(w.labourTotal)}</td>
          </tr>
          {w.overheads > 0 && (
            <tr className="border-t border-border/70">
              <td className="pl-5 sm:pl-6 py-2">Transport</td><td /><td className="hidden sm:table-cell" />
              <td className="pr-5 sm:pr-6 py-2 text-right">{gbp(w.overheads)}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-primary">
            <th scope="row" className="pl-5 sm:pl-6 py-3 text-left font-heading text-primary">Total</th>
            <td /><td className="hidden sm:table-cell" />
            <td className="pr-5 sm:pr-6 py-3 text-right font-heading text-xl text-accent">{gbp(w.total)}</td>
          </tr>
        </tfoot>
      </table>
      <p className="px-5 sm:px-6 py-3 text-xs text-muted-foreground border-t border-border bg-secondary/40">
        Typical UK retail prices including VAT, {PRICES_CHECKED}. Not VAT-registered example; add 20% to the total if you are. Rate is an example: use your own.
      </p>
    </div>
  );
};

export const GuidePage = () => {
  const { slug = "" } = useParams();
  const g = GUIDE_BY_SLUG.get(slug);
  usePageMeta(g ? guideMeta(slug) : null);
  if (!g) return <NotFound />;
  const w = workGuide(g);
  const related = GUIDES.filter((x) => x.trade.slug === g.trade.slug && x.slug !== g.slug).slice(0, 4);
  const template = TEMPLATES.find((t) => t.guide === g.slug || t.trade.slug === g.trade.slug);

  return (
    <Shell>
      <article className="container mx-auto max-w-4xl">
        <Crumbs items={[["Pricing guides", "/guides"], [g.trade.name, `/trades/${g.trade.slug}`], [g.h1]]} />
        <h1 className="text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05] text-primary">{g.h1}</h1>
        <p className="mt-5 text-lg leading-relaxed text-foreground/80 max-w-2xl">{g.description}</p>
        <p className="mt-3 text-sm text-muted-foreground">For {g.trade.name.toLowerCase()} in the UK. Prices checked {PRICES_CHECKED}.</p>

        <div className="mt-10 grid lg:grid-cols-[1.5fr_1fr] gap-10 items-start">
          <WorkedQuote g={g} />
          <div className="space-y-8">
            {g.published && (
              <section>
                <h2 className="text-xl text-primary">What customers expect to pay</h2>
                <p className="mt-2 leading-relaxed text-foreground/80">
                  Homeowners are told to expect <strong className="tabular">{gbp(g.published.low).replace(".00", "")}–{gbp(g.published.high).replace(".00", "")}</strong> for {g.published.what}, according to the{" "}
                  <a href={g.published.source} target="_blank" rel="noopener" className="underline underline-offset-4">{g.published.sourceName}</a>.
                  The worked example comes to {gbp(w.total)}.
                </p>
              </section>
            )}
            <section>
              <h2 className="text-xl text-primary">Where the time goes</h2>
              <ul className="mt-3 divide-y divide-border border-y border-border">
                {w.labour.map((l) => (
                  <li key={l.name} className="py-2.5 flex justify-between gap-4 text-[0.95rem]">
                    <span>{l.name}</span><span className="tabular text-muted-foreground whitespace-nowrap">{l.hours} h</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <section className="mt-14 max-w-2xl">
          <h2 className="text-2xl text-primary">Before you quote</h2>
          <ul className="mt-4 space-y-3 list-disc pl-5 leading-relaxed text-foreground/85">
            {g.tips.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </section>

        <section className="mt-14 max-w-2xl">
          <h2 className="text-2xl text-primary">How the quantities are worked out</h2>
          <p className="mt-4 leading-relaxed text-foreground/85">
            Each material is counted in the units merchants sell it in, with normal waste allowed, so you can order straight
            from the list. Labour is the on-site time for one competent tradesperson, including setting up, testing and
            clearing up. Change the measurements and the whole quote moves with them; that's what Quotable does for you on
            every job, with each material priced live at UK merchants.
          </p>
        </section>

        <Cta title={`Quote this job with today's prices`} text="Type the job, check the lines, send a link your customer can accept and pay. Every material is priced live and linked to the product." />

        {(related.length > 0 || template) && (
          <section className="mt-14">
            <h2 className="text-xl text-primary">More for {g.trade.name.toLowerCase()}</h2>
            <ul className="mt-4 grid sm:grid-cols-2 gap-x-8">
              {related.map((r) => (
                <li key={r.slug} className="border-b border-border"><Link to={`/guides/${r.slug}`} className="block py-3 hover:text-primary hover:underline underline-offset-4">{r.h1}</Link></li>
              ))}
              {template && (
                <li className="border-b border-border"><Link to={`/quote-templates/${template.slug}`} className="block py-3 hover:text-primary hover:underline underline-offset-4">Free {template.trade.singular} quote template</Link></li>
              )}
            </ul>
          </section>
        )}
      </article>
    </Shell>
  );
};

export const GuidesIndex = () => {
  usePageMeta(guidesIndexMeta());
  const byTrade = new Map<string, GuideDef[]>();
  for (const g of GUIDES) byTrade.set(g.trade.name, [...(byTrade.get(g.trade.name) ?? []), g]);
  return (
    <Shell>
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05] text-primary">How to price jobs</h1>
        <p className="mt-5 text-lg leading-relaxed text-foreground/80 max-w-2xl">
          Materials, quantities, labour hours and a worked example for common jobs, with typical UK prices for {PRICES_CHECKED}.
        </p>
        <div className="mt-12 grid md:grid-cols-2 gap-x-12 gap-y-10">
          {[...byTrade].map(([trade, list]) => (
            <section key={trade}>
              <h2 className="text-lg text-primary pb-2 border-b-2 border-primary">{trade}</h2>
              <ul>
                {list.map((g) => (
                  <li key={g.slug} className="border-b border-border">
                    <Link to={`/guides/${g.slug}`} className="block py-3 hover:text-primary hover:underline underline-offset-4">{g.h1}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </Shell>
  );
};

// ── Quote template ─────────────────────────────────────────────────

export const TemplatePage = () => {
  const { slug = "" } = useParams();
  const t = TEMPLATE_BY_SLUG.get(slug);
  usePageMeta(t ? templateMeta(slug) : null);
  if (!t) return <NotFound />;
  const g = GUIDE_BY_SLUG.get(t.guide)!;
  const w = workGuide(g);
  const subtotal = w.total;
  const vat = Math.round(subtotal * 0.2 * 100) / 100;
  const Name = t.trade.singular.charAt(0).toUpperCase() + t.trade.singular.slice(1);

  return (
    <Shell>
      <article className="container mx-auto max-w-4xl">
        <div className="print:hidden">
          <Crumbs items={[["Quote templates", "/quote-templates"], [`${Name} quote template`]]} />
          <h1 className="text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05] text-primary">Free {t.trade.singular} quote template</h1>
          <p className="mt-5 text-lg leading-relaxed text-foreground/80 max-w-2xl">
            A complete UK {t.trade.singular} quote, filled in with a real example so you can see what goes where. Print it,
            save it as a PDF, or copy the layout into your own.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="default" size="lg" className="h-11" onClick={() => typeof window !== "undefined" && window.print()}>Print or save as PDF</Button>
            <Button asChild variant="outline" size="lg" className="h-11"><Link to="/auth">Make one with live prices</Link></Button>
          </div>
        </div>

        {/* The template itself */}
        <section aria-label={`${Name} quote template`} className="print-sheet mt-10 rounded-md border border-border bg-card shadow-md p-6 sm:p-10 text-[0.95rem]">
          <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-border">
            <div>
              <p className="font-heading text-xl text-primary">Your Business Name</p>
              <p className="text-muted-foreground mt-1 leading-relaxed">Address line, Town, Postcode<br />07000 000000<br />you@yourbusiness.co.uk</p>
            </div>
            <div className="sm:text-right">
              <p className="font-heading text-2xl text-primary">Quote</p>
              <p className="text-muted-foreground mt-1 tabular leading-relaxed">No. Q-0001<br />Date: 6 November 2026<br />Valid until: 6 December 2026</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 py-6 border-b border-border">
            <div>
              <p className="text-sm text-muted-foreground">For</p>
              <p className="mt-1 leading-relaxed">Customer name<br />Site address</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">The job</p>
              <p className="mt-1 leading-relaxed">{g.example}</p>
            </div>
          </div>

          <table className="w-full mt-4 tabular">
            <caption className="sr-only">Quote lines</caption>
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
              <tr className="border-t border-border/70">
                <td className="py-2 pr-2">Labour</td><td className="py-2 text-right">{w.hours} h</td>
                <td className="py-2 text-right">{gbp(w.labourTotal)}</td>
              </tr>
              {w.overheads > 0 && (
                <tr className="border-t border-border/70"><td className="py-2">Transport</td><td /><td className="py-2 text-right">{gbp(w.overheads)}</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-border"><th scope="row" className="pt-3 text-left font-normal">Subtotal</th><td /><td className="pt-3 text-right">{gbp(subtotal)}</td></tr>
              <tr><th scope="row" className="py-1 text-left font-normal text-muted-foreground">VAT at 20% (if you're VAT-registered)</th><td /><td className="py-1 text-right text-muted-foreground">{gbp(vat)}</td></tr>
              <tr className="border-t-2 border-primary"><th scope="row" className="py-3 text-left font-heading text-primary">Total</th><td /><td className="py-3 text-right font-heading text-xl text-primary">{gbp(subtotal + vat)}</td></tr>
            </tfoot>
          </table>

          <div className="mt-6 grid sm:grid-cols-2 gap-6 text-sm leading-relaxed text-foreground/85">
            <div>
              <p className="font-semibold text-primary">Terms</p>
              <p className="mt-1">25% deposit to book the work, balance on completion. Payment within 14 days of invoice. This quote is valid for 30 days; material prices may change after that.</p>
            </div>
            <div>
              <p className="font-semibold text-primary">Not included</p>
              <p className="mt-1">Anything not listed above, including making good and decorating unless stated. Extra work found once started will be agreed with you before it's done.</p>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border grid sm:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <p>Accepted by: ______________________</p>
            <p>Date: ______________</p>
          </div>
        </section>

        <div className="print:hidden">
          <section className="mt-14 max-w-2xl">
            <h2 className="text-2xl text-primary">What to include in a {t.trade.singular} quote</h2>
            <ul className="mt-4 space-y-3 list-disc pl-5 leading-relaxed text-foreground/85">
              <li>Your business name, contact details and, if registered, your VAT number</li>
              <li>A quote number, the date and how long the price is valid</li>
              <li>The job in plain words, so the customer can see exactly what's included</li>
              {t.include.map((i) => <li key={i}>{i}</li>)}
              <li>Materials and labour as separate lines, with VAT shown if you charge it</li>
              <li>Deposit and payment terms, and what happens if extra work is found</li>
            </ul>
          </section>

          <section className="mt-14 max-w-2xl">
            <h2 className="text-2xl text-primary">How the example was priced</h2>
            <p className="mt-4 leading-relaxed text-foreground/85">
              The figures come from our guide <Link to={`/guides/${g.slug}`} className="underline underline-offset-4">{g.h1.toLowerCase()}</Link>,
              using typical UK retail prices for {PRICES_CHECKED} and an example rate of {gbp(g.rate)} an hour. Swap in your own
              rate and supplier prices, or let Quotable price every line live for you.
            </p>
          </section>

          <Cta title="Stop filling in templates" text="Type the job and Quotable fills in the lines, prices each material live, adds your labour and sends your customer a link to accept." />
        </div>
      </article>
    </Shell>
  );
};

export const TemplatesIndex = () => {
  usePageMeta(templatesIndexMeta());
  return (
    <Shell>
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05] text-primary">Free quote templates</h1>
        <p className="mt-5 text-lg leading-relaxed text-foreground/80 max-w-2xl">
          Printable quote templates for UK trades, each filled in with a real worked example. Free to print or save as PDF.
        </p>
        <ul className="mt-10 grid sm:grid-cols-2 gap-x-12">
          {TEMPLATES.map((t) => (
            <li key={t.slug} className="border-b border-border">
              <Link to={`/quote-templates/${t.slug}`} className="block py-4 hover:text-primary hover:underline underline-offset-4">
                {t.trade.singular.charAt(0).toUpperCase() + t.trade.singular.slice(1)} quote template
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Shell>
  );
};
