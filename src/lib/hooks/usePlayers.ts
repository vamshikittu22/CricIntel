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

export function useBowlingAnalytics(playerId: string | undefined, format?: string) {
  return useQuery({
    queryKey: ["bowling-analytics", playerId, format],
    queryFn: async () => {
      let q = supabase
        .from("bowling_analytics" as any)
        .select("*")
        .eq("player_id", playerId!);
      if (format) {
        q = q.eq("format", format);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
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

export function useBowlingDeliveries(playerId: string | undefined, format?: string) {
  return useQuery({
    queryKey: ["bowling-deliveries", playerId, format],
    queryFn: async () => {
      let q = supabase
        .from("deliveries")
        .select("*, matches!deliveries_match_id_fkey(format, match_date, team1, team2, venue, result), players!deliveries_batter_id_fkey(name)")
        .eq("bowler_id", playerId!);
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

export function useHeadToHead(batterId: string | undefined, bowlerId: string | undefined, format?: string) {
  return useQuery({
    queryKey: ["head-to-head", batterId, bowlerId, format],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("head_to_head", {
        p_batter_id: batterId!,
        p_bowler_id: bowlerId!,
        p_format: format || null,
      });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!batterId && !!bowlerId,
  });
}

export function usePlayerOpponents(playerId: string | undefined, role: "batter" | "bowler") {
  return useQuery({
    queryKey: ["opponents", playerId, role],
    queryFn: async () => {
      const col = role === "batter" ? "batter_id" : "bowler_id";
      const oppCol = role === "batter" ? "bowler_id" : "batter_id";
      const fk = role === "batter" ? "deliveries_bowler_id_fkey" : "deliveries_batter_id_fkey";
      const { data, error } = await supabase
        .from("deliveries")
        .select(`${oppCol}, players!${fk}(id, name, country)`)
        .eq(col, playerId!);
      if (error) throw error;
      // Deduplicate opponents
      const seen = new Set<string>();
      const opponents: { id: string; name: string; country: string }[] = [];
      for (const d of data as any[]) {
        const p = d.players;
        if (p && !seen.has(p.id)) {
          seen.add(p.id);
          opponents.push({ id: p.id, name: p.name, country: p.country });
        }
      }
      return opponents.sort((a, b) => a.name.localeCompare(b.name));
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
