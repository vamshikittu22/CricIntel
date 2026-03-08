import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePlayerSearch(query: string) {
  return useQuery({
    queryKey: ["players", "search", query],
    queryFn: async () => {
      let q = supabase.from("players").select("*").order("name");
      if (query.trim()) {
        q = q.ilike("name", `%${query.trim()}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: true,
  });
}

export function usePlayer(id: string | undefined) {
  return useQuery({
    queryKey: ["players", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useBattingAnalytics(playerId: string | undefined, format?: string) {
  return useQuery({
    queryKey: ["batting-analytics", playerId, format],
    queryFn: async () => {
      let q = supabase
        .from("batting_analytics")
        .select("*")
        .eq("player_id", playerId!);
      if (format) {
        q = q.eq("format", format as "Test" | "ODI" | "T20");
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!playerId,
  });
}

export function useDeliveries(playerId: string | undefined, format?: string) {
  return useQuery({
    queryKey: ["deliveries", playerId, format],
    queryFn: async () => {
      let q = supabase
        .from("deliveries")
        .select("*, matches!deliveries_match_id_fkey(format, match_date, team1, team2, venue, result)")
        .eq("batter_id", playerId!);
      const { data, error } = await q;
      if (error) throw error;
      if (format) {
        return data.filter((d: any) => d.matches?.format === format);
      }
      return data;
    },
    enabled: !!playerId,
  });
}

export function useFeaturedPlayers() {
  return useQuery({
    queryKey: ["featured-players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("*")
        .order("name")
        .limit(15);
      if (error) throw error;
      return data;
    },
  });
}
