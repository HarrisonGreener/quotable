// Shared bits for the growth pages (software pages, business guides, tools,
// invoice templates): FAQ blocks with matching structured data, link lists.
import { Link } from "react-router-dom";
import { SITE_URL } from "../content";

export type Faq = [question: string, answer: string];

export const faqSchema = (faqs: Faq[]) => ({
  "@type": "FAQPage",
  mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
});

export const softwareSchema = (name: string, description: string, path: string) => ({
  "@type": "SoftwareApplication",
  name,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS, Android",
  url: `${SITE_URL}${path}`,
  description,
  offers: [
    { "@type": "Offer", price: "14.99", priceCurrency: "GBP", name: "Monthly" },
    { "@type": "Offer", price: "159.99", priceCurrency: "GBP", name: "Yearly" },
  ],
  publisher: { "@id": `${SITE_URL}/#org` },
});

export const FaqList = ({ faqs, title = "Questions people ask" }: { faqs: Faq[]; title?: string }) => (
  <section className="mt-16">
    <h2 className="text-2xl sm:text-3xl text-primary">{title}</h2>
    <div className="mt-6 divide-y divide-border rounded-md border border-border bg-card">
      {faqs.map(([q, a]) => (
        <details key={q} className="group p-5 sm:p-6">
          <summary className="cursor-pointer list-none font-heading text-lg text-primary flex justify-between gap-4">
            {q}
            <span aria-hidden className="text-accent transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 leading-relaxed text-foreground/80">{a}</p>
        </details>
      ))}
    </div>
  </section>
);

export const LinkGrid = ({ title, links }: { title: string; links: [label: string, to: string, note?: string][] }) => (
  <section className="mt-14">
    <h2 className="text-xl sm:text-2xl text-primary">{title}</h2>
    <ul className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {links.map(([label, to, note]) => (
        <li key={to}>
          <Link to={to} className="block h-full rounded-md border border-border bg-card p-4 hover:border-primary transition-colors">
            <span className="font-medium text-primary">{label}</span>
            {note && <span className="mt-1 block text-sm text-muted-foreground">{note}</span>}
          </Link>
        </li>
      ))}
    </ul>
  </section>
);

/** The main site sections every growth page links to (helps Google find everything). */
export const EXPLORE_LINKS: [string, string, string][] = [
  ["Quoting software", "/quoting-software", "Priced quotes in minutes"],
  ["Invoicing app", "/invoicing-software", "Invoices, VAT and who owes you"],
  ["Free invoice generator", "/tools/invoice-generator", "Make a PDF invoice, no sign-up"],
  ["Free quote generator", "/tools/quote-generator", "Make a PDF quote, no sign-up"],
  ["Materials calculators", "/tools", "Paint, plaster, tiles, concrete"],
  ["Pricing guides", "/guides", "How to price common jobs"],
  ["Trade price lists", "/price-lists", "Common jobs with 2026 prices"],
];
