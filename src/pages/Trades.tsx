import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ALL_TRADES, TRADE_CATEGORIES, TRADE_SPECIALIZATIONS } from "@/data/trades";
import NotFound from "./NotFound";
import { applyMeta, type PageMeta } from "@/seo/meta";
import { GUIDES, TEMPLATES, SITE_URL } from "@/seo/content";

// SEO landing pages: /trades and /trades/:slug (e.g. /trades/electrician).
// Each one is a real, useful page for that trade, not a keyword stub.

// Plural label for headings: "Electricians", "Painters & Decorators"
const PLURAL_OVERRIDES: Record<string, string> = {
  "carpenter": "Carpenters & Joiners",
  "hgv-mechanic": "HGV & Fleet Mechanics",
  "lift-engineer": "Lift Engineers",
  "pool-spa": "Pool & Spa Engineers",
  "cleaning-services": "Cleaning Businesses",
  "pest-control": "Pest Control Technicians",
};
const plural = (value: string, label: string) =>
  PLURAL_OVERRIDES[value] ??
  label.split(" & ").map((w) => (w.endsWith("s") ? w : `${w}s`)).join(" & ");

// Short singular for buttons: "Try a carpenter quote"
const singular = (label: string) => label.split(" / ")[0].toLowerCase();
const withArticle = (label: string) => {
  const w = singular(label);
  return `${/^([aeio]|ev\b|hgv\b|hvac\b|u(?!ni))/i.test(w) ? "an" : "a"} ${w}`;
};

const SKIP = new Set(["other", "multi-trade"]);

const EXAMPLE_JOBS: Record<string, string[]> = {
  "Building & Construction": ["Single-storey rear extension", "Knock through with steel beam", "Re-point a garden wall"],
  "Electrical & Power": ["Consumer unit upgrade with RCBOs", "Add three double sockets", "EV charger install"],
  "Plumbing & Heating": ["Combi boiler swap", "Replace kitchen mixer tap", "Add a radiator and TRVs"],
};

export const tradeMeta = (slug: string): PageMeta | null => {
  const trade = ALL_TRADES.find((t) => t.value === slug && !SKIP.has(t.value));
  if (!trade) return null;
  const name = plural(trade.value, trade.label);
  return {
    path: `/trades/${trade.value}`,
    title: `Quoting software for ${name.toLowerCase()} (UK) | Quotable`,
    description: `Quotes for UK ${name.toLowerCase()} in minutes: materials priced live at UK merchants, labour at your rate, a link your customer can accept and pay, then invoicing in one click.`,
    jsonLd: [{
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Trades", item: `${SITE_URL}/trades` },
        { "@type": "ListItem", position: 3, name, item: `${SITE_URL}/trades/${trade.value}` },
      ],
    }],
  };
};

export const tradesIndexMeta = (): PageMeta => ({
  path: "/trades",
  title: "Quoting and invoicing software for every UK trade | Quotable",
  description: "Quoting, customer acceptance and invoicing for 50+ UK trades, from electricians and plumbers to roofers, tilers and EV installers.",
});

export const TRADE_SLUGS = () => ALL_TRADES.filter((t) => !SKIP.has(t.value)).map((t) => t.value);

export const TradePage = () => {
  const { slug } = useParams();
  const trade = ALL_TRADES.find((t) => t.value === slug && !SKIP.has(t.value));

  useEffect(() => {
    const m = trade && tradeMeta(trade.value);
    if (m) applyMeta(m);
  }, [trade]);

  if (!trade) return <NotFound />;

  const name = plural(trade.value, trade.label);
  const specialisms = (TRADE_SPECIALIZATIONS[trade.value] || []).slice(0, 8);
  const examples = EXAMPLE_JOBS[trade.category] || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="pt-28 pb-12 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-accent mb-3">{trade.category}</p>
            <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-5">Quotes for {name.toLowerCase()}, done in minutes</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Describe the job, or just say it. Quotable lists the materials, labour and overheads {withArticle(trade.label)} job needs,
              prices them from UK suppliers, and gives your customer a link to accept and pay the deposit.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/auth"><Button variant="accent" size="lg">Start your free month</Button></Link>
              <Link to="/auth?demo=true"><Button variant="outline" size="lg">Try Demo</Button></Link>
            </div>
          </div>
        </section>

        {(specialisms.length > 0 || examples.length > 0) && (
          <section className="pb-12 px-4">
            <div className="container mx-auto max-w-4xl grid gap-6 md:grid-cols-2">
              {specialisms.length > 0 && (
                <div className="rounded-xl border p-6">
                  <h2 className="font-heading text-xl mb-4 text-foreground">Built around your work</h2>
                  <ul className="space-y-2">
                    {specialisms.map((s) => (
                      <li key={s} className="flex gap-2 text-sm text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" aria-hidden="true" />{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="rounded-xl border p-6">
                <h2 className="font-heading text-xl mb-4 text-foreground">From quote to paid</h2>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-5">
                  <li>Say or type the job on site; add photos.</li>
                  <li>Check the breakdown. Anything estimated is flagged for you.</li>
                  <li>Send a link by WhatsApp. Your customer accepts with a tap.</li>
                  <li>They pay the deposit by card or bank transfer.</li>
                  <li>Invoice in one click; export to Xero, QuickBooks or FreeAgent.</li>
                </ol>
                {examples.length > 0 && <p className="text-sm text-muted-foreground mt-4">Typical jobs: {examples.join(" · ")}.</p>}
              </div>
            </div>
          </section>
        )}

        {(() => {
          const guides = GUIDES.filter((g) => g.trade.slug === trade.value);
          const template = TEMPLATES.find((t) => t.trade.slug === trade.value);
          if (!guides.length && !template) return null;
          return (
            <section className="pb-16 px-4">
              <div className="container mx-auto max-w-4xl">
                <h2 className="font-heading text-2xl text-primary">Pricing help for {name.toLowerCase()}</h2>
                <ul className="mt-4 grid sm:grid-cols-2 gap-x-10">
                  {template && (
                    <li className="border-b border-border"><Link to={`/quote-templates/${template.slug}`} className="block py-3 hover:text-primary hover:underline underline-offset-4">Free {template.trade.singular} quote template</Link></li>
                  )}
                  {guides.map((g) => (
                    <li key={g.slug} className="border-b border-border"><Link to={`/guides/${g.slug}`} className="block py-3 hover:text-primary hover:underline underline-offset-4">{g.h1}</Link></li>
                  ))}
                </ul>
              </div>
            </section>
          );
        })()}
      </main>
      <Footer />
    </div>
  );
};

export const TradesIndex = () => {
  useEffect(() => { applyMeta(tradesIndexMeta()); }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
          <h1 className="font-heading text-4xl text-foreground mb-3 text-center">Quotable for your trade</h1>
          <p className="text-muted-foreground text-center mb-10">Pick your trade to see how it works for you.</p>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {TRADE_CATEGORIES.map((c) => (
              <section key={c.name} aria-labelledby={`cat-${c.name}`}>
                <h2 id={`cat-${c.name}`} className="font-heading text-lg mb-3 text-foreground">{c.name}</h2>
                <ul className="space-y-1.5">
                  {c.trades.filter((t) => !SKIP.has(t.value)).map((t) => (
                    <li key={t.value}>
                      <Link to={`/trades/${t.value}`} className="text-muted-foreground hover:text-accent">{t.label}</Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
