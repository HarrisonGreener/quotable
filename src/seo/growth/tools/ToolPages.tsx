// Free tools section: /tools and /tools/:slug.
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { OFFER } from "@/config/offer";
import NotFound from "@/pages/NotFound";
import { Shell, Crumbs, Cta } from "../../layout";
import { breadcrumbs, usePageMeta, type PageMeta } from "../../meta";
import { SITE_URL } from "../../content";
import { EXPLORE_LINKS, FaqList, LinkGrid, faqSchema, type Faq } from "../shared";
import { DocGenerator } from "./DocGenerator";
import { VatCalculator, PaintCalculator, PlasterCalculator, TileCalculator, ConcreteCalculator } from "./Calculators";

interface ToolDef {
  slug: string;
  name: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  tool: () => ReactNode;
  howTo?: string[];
  faqs: Faq[];
  related: [string, string, string][];
  card: string;
}

export const TOOLS: ToolDef[] = [
  {
    slug: "invoice-generator", name: "Invoice generator",
    title: "Free invoice generator for UK tradespeople: make a PDF invoice, no sign-up",
    description: "Make a professional PDF invoice in a couple of minutes: your details, the customer, the work, VAT if you're registered. Free, no sign-up, built for UK trades.",
    h1: "Free invoice generator for tradespeople",
    intro: "Fill in your details and the work, then download a PDF invoice ready to send by email or WhatsApp. It includes everything a UK invoice needs, and adds VAT if you're registered.",
    tool: () => <DocGenerator kind="invoice" />,
    howTo: ["Add your business name, address and contact details.", "Add the customer and the job address.", "List the work and materials with prices. Tick Add VAT if you're registered.", "Add payment details and download the PDF."],
    faqs: [
      ["Is this invoice generator really free?", "Yes. No sign-up, no watermark across the invoice, and your details stay on your device."],
      ["Does it meet UK invoice rules?", "It includes the information gov.uk says every invoice needs: a unique number, your details, the customer's details, a description, dates, amounts, VAT and the total. Limited companies should use their full registered name."],
      ["Can I make invoices automatically from my quotes?", `Yes, in Quotable: accepted quotes turn into invoices in one click, and you can see who's paid. ${OFFER.line}`],
    ],
    related: [["What to put on an invoice", "/guides/what-to-put-on-an-invoice", "UK rules"], ["Invoice templates", "/invoice-templates", "Examples by trade"], ["Invoicing app", "/invoicing-software", "Invoices from quotes"]],
    card: "Make a PDF invoice, no sign-up",
  },
  {
    slug: "quote-generator", name: "Quote generator",
    title: "Free quote generator for UK tradespeople: make a PDF quote, no sign-up",
    description: "Make a professional PDF quote for a job in minutes: scope, materials, labour, VAT and validity. Free, no sign-up, built for UK tradespeople.",
    h1: "Free quote generator for tradespeople",
    intro: "Put together a clear, professional quote and download it as a PDF. For quotes with the materials worked out and priced for you, try Quotable.",
    tool: () => <DocGenerator kind="quote" />,
    howTo: ["Add your business and the customer.", "Describe the work line by line, with materials and labour.", "Set how long the quote is valid and any deposit terms.", "Download the PDF and send it."],
    faqs: [
      ["What should a quote include?", "Your details, the customer's, a clear description of the work and what's not included, prices, VAT if registered, how long the price stands and your payment terms. See our guide to writing a quote."],
      ["Can it price the materials for me?", "This free tool doesn't. Quotable does: describe the job and it lists the materials and prices them live at UK merchants."],
    ],
    related: [["How to write a quote", "/guides/how-to-write-a-quote", "What to include"], ["Quote templates", "/quote-templates", "Examples by trade"], ["Quoting software", "/quoting-software", "Materials priced for you"]],
    card: "Make a PDF quote, no sign-up",
  },
  {
    slug: "vat-calculator", name: "VAT calculator",
    title: "VAT calculator for trades: add or remove 20% VAT (UK)",
    description: "Add VAT to a price or take it off, at 20%, 5% or any rate. Quick VAT calculator for UK tradespeople quoting and invoicing.",
    h1: "VAT calculator: add or remove VAT",
    intro: "Add VAT to a price for a quote, or work out the VAT inside a price you've been given.",
    tool: () => <VatCalculator />,
    faqs: [
      ["How do I add 20% VAT?", "Multiply the price by 1.2. £500 plus VAT is £600."],
      ["How do I remove VAT from a price?", "Divide the price including VAT by 1.2. £600 including VAT is £500 plus £100 VAT."],
      ["When do I have to charge VAT?", "Once you're VAT-registered. You must register when your taxable turnover goes over £90,000 in any rolling 12 months."],
    ],
    related: [["VAT for tradespeople", "/guides/vat-for-tradespeople", "When to register"], ["Invoice generator", "/tools/invoice-generator", "With VAT built in"], ["Invoicing app", "/invoicing-software", "VAT on every invoice"]],
    card: "Add or take off 20% VAT",
  },
  {
    slug: "paint-calculator", name: "Paint calculator",
    title: "Paint calculator: how much paint do I need for a room? (UK)",
    description: "Work out how much emulsion you need for a room: walls, ceiling, coats and tins, with doors and windows taken off. Free paint calculator for decorators.",
    h1: "Paint calculator: how much paint for a room?",
    intro: "Enter the room size and number of coats to see how many litres and 5 L tins you need.",
    tool: () => <PaintCalculator />,
    faqs: [
      ["How much paint do I need for a room?", "A typical 4m x 3.5m bedroom has around 30 to 35 m² of wall. At two coats and about 12 m² per litre, that's roughly 5 to 6 litres of emulsion."],
      ["How many coats do I need?", "Usually two. New plaster needs a thinned mist coat first, and big colour changes can need a third."],
    ],
    related: [["How to price painting a room", "/guides/how-to-price-painting-a-room", "Materials and labour"], ["Decorator quote template", "/quote-templates/painter-decorator-quote-template", "Free example"], ["Quotable for decorators", "/trades/painter-decorator", "Quotes in minutes"]],
    card: "Litres and tins for a room",
  },
  {
    slug: "plaster-calculator", name: "Plaster calculator",
    title: "Plaster calculator: how many bags of multi-finish do I need? (UK)",
    description: "Work out how many 25 kg bags of finishing plaster you need to skim a room, walls and ceiling, with doors and windows taken off.",
    h1: "Plaster calculator: bags of finish for a skim",
    intro: "Enter the room size to see how many 25 kg bags of finish plaster you need for a 2 mm skim.",
    tool: () => <PlasterCalculator />,
    faqs: [
      ["How much does a bag of multi-finish cover?", "Roughly 10 m² at 2 mm thick, per 25 kg bag. Always check the bag, and allow a little extra."],
      ["How many bags to skim a room?", "A typical bedroom's walls (about 30 m²) need around 3 to 4 bags, plus 1 to 2 for the ceiling."],
    ],
    related: [["How to price skimming a room", "/guides/how-to-price-skimming-a-room", "Materials and labour"], ["Plasterer day rates", "/day-rates", "What to charge"], ["Quotable for plasterers", "/trades/plasterer", "Quotes in minutes"]],
    card: "25 kg bags for a skim",
  },
  {
    slug: "tile-calculator", name: "Tile calculator",
    title: "Tile calculator: how many tiles do I need? (UK)",
    description: "Work out how many tiles and boxes you need for a wall or floor, from the area and tile size, with extra for cuts.",
    h1: "Tile calculator: how many tiles do I need?",
    intro: "Enter the area and tile size to see how many tiles and boxes to order, including extra for cuts.",
    tool: () => <TileCalculator />,
    faqs: [
      ["How much extra tile should I order?", "About 10% for a straight lay, 15% for diagonal or herringbone patterns, and more for small rooms with lots of cuts."],
      ["Should I buy all the tiles at once?", "Yes. Shade can vary between batches, so order everything from the same batch."],
    ],
    related: [["How to price tiling", "/guides/how-to-price-tiling", "Materials and labour"], ["How to price floor tiling", "/guides/how-to-price-floor-tiling", "Worked example"], ["Quotable for tilers", "/trades/tiler", "Quotes in minutes"]],
    card: "Tiles and boxes for an area",
  },
  {
    slug: "concrete-calculator", name: "Concrete calculator",
    title: "Concrete calculator: volume and bags for a slab or path (UK)",
    description: "Work out how much concrete you need for a slab, base or path in cubic metres and 25 kg bags of ready-mix.",
    h1: "Concrete calculator for slabs, bases and paths",
    intro: "Enter the length, width and depth to see the volume in cubic metres and roughly how many 25 kg bags of ready-mix you need.",
    tool: () => <ConcreteCalculator />,
    faqs: [
      ["How thick should a concrete base be?", "Around 100 mm for paths, patios and shed bases, and 150 mm or more for driveways, on a compacted sub-base."],
      ["Bags or a ready-mix delivery?", "For anything over about 1 m³, ready-mix delivered by truck is usually cheaper and quicker than mixing bags."],
    ],
    related: [["How to price decking", "/guides/how-to-price-decking", "For landscapers"], ["Quotable for landscapers", "/trades/landscaper", "Quotes in minutes"], ["Quotable for builders", "/trades/general-builder", "Quotes in minutes"]],
    card: "m³ and bags for a slab",
  },
];

const BY_SLUG = new Map(TOOLS.map((t) => [t.slug, t]));

export const toolsIndexMeta = (): PageMeta => ({
  path: "/tools",
  title: "Free tools for UK tradespeople: invoice and quote generators, calculators",
  description: "Free tools for UK trades: invoice and quote generators that make a PDF, a VAT calculator, and paint, plaster, tile and concrete calculators. No sign-up.",
  jsonLd: [breadcrumbs([["Home", "/"], ["Free tools", "/tools"]])],
});

export const toolMeta = (slug: string): PageMeta | null => {
  const t = BY_SLUG.get(slug);
  if (!t) return null;
  return {
    path: `/tools/${t.slug}`,
    title: t.title,
    description: t.description,
    jsonLd: [
      { "@type": "WebApplication", name: `${t.name} by Quotable`, url: `${SITE_URL}/tools/${t.slug}`, applicationCategory: "BusinessApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" }, description: t.description },
      ...(t.howTo ? [{ "@type": "HowTo", name: t.h1, step: t.howTo.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })) }] : []),
      faqSchema(t.faqs),
      breadcrumbs([["Home", "/"], ["Free tools", "/tools"], [t.name, `/tools/${t.slug}`]]),
    ],
  };
};

export const TOOL_SLUGS = TOOLS.map((t) => t.slug);

export const ToolsIndex = () => {
  usePageMeta(toolsIndexMeta());
  return (
    <Shell>
      <div className="container mx-auto max-w-5xl">
        <Crumbs items={[["Home", "/"], ["Free tools"]]} />
        <h1 className="text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05] text-primary">Free tools for tradespeople</h1>
        <p className="mt-5 text-lg leading-relaxed text-foreground/80 max-w-2xl">Make a quote or invoice, work out VAT, and calculate materials. All free, no sign-up.</p>
        <ul className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...TOOLS.map((t) => [t.name, `/tools/${t.slug}`, t.card] as const), ["Day rate calculator", "/day-rates", "What to charge per day"] as const].map(([name, to, card]) => (
            <li key={to}>
              <Link to={to} className="block h-full rounded-md border border-border bg-card p-5 hover:border-primary transition-colors">
                <span className="font-heading text-lg text-primary">{name}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{card}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Cta title="Want the materials worked out for you?" text={`Describe a job and Quotable lists the materials, prices them at UK merchants and adds your labour. ${OFFER.line}`} />
      </div>
    </Shell>
  );
};

export const ToolPage = ({ slug }: { slug: string }) => {
  const t = BY_SLUG.get(slug);
  usePageMeta(t ? toolMeta(slug) : null);
  if (!t) return <NotFound />;
  return (
    <Shell>
      <div className="container mx-auto max-w-6xl">
        <Crumbs items={[["Free tools", "/tools"], [t.name]]} />
        <h1 className="text-[clamp(2rem,4.5vw,3.1rem)] leading-[1.05] text-primary">{t.h1}</h1>
        <p className="mt-4 text-lg leading-relaxed text-foreground/80 max-w-3xl">{t.intro}</p>
        <div className="mt-10">{t.tool()}</div>
        {t.howTo && (
          <section className="mt-14 max-w-3xl">
            <h2 className="text-2xl text-primary">How to use it</h2>
            <ol className="mt-4 list-decimal pl-5 space-y-2 leading-relaxed text-foreground/85 marker:text-accent">
              {t.howTo.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </section>
        )}
        <div className="max-w-4xl">
          <FaqList faqs={t.faqs} />
          <LinkGrid title="Useful next" links={t.related} />
          <LinkGrid title="More free tools and guides" links={EXPLORE_LINKS.filter(([, to]) => to !== `/tools/${t.slug}`)} />
        </div>
        <Cta title="Quotes with the materials priced for you" text={`Describe the job and Quotable lists the materials, prices them live at UK merchants and adds your labour. ${OFFER.line}`} />
      </div>
    </Shell>
  );
};
