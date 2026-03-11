import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ── Types ───────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  country: string;
  gender: string;
}

export interface PlayerSummary {
  player_id: string;
  format: string;
  matches: number;
  innings_bat: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  not_outs: number;
  average: number | null;
  strike_rate: number | null;
  innings_bowl: number;
  overs: number;
  bowl_runs: number;
  wickets: number;
  econ: number | null;
  bowl_average: number | null;
  bowl_strike_rate: number | null;
}

export interface PlayerMatchRow {
  match_id: string;
  player_id: string;
  team: string;
  is_batter: boolean;
  is_bowler: boolean;
  bat_runs: number;
  bat_balls: number;
  bat_fours: number;
  bat_sixes: number;
  bat_dismissal_kind: string | null;
  bat_not_out: boolean;
  bowl_overs: number;
  bowl_maidens: number;
  bowl_runs: number;
  bowl_wickets: number;
  bowl_econ: number;
  format: string;
  match_date: string;
  venue: string;
  team1: string;
  team2: string;
  result: string | null;
  event_name: string | null;
}

// ── Hooks ───────────────────────────────────────────

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
      return data as Player[];
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
      return data as Player;
    },
    enabled: !!id,
  });
}

export function usePlayerSummary(playerId: string | undefined) {
  return useQuery({
    queryKey: ["player-summary", playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_stats_summary")
        .select("*")
        .eq("player_id", playerId!);
      if (error) throw error;
      return data as PlayerSummary[];
    },
    enabled: !!playerId,
  });
}

export function usePlayerRecentMatches(playerId: string | undefined, format?: string, limit = 20) {
  return useQuery({
    queryKey: ["player-recent-matches", playerId, format, limit],
    queryFn: async () => {
      let q = supabase
        .from("match_player_stats")
        .select("*, matches!match_player_stats_match_id_fkey(format, match_date, venue, team1, team2, result, event_name)")
        .eq("player_id", playerId!)
        .order("match_id", { ascending: false })
        .limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      // Flatten the join
      const rows = (data as any[]).map((row) => ({
        match_id: row.match_id,
        player_id: row.player_id,
        team: row.team,
        is_batter: row.is_batter,
        is_bowler: row.is_bowler,
        bat_runs: row.bat_runs,
        bat_balls: row.bat_balls,
        bat_fours: row.bat_fours,
        bat_sixes: row.bat_sixes,
        bat_dismissal_kind: row.bat_dismissal_kind,
        bat_not_out: row.bat_not_out,
        bowl_overs: row.bowl_overs,
        bowl_maidens: row.bowl_maidens,
        bowl_runs: row.bowl_runs,
        bowl_wickets: row.bowl_wickets,
        bowl_econ: row.bowl_econ,
        format: row.matches?.format ?? "",
        match_date: row.matches?.match_date ?? "",
        venue: row.matches?.venue ?? "",
        team1: row.matches?.team1 ?? "",
        team2: row.matches?.team2 ?? "",
        result: row.matches?.result ?? null,
        event_name: row.matches?.event_name ?? null,
      })) as PlayerMatchRow[];
      if (format) {
        return rows.filter((r) => r.format === format);
      }
      return rows;
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
      return data as Player[];
    },
  });
}

export function useTopPlayers(format: string, stat: "runs" | "wickets" = "runs", limit = 10) {
  return useQuery({
    queryKey: ["top-players", format, stat, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("player_stats_summary")
        .select("*, players!player_stats_summary_player_id_fkey(name, country)")
        .eq("format", format)
        .order(stat, { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useRecentMatches(limit = 10) {
  return useQuery({
    queryKey: ["recent-matches", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("match_date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as any[];
    },
  });
}
