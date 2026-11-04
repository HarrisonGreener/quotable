import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Save } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useClients } from "@/hooks/useClients";
import { ClientAutocomplete } from "@/components/ClientAutocomplete";

interface CreateInvoiceFormProps {
  userId: string;
  onSuccess: () => void;
  isMobile?: boolean;
}

export const CreateInvoiceForm = ({ userId, onSuccess, isMobile = false }: CreateInvoiceFormProps) => {
  const { settings: appSettings } = useAppSettings();
  const { clients } = useClients(true);
  const [title, setTitle] = useState("");
  const [client, setClient] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + (appSettings.payment_terms || 30));
    return date.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);

  // Update due date when date changes
  useEffect(() => {
    if (date) {
      const invoiceDate = new Date(date);
      invoiceDate.setDate(invoiceDate.getDate() + (appSettings.payment_terms || 30));
      setDueDate(invoiceDate.toISOString().split('T')[0]);
    }
  }, [date, appSettings.payment_terms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !client || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const tax = appSettings.include_vat ? numAmount * 0.20 : 0;
      const total = numAmount + tax;

      const { error } = await supabase.from('invoices').insert([{
        user_id: userId,
        invoice_number: `INV-${Date.now()}`,
        title,
        client,
        client_id: selectedClientId,
        date,
        due_date: dueDate,
        amount: numAmount,
        tax,
        total,
        status: 'Pending',
        summary: description || null
      }]);

      if (error) throw error;

      toast.success("Invoice created successfully!");
      
      // Reset form
      setTitle("");
      setClient("");
      setSelectedClientId(null);
      setAmount("");
      setDescription("");
      setDate(new Date().toISOString().split('T')[0]);
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + (appSettings.payment_terms || 30));
      setDueDate(newDueDate.toISOString().split('T')[0]);
      
      onSuccess();
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`shadow-smooth ${isMobile ? 'mx-0' : ''}`}>
      <CardHeader>
        <CardTitle className="font-heading">Create Standalone Invoice</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Kitchen Renovation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Client Name *</Label>
            <ClientAutocomplete
              clients={clients}
              value={client}
              onValueChange={setClient}
              onClientSelect={(selectedClient) => {
                if (selectedClient) {
                  setSelectedClientId(selectedClient.id);
                } else {
                  setSelectedClientId(null);
                }
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Invoice Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (excl. VAT) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
            {amount && !isNaN(parseFloat(amount)) && (
              <p className="text-sm text-muted-foreground">
                {appSettings.include_vat ? (
                  <>VAT (20%): £{(parseFloat(amount) * 0.20).toFixed(2)} | Total: £{(parseFloat(amount) * 1.20).toFixed(2)}</>
                ) : (
                  <>Total: £{parseFloat(amount).toFixed(2)} (No VAT)</>
                )}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the work completed..."
              rows={4}
            />
          </div>

          <Button type="submit" disabled={loading} className={isMobile ? 'w-full' : ''}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Creating..." : "Create Invoice"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
