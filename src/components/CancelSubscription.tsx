import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Cancel in two taps, no phone call or form to find: you keep access until the
// end of what you've paid for (or your free month), and can change your mind.

export const CancelSubscription = ({ cancelAtPeriodEnd, accessUntil, setCancelled }: {
  cancelAtPeriodEnd: boolean;
  accessUntil: string | null;
  setCancelled: (cancel: boolean, reason?: string) => Promise<{ cancelAtPeriodEnd: boolean; accessUntil: string | null }>;
}) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const until = accessUntil ? format(new Date(accessUntil), "d MMMM yyyy") : null;

  const run = async (cancel: boolean) => {
    setBusy(true);
    try {
      const r = await setCancelled(cancel, reason.trim() || undefined);
      const end = r.accessUntil ? format(new Date(r.accessUntil), "d MMMM yyyy") : until;
      toast.success(cancel
        ? `Subscription cancelled. You won't be charged again${end ? ` and keep access until ${end}` : ""}.`
        : "Subscription resumed. Nothing changes.");
      setOpen(false);
    } catch {
      toast.error(cancel ? "Couldn't cancel. Please try again, or use Manage subscription." : "Couldn't resume. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (cancelAtPeriodEnd) {
    return (
      <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
        <p>
          Cancelled. You won't be charged again{until ? <> and keep access until <strong>{until}</strong></> : null}.
        </p>
        <Button variant="link" className="h-auto px-0 mt-1" onClick={() => run(false)} disabled={busy}>
          Keep my subscription
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button variant="ghost" className="w-full text-muted-foreground hover:text-destructive" onClick={() => setOpen(true)}>
        Cancel subscription
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You won't be charged again. You keep full access{until ? ` until ${until}` : " until the end of the period you've paid for"},
              and your quotes, invoices and clients stay in your account. You can resume any time before then.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">Anything we could do better? (optional)</Label>
            <Textarea id="cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); run(true); }}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? "Cancelling…" : "Cancel subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
