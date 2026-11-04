import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Client } from "@/hooks/useClients";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, FileText, Receipt, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
};

interface ClientDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export const ClientDetailsDrawer = ({
  open,
  onOpenChange,
  client,
}: ClientDetailsDrawerProps) => {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (client && open) {
      loadClientData();
    }
  }, [client, open]);

  const loadClientData = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load quotes
      const { data: quotesData } = await supabase
        .from("quotes")
        .select("*")
        .eq("user_id", user.id)
        .or(`client.eq.${client.company_name},client_id.eq.${client.id}`)
        .order("created_at", { ascending: false });

      // Load invoices
      const { data: invoicesData } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", user.id)
        .or(`client.eq.${client.company_name},client_id.eq.${client.id}`)
        .order("created_at", { ascending: false });

      setQuotes(quotesData || []);
      setInvoices(invoicesData || []);
    } catch (error) {
      console.error("Error loading client data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = invoices
    .filter(inv => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.total, 0);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Draft: "bg-muted text-muted-foreground",
      Accepted: "bg-emerald-500/20 text-emerald-600",
      Rejected: "bg-red-500/20 text-red-600",
      Pending: "bg-amber-500/20 text-amber-600",
      Paid: "bg-emerald-500/20 text-emerald-600",
      Overdue: "bg-red-500/20 text-red-600",
    };
    return colors[status] || "bg-muted text-muted-foreground";
  };

  if (!client) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">{client.company_name}</SheetTitle>
          <SheetDescription>Client details and history</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.contact_name && (
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Contact Name</p>
                    <p className="text-sm text-muted-foreground">{client.contact_name}</p>
                  </div>
                </div>
              )}
              {client.email && (
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a href={`mailto:${client.email}`} className="text-sm text-primary hover:underline">
                      {client.email}
                    </a>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <a href={`tel:${client.phone}`} className="text-sm text-primary hover:underline">
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{client.address}</p>
                  </div>
                </div>
              )}
              {client.notes && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{client.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Revenue Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="space-y-2">
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
                    <p className="text-sm text-muted-foreground">Total paid invoices</p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Quotes: </span>
                      <span className="font-medium">{quotes.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Invoices: </span>
                      <span className="font-medium">{invoices.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quotes List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Quotes ({quotes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : quotes.length > 0 ? (
                <div className="space-y-2">
                  {quotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{quote.title}</p>
                          <p className="text-sm text-muted-foreground">{quote.category}</p>
                        </div>
                        <Badge className={getStatusColor(quote.status)} variant="secondary">
                          {quote.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {new Date(quote.created_at).toLocaleDateString()}
                        </span>
                        <span className="font-semibold">{formatCurrency(quote.grand_total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No quotes for this client yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Invoices List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Invoices ({invoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : invoices.length > 0 ? (
                <div className="space-y-2">
                  {invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{invoice.title}</p>
                          <p className="text-sm text-muted-foreground">{invoice.invoice_number}</p>
                        </div>
                        <Badge className={getStatusColor(invoice.status)} variant="secondary">
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Due: {new Date(invoice.due_date).toLocaleDateString()}
                        </span>
                        <span className="font-semibold">{formatCurrency(invoice.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No invoices for this client yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};
