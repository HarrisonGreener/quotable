// Software landing pages for the big commercial searches: "quoting software for
// tradesmen", "invoice app for tradesmen", "job management app", "estimating software".
// Each page has its own angle, real feature detail, a comparison and FAQs.
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/NotFound";
import { OFFER } from "@/config/offer";
import { Shell, Crumbs, Cta } from "../layout";
import { breadcrumbs, ORG, usePageMeta, type PageMeta } from "../meta";
import { EXPLORE_LINKS, FaqList, LinkGrid, faqSchema, softwareSchema, type Faq } from "./shared";

interface SoftwarePage {
  path: string;
  crumb: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  points: [string, string][];
  steps: [string, string][];
  compareTitle: string;
  compare: [row: string, oldWay: string, quotable: string][];
  oldWayLabel: string;
  faqs: Faq[];
  related: [string, string, string][];
}

const PAGES: SoftwarePage[] = [
  {
    path: "/quoting-software",
    crumb: "Quoting software",
    title: "Quoting software for UK tradespeople, with live material prices | Quotable",
    description:
      "Quoting software for UK trades: describe the job, get materials priced live at Toolstation, Wickes and Travis Perkins, labour at your rate, and a quote your customer accepts online.",
    h1: "Quoting software for tradespeople that prices the materials for you",
    lead:
      "Describe the job in your own words, typed or spoken. Quotable lists the materials and quantities, finds today's price for each one at UK merchants, works out your labour, and gives you a professional quote to send from the van.",
    points: [
      ["Materials priced live", "Each line is priced from UK merchants' own product pages, mainly Toolstation, Wickes and Travis Perkins, and links to its source so you can check it."],
      ["Your rates, not ours", "Labour is worked out from your own hourly or day rate. Your own stock prices are always used first."],
      ["Speak the job", "Tap the microphone and describe the work like you would to a mate. Sizes, finishes and access all help."],
      ["Sent in a tap", "Send a link by WhatsApp or email. Your customer opens it on their phone, sees your branding, and accepts with one tap."],
      ["Deposits", "Add your own card payment link and bank details, and customers can pay a deposit straight from the quote."],
      ["Quote to invoice", "When the job's done, turn the accepted quote into an invoice in one click. No retyping."],
    ],
    steps: [
      ["Describe the job", "\"Re-skim the bedroom walls, about 3m by 3m, walls sound.\" Type it or say it."],
      ["Check the quote", "Materials, quantities, prices and labour appear in seconds. Change anything you like."],
      ["Send and get accepted", "Send the link. You can see when it's opened and when it's accepted."],
    ],
    compareTitle: "Quotable vs quoting in Word, Excel or on paper",
    oldWayLabel: "Word, Excel or paper",
    compare: [
      ["Material prices", "Look each one up yourself", "Priced live from UK merchants"],
      ["Time per quote", "Often an evening's work", "A few minutes"],
      ["From the van", "Wait till you're home", "On your phone, anywhere"],
      ["Customer acceptance", "Chase a reply by text", "One-tap accept, and you see when it's opened"],
      ["Turning it into an invoice", "Type it all out again", "One click"],
    ],
    faqs: [
      ["What is quoting software for tradesmen?", "It's an app that helps you put together a priced quote for a job and send it to the customer. Quotable goes further than a template: it lists the materials for you, prices them from UK merchants, and works out labour from your rate."],
      ["Are the material prices accurate?", "They're read from merchants' public product pages, so they reflect the listed price at the time. Trade-account, in-store and delivery prices can differ, which is why every line links to its source and anything Quotable couldn't match is marked for you to check."],
      ["Can I use my own prices?", "Yes. Add the items you buy regularly to your Inventory with your own prices, and Quotable uses them first whenever they match."],
      ["Does it work for my trade?", "It works for any job priced by materials and time: electricians, plumbers, plasterers, decorators, carpenters, tilers, builders, landscapers and more. See the page for your trade."],
      ["Do I need to download an app?", "No app store needed. Quotable runs in your phone's browser, and you can add it to your home screen so it opens full screen like any other app."],
      ["How much is it?", `£14.99 a month or £159.99 a year. ${OFFER.line}`],
    ],
    related: [
      ["Quote templates", "/quote-templates", "Free printable quote examples by trade"],
      ["How to write a quote", "/guides/how-to-write-a-quote", "What to include, with an example"],
      ["Quote vs estimate", "/guides/quote-vs-estimate", "The difference, and which to use"],
    ],
  },
  {
    path: "/invoicing-software",
    crumb: "Invoicing app",
    title: "Invoicing app for UK tradespeople: quotes to invoices in one click | Quotable",
    description:
      "An invoicing app built for UK trades: turn accepted quotes into invoices in one click, add VAT, take payment by link, see who owes you, and export to Xero, QuickBooks or FreeAgent.",
    h1: "An invoicing app for tradespeople that does the paperwork for you",
    lead:
      "Most trades invoicing apps start with a blank invoice. Quotable starts with the quote you already sent, so when the job's done the invoice is one click away, with your branding, VAT and payment details on it.",
    points: [
      ["One click from the quote", "Accepted quotes become invoices with every line carried across. No retyping, no mistakes."],
      ["Get paid from the link", "Send the invoice by WhatsApp or email. Customers open it on their phone and pay through your own card payment link or bank details."],
      ["See who owes you", "Mark invoices paid as the money arrives. Overdue invoices are highlighted so nothing slips through."],
      ["VAT handled", "If you're VAT-registered, set your rate once and VAT is added to every quote and invoice."],
      ["Accountant-ready", "Export invoices in the format Xero, QuickBooks and FreeAgent expect, and run reports on revenue and tax collected."],
      ["Your brand", "Your logo, colours and business details on every invoice PDF, from a choice of templates you can design."],
    ],
    steps: [
      ["Finish the job", "Open the accepted quote and tap Convert to Invoice."],
      ["Send it", "Share the invoice link by WhatsApp or email, or download the PDF."],
      ["Mark it paid", "When the money lands, mark it paid. Overdue ones stand out."],
    ],
    compareTitle: "Quotable vs invoicing in Word, Excel or a generic app",
    oldWayLabel: "Word, Excel or a generic app",
    compare: [
      ["Creating the invoice", "Type it out from scratch", "One click from the accepted quote"],
      ["Getting paid", "Send bank details separately", "Payment link and bank details on the invoice"],
      ["Chasing", "Remember who hasn't paid", "Overdue invoices highlighted"],
      ["For your accountant", "Retype into their software", "Export for Xero, QuickBooks or FreeAgent"],
      ["Built for trades", "Generic line items", "Materials and labour from the job"],
    ],
    faqs: [
      ["What does an invoice need to include in the UK?", "A unique invoice number, your business name and contact details, the customer's name and address, a clear description of the work, the date of the work and the invoice date, the amounts charged, any VAT, and the total. Our guide to what an invoice must include covers sole traders, limited companies and VAT invoices."],
      ["Can customers pay straight from the invoice?", "Yes. Add your own card payment link (for example from Stripe, SumUp or PayPal) and your bank details in Account, and they appear on every invoice link."],
      ["Does it work with my accountant's software?", "Invoices export in the format Xero, QuickBooks and FreeAgent expect, and Tax & Reports gives you revenue, tax collected and outstanding invoices to hand over."],
      ["I'm not VAT-registered. Is that a problem?", "Not at all. Leave VAT off and your quotes and invoices won't show it. Turn it on if you register later."],
      ["Is there a free option?", `Try our free invoice generator to make a one-off PDF invoice with no sign-up. The full app is £14.99 a month: ${OFFER.short}.`],
    ],
    related: [
      ["Free invoice generator", "/tools/invoice-generator", "Make a PDF invoice now, no sign-up"],
      ["What an invoice must include", "/guides/what-to-put-on-an-invoice", "UK rules for trades"],
      ["Chasing unpaid invoices", "/guides/how-to-chase-unpaid-invoices", "Late payment interest and what to say"],
    ],
  },
  {
    path: "/job-management-software",
    crumb: "Job management",
    title: "Job management app for UK tradespeople: quotes, jobs and invoices in one place | Quotable",
    description:
      "Simple job management for UK trades: quotes, a job calendar, customers and invoices in one app on your phone. Built for sole traders and small firms, from £14.99 a month.",
    h1: "Simple job management for tradespeople, from quote to paid",
    lead:
      "Big job management systems are built for firms with an office. Quotable is built for the person doing the work: quote the job, book it in, invoice it and see who's paid, all from your phone.",
    points: [
      ["Quotes", "AI quotes with materials priced live at UK merchants and labour at your rate."],
      ["Job calendar", "Put accepted quotes on the calendar and see quotes, booked, completed, overdue and paid jobs at a glance."],
      ["Customers", "Keep names, addresses and contact details in one place and reuse them on every quote."],
      ["Invoices", "Invoice from the quote in one click and see who owes you."],
      ["Reports", "Revenue, tax collected and outstanding invoices, ready for your accountant."],
      ["On your phone", "Add it to your home screen and use it like an app, on site or in the van."],
    ],
    steps: [
      ["Quote it", "Describe the job and send a priced quote."],
      ["Book it", "Once it's accepted, drop it on the calendar."],
      ["Invoice it", "When it's done, invoice it and mark it paid."],
    ],
    compareTitle: "Quotable vs big job management systems",
    oldWayLabel: "Big job management systems",
    compare: [
      ["Built for", "Firms with an office and staff", "Sole traders and small teams"],
      ["Set-up", "Onboarding calls and training", "Sign up and quote in minutes"],
      ["Material pricing", "Usually your own price lists", "Live UK merchant prices, plus your own"],
      ["Price", "Often per user, per month, on contract", "£14.99 a month, cancel in two taps"],
    ],
    faqs: [
      ["What is job management software for tradesmen?", "It keeps the whole job in one place: the quote, the booking, the customer's details and the invoice. Quotable does that without the complexity of systems built for large firms."],
      ["Is it suitable for a one-person business?", "Yes, that's who it's built for. Everything works from your phone, and there's nothing to set up beyond your rates and business details."],
      ["Can I see my jobs on a calendar?", "Yes. Accepted quotes go on the Scheduling calendar, colour-coded by status, and you can move them around on a computer."],
      ["Can I cancel any time?", "Yes. Cancel in the app in two taps and you keep access until the end of the period you've paid for."],
    ],
    related: [
      ["Quoting software", "/quoting-software", "Priced quotes in minutes"],
      ["Invoicing app", "/invoicing-software", "Invoices, VAT and who owes you"],
      ["Get the app", "/app", "Put Quotable on your home screen"],
    ],
  },
  {
    path: "/estimating-software",
    crumb: "Estimating software",
    title: "Estimating software for builders and trades (UK) | Quotable",
    description:
      "Estimating software for UK builders and tradespeople: describe the job, get materials, quantities and labour worked out, priced live at UK merchants, then send it as a quote.",
    h1: "Estimating software for builders and trades that does the take-off for you",
    lead:
      "Estimating usually means working out quantities, looking up prices and adding labour line by line. Quotable does the first draft for you from a plain description, priced from UK merchants, so you spend your time checking rather than typing.",
    points: [
      ["Quantities worked out", "From your description and measurements, Quotable lists the materials and how much of each you'll need."],
      ["Priced live", "Each material is priced from UK merchant product pages, with the source linked."],
      ["Labour from your rates", "Labour time is estimated and charged at your hourly or day rate."],
      ["Everything editable", "Change any quantity, price or line. It's your estimate."],
      ["Assumptions shown", "Quotable lists what it assumed and anything it couldn't price, so you know what to check."],
      ["Estimate to quote", "Send the finished estimate to your customer as a branded quote they can accept online."],
    ],
    steps: [
      ["Give the details", "Describe the job with sizes, what's there now and the finish wanted."],
      ["Review the estimate", "Check quantities, prices, labour and assumptions. Adjust anything."],
      ["Send it", "Send it as a quote, or keep it as your working estimate."],
    ],
    compareTitle: "Quotable vs a spreadsheet estimate",
    oldWayLabel: "A spreadsheet",
    compare: [
      ["Quantities", "Work them out by hand", "Worked out from your description"],
      ["Prices", "Look up each item", "Priced live from UK merchants"],
      ["Labour", "Guess, then type it in", "Estimated at your rate"],
      ["Sending it", "Copy it into a quote", "Send as a branded quote"],
    ],
    faqs: [
      ["How accurate are the estimates?", "They're a strong first draft, not a final answer. Quantities come from your description, so the more detail you give (sizes, condition, finish, access) the better. Always check the lines before you send."],
      ["Is it suitable for large building projects?", "It's best for the jobs small builders and trades price every week: extensions, refurbishments, bathrooms, kitchens, rewires and repairs. For very large commercial tenders you'll still want a full QS take-off."],
      ["What's the difference between an estimate and a quote?", "An estimate is an approximate price; a quote is a fixed price for the work described. Our guide explains when to use each."],
    ],
    related: [
      ["Quote vs estimate", "/guides/quote-vs-estimate", "Which to give, and why it matters"],
      ["Materials calculators", "/tools", "Paint, plaster, tiles and concrete"],
      ["Day rates by trade", "/day-rates", "What trades charge per day in the UK"],
    ],
  },
];

const BY_PATH = new Map(PAGES.map((p) => [p.path, p]));
export const SOFTWARE_PATHS = PAGES.map((p) => p.path);

export const softwareMeta = (path: string): PageMeta | null => {
  const p = BY_PATH.get(path);
  if (!p) return null;
  return {
    path: p.path,
    title: p.title,
    description: p.description,
    jsonLd: [ORG, softwareSchema("Quotable", p.description, p.path), faqSchema(p.faqs), breadcrumbs([["Home", "/"], [p.crumb, p.path]])],
  };
};

export const SoftwarePage = ({ path }: { path: string }) => {
  const p = BY_PATH.get(path);
  usePageMeta(p ? softwareMeta(path) : null);
  if (!p) return <NotFound />;
  return (
    <Shell>
      <article className="container mx-auto max-w-5xl">
        <Crumbs items={[["Home", "/"], [p.crumb]]} />
        <h1 className="text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.05] text-primary max-w-4xl">{p.h1}</h1>
        <p className="mt-5 text-lg leading-relaxed text-foreground/80 max-w-3xl">{p.lead}</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild variant="accent" size="lg" className="h-12 px-6"><Link to="/auth">{OFFER.button}</Link></Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-6"><Link to="/auth?demo=true">Try the sample account</Link></Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{OFFER.line}</p>

        <section className="mt-16">
          <h2 className="text-2xl sm:text-3xl text-primary">What you get</h2>
          <ul className="mt-6 grid sm:grid-cols-2 gap-x-10 gap-y-6">
            {p.points.map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-accent" aria-hidden />
                <div>
                  <h3 className="font-heading text-lg text-primary">{t}</h3>
                  <p className="mt-1 leading-relaxed text-foreground/80">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl sm:text-3xl text-primary">How it works</h2>
          <ol className="mt-6 grid md:grid-cols-3 gap-4">
            {p.steps.map(([t, d], i) => (
              <li key={t} className="rounded-md border border-border bg-card p-5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{i + 1}</span>
                <h3 className="mt-3 font-heading text-lg text-primary">{t}</h3>
                <p className="mt-1 leading-relaxed text-foreground/80">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl sm:text-3xl text-primary">{p.compareTitle}</h2>
          <div className="mt-6 overflow-x-auto rounded-md border border-border bg-card">
            <table className="w-full min-w-[34rem] text-left text-[0.95rem]">
              <thead>
                <tr className="border-b border-border text-sm text-muted-foreground">
                  <th scope="col" className="p-4 font-normal" />
                  <th scope="col" className="p-4 font-normal">{p.oldWayLabel}</th>
                  <th scope="col" className="p-4 font-semibold text-primary">Quotable</th>
                </tr>
              </thead>
              <tbody>
                {p.compare.map(([row, a, b]) => (
                  <tr key={row} className="border-b border-border/70 last:border-0">
                    <th scope="row" className="p-4 font-medium text-primary">{row}</th>
                    <td className="p-4 text-foreground/75">{a}</td>
                    <td className="p-4">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <FaqList faqs={p.faqs} />
        <LinkGrid title="Useful next" links={p.related} />
        <LinkGrid title="More from Quotable" links={EXPLORE_LINKS.filter(([, to]) => to !== p.path)} />
        <Cta title="Try it on your next job" text={`Describe a real job and see the quote it gives you. ${OFFER.line}`} />
      </article>
    </Shell>
  );
};
