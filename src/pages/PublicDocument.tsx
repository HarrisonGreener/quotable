import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, CreditCard, Landmark, Loader2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

// The page a customer sees when a tradesperson sends them a quote or
// invoice link (/q/:token and /i/:token). No login, phone-first.

type Line = { name: string; quantity: number | null; unit: string | null; cost: number };

interface Payload {
  type: "quote" | "invoice";
  business: {
    name: string | null; email: string | null; phone: string | null; website: string | null;
    address: string | null; vatNumber: string | null; logoUrl: string | null; paymentLink: string | null;
    bank: { accountName: string; bankName: string; sortCode: string; accountNumber: string } | null;
    paymentNotes: string | null;
  };
  document: {
    reference: string; title: string; client: string; location?: string; summary?: string;
    created_at?: string; valid_until?: string | null; date?: string; due_date?: string; status: string;
    accepted_at?: string | null; accepted_name?: string | null;
    materials?: Line[]; labour?: Line[]; overheads?: Line[];
    subtotal: number; vat: number; total: number; deposit_percent?: number | null; deposit?: number | null;
    photos?: string[];
  };
}

const fmt = (n: number) => `£${(n || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");

const invoke = async (body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke("public-document", { body });
  if (error) {
    let message: string | undefined;
    try { message = (await (error as any).context?.json())?.error; } catch { /* ignore */ }
    throw new Error(message || "Couldn't load this page.");
  }
  if (data?.error) throw new Error(data.error);
  return data;
};

const Section = ({ title, lines }: { title: string; lines?: Line[] }) =>
  lines && lines.length > 0 ? (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-2">{title}</h3>
      <ul className="divide-y">
        {lines.map((l, i) => (
          <li key={i} className="flex justify-between gap-4 py-2 text-sm">
            <span className="text-foreground">
              {l.name}
              {l.quantity != null && <span className="text-muted-foreground"> · {l.quantity}{l.unit ? ` ${l.unit}` : ""}</span>}
            </span>
            <span className="whitespace-nowrap">{fmt(l.cost)}</span>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

const PublicDocument = ({ type }: { type: "quote" | "invoice" }) => {
  const { token } = useParams();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    invoke({ token, type }).then(setData).catch((e) => setError(e.message));
  }, [token, type]);

  // Private customer pages: keep them out of search engines.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    if (data) document.title = `${data.type === "quote" ? "Quote" : "Invoice"}${data.business.name ? ` from ${data.business.name}` : ""}`;
  }, [data]);

  const accept = async () => {
    setAccepting(true);
    setAcceptError(null);
    try {
      const res = await invoke({ token, type: "quote", action: "accept", name });
      setData((d) => d && { ...d, document: { ...d.document, status: "Accepted", accepted_at: res.accepted_at, accepted_name: d.document.accepted_name || name } });
    } catch (e) {
      setAcceptError(e instanceof Error ? e.message : "Couldn't accept just now.");
    } finally {
      setAccepting(false);
    }
  };

  if (error) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <p role="alert" className="text-center text-muted-foreground max-w-sm">{error}</p>
      </main>
    );
  }
  if (!data) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center" aria-busy="true">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading" />
      </main>
    );
  }

  const { business: b, document: d } = data;
  const isQuote = data.type === "quote";
  const accepted = !!d.accepted_at;
  const expired = isQuote && d.valid_until && new Date(d.valid_until) < new Date(new Date().toDateString());
  const paid = !isQuote && /paid/i.test(d.status);
  const payAmount = isQuote ? d.deposit : d.total;
  const showPayment = (isQuote ? accepted && !!d.deposit : !paid) && (b.paymentLink || b.bank);

  return (
    <main className="min-h-screen bg-muted/30 py-6 px-4">
      <article className="mx-auto max-w-2xl space-y-4">
        {/* Business */}
        <header className="bg-background rounded-xl border p-5 flex items-center gap-4">
          {b.logoUrl && <img src={b.logoUrl} alt="" className="h-14 w-14 object-contain rounded" />}
          <div className="min-w-0">
            <p className="font-heading text-lg text-foreground truncate">{b.name || "Your quote"}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {b.phone && <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1 hover:text-primary"><Phone className="h-3.5 w-3.5" aria-hidden="true" />{b.phone}</a>}
              {b.email && <a href={`mailto:${b.email}`} className="inline-flex items-center gap-1 hover:text-primary"><Mail className="h-3.5 w-3.5" aria-hidden="true" />{b.email}</a>}
            </div>
          </div>
        </header>

        {/* Document */}
        <section className="bg-background rounded-xl border p-5 space-y-5" aria-labelledby="doc-title">
          <div>
            <p className="text-xs font-semibold tracking-wide uppercase text-accent">{isQuote ? "Quote" : "Invoice"} {d.reference}</p>
            <h1 id="doc-title" className="font-heading text-2xl text-foreground mt-1">{d.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              For {d.client}{d.location ? ` · ${d.location}` : ""}
              {isQuote && d.created_at && ` · ${date(d.created_at)}`}
              {!isQuote && d.date && ` · ${date(d.date)}`}
            </p>
            {isQuote && d.valid_until && <p className="text-sm text-muted-foreground">Valid until {date(d.valid_until)}</p>}
            {!isQuote && d.due_date && <p className="text-sm text-muted-foreground">Due {date(d.due_date)}</p>}
          </div>

          {d.summary && <p className="text-foreground leading-relaxed">{d.summary}</p>}

          {d.photos && d.photos.length > 0 && (
            <ul className="grid grid-cols-3 gap-2" aria-label="Site photos">
              {d.photos.map((src, i) => (
                <li key={i}><a href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt={`Site photo ${i + 1}`} className="aspect-square w-full object-cover rounded-md" /></a></li>
              ))}
            </ul>
          )}

          <Section title="Materials" lines={d.materials} />
          <Section title="Labour" lines={d.labour} />
          <Section title="Other costs" lines={d.overheads} />

          <dl className="border-t pt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{fmt(d.subtotal)}</dd></div>
            {d.vat > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">VAT</dt><dd>{fmt(d.vat)}</dd></div>}
            <div className="flex justify-between text-lg font-semibold text-foreground pt-1"><dt>Total</dt><dd>{fmt(d.total)}</dd></div>
            {isQuote && d.deposit != null && (
              <div className="flex justify-between text-accent font-semibold"><dt>Deposit to book ({d.deposit_percent}%)</dt><dd>{fmt(d.deposit)}</dd></div>
            )}
          </dl>
        </section>

        {/* Accept */}
        {isQuote && (
          <section className="bg-background rounded-xl border p-5" aria-labelledby="accept-title">
            {accepted ? (
              <div className="flex items-start gap-3" role="status">
                <CheckCircle2 className="h-6 w-6 text-green-700 flex-shrink-0" aria-hidden="true" />
                <div>
                  <h2 id="accept-title" className="font-semibold text-foreground">Quote accepted</h2>
                  <p className="text-sm text-muted-foreground">
                    Accepted{d.accepted_name ? ` by ${d.accepted_name}` : ""} on {date(d.accepted_at)}. {b.name || "They"} will be in touch to book the work.
                  </p>
                </div>
              </div>
            ) : expired ? (
              <p className="text-sm text-muted-foreground" id="accept-title">This quote has expired. Contact {b.name || "the business"} for an updated price.</p>
            ) : (
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); accept(); }}>
                <h2 id="accept-title" className="font-semibold text-foreground">Happy to go ahead?</h2>
                <div className="space-y-1.5">
                  <Label htmlFor="accept-name">Your full name</Label>
                  <Input id="accept-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 text-base" />
                </div>
                <p className="text-xs text-muted-foreground">By accepting you agree to the work and price above{d.deposit ? `, with a ${fmt(d.deposit)} deposit to book` : ""}.</p>
                {acceptError && <p role="alert" className="text-sm text-destructive">{acceptError}</p>}
                <Button type="submit" variant="accent" size="lg" className="w-full h-12" disabled={accepting || name.trim().length < 2}>
                  {accepting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Accept quote"}
                </Button>
              </form>
            )}
          </section>
        )}

        {/* Pay */}
        {showPayment && (
          <section className="bg-background rounded-xl border p-5 space-y-4" aria-labelledby="pay-title">
            <h2 id="pay-title" className="font-semibold text-foreground">
              {isQuote ? `Pay your ${fmt(payAmount || 0)} deposit` : `Pay ${fmt(payAmount || 0)}`}
            </h2>
            {b.paymentLink && (
              <a href={b.paymentLink} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="accent" size="lg" className="w-full h-12"><CreditCard className="h-4 w-4 mr-2" aria-hidden="true" />Pay by card</Button>
              </a>
            )}
            {b.bank && (
              <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1">
                <p className="font-medium flex items-center gap-2"><Landmark className="h-4 w-4" aria-hidden="true" />Bank transfer</p>
                <p>{b.bank.accountName}{b.bank.bankName ? ` · ${b.bank.bankName}` : ""}</p>
                <p>Sort code <span className="font-mono">{b.bank.sortCode}</span> · Account <span className="font-mono">{b.bank.accountNumber}</span></p>
                <p>Reference <span className="font-mono">{d.reference}</span></p>
              </div>
            )}
            {b.paymentNotes && <p className="text-xs text-muted-foreground">{b.paymentNotes}</p>}
          </section>
        )}

        {paid && (
          <p role="status" className="text-center text-sm text-green-800 dark:text-green-300 font-medium">Paid — thank you.</p>
        )}

        <footer className="text-center text-xs text-muted-foreground pt-2">
          {[b.address, b.vatNumber && `VAT ${b.vatNumber}`].filter(Boolean).join(" · ")}
          <p className="mt-2">Sent with <a href="/" className="underline hover:text-primary">Quotable</a></p>
        </footer>
      </article>
    </main>
  );
};

export const PublicQuote = () => <PublicDocument type="quote" />;
export const PublicInvoice = () => <PublicDocument type="invoice" />;
export default PublicDocument;
