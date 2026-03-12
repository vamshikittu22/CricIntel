import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ── Types ───────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  country: string;
  gender: string;
  role: string | null;
  debut_year: number | null;
  last_played_year: number | null;
  formats_played: string[] | null;
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
  hundreds: number;
  fifties: number;
  best_score: number;
  dismissals_breakdown: Record<string, number>;
  innings_bowl: number;
  overs: number;
  bowl_runs: number;
  wickets: number;
  bowl_five_wickets: number;
  bowl_best_figures: string | null;
  econ: number | null;
  bowl_average: number | null;
  bowl_strike_rate: number | null;
  catches: number;
  stumpings: number;
  run_outs: number;
}

export interface PlayerMatchRow {
  match_id: string;
  player_id: string;
  inning: number;
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

export function usePlayerSearch(query: string, gender: "all" | "male" | "female" = "all") {
  return useQuery({
    queryKey: ["players", "search", query, gender],
    queryFn: async () => {
      let q = supabase.from("players").select("*").order("name").limit(50);
      if (query.trim()) {
        q = q.ilike("name", `%${query.trim()}%`);
      }
      if (gender !== "all") {
        q = q.eq("gender", gender);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as Player[];
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
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
    staleTime: 10 * 60 * 1000,
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
      return (data as unknown) as PlayerSummary[];
    },
    enabled: !!playerId,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to get aggregated totals across all formats for a player
export function usePlayerTotals(playerId: string | undefined) {
  return useQuery({
    queryKey: ["player-totals", playerId],
    queryFn: async () => {
      if (!playerId) return null;
      
      const { data: summaries, error } = await supabase
        .from("player_stats_summary")
        .select("*")
        .eq("player_id", playerId!);
      
      if (error) throw error;
      
      if (!summaries || summaries.length === 0) return null;
      
      // Calculate totals across all formats
      const totals = summaries.reduce((acc, curr) => {
        return {
          matches: (acc.matches || 0) + (curr.matches || 0),
          innings_bat: (acc.innings_bat || 0) + (curr.innings_bat || 0),
          runs: (acc.runs || 0) + (curr.runs || 0),
          balls: (acc.balls || 0) + (curr.balls || 0),
          fours: (acc.fours || 0) + (curr.fours || 0),
          sixes: (acc.sixes || 0) + (curr.sixes || 0),
          not_outs: (acc.not_outs || 0) + (curr.not_outs || 0),
          innings_bowl: (acc.innings_bowl || 0) + (curr.innings_bowl || 0),
          overs: (acc.overs || 0) + (curr.overs || 0),
          bowl_runs: (acc.bowl_runs || 0) + (curr.bowl_runs || 0),
          wickets: (acc.wickets || 0) + (curr.wickets || 0),
        };
      }, {
        matches: 0,
        innings_bat: 0,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        not_outs: 0,
        innings_bowl: 0,
        overs: 0,
        bowl_runs: 0,
        wickets: 0,
      });
      
      // Calculate derived statistics
      const average = totals.innings_bat > 0 && totals.not_outs < totals.innings_bat 
        ? totals.runs / (totals.innings_bat - totals.not_outs) 
        : null;
      
      const strike_rate = totals.balls > 0 
        ? (totals.runs * 100) / totals.balls 
        : null;
      
      const bowl_average = totals.wickets > 0 
        ? totals.bowl_runs / totals.wickets 
        : null;
      
      const bowl_strike_rate = totals.wickets > 0 
        ? (totals.overs * 6) / totals.wickets 
        : null;
      
      const econ = totals.overs > 0 
        ? totals.bowl_runs / totals.overs 
        : null;
      
      return {
        ...totals,
        average: average ? Number(average.toFixed(2)) : null,
        strike_rate: strike_rate ? Number(strike_rate.toFixed(2)) : null,
        bowl_average: bowl_average ? Number(bowl_average.toFixed(2)) : null,
        bowl_strike_rate: bowl_strike_rate ? Number(bowl_strike_rate.toFixed(2)) : null,
        econ: econ ? Number(econ.toFixed(2)) : null,
      };
    },
    enabled: !!playerId,
  });
}

export function usePlayerRecentMatches(playerId: string | undefined, format?: string, limit = 500) {
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
        inning: row.inning,
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

export function useFeaturedPlayers(page = 0, pageSize = 100, country?: string) {
  return useQuery({
    queryKey: ["featured-players", page, pageSize, country],
    queryFn: async () => {
      let q = supabase
        .from("players")
        .select("*")
        .order("name")
        .range(page * pageSize, (page + 1) * pageSize - 1);
        
      if (country && country !== "All Countries") {
        q = q.eq("country", country);
      }
      
      const { data, error } = await q;
      if (error) throw error;
      return data as Player[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCountries() {
  return useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("country")
        .limit(10000);
      if (error) throw error;
      
      // Get unique countries and sort
      const uniqueCountries = [...new Set(data.map(p => p.country))].sort();
      return ["All Countries", ...uniqueCountries];
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
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

export function useRecentMatches(limit = 10, gender?: "all" | "male" | "female", format?: string) {
  return useQuery({
    queryKey: ["recent-matches", limit, gender, format],
    queryFn: async () => {
      let q = supabase
        .from("matches")
        .select("*")
        .order("match_date", { ascending: false })
        .limit(limit);
      if (gender && gender !== "all") {
        q = q.eq("gender", gender);
      }
      if (format && format !== "All") {
        q = q.eq("format", format);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });
}

export function usePlayerVsBowling(playerId: string | undefined, format?: string) {
  return useQuery({
    queryKey: ["player-vs-bowling", playerId, format],
    queryFn: async () => {
      let q = supabase
        .from("player_vs_bowling_type")
        .select("*")
        .eq("player_id", playerId!);
      if (format) q = q.eq("format", format);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!playerId,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlayerPhaseStats(playerId: string | undefined, format?: string) {
  return useQuery({
    queryKey: ["player-phase-stats", playerId, format],
    queryFn: async () => {
      let q = supabase
        .from("player_phase_stats")
        .select("*")
        .eq("player_id", playerId!);
      if (format) q = q.eq("format", format);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!playerId,
    staleTime: 5 * 60 * 1000,
  });
}
