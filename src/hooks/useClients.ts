import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

export interface Client {
  id: string;
  user_id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useClients = (enabled: boolean = true) => {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadClients = async () => {
    if (!enabled || isDemo) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .order("company_name", { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error loading clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setIsLoading(false);
    }
  };

  const createClient = async (clientData: Omit<Client, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("clients")
        .insert([{ ...clientData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Client added successfully");
      await loadClients();
      return data;
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("Failed to add client");
      throw error;
    }
  };

  const updateClient = async (id: string, clientData: Partial<Omit<Client, "id" | "user_id" | "created_at" | "updated_at">>) => {
    try {
      const { error } = await supabase
        .from("clients")
        .update(clientData)
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Client updated successfully");
      await loadClients();
    } catch (error) {
      console.error("Error updating client:", error);
      toast.error("Failed to update client");
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Client deleted successfully");
      await loadClients();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Failed to delete client");
      throw error;
    }
  };

  const getUnsavedClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get all quotes and invoices without client_id
      const { data: quotesData } = await supabase
        .from("quotes")
        .select("client, location, id")
        .eq("user_id", user.id)
        .is("client_id", null);

      const { data: invoicesData } = await supabase
        .from("invoices")
        .select("client, id")
        .eq("user_id", user.id)
        .is("client_id", null);

      // Deduplicate by client name
      const unsavedMap = new Map<string, { name: string; location?: string; quoteCount: number; invoiceCount: number }>();

      quotesData?.forEach((quote) => {
        const existing = unsavedMap.get(quote.client) || { name: quote.client, location: quote.location, quoteCount: 0, invoiceCount: 0 };
        existing.quoteCount++;
        if (!existing.location && quote.location) existing.location = quote.location;
        unsavedMap.set(quote.client, existing);
      });

      invoicesData?.forEach((invoice) => {
        const existing = unsavedMap.get(invoice.client) || { name: invoice.client, quoteCount: 0, invoiceCount: 0 };
        existing.invoiceCount++;
        unsavedMap.set(invoice.client, existing);
      });

      return Array.from(unsavedMap.values());
    } catch (error) {
      console.error("Error loading unsaved clients:", error);
      return [];
    }
  };

  useEffect(() => {
    if (enabled) {
      loadClients();
    }
  }, [enabled, isDemo]);

  return {
    clients,
    isLoading,
    createClient,
    updateClient,
    deleteClient,
    refetch: loadClients,
    getUnsavedClients,
  };
};
