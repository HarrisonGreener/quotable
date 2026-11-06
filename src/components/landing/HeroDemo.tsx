// Hero: a quote being made on a phone. The job is typed in, the materials appear
// with merchant prices, labour and VAT are added, and the quote is sent and accepted.
//
// The example is a single-trade job priced at real rates (checked Nov 2026):
//   materials: Wickes / Travis Perkins product pages
//   labour:    1.5 days at £220, inside the £170–£300 North West plasterer day rate (Trade2Base 2026)
//   total:     £471.48 inc. VAT; Checkatrade puts a 3 m × 3 m re-skim at £430–£550, typically £480 (June 2026)
//
// The server render and reduced-motion users get the finished quote, so the content is
// readable without JavaScript and nothing moves for people who've asked it not to.

import { useEffect, useState } from "react";
import { Mic, Check, Pause, Play, MessageCircle } from "lucide-react";

const JOB = "Re-skim the bedroom walls, about 3 m by 3 m. Walls are sound, just tired.";

const LINES = [
  { item: "Thistle Multi-Finish 25 kg", qty: "3 bags", supplier: "Wickes", price: 33.75 },
  { item: "PVA bonding agent 5 L", qty: "1", supplier: "Wickes", price: 14.25 },
  { item: "Scrim tape 48 mm × 90 m", qty: "1 roll", supplier: "Travis Perkins", price: 4.9 },
  { item: "Sundries", qty: "dust sheets, tape, cleaning", supplier: "van stock", price: 10.0 },
];
const LABOUR = { days: 1.5, rate: 220 };

const materials = LINES.reduce((s, l) => s + l.price, 0);
const labour = LABOUR.days * LABOUR.rate;
const net = materials + labour;
const vat = Math.round(net * 0.2 * 100) / 100;
const TOTAL = Math.round((net + vat) * 100) / 100;

export const HERO_EXAMPLE = { job: JOB, total: TOTAL, materials, labour, vat };

const gbp = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Timeline (ms)
const T = {
  typeStart: 500,
  perChar: 30,
  get typeEnd() { return this.typeStart + JOB.length * this.perChar; },
  get thinking() { return this.typeEnd + 350; },
  get pricing() { return this.thinking + 700; },
  get line0() { return this.pricing + 600; },
  lineGap: 420,
  get labour() { return this.line0 + LINES.length * this.lineGap + 150; },
  get vat() { return this.labour + 380; },
  get total() { return this.vat + 380; },
  get send() { return this.total + 1100; },
  get sent() { return this.send + 900; },
  get opened() { return this.sent + 1000; },
  get accepted() { return this.opened + 1000; },
  get end() { return this.accepted + 3200; },
};
const FINISHED = 1e9;

export const HeroDemo = () => {
  // Server render shows the finished quote; the browser plays it from the start
  const [t, setT] = useState(() =>
    typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? FINISHED : 0,
  );
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (t >= FINISHED || paused) return;
    const id = window.setInterval(() => setT((v) => (v + 50 >= T.end ? 0 : v + 50)), 50);
    return () => window.clearInterval(id);
  }, [paused, t >= FINISHED]); // eslint-disable-line react-hooks/exhaustive-deps

  const typed = t >= FINISHED ? JOB.length : Math.max(0, Math.min(JOB.length, Math.floor((t - T.typeStart) / T.perChar)));
  const typing = typed > 0 && typed < JOB.length;
  const status =
    t >= T.line0 ? null : t >= T.pricing ? "Checking prices at Toolstation, Wickes and Travis Perkins…" : t >= T.thinking ? "Working out materials…" : null;
  const shownLines = t >= T.line0 ? Math.min(LINES.length, Math.floor((t - T.line0) / T.lineGap) + 1) : 0;
  const totalShown = t >= T.total ? TOTAL * Math.min(1, (t - T.total) / 500) : 0;
  const stage = t >= T.accepted ? "accepted" : t >= T.opened ? "opened" : t >= T.sent ? "sent" : t >= T.send ? "send" : null;

  return (
    <figure className="mx-auto w-[17.5rem] sm:w-[18.75rem] max-w-full" aria-label="Example: a plastering quote made in Quotable">
      <p className="sr-only">
        Example quote: “{JOB}” Materials {gbp(materials)} priced at Wickes and Travis Perkins, labour {LABOUR.days} days at {gbp(LABOUR.rate)} a day,
        VAT {gbp(vat)}, total {gbp(TOTAL)}. Sent to the customer by WhatsApp and accepted.
      </p>

      {/* the phone */}
      <div aria-hidden className="relative flex aspect-[9/19.5] rounded-[2.6rem] bg-primary p-[0.5rem] shadow-[0_30px_60px_-20px_hsl(var(--primary)/0.45)]">
        <div className="relative flex-1 overflow-hidden rounded-[2.15rem] bg-card flex flex-col">
          <div className="mx-auto mt-2.5 h-[1.1rem] w-[5.25rem] shrink-0 rounded-full bg-primary/95" />

          {/* header */}
          <div className="px-5 pt-3 pb-2 flex items-baseline justify-between">
            <span className="font-heading text-primary text-[1.05rem]">New quote</span>
            <span className="text-[0.7rem] text-muted-foreground tabular">Q-0142</span>
          </div>

          {/* job box */}
          <div className="mx-4 rounded-md border border-border bg-background px-3 py-2.5 min-h-[4.6rem] relative">
            <p className="text-[0.82rem] leading-snug text-foreground pr-7">
              {JOB.slice(0, typed)}
              {typing && <span className="hero-caret" />}
              {typed === 0 && <span className="text-muted-foreground">Describe the job…</span>}
            </p>
            <Mic className={`absolute right-2.5 top-2.5 h-4 w-4 ${typing ? "text-accent" : "text-muted-foreground"}`} />
          </div>

          {/* status / lines */}
          <div className="flex-1 min-h-0 px-4 pt-2 overflow-hidden">
            {status && (
              <p className="flex items-center gap-2 text-[0.75rem] text-muted-foreground px-1 py-2">
                <span className="hero-dots"><i /><i /><i /></span>
                {status}
              </p>
            )}
            <ul className="text-[0.8rem] tabular">
              {LINES.slice(0, shownLines).map((l) => (
                <li key={l.item} className="hero-line flex justify-between gap-3 border-b border-border/70 py-[0.45rem] px-1">
                  <span className="min-w-0">
                    <span className="block text-foreground truncate">{l.item}</span>
                    <span className="block text-[0.68rem] text-muted-foreground">
                      {l.qty} · {l.supplier}
                      {l.supplier !== "van stock" && <span className="ml-1.5 text-[0.6rem] font-semibold uppercase tracking-wide text-accent">live</span>}
                    </span>
                  </span>
                  <span className="text-foreground shrink-0">{gbp(l.price)}</span>
                </li>
              ))}
              {t >= T.labour && (
                <li className="hero-line flex justify-between gap-3 border-b border-border/70 py-[0.45rem] px-1">
                  <span>
                    <span className="block text-foreground">Labour</span>
                    <span className="block text-[0.68rem] text-muted-foreground">{LABOUR.days} days at {gbp(LABOUR.rate)}</span>
                  </span>
                  <span className="text-foreground">{gbp(labour)}</span>
                </li>
              )}
              {t >= T.vat && (
                <li className="hero-line flex justify-between gap-3 py-[0.45rem] px-1 text-muted-foreground">
                  <span>VAT 20%</span>
                  <span>{gbp(vat)}</span>
                </li>
              )}
            </ul>
            {t >= T.total && (
              <div className="hero-line mt-1 flex items-baseline justify-between border-t-2 border-primary px-1 pt-2.5">
                <span className="font-heading text-primary text-[0.95rem]">Total</span>
                <span className="font-heading text-accent text-[1.6rem] tabular">{gbp(totalShown)}</span>
              </div>
            )}
          </div>

          {/* send / tracking */}
          <div className="px-4 pb-5 pt-1 h-[5.25rem] shrink-0">
            {stage === "send" && (
              <div className="hero-line hero-press flex h-11 items-center justify-center gap-2 rounded-md bg-accent text-accent-foreground text-sm font-semibold">
                <MessageCircle className="h-4 w-4" /> Send by WhatsApp
              </div>
            )}
            {(stage === "sent" || stage === "opened" || stage === "accepted") && (
              <ol className="hero-line flex items-center justify-between text-[0.72rem]">
                {(["Sent", "Opened", "Accepted"] as const).map((s, i) => {
                  const done = i === 0 || (i === 1 && stage !== "sent") || (i === 2 && stage === "accepted");
                  return (
                    <li key={s} className={`flex items-center gap-1.5 ${done ? (s === "Accepted" ? "text-accent font-semibold" : "text-primary") : "text-muted-foreground/60"}`}>
                      <span className={`grid h-5 w-5 place-items-center rounded-full border ${done ? (s === "Accepted" ? "bg-accent border-accent text-white" : "bg-primary border-primary text-white") : "border-border"}`}>
                        {done && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      {s}
                    </li>
                  );
                })}
              </ol>
            )}
            {stage === "accepted" && (
              <p className="hero-line mt-2.5 text-[0.72rem] text-muted-foreground">Accepted by Mrs K. Whitworth · deposit link sent</p>
            )}
          </div>
        </div>
      </div>

      <figcaption className="mt-5 flex items-start justify-between gap-4 text-xs text-muted-foreground">
        <span>Materials priced from the merchants' own product pages. Labour at your rate. Total includes VAT.</span>
        {t < FINISHED && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="shrink-0 inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-label={paused ? "Play the example" : "Pause the example"}
          >
            {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            {paused ? "Play" : "Pause"}
          </button>
        )}
      </figcaption>
    </figure>
  );
};
