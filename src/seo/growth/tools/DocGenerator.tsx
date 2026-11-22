// Free invoice / quote generator: fill in a form, see it, download a PDF. No sign-up.
// Details stay in this browser only (handy next time); nothing is sent to us.
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type DocKind = "invoice" | "quote";

interface Line { description: string; qty: string; price: string }
interface Doc {
  businessName: string; businessAddress: string; businessContact: string; vatNumber: string;
  customerName: string; customerAddress: string;
  number: string; date: string; secondDate: string;
  lines: Line[]; vat: boolean; vatRate: string; notes: string;
}

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
const num = (s: string) => { const n = parseFloat(String(s).replace(/[^0-9.\-]/g, "")); return Number.isFinite(n) ? n : 0; };
const gbp = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const ukDate = (iso: string) => (iso ? new Date(iso + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "");

const blank = (kind: DocKind): Doc => ({
  businessName: "", businessAddress: "", businessContact: "", vatNumber: "",
  customerName: "", customerAddress: "",
  number: kind === "invoice" ? "INV-001" : "Q-001",
  date: today(), secondDate: plusDays(kind === "invoice" ? 14 : 30),
  lines: [{ description: "", qty: "1", price: "" }],
  vat: false, vatRate: "20",
  notes: kind === "invoice" ? "Payment due within 14 days. Bank: Sort code 00-00-00, Account 00000000." : "This quote is valid for 30 days. A deposit is due before work starts.",
});

const STORE = "quotable_free_doc_business";

export const DocGenerator = ({ kind }: { kind: DocKind }) => {
  const [doc, setDoc] = useState<Doc>(() => blank(kind));
  const label = kind === "invoice" ? "Invoice" : "Quote";

  // Remember the business details (only) on this device
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "null");
      if (saved) setDoc((d) => ({ ...d, ...saved }));
    } catch { /* storage blocked */ }
  }, []);
  useEffect(() => {
    try {
      const { businessName, businessAddress, businessContact, vatNumber } = doc;
      localStorage.setItem(STORE, JSON.stringify({ businessName, businessAddress, businessContact, vatNumber }));
    } catch { /* ignore */ }
  }, [doc.businessName, doc.businessAddress, doc.businessContact, doc.vatNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof Doc>(k: K, v: Doc[K]) => setDoc((d) => ({ ...d, [k]: v }));
  const setLine = (i: number, k: keyof Line, v: string) =>
    setDoc((d) => ({ ...d, lines: d.lines.map((l, j) => (j === i ? { ...l, [k]: v } : l)) }));

  const totals = useMemo(() => {
    const sub = doc.lines.reduce((s, l) => s + num(l.qty) * num(l.price), 0);
    const vat = doc.vat ? sub * (num(doc.vatRate) / 100) : 0;
    return { sub, vat, total: sub + vat };
  }, [doc.lines, doc.vat, doc.vatRate]);

  const download = async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const navy: [number, number, number] = [11, 39, 65];
    const orange: [number, number, number] = [197, 87, 27];
    const W = 210, M = 18;
    let y = 22;
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(22); pdf.setTextColor(...navy);
    pdf.text(label.toUpperCase(), M, y);
    pdf.setFontSize(10); pdf.setFont("helvetica", "normal"); pdf.setTextColor(60);
    const right = [
      `${label} no. ${doc.number}`,
      `Date: ${ukDate(doc.date)}`,
      doc.secondDate ? `${kind === "invoice" ? "Due" : "Valid until"}: ${ukDate(doc.secondDate)}` : "",
    ].filter(Boolean);
    right.forEach((t, i) => pdf.text(t, W - M, y - 6 + i * 5, { align: "right" }));
    y += 12;
    pdf.setFont("helvetica", "bold"); pdf.setTextColor(...navy); pdf.text("From", M, y); pdf.text(kind === "invoice" ? "Bill to" : "Prepared for", W / 2, y);
    pdf.setFont("helvetica", "normal"); pdf.setTextColor(40);
    const from = [doc.businessName, ...doc.businessAddress.split("\n"), doc.businessContact, doc.vatNumber ? `VAT no. ${doc.vatNumber}` : ""].filter(Boolean);
    const to = [doc.customerName, ...doc.customerAddress.split("\n")].filter(Boolean);
    from.forEach((t, i) => pdf.text(t, M, y + 5 + i * 5));
    to.forEach((t, i) => pdf.text(t, W / 2, y + 5 + i * 5));
    y += 10 + Math.max(from.length, to.length) * 5;

    // Table
    pdf.setFillColor(...navy); pdf.rect(M, y, W - 2 * M, 8, "F");
    pdf.setTextColor(255); pdf.setFont("helvetica", "bold");
    pdf.text("Description", M + 3, y + 5.5);
    pdf.text("Qty", 130, y + 5.5, { align: "right" });
    pdf.text("Price", 158, y + 5.5, { align: "right" });
    pdf.text("Amount", W - M - 3, y + 5.5, { align: "right" });
    y += 8;
    pdf.setFont("helvetica", "normal"); pdf.setTextColor(40);
    doc.lines.filter((l) => l.description || num(l.price)).forEach((l) => {
      const wrapped = pdf.splitTextToSize(l.description || "-", 95) as string[];
      const h = Math.max(8, wrapped.length * 5 + 3);
      if (y + h > 260) { pdf.addPage(); y = 20; }
      pdf.text(wrapped, M + 3, y + 5.5);
      pdf.text(String(num(l.qty)), 130, y + 5.5, { align: "right" });
      pdf.text(gbp(num(l.price)), 158, y + 5.5, { align: "right" });
      pdf.text(gbp(num(l.qty) * num(l.price)), W - M - 3, y + 5.5, { align: "right" });
      y += h;
      pdf.setDrawColor(225); pdf.line(M, y, W - M, y);
    });
    y += 6;
    const row = (k: string, v: string, bold = false) => {
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setTextColor(...(bold ? navy : ([60, 60, 60] as [number, number, number])));
      pdf.text(k, 150, y, { align: "right" }); pdf.text(v, W - M - 3, y, { align: "right" }); y += 6;
    };
    row("Subtotal", gbp(totals.sub));
    if (doc.vat) row(`VAT (${num(doc.vatRate)}%)`, gbp(totals.vat));
    pdf.setFontSize(13); pdf.setTextColor(...orange);
    pdf.setFont("helvetica", "bold");
    pdf.text("Total", 150, y + 2, { align: "right" }); pdf.text(gbp(totals.total), W - M - 3, y + 2, { align: "right" });
    y += 14;
    if (doc.notes.trim()) {
      pdf.setFontSize(10); pdf.setTextColor(...navy); pdf.text("Notes", M, y);
      pdf.setFont("helvetica", "normal"); pdf.setTextColor(60);
      pdf.text(pdf.splitTextToSize(doc.notes, W - 2 * M) as string[], M, y + 5);
    }
    pdf.setFontSize(8); pdf.setTextColor(150);
    pdf.text("Made free with Quotable: quotes and invoices for UK trades, quotable.uk", W / 2, 288, { align: "center" });
    pdf.save(`${label}-${doc.number || "draft"}.pdf`);
  };

  const field = "space-y-1.5";
  return (
    <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-start">
      <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); download(); }}>
        <fieldset className="space-y-4">
          <legend className="font-heading text-lg text-primary">Your business</legend>
          <div className={field}><Label htmlFor="bn">Business name</Label><Input id="bn" value={doc.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="Taylor Plastering" /></div>
          <div className={field}><Label htmlFor="ba">Address</Label><Textarea id="ba" rows={2} value={doc.businessAddress} onChange={(e) => set("businessAddress", e.target.value)} placeholder={"12 High Street\nBrighton BN1 1AA"} /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className={field}><Label htmlFor="bc">Phone or email</Label><Input id="bc" value={doc.businessContact} onChange={(e) => set("businessContact", e.target.value)} placeholder="07700 900123" /></div>
            <div className={field}><Label htmlFor="bv">VAT number (if registered)</Label><Input id="bv" value={doc.vatNumber} onChange={(e) => set("vatNumber", e.target.value)} placeholder="Optional" /></div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-heading text-lg text-primary">Customer</legend>
          <div className={field}><Label htmlFor="cn">Customer name</Label><Input id="cn" value={doc.customerName} onChange={(e) => set("customerName", e.target.value)} placeholder="Mrs K. Whitworth" /></div>
          <div className={field}><Label htmlFor="ca">Job address</Label><Textarea id="ca" rows={2} value={doc.customerAddress} onChange={(e) => set("customerAddress", e.target.value)} placeholder={"4 Elm Road\nHove BN3 2AB"} /></div>
        </fieldset>

        <fieldset className="grid sm:grid-cols-3 gap-4">
          <legend className="sr-only">{label} details</legend>
          <div className={field}><Label htmlFor="no">{label} number</Label><Input id="no" value={doc.number} onChange={(e) => set("number", e.target.value)} /></div>
          <div className={field}><Label htmlFor="dt">Date</Label><Input id="dt" type="date" value={doc.date} onChange={(e) => set("date", e.target.value)} /></div>
          <div className={field}><Label htmlFor="d2">{kind === "invoice" ? "Due date" : "Valid until"}</Label><Input id="d2" type="date" value={doc.secondDate} onChange={(e) => set("secondDate", e.target.value)} /></div>
        </fieldset>

        <fieldset>
          <legend className="font-heading text-lg text-primary">Work and materials</legend>
          <div className="mt-3 space-y-3">
            {doc.lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_4.5rem_6.5rem_2.75rem] gap-2 items-end">
                <div className={field}>{i === 0 && <Label htmlFor={`d${i}`}>Description</Label>}<Input id={`d${i}`} value={l.description} onChange={(e) => setLine(i, "description", e.target.value)} placeholder={i === 0 ? "Re-skim bedroom walls" : "Item"} aria-label="Description" /></div>
                <div className={field}>{i === 0 && <Label htmlFor={`q${i}`}>Qty</Label>}<Input id={`q${i}`} inputMode="decimal" value={l.qty} onChange={(e) => setLine(i, "qty", e.target.value)} aria-label="Quantity" /></div>
                <div className={field}>{i === 0 && <Label htmlFor={`p${i}`}>Price £</Label>}<Input id={`p${i}`} inputMode="decimal" value={l.price} onChange={(e) => setLine(i, "price", e.target.value)} placeholder="0.00" aria-label="Price each" /></div>
                <Button type="button" variant="ghost" size="icon" className="h-10 w-11" aria-label="Remove line" disabled={doc.lines.length === 1}
                  onClick={() => setDoc((d) => ({ ...d, lines: d.lines.filter((_, j) => j !== i) }))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setDoc((d) => ({ ...d, lines: [...d.lines, { description: "", qty: "1", price: "" }] }))}>
            <Plus className="mr-1 h-4 w-4" /> Add a line
          </Button>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <label className="inline-flex min-h-[2.75rem] items-center gap-2 text-sm">
              <input type="checkbox" checked={doc.vat} onChange={(e) => set("vat", e.target.checked)} className="h-4 w-4 accent-[hsl(var(--accent))]" />
              Add VAT
            </label>
            {doc.vat && (
              <div className="flex items-center gap-2 text-sm"><Label htmlFor="vr">Rate %</Label><Input id="vr" className="h-10 w-20" inputMode="decimal" value={doc.vatRate} onChange={(e) => set("vatRate", e.target.value)} /></div>
            )}
          </div>
        </fieldset>

        <div className={field}>
          <Label htmlFor="nt">{kind === "invoice" ? "Payment details and notes" : "Terms and notes"}</Label>
          <Textarea id="nt" rows={3} value={doc.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>

        <Button type="submit" variant="accent" size="lg" className="h-12 w-full sm:w-auto px-6">
          <Download className="mr-2 h-4 w-4" /> Download {label.toLowerCase()} PDF
        </Button>
        <p className="text-xs text-muted-foreground">Your details stay on this device. Nothing is sent to us.</p>
      </form>

      {/* Live preview */}
      <aside className="lg:sticky lg:top-24 rounded-md border border-border bg-card p-5 sm:p-6 shadow-md text-sm" aria-label={`${label} preview`}>
        <div className="flex items-start justify-between gap-4">
          <p className="font-heading text-2xl text-primary">{label}</p>
          <div className="text-right text-muted-foreground">
            <p>{doc.number}</p><p>{ukDate(doc.date)}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div><p className="font-medium text-primary">From</p><p className="whitespace-pre-line text-foreground/80">{[doc.businessName, doc.businessAddress, doc.businessContact].filter(Boolean).join("\n") || "Your business"}</p></div>
          <div><p className="font-medium text-primary">{kind === "invoice" ? "Bill to" : "For"}</p><p className="whitespace-pre-line text-foreground/80">{[doc.customerName, doc.customerAddress].filter(Boolean).join("\n") || "Customer"}</p></div>
        </div>
        <table className="mt-5 w-full tabular">
          <tbody>
            {doc.lines.filter((l) => l.description || num(l.price)).map((l, i) => (
              <tr key={i} className="border-t border-border/70">
                <td className="py-2 pr-2">{l.description || "-"} {num(l.qty) !== 1 && <span className="text-muted-foreground">× {num(l.qty)}</span>}</td>
                <td className="py-2 text-right">{gbp(num(l.qty) * num(l.price))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border"><td className="py-1.5 text-muted-foreground">Subtotal</td><td className="py-1.5 text-right">{gbp(totals.sub)}</td></tr>
            {doc.vat && <tr><td className="py-1.5 text-muted-foreground">VAT {num(doc.vatRate)}%</td><td className="py-1.5 text-right">{gbp(totals.vat)}</td></tr>}
            <tr className="border-t-2 border-primary"><td className="py-2 font-heading text-primary">Total</td><td className="py-2 text-right font-heading text-lg text-accent">{gbp(totals.total)}</td></tr>
          </tfoot>
        </table>
      </aside>
    </div>
  );
};
