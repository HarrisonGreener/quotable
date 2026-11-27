// Pages aimed at tradespeople themselves (not homeowners):
//  • /quoting-software/<trade>  "quoting app for plumbers" and similar searches
//  • /price-lists/<trade>-price-list  "electrician price list 2026" and similar
// Price lists are worked out from the same job recipes the quoting engine uses.
import { Link } from "react-router-dom";
import { CheckCircle2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/NotFound";
import { OFFER } from "@/config/offer";
import { Shell, Crumbs, Cta } from "../layout";
import { breadcrumbs, ORG, usePageMeta, type PageMeta } from "../meta";
import { GUIDES, TEMPLATES, PRICES_CHECKED, workGuide, workJob, gbp } from "../content";
import { DAY_RATES } from "../dayRates";
import { FaqList, LinkGrid, faqSchema, softwareSchema, type Faq } from "./shared";

type Params = Record<string, number | string | boolean>;

// ── Price lists ───────────────────────────────────────────────────

interface PriceItem { job: string; recipe: string; params: Params; note?: string }
interface PriceList {
  slug: string;
  tradeSlug: string;
  singular: string; // "electrician"
  plural: string;   // "electricians"
  rate: number;     // example hourly rate
  items: PriceItem[];
  extra?: string;   // a trade-specific note under the table
}

const PRICE_LISTS: PriceList[] = [
  {
    slug: "electrician-price-list", tradeSlug: "electrician", singular: "electrician", plural: "electricians", rate: 50,
    items: [
      { job: "Add a double socket (spur off the ring)", recipe: "sockets_add", params: { count: 1 } },
      { job: "Add 3 double sockets", recipe: "sockets_add", params: { count: 3 } },
      { job: "Replace 4 sockets and 2 switches", recipe: "accessories_replace", params: { sockets: 4, switches: 2 } },
      { job: "Fit a pendant light (existing wiring)", recipe: "lights", params: { count: 1, type: "pendant" } },
      { job: "Fit 6 LED downlights, new wiring", recipe: "lights", params: { count: 6, type: "downlight", new_wiring: true } },
      { job: "Consumer unit change (8 circuits)", recipe: "consumer_unit", params: { circuits: 8 } },
      { job: "EICR, 2-bed house", recipe: "eicr", params: { bedrooms: 2, circuits: 8 } },
      { job: "EICR, 3-bed house", recipe: "eicr", params: { bedrooms: 3, circuits: 10 } },
      { job: "Electric shower on a new circuit", recipe: "electric_shower", params: { new_circuit: true, cable_m: 15 } },
      { job: "Bathroom extractor fan, new hole", recipe: "extractor_fan", params: { count: 1, new_hole: true } },
      { job: "3 mains smoke and heat alarms", recipe: "smoke_alarms", params: { count: 3 } },
      { job: "Outdoor socket", recipe: "outdoor_socket", params: { count: 1 } },
    ],
    extra: "Testing, certification and building control notification are included in the hours where the job needs them. Add your scheme's notification fee if you pass it on.",
  },
  {
    slug: "plumber-price-list", tradeSlug: "plumber", singular: "plumber", plural: "plumbers", rate: 55,
    items: [
      { job: "Replace a basin tap", recipe: "tap_replace", params: { count: 1, type: "basin", valves: true } },
      { job: "Replace a kitchen tap", recipe: "tap_replace", params: { count: 1, type: "kitchen", valves: true } },
      { job: "Replace a toilet, toilet included", recipe: "toilet_replace", params: { count: 1, supply_toilet: true } },
      { job: "Replace a basin, basin included", recipe: "basin_replace", params: { count: 1, supply_basin: true } },
      { job: "Replace a radiator, same position", recipe: "radiator_replace", params: { count: 1, size: "medium", new_position: false } },
      { job: "Add a new radiator (6 m pipe run)", recipe: "radiator_add", params: { count: 1, pipe_m: 6, size: "medium" } },
      { job: "Leak repair, easy access", recipe: "leak_repair", params: { count: 1, access: false } },
      { job: "Leak repair, lifting floorboards", recipe: "leak_repair", params: { count: 1, access: true } },
      { job: "Fit an outside tap", recipe: "outside_tap", params: { count: 1 } },
      { job: "Mixer shower on existing feeds", recipe: "shower_mixer", params: { new_feeds: false } },
      { job: "Mixer shower with new feeds", recipe: "shower_mixer", params: { new_feeds: true } },
      { job: "Boiler service", recipe: "boiler_service", params: {} },
    ],
    extra: "Gas work needs Gas Safe registration. Prices assume standard access and no surprises behind the walls: say so on your quote.",
  },
  {
    slug: "plasterer-price-list", tradeSlug: "plasterer", singular: "plasterer", plural: "plasterers", rate: 30,
    items: [
      { job: "Skim walls, small bedroom (3 × 3 m)", recipe: "skim", params: { length: 3, width: 3, height: 2.4, doors: 1, windows: 1 } },
      { job: "Skim walls, living room (4.5 × 4 m)", recipe: "skim", params: { length: 4.5, width: 4, height: 2.4, doors: 1, windows: 1 } },
      { job: "Skim walls and ceiling (3.5 × 3 m room)", recipe: "skim", params: { length: 3.5, width: 3, height: 2.4, doors: 1, windows: 1, include_ceiling: true } },
      { job: "Skim a ceiling (12 m²)", recipe: "skim", params: { ceiling_area: 12 } },
      { job: "Overboard and skim a ceiling (12 m²)", recipe: "ceiling_board", params: { ceiling_area: 12, remove_old: false } },
      { job: "Take down and replace a ceiling (12 m²)", recipe: "ceiling_board", params: { ceiling_area: 12, remove_old: true } },
      { job: "Fit coving (14 m)", recipe: "coving", params: { metres: 14 } },
    ],
    extra: "Skimming assumes sound walls. Patch repairs, bonding or hacking off old plaster add time: price them as separate lines.",
  },
  {
    slug: "decorator-price-list", tradeSlug: "painter-decorator", singular: "decorator", plural: "painters and decorators", rate: 32,
    items: [
      { job: "Paint a small bedroom (walls, ceiling, woodwork)", recipe: "paint_room", params: { length: 3, width: 3, height: 2.4, doors: 1, windows: 1 } },
      { job: "Paint a living room (walls, ceiling, woodwork)", recipe: "paint_room", params: { length: 4.5, width: 4, height: 2.4, doors: 1, windows: 1 } },
      { job: "Paint walls only, 4 × 3.5 m room", recipe: "paint_room", params: { length: 4, width: 3.5, height: 2.4, ceiling: false, woodwork: false } },
      { job: "Paint 3 bedrooms (walls, ceilings, woodwork)", recipe: "paint_room", params: { length: 3.5, width: 3, height: 2.4, rooms: 3 } },
      { job: "Strip and wallpaper a room (customer's paper)", recipe: "wallpaper", params: { length: 4, width: 3.5, height: 2.4, doors: 1, windows: 1, strip: true, supply_paper: false } },
      { job: "Paint house exterior, 40 m², tower", recipe: "exterior_paint", params: { area: 40, access: "tower" } },
      { job: "Paint house exterior, 80 m², scaffold", recipe: "exterior_paint", params: { area: 80, access: "scaffold" }, note: "scaffold hire extra" },
      { job: "Fit coving (14 m)", recipe: "coving", params: { metres: 14 } },
    ],
    extra: "Prep is the swing factor: heavy filling, stain blocking or a big colour change can add a third coat and a day.",
  },
  {
    slug: "tiler-price-list", tradeSlug: "tiler", singular: "tiler", plural: "tilers", rate: 40,
    items: [
      { job: "Kitchen splashback (3 m²)", recipe: "tiling", params: { area: 3, surface: "wall", tile_price: 0 } },
      { job: "Bathroom walls (6 m²)", recipe: "tiling", params: { area: 6, surface: "wall", tile_price: 0 } },
      { job: "Bathroom walls, old tiles off (12 m²)", recipe: "tiling", params: { area: 12, surface: "wall", tile_price: 0, remove_old: true } },
      { job: "Bathroom floor (4 m²)", recipe: "tiling", params: { area: 4, surface: "floor", tile_price: 0 } },
      { job: "Kitchen floor, large format (10 m²)", recipe: "tiling", params: { area: 10, surface: "floor", tile_price: 0, large_format: true } },
    ],
    extra: "Prices are with the customer supplying the tiles: adhesive, grout, trims and your time only. Add the tiles plus waste if you supply them.",
  },
  {
    slug: "carpenter-price-list", tradeSlug: "carpenter", singular: "carpenter", plural: "carpenters and joiners", rate: 35,
    items: [
      { job: "Hang an internal door, door included", recipe: "internal_doors", params: { count: 1, type: "standard", supply_doors: true } },
      { job: "Hang 3 internal doors, doors included", recipe: "internal_doors", params: { count: 3, type: "standard", supply_doors: true } },
      { job: "Hang a fire door, door included", recipe: "internal_doors", params: { count: 1, type: "fire", supply_doors: true } },
      { job: "Replace skirting, one room (14 m)", recipe: "skirting", params: { metres: 14, remove_old: true } },
      { job: "Architrave, both sides of a door", recipe: "architrave", params: { sides: 2 } },
      { job: "Lay laminate, 12 m², flooring included", recipe: "laminate_floor", params: { area: 12, type: "laminate", doorways: 1, supply_floor: true } },
      { job: "Lay engineered oak, 15 m², flooring included", recipe: "laminate_floor", params: { area: 15, type: "engineered", doorways: 1, supply_floor: true } },
      { job: "Stud wall with a door (3 m)", recipe: "stud_wall", params: { length: 3, height: 2.4, insulated: true, door: true } },
      { job: "Replace 9 m of fencing, concrete posts", recipe: "fence_panels", params: { length: 9, posts: "concrete", remove_old: true } },
      { job: "Timber decking (12 m²)", recipe: "decking", params: { area: 12 } },
    ],
    extra: "Old houses rarely have square walls or level floors: allow extra time for scribing and packing on older properties.",
  },
];

const round5 = (v: number) => Math.round(v / 5) * 5;
const pounds = (v: number) => `£${Math.round(v).toLocaleString("en-GB")}`;

const priceRows = (l: PriceList) => l.items.map((i) => ({ ...i, ...workJob(i.recipe, i.params, l.rate) }));

const PL_BY_SLUG = new Map(PRICE_LISTS.map((l) => [l.slug, l]));
export const PRICE_LIST_SLUGS = PRICE_LISTS.map((l) => l.slug);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const priceListFaqs = (l: PriceList): Faq[] => {
  const rows = priceRows(l);
  const top = rows.slice(0, 2).map((r) => [`How much does a ${l.singular} charge to ${r.job.charAt(0).toLowerCase() + r.job.slice(1)}?`,
    `About ${pounds(round5(r.total))} in 2026: ${pounds(r.materialsTotal)} of materials and ${r.hours} hours of labour at ${pounds(l.rate)} an hour. Your own rate and the job's access change it.`] as Faq);
  return [
    ...top,
    [`How do I make my own ${l.singular} price list?`, `Start from your day rate, work out the hours each common job really takes you (including setting up and clearing up), add materials at today's merchant prices, then round. Re-check material prices every few months: they move. Quotable does the materials and hours for you on every quote.`],
    ["Should I show customers a price list?", "A list of 'from' prices helps customers decide to call you, but quote each job properly after seeing it. Access, the state of what's there and the customer's choices change the price."],
  ];
};

export const priceListMeta = (slug: string): PageMeta | null => {
  const l = PL_BY_SLUG.get(slug);
  if (!l) return null;
  const name = cap(l.singular);
  return {
    path: `/price-lists/${l.slug}`,
    title: `${name} price list UK 2026: prices for ${l.items.length} common jobs`,
    description: `A ${l.singular} price list for the UK with ${PRICES_CHECKED} prices: ${l.items.length} common jobs with materials, labour hours and a typical price, worked out at ${pounds(l.rate)} an hour. Print it or set your own rate.`,
    jsonLd: [
      { "@type": "Article", headline: `${name} price list UK 2026`, dateModified: "2026-11-27", publisher: { "@id": "https://quotable.uk/#org" }, mainEntityOfPage: `https://quotable.uk/price-lists/${l.slug}` },
      faqSchema(priceListFaqs(l)),
      breadcrumbs([["Home", "/"], ["Price lists", "/price-lists"], [`${name} price list`, `/price-lists/${l.slug}`]]),
    ],
  };
};

export const priceListsIndexMeta = (): PageMeta => ({
  path: "/price-lists",
  title: "Trade price lists UK 2026: electrician, plumber, plasterer, decorator and more",
  description: `Price lists for UK tradespeople with ${PRICES_CHECKED} prices: common jobs with materials, labour hours and typical prices for electricians, plumbers, plasterers, decorators, tilers and carpenters.`,
  jsonLd: [breadcrumbs([["Home", "/"], ["Price lists", "/price-lists"]])],
});

const tradeLinks = (tradeSlug: string, self: string): [string, string, string][] => {
  const day = DAY_RATES.find((d) => d.tradeSlug === tradeSlug);
  const tpl = TEMPLATES.find((t) => t.trade.slug === tradeSlug);
  const sw = SOFTWARE_TRADES.find((s) => s.tradeSlug === tradeSlug);
  const pl = PRICE_LISTS.find((p) => p.tradeSlug === tradeSlug);
  const links: [string, string, string][] = [];
  if (pl) links.push([`${cap(pl.singular)} price list`, `/price-lists/${pl.slug}`, "Common jobs with 2026 prices"]);
  if (day) links.push([`${cap(day.trade)} day rate`, `/day-rates/${day.slug}`, "What to charge per day, by region"]);
  if (sw) links.push([`Quoting app for ${sw.plural}`, `/quoting-software/${sw.slug}`, "Priced quotes in minutes"]);
  if (tpl) links.push([`Free ${tpl.trade.singular} quote template`, `/quote-templates/${tpl.slug}`, "Printable, with a worked example"]);
  links.push(["All trade guides", `/trades/${tradeSlug}`, "Guides, rates and templates"]);
  return links.filter(([, to]) => to !== self);
};

export const PriceListPage = ({ slug }: { slug: string }) => {
  const l = PL_BY_SLUG.get(slug);
  usePageMeta(l ? priceListMeta(slug) : null);
  if (!l) return <NotFound />;
  const rows = priceRows(l);
  const name = cap(l.singular);
  const guides = GUIDES.filter((g) => g.trade.slug === l.tradeSlug);
  return (
    <Shell>
      <article className="container mx-auto max-w-5xl">
        <Crumbs items={[["Price lists", "/price-lists"], [`${name} price list`]]} />
        <h1 className="text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05] text-primary">{name} price list UK (2026)</h1>
        <p className="mt-5 text-lg leading-relaxed text-foreground/80 max-w-3xl">
          Typical prices for {l.items.length} jobs {l.plural} are asked for most, worked out from real quantities and labour times,
          with materials at UK retail prices ({PRICES_CHECKED}) and labour at {pounds(l.rate)} an hour. Use it to sense-check
          your own prices or as a starting point for your own list.
        </p>

        <div className="mt-10 overflow-x-auto rounded-md border border-border bg-card shadow-md">
          <table className="w-full min-w-[40rem] text-left text-[0.95rem] tabular">
            <caption className="sr-only">{name} prices for common jobs</caption>
            <thead>
              <tr className="border-b border-border text-sm text-muted-foreground">
                <th scope="col" className="p-4 font-normal">Job</th>
                <th scope="col" className="p-4 font-normal text-right">Materials</th>
                <th scope="col" className="p-4 font-normal text-right">Hours</th>
                <th scope="col" className="p-4 font-normal text-right">Labour</th>
                <th scope="col" className="p-4 font-semibold text-primary text-right">Typical price</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.job} className="border-b border-border/70 last:border-0">
                  <th scope="row" className="p-4 font-medium text-foreground">{r.job}{r.note && <span className="block text-xs font-normal text-muted-foreground">{r.note}</span>}</th>
                  <td className="p-4 text-right">{gbp(r.materialsTotal)}</td>
                  <td className="p-4 text-right">{r.hours}</td>
                  <td className="p-4 text-right">{gbp(r.labourTotal)}</td>
                  <td className="p-4 text-right font-heading text-lg text-accent">{pounds(round5(r.total))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-3 text-xs text-muted-foreground border-t border-border bg-secondary/40">
            Materials are typical UK retail prices including VAT. Labour at {pounds(l.rate)}/hour with no VAT; add 20% if you're VAT-registered.
            Typical price includes £25 transport where the job needs a trip to the merchant, rounded to the nearest £5.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 print:hidden">
          <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" aria-hidden /> Print or save as PDF</Button>
        </div>

        {l.extra && <p className="mt-8 max-w-3xl leading-relaxed text-foreground/85">{l.extra}</p>}

        <section className="mt-14 max-w-3xl">
          <h2 className="text-2xl text-primary">Your rate changes everything</h2>
          <p className="mt-4 leading-relaxed text-foreground/85">
            These prices use {pounds(l.rate)} an hour. If you charge more, multiply the hours column by your rate and add the
            materials. Not sure what your rate should be? See what {l.plural} charge per day in your region on the{" "}
            {DAY_RATES.find((d) => d.tradeSlug === l.tradeSlug) ? <Link className="underline underline-offset-4" to={`/day-rates/${DAY_RATES.find((d) => d.tradeSlug === l.tradeSlug)!.slug}`}>{l.singular} day rate page</Link> : <Link className="underline underline-offset-4" to="/day-rates">day rates page</Link>}.
          </p>
        </section>

        {guides.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl text-primary">Full breakdowns, line by line</h2>
            <ul className="mt-4 grid sm:grid-cols-2 gap-x-8">
              {guides.map((g) => (
                <li key={g.slug} className="border-b border-border"><Link to={`/guides/${g.slug}`} className="block py-3 hover:text-primary hover:underline underline-offset-4">{g.h1}</Link></li>
              ))}
            </ul>
          </section>
        )}

        <FaqList faqs={priceListFaqs(l)} />
        <LinkGrid title={`More for ${l.plural}`} links={tradeLinks(l.tradeSlug, `/price-lists/${l.slug}`)} />
        <Cta title="Price every job like this, automatically" text={`Describe the job and Quotable works out the materials, prices them live at UK merchants and adds your labour. ${OFFER.line}`} />
      </article>
    </Shell>
  );
};

export const PriceListsIndex = () => {
  usePageMeta(priceListsIndexMeta());
  return (
    <Shell>
      <div className="container mx-auto max-w-5xl">
        <Crumbs items={[["Price lists"]]} />
        <h1 className="text-[clamp(2rem,4.5vw,3.25rem)] leading-[1.05] text-primary">Trade price lists for 2026</h1>
        <p className="mt-5 text-lg leading-relaxed text-foreground/80 max-w-2xl">
          Common jobs with materials, labour hours and a typical price, worked out from real quantities. Prices checked {PRICES_CHECKED}.
        </p>
        <ul className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRICE_LISTS.map((l) => (
            <li key={l.slug}>
              <Link to={`/price-lists/${l.slug}`} className="block h-full rounded-md border border-border bg-card p-5 hover:border-primary transition-colors">
                <span className="font-heading text-lg text-primary">{cap(l.singular)} price list</span>
                <span className="mt-1 block text-sm text-muted-foreground">{l.items.length} jobs, from {pounds(Math.min(...priceRows(l).map((r) => round5(r.total))))}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Cta title="Quote any job in minutes" text={OFFER.line} />
      </div>
    </Shell>
  );
};

// ── Quoting software for each trade ───────────────────────────────

interface TradeSoftware {
  slug: string;        // /quoting-software/<slug>
  tradeSlug: string;
  plural: string;      // "plumbers"
  name: string;        // "Plumbers" (for the H1)
  example: string;     // a typed job description
  lead: string;
  points: [string, string][];
  faqs: Faq[];
}

const SOFTWARE_TRADES: TradeSoftware[] = [
  {
    slug: "electricians", tradeSlug: "electrician", plural: "electricians", name: "Electricians",
    example: "Add two double sockets in the kitchen and swap the pendant for six downlights, new wiring.",
    lead: "Describe the job and Quotable lists the cable, back boxes, accessories and fittings in the quantities wholesalers sell them, prices each one, and adds your time for first fix, second fix and testing.",
    points: [
      ["Cable and accessories counted for you", "Metres of twin and earth, back boxes, faceplates, downlights, MCBs and RCBOs: worked out from the job, not guessed."],
      ["Testing time included", "Labour includes testing and paperwork time where the job needs it, so it doesn't come out of your margin."],
      ["Quote consumer units and EICRs fast", "Common electrical jobs like board changes, EICRs, showers and fans have worked-out labour times built in."],
    ],
    faqs: [
      ["Does Quotable do electrical certificates?", "No. Keep using your scheme's certification software for EICs, minor works and EICRs. Quotable handles the quote, the customer accepting it, and the invoice."],
      ["Can I set different rates for different work?", "Yes. Set your hourly or day rate in your account, and change any labour line on a quote before you send it."],
      ["Where do the material prices come from?", "Each material is priced from UK merchants' own product pages, mainly Toolstation, Wickes and Travis Perkins, with a link so you can check it. Your own stock prices are used first."],
    ],
  },
  {
    slug: "plumbers", tradeSlug: "plumber", plural: "plumbers", name: "Plumbers",
    example: "Replace the bedroom radiator like for like and fit a new kitchen mixer tap with isolation valves.",
    lead: "Describe the job and Quotable lists the fittings, valves, pipe and consumables, prices them at UK merchants, and adds your time for draining down, fitting and refilling.",
    points: [
      ["Fittings and valves listed", "TRVs, lockshields, isolation valves, compression fittings, inhibitor and PTFE: the small stuff that gets forgotten and eats your margin."],
      ["Drain-down time counted", "Labour includes isolating or draining down, refilling and bleeding, not just the fitting time."],
      ["Supplied or customer's own", "Say who's supplying the toilet, tap or radiator and the quote follows it."],
    ],
    faqs: [
      ["Can I quote boiler work with it?", "Yes for services and the plumbing around it. For boiler installs, describe the job and check the lines: price the boiler itself from your supplier."],
      ["Can customers pay a deposit from the quote?", "Yes. Add your own card payment link and bank details, and customers can pay a deposit when they accept."],
      ["Where do the material prices come from?", "Each material is priced from UK merchants' own product pages, mainly Toolstation, Wickes and Travis Perkins, with a link so you can check it. Your own stock prices are used first."],
    ],
  },
  {
    slug: "plasterers", tradeSlug: "plasterer", plural: "plasterers", name: "Plasterers",
    example: "Skim the living room walls and ceiling, room is 4.5 by 4 metres, one door and one window.",
    lead: "Give the room size and Quotable works out the wall and ceiling area, the bags of multi-finish, PVA, beads and scrim, and the time to prep, skim and clear up.",
    points: [
      ["Areas worked out from room sizes", "Give length, width and height and the doors and windows come off automatically."],
      ["Bags, beads and boards counted", "Multi-finish, bonding, plasterboard, angle bead and scrim in the quantities the merchant sells."],
      ["Ceilings too", "Overboarding or taking down and replacing a ceiling, with boards, screws and disposal included."],
    ],
    faqs: [
      ["Can I quote by the square metre?", "Yes. Give the area in square metres instead of the room size and the quantities follow it."],
      ["Does it handle patch repairs?", "Describe them as part of the job. Anything outside the standard jobs is listed for you to price, and nothing is left off silently."],
      ["Where do the material prices come from?", "Each material is priced from UK merchants' own product pages, mainly Toolstation, Wickes and Travis Perkins, with a link so you can check it. Your own stock prices are used first."],
    ],
  },
  {
    slug: "decorators", tradeSlug: "painter-decorator", plural: "painters and decorators", name: "Painters and decorators",
    example: "Paint the two front bedrooms, walls, ceilings and woodwork, two coats, light prep.",
    lead: "Give the rooms and Quotable works out the paintable area, the litres of emulsion, gloss and undercoat, the filler and sundries, and the hours for prep, cutting in and coats.",
    points: [
      ["Litres worked out, not guessed", "Wall, ceiling and woodwork areas from room sizes, with coverage and coats, rounded to the tins you'd buy."],
      ["Prep priced properly", "Light, normal or heavy prep changes the hours, so a tired room isn't priced like a fresh one."],
      ["Inside and out", "Interiors, wallpapering and exterior masonry painting, with access (ladders, tower or scaffold) included."],
    ],
    faqs: [
      ["Can I use my own paint prices?", "Yes. Add the paints you use to your stock with your trade prices, and they're used before merchant prices."],
      ["Can I quote several rooms at once?", "Yes. Describe them together and each room is worked out, then totalled on one quote."],
      ["Where do the material prices come from?", "Each material is priced from UK merchants' own product pages, mainly Toolstation, Wickes and Travis Perkins, with a link so you can check it. Your own stock prices are used first."],
    ],
  },
  {
    slug: "tilers", tradeSlug: "tiler", plural: "tilers", name: "Tilers",
    example: "Tile the bathroom walls, about 12 square metres, old tiles to come off, customer supplying tiles.",
    lead: "Give the area and Quotable works out the adhesive, grout, trims, levelling clips and backer board, and the time to strip, prep, set out, tile and grout.",
    points: [
      ["Adhesive and grout by the bag", "Quantities from the area and tile size, rounded to what the merchant sells."],
      ["Strip-out and prep counted", "Removing old tiles and preparing the surface are priced as their own time, not squeezed in."],
      ["Large format handled", "Large tiles take longer and need levelling clips: the quote reflects it."],
    ],
    faqs: [
      ["What if the customer buys the tiles?", "Say so and the tiles come off the quote, leaving your materials and labour."],
      ["Can I quote walls and floor together?", "Yes. Describe both and each is worked out separately on the same quote."],
      ["Where do the material prices come from?", "Each material is priced from UK merchants' own product pages, mainly Toolstation, Wickes and Travis Perkins, with a link so you can check it. Your own stock prices are used first."],
    ],
  },
  {
    slug: "carpenters", tradeSlug: "carpenter", plural: "carpenters and joiners", name: "Carpenters and joiners",
    example: "Hang three internal doors, customer's doors, new hinges and handles, and replace the skirting in the hall, about 14 metres.",
    lead: "Describe the job and Quotable lists the timber, ironmongery, fixings and adhesives, prices them at UK merchants, and adds your time for each part of the job.",
    points: [
      ["Ironmongery counted per door", "Hinges, latches, handles and screws for every door, with fire-door hardware where needed."],
      ["Lengths rounded to stock sizes", "Skirting, architrave and studwork in the lengths merchants sell, with waste allowed."],
      ["Floors, fences and decking too", "Laminate and engineered floors, stud walls, fence panels and decking all have worked-out quantities and times."],
    ],
    faqs: [
      ["Can I quote bespoke joinery?", "Describe it and the parts outside the standard jobs are listed for you to price yourself. Standard first and second fix work is priced for you."],
      ["Can I add my own day rate?", "Yes. Labour is always worked out from your own hourly or day rate."],
      ["Where do the material prices come from?", "Each material is priced from UK merchants' own product pages, mainly Toolstation, Wickes and Travis Perkins, with a link so you can check it. Your own stock prices are used first."],
    ],
  },
  {
    slug: "builders", tradeSlug: "general-builder", plural: "builders", name: "Builders",
    example: "Put up a stud wall with a door in the back bedroom, skim both sides and paint, then lay laminate in both rooms.",
    lead: "Mixed jobs are where quoting takes longest. Describe the whole job and Quotable breaks it into the trades involved, prices each part, and puts it on one clear quote.",
    points: [
      ["One quote, several trades", "Carpentry, plastering, decorating, flooring and small plumbing and electrical jobs worked out together."],
      ["Nothing left off silently", "Anything outside the standard jobs is listed separately for you to price, so the gaps are visible."],
      ["Quote to invoice", "When the job's done, turn the accepted quote into an invoice in one click."],
    ],
    faqs: [
      ["Can it price extensions or big structural work?", "Not on its own. Quotable is built for small and medium jobs. For larger builds, use it for the fit-out parts and price the structure from your own figures."],
      ["Can I add subcontractor costs?", "Yes. Add any line by hand with your own price."],
      ["Where do the material prices come from?", "Each material is priced from UK merchants' own product pages, mainly Toolstation, Wickes and Travis Perkins, with a link so you can check it. Your own stock prices are used first."],
    ],
  },
];

const SW_BY_SLUG = new Map(SOFTWARE_TRADES.map((s) => [s.slug, s]));
export const TRADE_SOFTWARE_SLUGS = SOFTWARE_TRADES.map((s) => s.slug);

const COMMON_FAQS: Faq[] = [
  ["How much does Quotable cost?", `£14.99 a month or £159.99 a year. ${OFFER.line}`],
  ["Does it work on my phone?", "Yes. It runs in your phone's browser and can be added to your home screen like an app, so you can quote from the van."],
];

export const tradeSoftwareMeta = (slug: string): PageMeta | null => {
  const s = SW_BY_SLUG.get(slug);
  if (!s) return null;
  const path = `/quoting-software/${s.slug}`;
  const title = `Quoting app for ${s.plural} (UK): priced quotes in minutes | Quotable`;
  const description = `A quoting app built for UK ${s.plural}: describe the job, get materials priced live at UK merchants, labour at your rate, and a quote your customer can accept and pay from their phone. ${OFFER.short ? cap(OFFER.short) + "." : ""}`.trim();
  return {
    path, title, description,
    jsonLd: [ORG, softwareSchema("Quotable", description, path), faqSchema([...s.faqs, ...COMMON_FAQS]),
      breadcrumbs([["Home", "/"], ["Quoting software", "/quoting-software"], [`For ${s.plural}`, path]])],
  };
};

export const TradeSoftwarePage = ({ slug }: { slug: string }) => {
  const s = SW_BY_SLUG.get(slug);
  usePageMeta(s ? tradeSoftwareMeta(slug) : null);
  if (!s) return <NotFound />;
  const guide = GUIDES.find((g) => g.trade.slug === s.tradeSlug);
  const w = guide ? workGuide(guide) : null;
  return (
    <Shell>
      <article className="container mx-auto max-w-5xl">
        <Crumbs items={[["Quoting software", "/quoting-software"], [`For ${s.plural}`]]} />
        <h1 className="text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.05] text-primary max-w-4xl">Quoting app for {s.plural}</h1>
        <p className="mt-5 text-lg leading-relaxed text-foreground/80 max-w-3xl">{s.lead}</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild variant="accent" size="lg" className="h-12 px-6"><Link to="/auth">{OFFER.button}</Link></Button>
          <Button asChild variant="outline" size="lg" className="h-12 px-6"><Link to="/auth?demo=true">Try the sample account</Link></Button>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{OFFER.line}</p>

        <section className="mt-14 grid md:grid-cols-2 gap-8 items-start">
          <div className="rounded-md border border-border bg-card p-5 sm:p-6 shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">You type or say</p>
            <p className="mt-2 text-lg italic text-foreground/85">“{s.example}”</p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">You get</p>
            <ul className="mt-2 space-y-1.5 text-[0.95rem] text-foreground/85">
              <li>Every material, in the quantities merchants sell</li>
              <li>Today's price for each, linked to the product</li>
              <li>Labour at your own rate, split by task</li>
              <li>A quote link your customer accepts in one tap</li>
            </ul>
          </div>
          {guide && w && (
            <div>
              <h2 className="text-xl text-primary">A real example</h2>
              <p className="mt-2 leading-relaxed text-foreground/80">“{guide.example}”</p>
              <dl className="mt-4 divide-y divide-border border-y border-border text-[0.95rem] tabular">
                <div className="flex justify-between py-2"><dt>Materials ({w.materials.length} lines)</dt><dd>{gbp(w.materialsTotal)}</dd></div>
                <div className="flex justify-between py-2"><dt>Labour, {w.hours} h at {gbp(guide.rate)}/h</dt><dd>{gbp(w.labourTotal)}</dd></div>
                <div className="flex justify-between py-2 font-heading text-primary"><dt>Total</dt><dd className="text-accent">{gbp(w.total)}</dd></div>
              </dl>
              <Link to={`/guides/${guide.slug}`} className="mt-3 inline-block text-sm underline underline-offset-4">See every line of this quote</Link>
            </div>
          )}
        </section>

        <section className="mt-16">
          <h2 className="text-2xl sm:text-3xl text-primary">Built for how {s.plural} price jobs</h2>
          <ul className="mt-6 grid md:grid-cols-3 gap-6">
            {s.points.map(([t, d]) => (
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
          <h2 className="text-2xl sm:text-3xl text-primary">Everything else you need</h2>
          <ul className="mt-6 grid sm:grid-cols-2 gap-x-10 gap-y-3 text-foreground/85">
            {["Speak the job instead of typing", "Send by WhatsApp or email, see when it's opened", "Customers accept and pay a deposit online", "Turn accepted quotes into invoices in one click", "Your logo and details on every quote", "Exports for Xero, QuickBooks and FreeAgent"].map((t) => (
              <li key={t} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />{t}</li>
            ))}
          </ul>
        </section>

        <FaqList faqs={[...s.faqs, ...COMMON_FAQS]} />
        <LinkGrid title={`More for ${s.plural}`} links={tradeLinks(s.tradeSlug, `/quoting-software/${s.slug}`)} />
        <Cta title="Try it on your next job" text={`Describe a real job and see the quote it gives you. ${OFFER.line}`} />
      </article>
    </Shell>
  );
};

/** Links for the /quoting-software hub and trade pages. */
export const TRADE_SOFTWARE_LINKS: [string, string, string][] = SOFTWARE_TRADES.map((s) => [`For ${s.plural}`, `/quoting-software/${s.slug}`, s.lead.split(". ")[0].slice(0, 70) + "…"]);
export const tradeHubLinks = (tradeSlug: string) => tradeLinks(tradeSlug, `/trades/${tradeSlug}`);

/** Price list and quoting-app links for a /trades/<slug> page. */
export const tradeExtras = (tradeSlug: string) => {
  const pl = PRICE_LISTS.find((p) => p.tradeSlug === tradeSlug);
  const sw = SOFTWARE_TRADES.find((s) => s.tradeSlug === tradeSlug);
  return {
    priceList: pl ? { label: `${cap(pl.singular)} price list (2026)`, to: `/price-lists/${pl.slug}` } : null,
    software: sw ? { label: `Quoting app for ${sw.plural}`, to: `/quoting-software/${sw.slug}` } : null,
  };
};
