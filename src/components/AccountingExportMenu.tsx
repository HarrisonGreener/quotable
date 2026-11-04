import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildAccountingCsv, downloadCsv, type AccountingFormat, type ExportInvoice } from "@/lib/accountingExport";
import { toast } from "sonner";

const FORMATS: { id: AccountingFormat; label: string; help: string }[] = [
  { id: "xero", label: "Xero", help: "Business → Invoices → Import. Imports as draft invoices." },
  { id: "quickbooks", label: "QuickBooks", help: "Settings ⚙ → Import data → Invoices." },
  { id: "freeagent", label: "FreeAgent", help: "Banking → your account → Upload statement. Paid invoices only, to match income." },
];

const startOfQuarter = () => {
  const d = new Date();
  return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1).toISOString().slice(0, 10);
};

export const AccountingExportMenu = ({ invoices, disabled }: { invoices: ExportInvoice[]; disabled?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(startOfQuarter());
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const inRange = invoices.filter((i) => (!from || i.date >= from) && (!to || i.date <= to));

  const exportAs = (format: AccountingFormat) => {
    const rows = format === "freeagent" ? inRange.filter((i) => /paid/i.test(i.status)) : inRange;
    if (!rows.length) {
      toast.info(format === "freeagent" ? "No paid invoices in that range" : "No invoices in that range");
      return;
    }
    downloadCsv(`quotable-${format}-${from}-to-${to}.csv`, buildAccountingCsv(format, rows));
    toast.success(`${rows.length} invoice${rows.length === 1 ? "" : "s"} exported for ${FORMATS.find((f) => f.id === format)!.label}`);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={disabled}>
        <Download className="h-4 w-4 mr-2" aria-hidden="true" />
        Export for accounts
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export for your accounting software</DialogTitle>
            <DialogDescription>Download invoices as a file your accounting software can import.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="exp-from">From</Label>
              <Input id="exp-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp-to">To</Label>
              <Input id="exp-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{inRange.length} invoice{inRange.length === 1 ? "" : "s"} in this range.</p>
          <ul className="space-y-2">
            {FORMATS.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="font-medium">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.help}</p>
                </div>
                <Button size="sm" variant="accent" onClick={() => exportAs(f.id)}>Download</Button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
};
