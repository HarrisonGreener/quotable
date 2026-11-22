// Comparison pages: Quotable vs named competitors, and a round-up.
// Rules (CAP Code): only verifiable facts from each company's own pricing page,
// dated and linked; like-for-like; say plainly where they're stronger.
import { Link } from "react-router-dom";
import { Check, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/NotFound";
import { OFFER } from "@/config/offer";
import { Shell, Crumbs, Cta } from "../layout";
import { breadcrumbs, usePageMeta, type PageMeta } from "../meta";
import { SITE_URL } from "../content";
import { EXPLORE_LINKS, FaqList, LinkGrid, faqSchema, type Faq } from "./shared";

const CHECKED = "22 November 2026";
const CHECKED_ISO = "2026-11-22";

interface Competitor {
  slug: string;
  name: string;
  priceLine: string; // as listed on their pricing page
  yearOne: string; // one person, one year, as listed
  pricingUrl: string;
  trial: string;
  strengths: string[]; // where they're genuinely stronger
  bestFor: string;
  rows: [feature: string, them: string | boolean, us: string | boolean][];
  faqs: Faq[];
}

const QUOTABLE_PRICE = "£14.99 a month or £159.99 a year for one person, and that's the full price you pay";

const COMPETITORS: Competitor[] = [
  {
    slug: "tradify",
    name: "Tradify",
    priceLine: "From £34 per user per month (Lite), £37 (Pro) or £44 (Plus), month to month",
    yearOne: "£408 to £528 for one person (12 months at £34 to £44)",
    pricingUrl: "https://www.tradifyhq.com/uk/pricing",
    trial: "14-day free trial",
    strengths: [
      "A fuller job management system: timesheets, subcontractor scheduling, recurring jobs and compliance certificates",
      "Automatic quote and invoice reminders, and appointment reminders",
      "Two-way sync with Xero and Sage, and QuickBooks Online integration",
      "Native iPhone, iPad and Android apps, and a large base of reviews",
    ],
    bestFor: "Growing firms with staff or subcontractors who need timesheets, scheduling and certificates in one system.",
    rows: [
      ["Price for one person", "From £34 a month", "£14.99 a month"],
      ["Quote from a plain description, typed or spoken", "AI tools on the Plus plan", true],
      ["Materials priced live from UK merchant websites", "Import supplier price lists as CSV files", true],
      ["Online quote acceptance", true, true],
      ["Quote to invoice", true, true],
      ["Accounting software", "Xero, QuickBooks, Sage", "Export for Xero, QuickBooks, FreeAgent"],
      ["Timesheets and staff scheduling", true, false],
      ["Automatic payment reminders", true, false],
      ["Free trial", "14 days", OFFER.short],
    ],
    faqs: [
      ["Is Quotable a good Tradify alternative?", "For sole traders and small teams who mainly need fast, accurate quotes and simple invoicing, yes, and it costs less than half as much for one person. If you need timesheets, staff scheduling and certificates, Tradify does more."],
      ["Can Quotable price materials like Tradify's price lists?", "Differently. Tradify lets you import your supplier's price list as a CSV. Quotable prices materials live from UK merchant websites from your description, and also uses your own saved prices first."],
    ],
  },
  {
    slug: "powered-now",
    name: "Powered Now",
    priceLine: "Business £150 a year, Professional £250 per user a year, Premium £370 per user a year, all plus VAT",
    yearOne: "£180 for one person on Business (£150 plus VAT)",
    pricingUrl: "https://www.powerednow.com/pricing-annual",
    trial: "30-day money-back guarantee (no free trial listed)",
    strengths: [
      "Forms and certificates, CIS support and VAT returns through Making Tax Digital on higher plans",
      "Team management, staff location and scheduling on higher plans",
      "Diary with automatic reminders, purchase orders and supplier invoices",
      "Xero integration on the Professional plan",
    ],
    bestFor: "Trades who need certificates, CIS and team features, and are happy to set up their own product catalogue.",
    rows: [
      ["Price for one person, one year", "£180 (Business, incl. VAT)", "£159.99"],
      ["Quote from a plain description, typed or spoken", "Not listed on its pricing page", true],
      ["Materials priced live from UK merchant websites", "Product catalogue on Professional plan", true],
      ["Quote to invoice", true, true],
      ["Certificates and forms", "Professional plan and above", false],
      ["Team features", "Professional plan and above", false],
      ["Try before paying", "30-day money-back guarantee", OFFER.short],
    ],
    faqs: [
      ["Is Quotable cheaper than Powered Now?", "For one person paying yearly, Quotable is £159.99 and Powered Now's Business plan is £150 plus VAT (£180). Powered Now's Professional and Premium plans are priced per user."],
      ["Does Quotable do certificates like Powered Now?", "No. If you need electrical or gas certificates in the same app, Powered Now's higher plans include forms and certificates. Quotable focuses on fast, priced quotes and invoicing."],
    ],
  },
  {
    slug: "yourtradebase",
    name: "YourTradebase",
    priceLine: "£29 a month plus VAT, £15 a month for each additional user, 2 months free when paying yearly",
    yearOne: "£348 plus VAT (£417.60) for one person paying monthly",
    pricingUrl: "https://www.yourtradebase.com/pricing/",
    trial: "30-day free trial, no card needed, then a limited free account if you don't pay",
    strengths: [
      "A long-established UK product with a free plan after the trial",
      "Quote follow-ups, invoice reminders and card payments",
      "Scheduling, messaging and job sheets for teams",
      "Connects to Xero and QuickBooks, with a mobile app",
    ],
    bestFor: "Small trade firms who want an established all-rounder with reminders and team scheduling.",
    rows: [
      ["Price for one person", "£29 a month plus VAT", "£14.99 a month"],
      ["Quote from a plain description, typed or spoken", "Not listed on its pricing page", true],
      ["Materials priced live from UK merchant websites", "Not listed on its pricing page", true],
      ["Quote to invoice", true, true],
      ["Card payments", true, "Via your own payment link"],
      ["Invoice reminders", true, false],
      ["Accounting software", "Xero, QuickBooks", "Export for Xero, QuickBooks, FreeAgent"],
      ["Free trial", "30 days", OFFER.short],
    ],
    faqs: [
      ["Is Quotable cheaper than YourTradebase?", "For one person, Quotable is £14.99 a month and YourTradebase is £29 a month plus VAT (£34.80), as listed on its pricing page."],
      ["What does YourTradebase do that Quotable doesn't?", "Automatic invoice reminders, built-in card payments and team scheduling. Quotable's focus is the quote itself: it lists and prices the materials for you from a description."],
    ],
  },
];

const BY_SLUG = new Map(COMPETITORS.map((c) => [c.slug, c]));
export const COMPARE_SLUGS = COMPETITORS.map((c) => `quotable-vs-${c.slug}`);

const pagePath = (c: Competitor) => `/compare/quotable-vs-${c.slug}`;

export const compareMeta = (slug: string): PageMeta | null => {
  const c = BY_SLUG.get(slug.replace(/^quotable-vs-/, ""));
  if (!c) return null;
  const faqs = [...c.faqs, ...COMMON_FAQS(c)];
  return {
    path: pagePath(c),
    title: `Quotable vs ${c.name}: a simpler ${c.name} alternative for UK tradespeople`,
    description: `Quotable vs ${c.name} compared: price, quoting, material pricing and features, from each company's own pricing page (checked ${CHECKED}). Which suits a sole trader?`,
    jsonLd: [
      { "@type": "Article", headline: `Quotable vs ${c.name}`, dateModified: CHECKED_ISO, mainEntityOfPage: `${SITE_URL}${pagePath(c)}`, publisher: { "@id": `${SITE_URL}/#org` } },
      faqSchema(faqs),
      breadcrumbs([["Home", "/"], ["Compare", "/compare"], [`Quotable vs ${c.name}`, pagePath(c)]]),
    ],
  };
};

const COMMON_FAQS = (c: Competitor): Faq[] => [
  [`Can I switch from ${c.name} to Quotable?`, "Yes. Sign up, set your rates and add your logo, and you can quote straight away. Keep your old account until you're happy, then cancel it."],
];

const Cell = ({ v }: { v: string | boolean }) =>
  v === true ? <Check className="h-5 w-5 text-accent" aria-label="Yes" /> : v === false ? <Minus className="h-5 w-5 text-muted-foreground" aria-label="No" /> : <span>{v}</span>;

export const ComparePage = ({ slug }: { slug: string }) => {
  const c = BY_SLUG.get(slug.replace(/^quotable-vs-/, ""));
  usePageMeta(c ? compareMeta(slug) : null);
  if (!c) return <NotFound />;
  const others = COMPETITORS.filter((x) => x.slug !== c.slug);
  return (
    <Shell>
      <article className="container mx-auto max-w-4xl">
        <Crumbs items={[["Compare", "/compare"], [`Quotable vs ${c.name}`]]} />
        <h1 className="text-[clamp(2rem,4.5vw,3.1rem)] leading-[1.05] text-primary">Quotable vs {c.name}</h1>
        <p className="mt-5 text-lg leading-relaxed text-foreground/80">
          Both help UK tradespeople quote and invoice. {c.name} is a broader system with more team features. Quotable is simpler and
          cheaper, and does one thing especially well: describe a job and it lists the materials, prices them live at UK merchants and
          adds your labour.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Prices and features taken from each company's own website on {CHECKED}. They can change, so check{" "}
          <a href={c.pricingUrl} target="_blank" rel="noopener" className="underline underline-offset-2">{c.name}'s pricing page</a>.
        </p>

        <section className="mt-10 grid sm:grid-cols-2 gap-4">
          <div className="rounded-md border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{c.name}</p>
            <p className="mt-1 font-heading text-primary">{c.priceLine}</p>
            <p className="mt-2 text-sm text-muted-foreground">One person, first year: {c.yearOne}. {c.trial}.</p>
          </div>
          <div className="rounded-md border-2 border-accent bg-card p-5">
            <p className="text-sm text-muted-foreground">Quotable</p>
            <p className="mt-1 font-heading text-primary">{QUOTABLE_PRICE}</p>
            <p className="mt-2 text-sm text-muted-foreground">One person, first year: £159.99 paid yearly. {OFFER.line}</p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl sm:text-3xl text-primary">Side by side</h2>
          <div className="mt-6 overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full min-w-[32rem] text-left text-[0.95rem]">
              <thead>
                <tr className="border-b border-border text-sm text-muted-foreground">
                  <th scope="col" className="p-4 font-normal" />
                  <th scope="col" className="p-4 font-normal">{c.name}</th>
                  <th scope="col" className="p-4 font-semibold text-primary">Quotable</th>
                </tr>
              </thead>
              <tbody>
                {c.rows.map(([f, them, us]) => (
                  <tr key={f} className="border-b border-border/70 last:border-0">
                    <th scope="row" className="p-4 font-medium text-primary">{f}</th>
                    <td className="p-4 text-foreground/80"><Cell v={them} /></td>
                    <td className="p-4"><Cell v={us} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12 grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl text-primary">Where {c.name} is stronger</h2>
            <ul className="mt-3 space-y-2 list-disc pl-5 marker:text-muted-foreground leading-relaxed text-foreground/85">
              {c.strengths.map((s) => <li key={s}>{s}</li>)}
            </ul>
            <p className="mt-4 text-sm text-muted-foreground"><strong className="text-foreground">Best for:</strong> {c.bestFor}</p>
          </div>
          <div>
            <h2 className="text-xl text-primary">Where Quotable is stronger</h2>
            <ul className="mt-3 space-y-2 list-disc pl-5 marker:text-accent leading-relaxed text-foreground/85">
              <li>Describe the job, typed or spoken, and get the materials listed and priced live from UK merchants</li>
              <li>One simple price for one person, with nothing per user</li>
              <li>Quick to learn: quote from your phone in minutes, no training needed</li>
              <li>Customers accept by link and can pay a deposit through your own payment link</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground"><strong className="text-foreground">Best for:</strong> sole traders and small teams who want fast, accurate quotes without paying for a full office system.</p>
          </div>
        </section>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Button asChild variant="accent" size="lg" className="h-12 px-6"><Link to="/auth">{OFFER.button}</Link></Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-6"><Link to="/auth?demo=true">Try the sample account</Link></Button>
        </div>

        <FaqList faqs={[...c.faqs, ...COMMON_FAQS(c)]} />
        <LinkGrid title="Other comparisons" links={[
          ...others.map((o) => [`Quotable vs ${o.name}`, pagePath(o), "Price and features compared"] as [string, string, string]),
          ["Best quoting software for UK trades", "/compare/best-quoting-software-uk", "The round-up"],
        ]} />
        <LinkGrid title="More from Quotable" links={EXPLORE_LINKS} />
        <section className="mt-12 text-xs text-muted-foreground leading-relaxed">
          <p>{c.name} is a trademark of its owner. Quotable isn't affiliated with or endorsed by {c.name}. Information is from {c.name}'s public website on {CHECKED} and may have changed.</p>
        </section>
        <Cta title={`Try Quotable alongside ${c.name}`} text={`Quote a real job in both and see which you prefer. ${OFFER.line}`} />
      </article>
    </Shell>
  );
};

// ── Round-up ───────────────────────────────────────────────────────

export const roundupMeta = (): PageMeta => ({
  path: "/compare/best-quoting-software-uk",
  title: "Best quoting software for UK tradespeople (2026): prices compared",
  description: `Quoting and invoicing apps for UK trades compared on price and features: Quotable, Tradify, YourTradebase and Powered Now. Prices from each company's own site, checked ${CHECKED}.`,
  jsonLd: [
    { "@type": "ItemList", itemListElement: [["Quotable", "/"], ...COMPETITORS.map((c) => [c.name, pagePath(c)])].map(([name, p], i) => ({ "@type": "ListItem", position: i + 1, name, url: `${SITE_URL}${p}` })) },
    breadcrumbs([["Home", "/"], ["Compare", "/compare"], ["Best quoting software (UK)", "/compare/best-quoting-software-uk"]]),
  ],
});

export const compareIndexMeta = (): PageMeta => ({
  path: "/compare",
  title: "Compare quoting and invoicing apps for UK tradespeople | Quotable",
  description: "How Quotable compares with Tradify, YourTradebase and Powered Now on price, quoting and features, using each company's own published information.",
  jsonLd: [breadcrumbs([["Home", "/"], ["Compare", "/compare"]])],
});

const Roundup = () => (
  <>
    <p className="mt-5 text-lg leading-relaxed text-foreground/80">
      The right app depends on your business. Here's an honest summary of four options for UK trades, with prices from each company's
      own website on {CHECKED}. Quotable is our product, so weigh that, and check each company's site before you decide.
    </p>
    <div className="mt-10 space-y-4">
      <div className="rounded-md border-2 border-accent bg-card p-5 sm:p-6">
        <h2 className="text-xl text-primary">Quotable: best for fast, priced quotes on a budget</h2>
        <p className="mt-2 text-sm text-muted-foreground">{QUOTABLE_PRICE}</p>
        <p className="mt-3 leading-relaxed text-foreground/85">Describe the job and it lists the materials, prices them live at UK merchants and adds your labour. Simple invoicing, scheduling and accounting exports. No timesheets, certificates or team features yet.</p>
      </div>
      {COMPETITORS.map((c) => (
        <div key={c.slug} className="rounded-md border border-border bg-card p-5 sm:p-6">
          <h2 className="text-xl text-primary">{c.name}: {c.bestFor.charAt(0).toLowerCase() + c.bestFor.slice(1).replace(/\.$/, "")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{c.priceLine}. {c.trial}.</p>
          <ul className="mt-3 space-y-1 list-disc pl-5 marker:text-muted-foreground leading-relaxed text-foreground/85">
            {c.strengths.slice(0, 3).map((s) => <li key={s}>{s}</li>)}
          </ul>
          <Link to={pagePath(c)} className="mt-3 inline-block font-medium text-primary underline underline-offset-2">Quotable vs {c.name}</Link>
        </div>
      ))}
    </div>
  </>
);

export const CompareIndex = ({ roundup = false }: { roundup?: boolean }) => {
  usePageMeta(roundup ? roundupMeta() : compareIndexMeta());
  return (
    <Shell>
      <article className="container mx-auto max-w-4xl">
        <Crumbs items={roundup ? [["Compare", "/compare"], ["Best quoting software (UK)"]] : [["Home", "/"], ["Compare"]]} />
        <h1 className="text-[clamp(2rem,4.5vw,3.1rem)] leading-[1.05] text-primary">
          {roundup ? "Best quoting software for UK tradespeople (2026)" : "Compare Quotable"}
        </h1>
        {roundup ? <Roundup /> : (
          <>
            <p className="mt-5 text-lg leading-relaxed text-foreground/80">Honest comparisons with other trade apps, using each company's own published prices and features.</p>
            <LinkGrid title="Comparisons" links={[
              ["Best quoting software for UK trades", "/compare/best-quoting-software-uk", "The round-up"],
              ...COMPETITORS.map((c) => [`Quotable vs ${c.name}`, pagePath(c), c.priceLine.split(",")[0]] as [string, string, string]),
            ]} />
          </>
        )}
        <section className="mt-12 text-xs text-muted-foreground leading-relaxed">
          <p>All product names are trademarks of their owners. Quotable isn't affiliated with any company listed. Information may have changed since {CHECKED}.</p>
        </section>
        <Cta title="See for yourself" text={`Quote a real job in Quotable and compare. ${OFFER.line}`} />
      </article>
    </Shell>
  );
};
