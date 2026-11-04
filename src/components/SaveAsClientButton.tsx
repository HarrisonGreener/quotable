import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { AddEditClientDialog } from "@/components/AddEditClientDialog";
import { useClients, Client } from "@/hooks/useClients";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SaveAsClientButtonProps {
  clientName: string;
  address?: string;
  onClientSaved?: (clientId: string) => void;
  disabled?: boolean;
  quoteId?: string;
  invoiceId?: string;
}

export function SaveAsClientButton({ 
  clientName, 
  address, 
  onClientSaved,
  disabled,
  quoteId,
  invoiceId
}: SaveAsClientButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const { createClient } = useClients();

  const handleSaveClient = async (clientData: Omit<Client, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      const newClient = await createClient(clientData);
      
      if (newClient) {
        // Update the quote or invoice with the new client_id
        if (quoteId) {
          await supabase
            .from("quotes")
            .update({ client_id: newClient.id })
            .eq("id", quoteId);
        }
        
        if (invoiceId) {
          await supabase
            .from("invoices")
            .update({ client_id: newClient.id })
            .eq("id", invoiceId);
        }

        // Also update all other quotes and invoices with matching client name
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from("quotes")
            .update({ client_id: newClient.id })
            .eq("user_id", user.id)
            .eq("client", clientName)
            .is("client_id", null);

          await supabase
            .from("invoices")
            .update({ client_id: newClient.id })
            .eq("user_id", user.id)
            .eq("client", clientName)
            .is("client_id", null);
        }

        setShowDialog(false);
        onClientSaved?.(newClient.id);
        toast.success("Client saved and linked to all matching records");
      }
    } catch (error) {
      console.error("Error saving client:", error);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowDialog(true)}
        disabled={disabled}
        title="Save as Client"
      >
        <UserPlus className="w-4 h-4" />
      </Button>

      <AddEditClientDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onSave={handleSaveClient}
        client={showDialog ? {
          id: "",
          user_id: "",
          company_name: clientName,
          address: address || "",
          contact_name: "",
          email: "",
          phone: "",
          notes: "",
          created_at: "",
          updated_at: "",
        } : undefined}
      />
    </>
  );
}
