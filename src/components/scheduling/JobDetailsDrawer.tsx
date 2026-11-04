import { useState } from "react";
import { format, addDays } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Receipt, 
  CheckCircle2, 
  Trash2, 
  Calendar,
  DollarSign,
  Eye,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuotes } from "@/hooks/useQuotes";
import { demoQuotes } from "@/data/demoData";
import { cn } from "@/lib/utils";
import { useAppSettings } from "@/hooks/useAppSettings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface JobDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: any;
  isDemo: boolean;
}

export const JobDetailsDrawer = ({
  open,
  onOpenChange,
  schedule,
  isDemo,
}: JobDetailsDrawerProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { settings: appSettings } = useAppSettings();
  const { data: dbQuotes = [] } = useQuotes(!isDemo);
  const quotes = isDemo ? demoQuotes : dbQuotes;
  
  const [loading, setLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  if (!schedule) return null;

  const quote = quotes.find((q: any) => q.id === (schedule.quote_id || schedule.quoteId));
  if (!quote) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "draft": return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
      case "scheduled": return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
      case "in progress": return "bg-orange-500/20 text-orange-700 dark:text-orange-300";
      case "completed": return "bg-teal-500/20 text-teal-700 dark:text-teal-300";
      case "invoiced": return "bg-purple-500/20 text-purple-700 dark:text-purple-300";
      case "paid": return "bg-green-500/20 text-green-700 dark:text-green-300";
      default: return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
    }
  };

  const handleViewQuote = () => {
    navigate(`/quotes?id=${quote.id}`);
    onOpenChange(false);
  };

  const handleConvertToInvoice = async () => {
    if (isDemo) {
      toast.error("Demo mode: Cannot create invoices");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate invoice number
      const { count } = await supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const invoiceNumber = `INV-${String((count || 0) + 1).padStart(4, "0")}`;
      const today = new Date();
      const dueDate = addDays(today, 30);

      const subtotal = (quote as any).total_materials + (quote as any).total_labour + (quote as any).total_overheads;
      const tax = appSettings.include_vat ? subtotal * 0.20 : 0;
      const total = subtotal + tax;

      const { data: invoice, error } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          quote_id: quote.id,
          invoice_number: invoiceNumber,
          client: quote.client,
          client_id: (quote as any).client_id || null,
          title: quote.title,
          amount: subtotal,
          tax: tax,
          total: total,
          date: format(today, "yyyy-MM-dd"),
          due_date: format(dueDate, "yyyy-MM-dd"),
          status: "Sent",
        })
        .select()
        .single();

      if (error) throw error;

      // Update quote status
      await supabase
        .from("quotes")
        .update({ status: "Invoiced" })
        .eq("id", quote.id);

      setInvoiceId(invoice.id);
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      
      toast.success("Invoice created successfully", {
        description: `Invoice ${invoiceNumber} created with 30-day payment window`
      });
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (isDemo) {
      toast.error("Demo mode: Cannot update invoices");
      return;
    }

    if (!invoiceId) {
      // Find existing invoice for this quote
      try {
        const { data: existingInvoice } = await supabase
          .from("invoices")
          .select("id")
          .eq("quote_id", quote.id)
          .single();

        if (!existingInvoice) {
          toast.error("No invoice found for this job");
          return;
        }

        setInvoiceId(existingInvoice.id);
      } catch (error) {
        toast.error("No invoice found for this job");
        return;
      }
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "Paid" })
        .eq("id", invoiceId);

      if (error) throw error;

      // Update quote status
      await supabase
        .from("quotes")
        .update({ status: "Paid" })
        .eq("id", quote.id);

      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });

      toast.success("Invoice marked as paid", {
        description: "Payment recorded successfully"
      });
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      toast.error("Failed to update invoice status");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteJob = async () => {
    if (isDemo) {
      toast.error("Demo mode: Cannot update job status");
      return;
    }

    setLoading(true);
    try {
      await supabase
        .from("quotes")
        .update({ status: "Completed" })
        .eq("id", quote.id);

      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      
      toast.success("Job marked as completed");
    } catch (error) {
      console.error("Error completing job:", error);
      toast.error("Failed to update job status");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isDemo) {
      toast.error("Demo mode: Cannot delete schedules");
      setShowDeleteDialog(false);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("schedules")
        .delete()
        .eq("id", schedule.id);

      if (error) throw error;

      // Reset quote status to draft
      await supabase
        .from("quotes")
        .update({ status: "Draft" })
        .eq("id", quote.id);

      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["quotes"] });

      toast.success("Schedule removed from calendar");
      onOpenChange(false);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast.error("Failed to delete schedule");
    } finally {
      setLoading(false);
    }
  };

  const isInvoiced = quote.status?.toLowerCase() === "invoiced" || quote.status?.toLowerCase() === "paid";
  const isPaid = quote.status?.toLowerCase() === "paid";
  const isCompleted = quote.status?.toLowerCase() === "completed";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Job Details</SheetTitle>
            <SheetDescription>
              View and manage scheduled job details
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg">{quote.client}</h3>
                <Badge className={cn("text-xs", getStatusColor(quote.status))}>
                  {quote.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{quote.title}</p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Start Date & Time</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(schedule.start_date || schedule.startDate), "PPP")}
                    {(schedule.start_time || schedule.startTime) && (
                      <span className="ml-2">at {(schedule.start_time || schedule.startTime).substring(0, 5)}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">End Date</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(schedule.end_date || schedule.endDate), "PPP")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">
                    {schedule.duration_days || schedule.durationDays} day(s)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Quote Amount</p>
                  <p className="text-sm text-muted-foreground">
                    £{((quote as any).total || (quote as any).grand_total)?.toLocaleString()}
                  </p>
                </div>
              </div>

              {(schedule.notes || schedule.notes === "") && schedule.notes && (
                <div>
                  <p className="text-sm font-medium mb-2">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {schedule.notes}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={handleViewQuote}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Quote Details
              </Button>

              {!isCompleted && !isInvoiced && (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleCompleteJob}
                  disabled={loading}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Completed
                </Button>
              )}

              {!isInvoiced && (
                <Button 
                  className="w-full" 
                  variant="default"
                  onClick={handleConvertToInvoice}
                  disabled={loading}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  {loading ? "Creating Invoice..." : "Convert to Invoice"}
                </Button>
              )}

              {isInvoiced && !isPaid && (
                <Button 
                  className="w-full" 
                  variant="default"
                  onClick={handleMarkPaid}
                  disabled={loading}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  {loading ? "Updating..." : "Mark Invoice as Paid"}
                </Button>
              )}

              {isPaid && (
                <div className="bg-green-500/10 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-medium">Invoice Paid</span>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove from Calendar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the job from the calendar and reset the quote status to Draft. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
