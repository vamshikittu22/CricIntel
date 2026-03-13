import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TacticalPattern {
  player_id: string;
  format: string;
  phase: string;
  ball_length: string;
  ball_line: string;
  total_balls: number;
  total_runs: number;
  total_dismissals: number;
  strike_rate: number;
  average: number;
}

export interface BowlerPattern {
  player_id: string;
  format: string;
  phase: string;
  ball_length: string;
  ball_line: string;
  total_balls: number;
  runs_conceded: number;
  wickets: number;
  economy: number;
  strike_rate: number;
}

export function useTacticalPatterns(
  playerId: string | undefined,
  format: string,
  options: { role: "striker" | "bowler" } = { role: "striker" }
) {
  return useQuery({
    queryKey: ["tactical-patterns", playerId, format, options.role],
    queryFn: async () => {
      if (!playerId) return null;

      const table = options.role === "striker" ? "player_delivery_patterns" : "bowler_delivery_patterns";
      
      let query = supabase
        .from(table as any)
        .select("*")
        .eq("player_id", playerId);

      if (format && format !== "All") {
        query = query.eq("format", format);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!playerId,
  });
}
