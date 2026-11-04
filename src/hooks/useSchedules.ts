import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const useSchedules = (enabled = true) => {
  const queryClient = useQueryClient();

  // Set up realtime subscription for schedule updates
  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('schedules-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules'
        },
        () => {
          // Invalidate and refetch schedules when any change occurs
          queryClient.invalidateQueries({ queryKey: ["schedules"] });
          // Also invalidate quotes as their status may have changed
          queryClient.invalidateQueries({ queryKey: ["quotes"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);

  return useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("user_id", user.id)
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled,
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
};
