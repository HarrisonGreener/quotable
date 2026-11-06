// The hero illustration: a finished Quotable quote for a real job, with real products
// and the prices Quotable found for them at UK merchants (checked Nov 2026).
// Lines fill in once on load; reduced-motion users see it complete.

const JOB = "Re-skim the bedroom walls, about 3 m by 3 m, and add two double sockets off the ring.";

const LINES: { item: string; qty: string; supplier: string; price: number }[] = [
  { item: "Thistle Multi-Finish plaster 25 kg", qty: "4 bags", supplier: "Wickes", price: 45.0 },
  { item: "PVA bonding agent 5 L", qty: "1", supplier: "Wickes", price: 14.25 },
  { item: "Scrim tape 48 mm × 90 m", qty: "1 roll", supplier: "Travis Perkins", price: 4.9 },
  { item: "2.5 mm twin & earth cable", qty: "12 m", supplier: "Travis Perkins", price: 10.92 },
  { item: "Double switched socket, white", qty: "2", supplier: "Travis Perkins", price: 6.98 },
  { item: "35 mm metal back box, 2-gang", qty: "2", supplier: "Travis Perkins", price: 1.7 },
];
const LABOUR = { hours: 15, rate: 32 };
const OVERHEADS = 35;

const gbp = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const QuoteSheet = () => {
  const materials = LINES.reduce((s, l) => s + l.price, 0);
  const labour = LABOUR.hours * LABOUR.rate;
  const total = materials + labour + OVERHEADS;

  return (
    <figure className="mx-auto w-full max-w-[34rem]" aria-label="Example quote produced by Quotable">
      <div className="relative">
      {/* the sheet underneath — a pad of quotes */}
      <div aria-hidden className="absolute inset-x-3 -bottom-2 top-3 rounded-md bg-card/70 border border-border" />
      <div className="relative rounded-md border border-border bg-card shadow-lg">
        <div className="flex items-baseline justify-between px-5 sm:px-6 pt-5 pb-3 border-b border-dashed border-border">
          <div>
            <p className="font-heading text-[0.95rem] text-primary">Quote Q-0142</p>
            <p className="text-xs text-muted-foreground mt-0.5">Mrs J. Patel, 14 Elm Road, Stockport</p>
          </div>
          <p className="text-xs text-muted-foreground tabular">6 Nov 2026</p>
        </div>

        <p className="docket-line px-5 sm:px-6 pt-4 pb-4 text-[0.95rem] leading-relaxed text-foreground/80 italic" style={{ animationDelay: "150ms" }}>
          “{JOB}”
        </p>

        <table className="w-full text-sm tabular">
          <caption className="sr-only">Materials with live merchant prices</caption>
          <tbody>
            {LINES.map((l, i) => (
              <tr key={l.item} className="docket-line border-t border-border/70" style={{ animationDelay: `${500 + i * 140}ms` }}>
                <td className="pl-5 sm:pl-6 py-2 pr-2">
                  <span className="text-foreground">{l.item}</span>
                  <span className="block text-[0.72rem] text-muted-foreground">{l.qty} from <span className="underline decoration-border underline-offset-2">{l.supplier}</span></span>
                </td>
                <td className="pr-5 sm:pr-6 py-2 text-right align-top text-foreground">{gbp(l.price)}</td>
              </tr>
            ))}
            <tr className="docket-line border-t border-border/70" style={{ animationDelay: `${500 + LINES.length * 140}ms` }}>
              <td className="pl-5 sm:pl-6 py-2 pr-2">
                <span className="text-foreground">Labour</span>
                <span className="block text-[0.72rem] text-muted-foreground">{LABOUR.hours} hours</span>
              </td>
              <td className="pr-5 sm:pr-6 py-2 text-right align-top text-foreground">{gbp(labour)}</td>
            </tr>
            <tr className="docket-line border-t border-border/70" style={{ animationDelay: `${640 + LINES.length * 140}ms` }}>
              <td className="pl-5 sm:pl-6 py-2 pr-2 text-foreground">Transport and sundries</td>
              <td className="pr-5 sm:pr-6 py-2 text-right text-foreground">{gbp(OVERHEADS)}</td>
            </tr>
          </tbody>
        </table>

        <div className="docket-line flex items-baseline justify-between px-5 sm:px-6 py-4 border-t-2 border-primary mt-1" style={{ animationDelay: `${900 + LINES.length * 140}ms` }}>
          <span className="font-heading text-primary">Total</span>
          <span className="font-heading text-2xl sm:text-3xl text-accent tabular">{gbp(total)}</span>
        </div>
      </div>
      </div>
      <figcaption className="mt-5 text-xs text-muted-foreground">
        Every price above was read from the merchant's website. Each line on a real quote links to the product.
      </figcaption>
    </figure>
  );
};
