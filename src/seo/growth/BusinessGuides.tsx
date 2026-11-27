// Business guides for trades: quotes, invoices, VAT and late payment. Facts checked
// against gov.uk (November 2026); sources are linked on each page.
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { OFFER } from "@/config/offer";
import { Shell, Crumbs, Cta } from "../layout";
import { breadcrumbs, type PageMeta } from "../meta";
import { SITE_URL } from "../content";
import { EXPLORE_LINKS, FaqList, LinkGrid, faqSchema, type Faq } from "./shared";

const UPDATED = "27 November 2026";
const UPDATED_ISO = "2026-11-27";

import { P, UL, A, type BusinessGuide } from "./guideBits";
import { MORE_BUSINESS_GUIDES } from "./MoreGuides";

export const BUSINESS_GUIDES: BusinessGuide[] = [
  {
    slug: "how-to-write-a-quote",
    h1: "How to write a quote as a tradesperson (UK)",
    title: "How to write a quote for a job: what to include, with an example (UK trades)",
    description: "What to put on a trade quote so customers say yes and there are no arguments later: scope, materials, labour, VAT, validity, payment terms and an example.",
    intro: "A good quote wins the job and protects you if the customer later says \"I thought that was included\". Here's what to put on one, in the order customers read it.",
    sections: [
      { h: "1. Your details and theirs", body: <>
        <P>Your business name, contact details and, if you're a limited company, the full company name. Then the customer's name and the job address. Give the quote a number and date so you can both refer to it.</P>
      </> },
      { h: "2. A clear description of the work", body: <>
        <P>This is the part that prevents disputes. Say exactly what you will do, where, and to what finish. "Re-skim three walls of the back bedroom (approx 3m x 3m), make good around sockets, ready for decoration" is far better than "plaster bedroom".</P>
        <P>Just as important: say what's <strong>not</strong> included. Moving furniture, decorating afterwards, skip hire, making good other trades' work.</P>
      </> },
      { h: "3. Materials and labour", body: <>
        <P>You can show one fixed price or break it down. A breakdown of materials and labour builds trust and makes changes easier to price. If you're unsure of material prices, check them on the day: our <A to="/guides">pricing guides</A> show typical quantities and current UK prices for common jobs.</P>
      </> },
      { h: "4. VAT", body: <>
        <P>If you're VAT-registered, show prices with VAT clearly (for most building work that's 20%). If you're not registered, don't add VAT. Customers comparing quotes will notice the difference, so be clear which you're showing. See <A to="/guides/vat-for-tradespeople">VAT for tradespeople</A>.</P>
      </> },
      { h: "5. How long the price stands", body: <>
        <P>Material prices move, so give the quote a validity period, commonly 30 days. After that you can re-price.</P>
      </> },
      { h: "6. Payment terms", body: <>
        <P>Say when you expect to be paid: any deposit, stage payments for longer jobs, and the balance on completion or within a set number of days. Put your bank details or payment link on it so paying is easy.</P>
      </> },
      { h: "7. How to accept", body: <>
        <P>Make saying yes easy: a signature, a reply, or a one-tap accept link. Keep a record of the accepted version; it's your agreement if anything's disputed.</P>
      </> },
    ],
    faqs: [
      ["Is a quote legally binding?", "A quote is an offer. Once the customer accepts it, it generally becomes the agreed price for the work described, which is why a clear description matters. If the customer asks for extra work, quote for the change before you do it."],
      ["Should I charge for quotes?", "Most trades quote for free for ordinary jobs. Some charge for very detailed surveys or designs and deduct it from the job if it goes ahead. Whatever you do, say so up front."],
      ["How long should a quote be valid for?", "30 days is common. Materials can change price quickly, so a shorter period is reasonable for material-heavy jobs."],
    ],
    sources: [],
    related: [
      ["Quote vs estimate", "/guides/quote-vs-estimate", "Which one to give"],
      ["Quote templates", "/quote-templates", "Free examples for your trade"],
      ["Free quote generator", "/tools/quote-generator", "Make a PDF quote now"],
    ],
  },
  {
    slug: "quote-vs-estimate",
    h1: "Quote vs estimate: what's the difference for trades?",
    title: "Quote vs estimate: the difference, and which to give (UK trades)",
    description: "A quote is a fixed price; an estimate is a best guess. When tradespeople should give each, how to word them, and how to avoid disputes when the price changes.",
    intro: "Customers often use the words interchangeably, but they mean different things, and mixing them up is a common cause of arguments at the end of a job.",
    sections: [
      { h: "A quote is a fixed price", body: <>
        <P>A quote says: for this described work, the price is this. Once the customer accepts it, that's generally the price, even if the job takes you longer than you thought. Use a quote when you can see the full scope: a consumer unit change, re-skimming a room, fitting a new bathroom suite.</P>
      </> },
      { h: "An estimate is an educated guess", body: <>
        <P>An estimate says: we think it'll cost about this, but it may change. Use one when you genuinely can't know the full scope until you start: chasing a leak, repairs behind tiles, old properties with surprises.</P>
        <P>Make it clear it's an estimate, explain what could change the price, and agree how you'll handle it (for example, you'll stop and agree the price before doing extra work).</P>
      </> },
      { h: "Which should you give?", body: <>
        <UL items={[
          "Clear scope, standard job: give a quote. Customers prefer certainty and it wins more work.",
          "Unknowns you can't check yet: give an estimate, or a quote with clearly stated exclusions.",
          "Mixed jobs: quote the known part, and give a rate (per hour or per item) for anything found once you open up.",
        ]} />
      </> },
      { h: "Avoiding disputes", body: <>
        <P>Whatever you give, write down what's included and what isn't, and quote any extra work before you do it. A written description of the scope is the single best protection you have.</P>
      </> },
    ],
    faqs: [
      ["Can I charge more than my quote?", "Only if the work changed: the customer asked for more, or there's something your quote clearly excluded. Agree the extra cost before doing the work, ideally in writing."],
      ["Can an estimate go up?", "Yes, that's the nature of an estimate, but it should stay reasonably close to your figure. Tell the customer as soon as you know it will go over."],
      ["Does Quotable do quotes or estimates?", "Both. It drafts a priced breakdown from your description; you decide whether to send it as a fixed quote or an estimate, and you can add exclusions and assumptions."],
    ],
    sources: [],
    related: [
      ["How to write a quote", "/guides/how-to-write-a-quote", "What to include"],
      ["Estimating software", "/estimating-software", "Let Quotable do the take-off"],
      ["Pricing guides", "/guides", "Typical materials and labour for common jobs"],
    ],
  },
  {
    slug: "what-to-put-on-an-invoice",
    h1: "What to put on an invoice: UK rules for tradespeople",
    title: "What must an invoice include? UK rules for sole traders, companies and VAT (2026)",
    description: "Exactly what a UK invoice must show, for sole traders, limited companies and VAT-registered trades, plus payment terms and a checklist. Checked against gov.uk.",
    intro: "Getting invoices right means you get paid faster and stay on the right side of HMRC. Here's what gov.uk says every invoice needs, and the extras for VAT invoices.",
    sections: [
      { h: "Every invoice must include", body: <>
        <UL items={[
          "A unique invoice number",
          "Your business name, address and contact details",
          "The customer's name and address",
          "A clear description of what you're charging for",
          "The date the work was done (the supply date)",
          "The invoice date",
          "The amounts charged, any VAT, and the total owed",
        ]} />
      </> },
      { h: "Sole traders also need", body: <>
        <UL items={[
          "Your own name, plus any business name you trade under",
          "If you use a business name, an address where legal documents can be delivered to you",
        ]} />
      </> },
      { h: "Limited companies also need", body: <>
        <UL items={[
          "The full company name, as on your certificate of incorporation",
          "If you show any directors' names, you must show all of them",
        ]} />
      </> },
      { h: "VAT invoices", body: <>
        <P>If you and your customer are both VAT-registered, you must give a VAT invoice. On top of the basics it shows your VAT registration number, the time of supply, the quantity or extent of the work, the unit price, the VAT rate and the amount excluding VAT for each line, and the total VAT.</P>
        <P>Construction trades should also know about the <strong>domestic reverse charge</strong>: for many building services supplied between VAT-registered businesses under the Construction Industry Scheme, the customer accounts for the VAT instead of you, and the invoice must say so. Check HMRC's guidance if you subcontract.</P>
      </> },
      { h: "Payment terms that get you paid", body: <>
        <P>Put your payment terms on the invoice, for example "payment due within 14 days", along with your bank details or a payment link. For business customers, if no date is agreed, payment is late 30 days after they receive the invoice or the work is done, whichever is later. See <A to="/guides/how-to-chase-unpaid-invoices">chasing unpaid invoices</A>.</P>
      </> },
    ],
    faqs: [
      ["Do I need to number my invoices?", "Yes. Every invoice needs a unique number. A simple sequence (INV-001, INV-002) is fine, and VAT invoices must come from a sequential series."],
      ["Can I send an invoice by WhatsApp or email?", "Yes. There's no rule that invoices must be posted. What matters is that it contains the right information and you keep a copy."],
      ["How long must I keep invoices?", "Keep business records for at least 5 years after the 31 January submission deadline of the tax year they relate to if you're self-employed, or 6 years from the end of the financial year for a limited company."],
    ],
    sources: [
      ["Invoices: what they must include (gov.uk)", "https://www.gov.uk/invoicing-and-taking-payment-from-customers/invoices-what-they-must-include"],
      ["Details which must be shown on a full VAT invoice (HMRC)", "https://www.gov.uk/hmrc-internal-manuals/vat-trader-records/vatrec5010"],
      ["VAT domestic reverse charge for building and construction services (gov.uk)", "https://www.gov.uk/guidance/vat-domestic-reverse-charge-for-building-and-construction-services"],
    ],
    related: [
      ["Free invoice generator", "/tools/invoice-generator", "Make a PDF invoice now"],
      ["Invoice templates", "/invoice-templates", "Examples for your trade"],
      ["Invoicing app", "/invoicing-software", "Invoices from quotes in one click"],
    ],
  },
  {
    slug: "vat-for-tradespeople",
    h1: "VAT for tradespeople: when to register and how to charge it",
    title: "VAT for tradespeople (UK, 2026): the £90,000 threshold, rates and quoting",
    description: "When UK tradespeople must register for VAT (the £90,000 threshold), how it's measured, how to show VAT on quotes and invoices, and the construction reverse charge.",
    intro: "VAT catches a lot of trades out, usually because turnover creeps over the threshold without anyone noticing. Here's what you need to know, checked against gov.uk.",
    sections: [
      { h: "When you must register", body: <>
        <P>You must register for VAT if your VAT-taxable turnover goes over <strong>£90,000</strong> in any rolling 12-month period, not just the tax year. Check it every month. You must also register if you expect to go over £90,000 in the next 30 days alone.</P>
        <P>Once you go over, you have 30 days from the end of that month to register. Below the threshold you can choose to register voluntarily.</P>
      </> },
      { h: "What turnover counts", body: <>
        <P>It's your total sales of VAT-taxable goods and services, including materials you charge customers for, not your profit. A busy year with lots of materials can push you over sooner than you'd think.</P>
      </> },
      { h: "Showing VAT on quotes", body: <>
        <UL items={[
          "If you're registered, add VAT (20% for most building work) and show it clearly as a separate line.",
          "Tell domestic customers whether a price includes VAT. A quote that looks cheaper because VAT isn't shown causes problems later.",
          "If you're not registered, don't charge VAT or mention a VAT number.",
        ]} />
      </> },
      { h: "Reduced and zero rates", body: <>
        <P>Some work qualifies for lower rates, for example certain energy-saving installations, some work on new-build homes, and some conversions. The rules are detailed, so check HMRC's guidance for the specific job before quoting a lower rate.</P>
      </> },
      { h: "The construction reverse charge", body: <>
        <P>If you're a VAT-registered subcontractor working for a VAT-registered contractor under the Construction Industry Scheme, the domestic reverse charge usually applies: you don't charge VAT, the contractor accounts for it, and your invoice must say the reverse charge applies. It doesn't apply to work for homeowners (end users).</P>
      </> },
    ],
    faqs: [
      ["What is the VAT threshold in 2026?", "£90,000 of VAT-taxable turnover in any rolling 12 months."],
      ["Should I register voluntarily?", "It can make sense if most of your customers are VAT-registered businesses (they reclaim it) or you buy a lot of materials. For mostly domestic customers it usually makes you look 20% dearer. Speak to an accountant."],
      ["Does Quotable handle VAT?", "Yes. Set your VAT rate once in Settings and it's added to every quote and invoice, and Tax & Reports shows the VAT you've collected."],
    ],
    sources: [
      ["How and when to register for VAT (gov.uk)", "https://www.gov.uk/vat-registration/when-to-register"],
      ["VAT domestic reverse charge for building and construction services (gov.uk)", "https://www.gov.uk/guidance/vat-domestic-reverse-charge-for-building-and-construction-services"],
      ["VAT rates on different goods and services (gov.uk)", "https://www.gov.uk/guidance/rates-of-vat-on-different-goods-and-services"],
    ],
    related: [
      ["VAT calculator", "/tools/vat-calculator", "Add or remove 20% VAT"],
      ["What to put on an invoice", "/guides/what-to-put-on-an-invoice", "Including VAT invoices"],
      ["Invoicing app", "/invoicing-software", "VAT on every invoice, automatically"],
    ],
  },
  {
    slug: "how-to-chase-unpaid-invoices",
    h1: "How to chase unpaid invoices (and what you can charge)",
    title: "How to chase an unpaid invoice: late payment interest and what to say (UK trades)",
    description: "A step-by-step way for UK tradespeople to chase late payment, with message wording, statutory interest (8% plus base rate) and fixed compensation of £40 to £100 for business customers.",
    intro: "Late payment is one of the biggest problems for small trades. Most late payers aren't refusing, they've just let it slide. A calm, steady process gets you paid without falling out.",
    sections: [
      { h: "Before the job: make it easy to pay on time", body: <>
        <UL items={[
          "Agree payment terms in your quote, and take a deposit on bigger jobs.",
          "Invoice the day you finish, while the job's fresh.",
          "Put bank details or a payment link on the invoice itself.",
        ]} />
      </> },
      { h: "A simple chasing timeline", body: <>
        <UL items={[
          <><strong>Due date:</strong> a friendly nudge. "Hi Sarah, just a reminder that invoice 104 for the bathroom is due today. Here's the link to pay. Thanks!"</>,
          <><strong>7 days late:</strong> a clear reminder with the amount and the invoice attached again.</>,
          <><strong>14 days late:</strong> a phone call. Ask when they'll pay and agree a date.</>,
          <><strong>30 days late:</strong> a formal letter before action, giving a final date before you take further steps.</>,
        ]} />
      </> },
      { h: "Business customers: interest and compensation", body: <>
        <P>If your customer is a business, the late payment law lets you claim statutory interest of <strong>8% plus the Bank of England base rate</strong> on the overdue amount, unless your contract says otherwise. You can also claim a fixed sum for the cost of recovering the debt:</P>
        <UL items={["Under £1,000: £40", "£1,000 to £9,999.99: £70", "£10,000 or more: £100"]} />
        <P>If you didn't agree a payment date, payment is late 30 days after the customer received the invoice or you finished the work, whichever is later. To claim interest, send a new invoice showing it.</P>
      </> },
      { h: "Homeowners", body: <>
        <P>The statutory interest rules are for business-to-business debts. For homeowners, rely on the payment terms you agreed in your quote. If you included a late payment charge in your terms, you can apply it; if not, keep chasing politely and firmly. If all else fails, in England and Wales the small claims track handles claims up to £10,000 and you can start one online.</P>
      </> },
    ],
    faqs: [
      ["Can I charge interest on a late invoice?", "For business customers, yes: statutory interest of 8% plus the Bank of England base rate, plus a fixed £40 to £100 recovery charge, unless your contract sets different terms. For homeowners, only if your agreed terms say so."],
      ["When is an invoice officially late?", "On the date you agreed. If you didn't agree one with a business customer, 30 days after they received the invoice or the work was done, whichever is later."],
      ["How do I stop it happening again?", "Take deposits, invoice the same day, include a payment link, and keep a record of every quote acceptance. Quotable highlights overdue invoices so you can chase them on time."],
    ],
    sources: [
      ["Late commercial payments: charging interest and debt recovery (gov.uk)", "https://www.gov.uk/late-commercial-payments-interest-debt-recovery"],
      ["Claim debt recovery costs on late payments (gov.uk)", "https://www.gov.uk/late-commercial-payments-interest-debt-recovery/claim-debt-recovery-costs"],
      ["Make a court claim for money (gov.uk)", "https://www.gov.uk/make-court-claim-for-money"],
    ],
    related: [
      ["Invoicing app", "/invoicing-software", "See who owes you at a glance"],
      ["What to put on an invoice", "/guides/what-to-put-on-an-invoice", "Get the basics right"],
      ["Free invoice generator", "/tools/invoice-generator", "Make a PDF invoice now"],
    ],
  },
];

BUSINESS_GUIDES.push(...MORE_BUSINESS_GUIDES);

export const BUSINESS_GUIDE_BY_SLUG = new Map(BUSINESS_GUIDES.map((g) => [g.slug, g]));

export const businessGuideMeta = (slug: string): PageMeta | null => {
  const g = BUSINESS_GUIDE_BY_SLUG.get(slug);
  if (!g) return null;
  return {
    path: `/guides/${g.slug}`,
    title: g.title,
    description: g.description,
    jsonLd: [
      {
        "@type": "Article",
        headline: g.h1,
        description: g.description,
        dateModified: UPDATED_ISO,
        author: { "@id": `${SITE_URL}/#org` },
        publisher: { "@id": `${SITE_URL}/#org` },
        mainEntityOfPage: `${SITE_URL}/guides/${g.slug}`,
      },
      faqSchema(g.faqs),
      breadcrumbs([["Home", "/"], ["Guides", "/guides"], [g.h1, `/guides/${g.slug}`]]),
    ],
  };
};

export const BusinessGuidePage = ({ slug }: { slug: string }) => {
  const g = BUSINESS_GUIDE_BY_SLUG.get(slug)!;
  return (
    <Shell>
      <article className="container mx-auto max-w-3xl">
        <Crumbs items={[["Guides", "/guides"], [g.h1]]} />
        <h1 className="text-[clamp(2rem,4.5vw,3rem)] leading-[1.05] text-primary">{g.h1}</h1>
        <p className="mt-5 text-lg leading-relaxed text-foreground/80">{g.intro}</p>
        <p className="mt-3 text-sm text-muted-foreground">For UK tradespeople. Updated {UPDATED}. General information, not legal or tax advice.</p>
        {g.sections.map((s) => (
          <section key={s.h} className="mt-10">
            <h2 className="text-2xl text-primary">{s.h}</h2>
            {s.body}
          </section>
        ))}
        <FaqList faqs={g.faqs} />
        {g.sources.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg text-primary">Sources</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {g.sources.map(([label, href]) => (
                <li key={href}><a href={href} rel="noopener" target="_blank" className="text-primary underline underline-offset-2">{label}</a></li>
              ))}
            </ul>
          </section>
        )}
        <LinkGrid title="Useful next" links={g.related} />
        <LinkGrid title="More from Quotable" links={EXPLORE_LINKS} />
        <Cta title="Quotes and invoices, done for you" text={`Quotable writes the quote, prices the materials and turns it into an invoice in one click. ${OFFER.line}`} />
      </article>
    </Shell>
  );
};
