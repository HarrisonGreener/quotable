import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, FileText, Calendar } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAppSettings } from "@/hooks/useAppSettings";

interface QuoteActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: any | null;
  isDemo: boolean;
  onStatusUpdate: () => void;
}

export const QuoteActionsDialog = ({ open, onOpenChange, quote, isDemo, onStatusUpdate }: QuoteActionsDialogProps) => {
  const navigate = useNavigate();
  const { settings: appSettings } = useAppSettings();
  const [selectedAction, setSelectedAction] = useState<"accept" | "reject" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-set selectedAction when dialog opens with an accepted quote
  useEffect(() => {
    if (open && quote?.status === "Accepted") {
      setSelectedAction("accept");
    } else if (open) {
      setSelectedAction(null);
    }
  }, [open, quote?.status]);

  const resetDialog = () => {
    setSelectedAction(null);
    setIsProcessing(false);
  };

  // Guard against null quote in handlers
  const handleAccept = async () => {
    if (!quote || isDemo) {
      toast.error(isDemo ? "Cannot update quotes in demo mode" : "No quote selected");
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("quotes")
        .update({ status: "Accepted" })
        .eq("id", quote.id);

      if (error) throw error;

      toast.success("Quote marked as accepted!");
      setSelectedAction("accept");
      onStatusUpdate();
    } catch (error: any) {
      console.error("Error accepting quote:", error);
      toast.error("Failed to accept quote");
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!quote || isDemo) {
      toast.error(isDemo ? "Cannot update quotes in demo mode" : "No quote selected");
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("quotes")
        .update({ status: "Rejected" })
        .eq("id", quote.id);

      if (error) throw error;

      toast.success("Quote marked as rejected");
      onStatusUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error rejecting quote:", error);
      toast.error("Failed to reject quote");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!quote || isDemo) {
      toast.error(isDemo ? "Cannot create invoices in demo mode" : "No quote selected");
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate invoice number
      const { data: existingInvoices, error: countError } = await supabase
        .from("invoices")
        .select("invoice_number")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (countError) throw countError;

      let nextNumber = 1;
      if (existingInvoices && existingInvoices.length > 0) {
        const lastNumber = parseInt(existingInvoices[0].invoice_number.replace(/\D/g, ""));
        nextNumber = lastNumber + 1;
      }

      const invoiceNumber = `INV-${String(nextNumber).padStart(4, "0")}`;

      // Calculate invoice details
      const amount = Number(quote.grand_total || 0);
      const tax = appSettings.include_vat ? amount * 0.2 : 0; // 20% VAT if enabled
      const total = amount + tax;

      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      // Create invoice
      const { error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          quote_id: quote.id,
          invoice_number: invoiceNumber,
          title: quote.title,
          client: quote.client,
          client_id: quote.client_id,
          date: today,
          due_date: dueDateStr,
          amount,
          tax,
          total,
          status: "Draft",
          summary: quote.summary || quote.job_description,
        });

      if (invoiceError) throw invoiceError;

      toast.success("Invoice created successfully! Redirecting...");
      setTimeout(() => {
        navigate(`/invoices${isDemo ? '?demo=true' : ''}`);
      }, 1500);
    } catch (error: any) {
      console.error("Error converting to invoice:", error);
      toast.error("Failed to create invoice");
      setIsProcessing(false);
    }
  };

  const handleScheduleJob = () => {
    if (!quote) return;
    navigate(`/scheduling?scheduleQuote=${quote.id}${isDemo ? '&demo=true' : ''}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetDialog();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        {!quote ? (
          <div className="py-8 text-center text-muted-foreground">
            No quote selected
          </div>
        ) : selectedAction === "accept" || quote.status === "Accepted" ? (
          <>
            <DialogHeader>
              <DialogTitle>Quote Accepted</DialogTitle>
              <DialogDescription>
                What would you like to do next?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100">Quote Accepted</p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Choose your next step
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleConvertToInvoice}
                  disabled={isProcessing || isDemo}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Convert to Invoice
                </Button>
                <Button
                  onClick={handleScheduleJob}
                  disabled={isDemo}
                  variant="outline"
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Schedule Job
                </Button>
              </div>
            </div>
          </>
        ) : quote.status === "Rejected" ? (
          <>
            <DialogHeader>
              <DialogTitle>Quote Rejected</DialogTitle>
              <DialogDescription>
                This quote was rejected by the client.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                <XCircle className="h-6 w-6 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-100">Quote Rejected</p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    No further action available for this quote
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Quote Actions</DialogTitle>
              <DialogDescription>
                Choose an action for this quote
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              <Button
                onClick={handleAccept}
                disabled={isProcessing || isDemo}
                className="w-full gap-2"
                variant="default"
              >
                <CheckCircle className="h-4 w-4" />
                Accept Quote
              </Button>
              <Button
                onClick={handleReject}
                disabled={isProcessing || isDemo}
                className="w-full gap-2"
                variant="destructive"
              >
                <XCircle className="h-4 w-4" />
                Reject Quote
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
