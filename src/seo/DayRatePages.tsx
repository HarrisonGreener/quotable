import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/NotFound";
import { DAY_RATES, DAY_RATE_BY_SLUG, DAY_RATES_CHECKED, perHour, type DayRateDef } from "./dayRates";
import { GUIDES, TEMPLATES } from "./content";
import { dayRateMeta, dayRatesIndexMeta, usePageMeta } from "./meta";
import { OFFER } from "@/config/offer";

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="px-4 pt-28 sm:pt-32 pb-24">{children}</main>
    <Footer />
  </div>
);

const money = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

// ── Work out your own day rate ─────────────────────────────────────

const Field = ({ id, label, hint, value, onChange, prefix }: {
  id: string; label: string; hint: string; value: number; onChange: (n: number) => void; prefix?: string;
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-semibold text-primary">{label}</label>
    <div className="mt-1.5 flex items-center rounded-md border border-border bg-background focus-within:ring-2 focus-within:ring-ring">
      {prefix && <span className="pl-3 text-muted-foreground">{prefix}</span>}
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-transparent px-3 py-2.5 text-base tabular outline-none"
      />
    </div>
    <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
  </div>
);

const RateCalculator = ({ d }: { d?: DayRateDef }) => {
  const [income, setIncome] = useState(40000);
  const [costs, setCosts] = useState(9000);
  const [days, setDays] = useState(200);
  const rate = days > 0 ? (Math.max(0, income) + Math.max(0, costs)) / days : 0;
  const mid = d ? d.rates.reduce((s, r) => s + (r.low + r.high) / 2, 0) / d.rates.length : null;

  return (
    <section aria-labelledby="calc" className="mt-14 rounded-md border border-border bg-card p-6 sm:p-8">
      <h2 id="calc" className="text-2xl text-primary">Work out your own day rate</h2>
      <p className="mt-2 text-foreground/80 max-w-2xl">
        A day rate has to cover what you want to take home and your business costs, spread over the days you actually get paid for.
        The figures below are examples: change them to yours.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-3">
        <Field id="calc-income" label="What you want to earn" hint="Per year, before tax" prefix="£" value={income} onChange={setIncome} />
        <Field id="calc-costs" label="Business costs" hint="Per year: van, fuel, insurance, tools, phone, software" prefix="£" value={costs} onChange={setCosts} />
        <Field id="calc-days" label="Paid days a year" hint="260 weekdays, minus holidays, quoting, travel and quiet spells" value={days} onChange={setDays} />
      </div>
      <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t-2 border-primary pt-4">
        <p className="text-lg text-primary">
          Your day rate: <strong className="font-heading text-3xl text-accent tabular">{money(rate)}</strong>
        </p>
        <p className="text-muted-foreground tabular">{money(rate / 8)} an hour on an 8-hour day · {money(rate / 2)} a half day</p>
      </div>
      {mid != null && rate > 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          The middle of the published {d!.trade} ranges below is about {money(mid)} a day.
        </p>
      )}
    </section>
  );
};

// ── One trade ──────────────────────────────────────────────────────

export const DayRatePage = () => {
  const { slug = "" } = useParams();
  const d = DAY_RATE_BY_SLUG.get(slug);
  usePageMeta(d ? dayRateMeta(slug) : null);
  if (!d) return <NotFound />;

  const name = d.trade.charAt(0).toUpperCase() + d.trade.slice(1);
  const lo = Math.min(...d.rates.map((r) => r.low));
  const hi = Math.max(...d.rates.map((r) => r.high));
  const guides = GUIDES.filter((g) => g.trade.slug === d.tradeSlug).slice(0, 4);
  const template = TEMPLATES.find((t) => t.trade.slug === d.tradeSlug);

  return (
    <Shell>
      <article className="container mx-auto max-w-4xl">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary hover:underline underline-offset-4">Home</Link>
          <span aria-hidden className="mx-2">/</span>
          <Link to="/day-rates" className="hover:text-primary hover:underline underline-offset-4">Day rates</Link>
        </nav>
        <h1 className="text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05] text-primary text-balance">{name} day rate in the UK (2026)</h1>
        <p className="mt-5 text-lg leading-relaxed text-foreground/85 max-w-2xl">
          Most self-employed {d.plural.toLowerCase()} charge <strong>{money(lo)}–{money(hi)} a day</strong>, depending mostly on where you work.
          London pays the most and Wales and the North the least. Figures checked {DAY_RATES_CHECKED}.
        </p>

        <section aria-labelledby="by-region" className="mt-12">
          <h2 id="by-region" className="text-2xl text-primary">Day rates by region</h2>
          <div className="mt-4 overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left tabular">
              <thead className="bg-card text-sm text-primary">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Region</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Per day</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Per hour (8-hour day)</th>
                </tr>
              </thead>
              <tbody>
                {d.rates.map((r) => (
                  <tr key={r.region} className="border-t border-border">
                    <th scope="row" className="px-4 py-3 font-normal">{r.region}</th>
                    <td className="px-4 py-3 whitespace-nowrap">{money(r.low)}–{money(r.high)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{money(perHour(r.low))}–{money(perHour(r.high))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {d.note && <p className="mt-3 text-sm text-foreground/80">{d.note}</p>}
          <p className="mt-3 text-sm text-muted-foreground">
            Self-employed, domestic work. Source: <a href={d.source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary">{d.source.name}</a>.
            Hourly figures are the day rate divided by 8.
          </p>
        </section>

        <section aria-labelledby="top" className="mt-12">
          <h2 id="top" className="text-2xl text-primary">What puts you at the top of the range</h2>
          <ul className="mt-4 space-y-2 list-disc pl-5 text-foreground/85 leading-relaxed">
            {d.upFactors.map((f) => <li key={f}>{f}.</li>)}
          </ul>
        </section>

        <RateCalculator d={d} />

        {(guides.length > 0 || template) && (
          <section aria-labelledby="pricing" className="mt-12">
            <h2 id="pricing" className="text-2xl text-primary">Pricing jobs as a {d.trade}</h2>
            <p className="mt-2 text-foreground/80">Day rates suit open-ended work. For set jobs, most customers want a fixed quote with materials itemised.</p>
            <ul className="mt-4 grid sm:grid-cols-2 gap-x-8">
              {template && (
                <li className="border-b border-border">
                  <Link to={`/quote-templates/${template.slug}`} className="block py-3 hover:text-primary hover:underline underline-offset-4">Free {template.trade.singular} quote template</Link>
                </li>
              )}
              {guides.map((g) => (
                <li key={g.slug} className="border-b border-border">
                  <Link to={`/guides/${g.slug}`} className="block py-3 hover:text-primary hover:underline underline-offset-4">{g.h1}</Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-16 rounded-md bg-primary text-white p-8 sm:p-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl text-white">Quote at your rate, with materials priced for you</h2>
            <p className="mt-3 text-white/75 max-w-xl leading-relaxed">
              Set your day or hourly rate once. Describe a job and Quotable lists the materials, prices them at UK merchants and works out the labour.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Button asChild variant="accent" size="lg" className="h-12 px-6"><Link to="/auth">{OFFER.button}</Link></Button>
            <Button asChild variant="ghost" size="lg" className="h-12 px-5 text-white hover:bg-white/10 hover:text-white"><Link to="/auth?demo=true">Try the sample account</Link></Button>
          </div>
        </section>

        <nav aria-label="Other trades" className="mt-12">
          <h2 className="text-lg text-primary">Day rates for other trades</h2>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {DAY_RATES.filter((o) => o.slug !== d.slug).map((o) => (
              <li key={o.slug}><Link to={`/day-rates/${o.slug}`} className="inline-flex min-h-[2.5rem] items-center hover:text-primary hover:underline underline-offset-4">{o.plural}</Link></li>
            ))}
          </ul>
        </nav>
      </article>
    </Shell>
  );
};

// ── All trades ─────────────────────────────────────────────────────

export const DayRatesIndex = () => {
  usePageMeta(dayRatesIndexMeta());
  return (
    <Shell>
      <div className="container mx-auto max-w-5xl">
        <h1 className="text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05] text-primary">UK trade day rates (2026)</h1>
        <p className="mt-5 text-lg leading-relaxed text-foreground/80 max-w-2xl">
          What self-employed tradespeople charge per day, from the lowest to the highest published regional rate. Figures checked {DAY_RATES_CHECKED}.
        </p>
        <div className="mt-10 overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left tabular">
            <thead className="bg-card text-sm text-primary">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Trade</th>
                <th scope="col" className="px-4 py-3 font-semibold">Per day (UK range)</th>
                <th scope="col" className="px-4 py-3 font-semibold">North West</th>
                <th scope="col" className="px-4 py-3 font-semibold">London</th>
              </tr>
            </thead>
            <tbody>
              {DAY_RATES.map((d) => {
                const lo = Math.min(...d.rates.map((r) => r.low));
                const hi = Math.max(...d.rates.map((r) => r.high));
                const nw = d.rates.find((r) => r.region.startsWith("North West"));
                const ldn = d.rates.find((r) => r.region.startsWith("London"));
                return (
                  <tr key={d.slug} className="border-t border-border">
                    <th scope="row" className="px-4 py-3 font-normal">
                      <Link to={`/day-rates/${d.slug}`} className="text-primary underline-offset-4 hover:underline">{d.plural}</Link>
                    </th>
                    <td className="px-4 py-3 whitespace-nowrap">{money(lo)}–{money(hi)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{nw ? `${money(nw.low)}–${money(nw.high)}` : "See page"}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{ldn ? `${money(ldn.low)}–${money(ldn.high)}` : "See page"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Self-employed, domestic work. Sources are linked on each trade's page.</p>
        <RateCalculator />
      </div>
    </Shell>
  );
};
