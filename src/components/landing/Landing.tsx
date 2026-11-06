import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TradeSearchHero } from "@/components/TradeSearchHero";
import { HeroDemo } from "@/components/landing/HeroDemo";
import { LANDING_FAQ } from "@/seo/meta";

const STAGES = [
  { name: "Quoted", text: "Type or say the job. Check the lines, add your photos, send it as a link or PDF." },
  { name: "Accepted", text: "Your customer opens it on their phone, accepts with a tap and pays the deposit." },
  { name: "Booked in", text: "Drop it on the calendar by the hour or the day, with the payment window marked." },
  { name: "Invoiced", text: "When the work's done the quote becomes an invoice. Nothing typed twice." },
  { name: "Paid", text: "A pay-now link on every invoice, VAT worked out, ready for your accountant." },
];

const TRADES = [
  "Electricians", "Plumbers", "Gas engineers", "Plasterers", "Painters & decorators", "Carpenters",
  "Joiners", "Tilers", "Builders", "Roofers", "Bathroom fitters", "Kitchen fitters", "Landscapers",
  "Fencers", "Bricklayers", "Flooring fitters", "Heating engineers", "Groundworkers", "Window fitters",
  "Locksmiths", "Solar installers", "EV charger installers", "Air-con engineers", "Handymen",
];

const FEATURES = [
  {
    group: "Quoting",
    items: [
      "Quotes from a typed description or a voice note",
      "Live prices from UK merchants, with a link on every line",
      "Your own stock and prices used first",
      "Your hourly or day rate, markup and VAT status",
      "Anything we couldn't price is marked for you to check",
      "Templates for the jobs you do every week",
    ],
  },
  {
    group: "Jobs and customers",
    items: [
      "A link your customer can accept and pay a deposit from",
      "Site photos on the quote",
      "Calendar with jobs by the hour or the day",
      "Every customer's quotes, jobs and invoices in one place",
      "Branded PDFs with your logo and bank details",
      "Send by WhatsApp, text or email",
    ],
  },
  {
    group: "Money",
    items: [
      "Turn a quote into an invoice in one click",
      "Pay-now links through your own payment provider",
      "VAT worked out on every line",
      "Exports for Xero, QuickBooks and FreeAgent",
      "Quarterly VAT and profit reports",
      "See what's owed at a glance",
    ],
  },
];

/** The landing page itself — no data hooks, so it can also be prerendered at build time. */
export const LandingContent = ({ onSubscribe, subLoading = false }: { onSubscribe: (plan: "monthly" | "annual") => void; subLoading?: boolean }) => {
  const handleSubscribe = onSubscribe;
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <LandingBody handleSubscribe={handleSubscribe} subLoading={subLoading} />
      <Footer />
    </div>
  );
};


const LandingBody = ({ handleSubscribe, subLoading }: { handleSubscribe: (plan: "monthly" | "annual") => void; subLoading: boolean }) => {
  return (
      <main>
        {/* ── Hero: the job typed in, the quote that comes out ───────────── */}
        <section className="px-4 pt-28 sm:pt-36 pb-20 sm:pb-28">
          <div className="container mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-16 items-center">
            <div className="max-w-xl">
              <h1 className="text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.02] text-primary">
                Type the job.
                <br />
                Get a priced quote.
              </h1>
              <p className="mt-6 text-lg sm:text-xl leading-relaxed text-foreground/80 max-w-[34rem]">
                Describe the work in your own words. Quotable lists the materials, finds today's price
                for each one at UK merchants and works out your labour, ready to send in about a minute.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row gap-3 sm:items-center">
                <Button asChild variant="accent" size="lg" className="h-12 px-7 text-base">
                  <Link to="/auth">Start your free month</Link>
                </Button>
                <Button asChild variant="ghost" size="lg" className="h-12 px-5 text-base text-primary underline underline-offset-4 decoration-border hover:decoration-primary hover:bg-transparent">
                  <Link to="/auth?demo=true">Look around with sample data</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">The sample account needs no sign-up.</p>
            </div>
            <HeroDemo />
          </div>
        </section>

        {/* ── Where the prices come from ─────────────────────────────────── */}
        <section className="border-y border-border bg-card/60 px-4">
          <div className="container mx-auto py-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-10">
            <p className="text-sm text-muted-foreground md:w-56 shrink-0">Prices checked live at</p>
            <ul className="flex flex-wrap gap-x-10 gap-y-2 font-heading text-lg sm:text-xl text-primary">
              <li>Toolstation</li>
              <li>Wickes</li>
              <li>Travis Perkins</li>
              <li className="text-muted-foreground font-normal font-sans text-base self-center" style={{ fontStretch: "100%" }}>
                and your own price list
              </li>
            </ul>
          </div>
        </section>

        {/* ── One job, start to finish (a real sequence, so it reads as one) ─ */}
        <section className="px-4 py-24 sm:py-32">
          <div className="container mx-auto">
            <h2 className="text-3xl sm:text-[2.75rem] leading-tight text-primary max-w-2xl">One job, start to finish</h2>
            <p className="mt-4 text-lg text-foreground/75 max-w-xl">
              The same quote carries on through the whole job, so you never copy details from one app to another.
            </p>
            <ol className="job-track mt-14 grid gap-10 md:gap-6 md:grid-cols-5">
              {STAGES.map((s, i) => (
                <li key={s.name} className="relative md:pt-9">
                  <span aria-hidden className={`job-track-dot ${i === STAGES.length - 1 ? "is-last" : ""}`} />
                  <h3 className="text-xl text-primary">{s.name}</h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-foreground/75">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Trades, set as type ────────────────────────────────────────── */}
        <section className="px-4 py-24 sm:py-28 bg-primary text-primary-foreground">
          <div className="container mx-auto">
            <div className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16">
              <div>
                <h2 className="text-3xl sm:text-[2.75rem] leading-tight text-white">Made for the trades</h2>
                <p className="mt-4 text-lg text-white/70 max-w-sm">
                  Any job, any trade. If you price materials and time, Quotable will quote it.
                </p>
                <div className="mt-8 max-w-sm [&_input]:bg-white [&_input]:text-foreground [&_p]:text-white/60">
                  <TradeSearchHero />
                </div>
              </div>
              <p className="font-heading text-[1.45rem] sm:text-[1.9rem] leading-[1.3] text-white/85" style={{ fontWeight: 420 }}>
                {TRADES.map((t, i) => (
                  <span key={t}>
                    {t}
                    {i < TRADES.length - 1 && <span className="text-accent-light">, </span>}
                  </span>
                ))}
                <span className="text-white/50"> and more.</span>
              </p>
            </div>
          </div>
        </section>

        {/* ── What's in it ──────────────────────────────────────────────── */}
        <section className="px-4 py-24 sm:py-32">
          <div className="container mx-auto">
            <h2 className="text-3xl sm:text-[2.75rem] leading-tight text-primary max-w-2xl">What's in it</h2>
            <div className="mt-12 grid gap-12 md:grid-cols-3 md:gap-10">
              {FEATURES.map((f) => (
                <div key={f.group}>
                  <h3 className="text-lg text-primary pb-3 border-b-2 border-primary">{f.group}</h3>
                  <ul className="mt-1">
                    {f.items.map((item) => (
                      <li key={item} className="py-3 border-b border-border text-[0.98rem] leading-snug text-foreground/85">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing: one sheet ────────────────────────────────────────── */}
        <section id="pricing" className="px-4 pb-24 sm:pb-32 scroll-mt-24">
          <div className="container mx-auto">
            <div className="rounded-md border border-border bg-card shadow-md grid md:grid-cols-[1.2fr_1fr_1fr]">
              <div className="p-8 sm:p-10 border-b md:border-b-0 md:border-r border-border">
                <h2 className="text-3xl sm:text-4xl leading-tight text-primary">One plan, everything included</h2>
                <p className="mt-4 text-foreground/75 leading-relaxed">
                  Unlimited quotes, invoices and customers. Your first month is free, and you can cancel any time.
                </p>
              </div>
              <div className="p-8 sm:p-10 border-b md:border-b-0 md:border-r border-border flex flex-col">
                <p className="text-sm text-muted-foreground">Monthly</p>
                <p className="mt-2 font-heading text-5xl text-primary tabular">£14.99</p>
                <p className="text-sm text-muted-foreground mt-1">a month after your free month</p>
                <Button variant="outline" size="lg" className="w-full h-12 mt-8"
                  onClick={() => handleSubscribe("monthly")} disabled={subLoading}>
                  Start free month
                </Button>
              </div>
              <div className="p-8 sm:p-10 flex flex-col">
                <p className="text-sm text-muted-foreground">Yearly</p>
                <p className="mt-2 font-heading text-5xl text-primary tabular">£159.99</p>
                <p className="text-sm text-muted-foreground mt-1">a year, which saves £19.89</p>
                <Button variant="accent" size="lg" className="w-full h-12 mt-8"
                  onClick={() => handleSubscribe("annual")} disabled={subLoading}>
                  Start free month
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Questions (mirrors the FAQ structured data) ──────────────── */}
        <section className="px-4 pb-24 sm:pb-32">
          <div className="container mx-auto grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16">
            <div>
              <h2 className="text-3xl sm:text-[2.75rem] leading-tight text-primary">Questions</h2>
              <p className="mt-4 text-foreground/75 max-w-sm">
                Or read our <Link to="/guides" className="underline underline-offset-4">pricing guides</Link> and{" "}
                <Link to="/quote-templates" className="underline underline-offset-4">free quote templates</Link>.
              </p>
            </div>
            <dl className="border-t-2 border-primary">
              {LANDING_FAQ.map(([q, a]) => (
                <div key={q} className="py-5 border-b border-border">
                  <dt className="font-heading text-lg text-primary" style={{ fontStretch: "105%" }}>{q}</dt>
                  <dd className="mt-2 leading-relaxed text-foreground/80 max-w-2xl">{a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Close ─────────────────────────────────────────────────────── */}
        <section className="px-4 pb-24 sm:pb-32">
          <div className="container mx-auto border-t-2 border-primary pt-12 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <h2 className="text-3xl sm:text-5xl leading-[1.05] text-primary max-w-3xl">
              Price the job before you're back in the van.
            </h2>
            <Button asChild variant="accent" size="lg" className="h-12 px-7 text-base shrink-0">
              <Link to="/auth">Start your free month</Link>
            </Button>
          </div>
        </section>
      </main>
  );
};

