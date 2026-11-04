import { useState } from "react";
import { Check, Copy, Eye, Link2, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// "Send link": gives a quote or invoice a private customer link, lets the
// tradesperson set a deposit and expiry (quotes), and share it by WhatsApp,
// text, email or copy.

const newToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

interface Props {
  type: "quote" | "invoice";
  record: {
    id: string;
    client?: string;
    title?: string;
    share_token?: string | null;
    customer_viewed_at?: string | null;
    accepted_at?: string | null;
    deposit_percent?: number | null;
    valid_until?: string | null;
  };
  businessName?: string | null;
  disabled?: boolean;
  onUpdated?: () => void;
  className?: string;
}

const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const SendLinkButton = ({ type, record, businessName, disabled, onUpdated, className }: Props) => {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState(record.share_token || "");
  const [deposit, setDeposit] = useState<string>(record.deposit_percent != null ? String(record.deposit_percent) : "");
  const [validUntil, setValidUntil] = useState(record.valid_until || addDays(30));
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const table = type === "quote" ? "quotes" : "invoices";
  const noun = type === "quote" ? "quote" : "invoice";

  // Creates the token if needed and saves deposit/expiry. Returns the link.
  const save = async (): Promise<string | null> => {
    setSaving(true);
    const t = token || newToken();
    const update: Record<string, unknown> = { share_token: t };
    if (type === "quote") {
      const pct = deposit.trim() === "" ? null : Math.min(100, Math.max(0, Number(deposit)));
      Object.assign(update, { deposit_percent: pct, valid_until: validUntil || null });
    }
    const { error } = await supabase.from(table).update(update as any).eq("id", record.id);
    setSaving(false);
    if (error) {
      toast.error("Couldn't create the link");
      return null;
    }
    setToken(t);
    onUpdated?.();
    return `${window.location.origin}/${type === "quote" ? "q" : "i"}/${t}`;
  };

  const messageFor = (link: string) =>
    `Hi${record.client ? ` ${record.client.split(" ")[0]}` : ""}, here's your ${noun}${record.title ? ` for ${record.title}` : ""}${businessName ? ` from ${businessName}` : ""}: ${link}`;

  const copy = async () => {
    const link = await save();
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = async (kind: "whatsapp" | "sms" | "email") => {
    // Open the window first (inside the click) so pop-up blockers allow it.
    const win = window.open("", "_blank");
    const link = await save();
    if (!link) { win?.close(); return; }
    const body = messageFor(link);
    const href =
      kind === "whatsapp" ? `https://wa.me/?text=${encodeURIComponent(body)}`
      : kind === "sms" ? `sms:?&body=${encodeURIComponent(body)}`
      : `mailto:?subject=${encodeURIComponent(`Your ${noun}${record.title ? `: ${record.title}` : ""}`)}&body=${encodeURIComponent(body)}`;
    if (win && kind === "whatsapp") win.location.href = href;
    else { win?.close(); window.location.href = href; }
  };

  const status = record.accepted_at
    ? `Accepted ${new Date(record.accepted_at).toLocaleDateString("en-GB")}`
    : record.customer_viewed_at
      ? `Opened ${new Date(record.customer_viewed_at).toLocaleDateString("en-GB")}`
      : record.share_token ? "Sent, not opened yet" : null;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={disabled} className={className}>
        <Link2 className="h-4 w-4 mr-2" aria-hidden="true" />
        Send link
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send {noun} link</DialogTitle>
            <DialogDescription>
              {type === "quote"
                ? "Your customer opens it on their phone, accepts with a tap and can pay the deposit."
                : "Your customer opens it on their phone and pays by card or bank transfer."}
            </DialogDescription>
          </DialogHeader>

          {status && (
            <p className="text-sm flex items-center gap-2 text-muted-foreground" role="status">
              <Eye className="h-4 w-4" aria-hidden="true" />{status}
            </p>
          )}

          {type === "quote" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="deposit">Deposit to book (%)</Label>
                <Input id="deposit" type="number" inputMode="numeric" min={0} max={100} step={5} placeholder="None" value={deposit} onChange={(e) => setDeposit(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valid-until">Valid until</Label>
                <Input id="valid-until" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="accent" onClick={() => share("whatsapp")} disabled={saving}><MessageCircle className="h-4 w-4 mr-2" aria-hidden="true" />WhatsApp</Button>
            <Button variant="outline" onClick={() => share("sms")} disabled={saving}><MessageCircle className="h-4 w-4 mr-2" aria-hidden="true" />Text</Button>
            <Button variant="outline" onClick={() => share("email")} disabled={saving}><Mail className="h-4 w-4 mr-2" aria-hidden="true" />Email</Button>
            <Button variant="outline" onClick={copy} disabled={saving}>
              {copied ? <Check className="h-4 w-4 mr-2" aria-hidden="true" /> : <Copy className="h-4 w-4 mr-2" aria-hidden="true" />}
              {copied ? "Copied" : "Copy link"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Add a card payment link and bank details in Account → Brand Details so customers can pay from the page.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};
