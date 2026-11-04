import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const useQuoteTemplates = (enabled = true) => {
  const queryClient = useQueryClient();

  // Set up realtime subscription for template updates
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('quote_templates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quote_templates'
        },
        () => {
          // Invalidate and refetch templates when any change occurs
          queryClient.invalidateQueries({ queryKey: ["quote_templates"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);

  return useQuery({
    queryKey: ["quote_templates"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("quote_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
};
