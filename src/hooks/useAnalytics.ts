import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Types ────────────────────────────────────────────────────────────

export interface BattingCareer {
  player_id: string;
  format: string;
  matches: number;
  innings: number;
  not_outs: number;
  total_runs: number;
  balls_faced: number;
  high_score: number;
  high_score_notout: boolean;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
  ducks: number;
  batting_avg: number | null;
  strike_rate: number | null;
  boundary_pct: number | null;
  updated_at: string;
}

export interface BowlingCareer {
  player_id: string;
  format: string;
  matches: number;
  innings_bowled: number;
  balls_bowled: number;
  runs_conceded: number;
  wickets: number;
  best_figures_w: number;
  best_figures_r: number;
  dot_balls: number;
  maidens: number;
  four_wicket_hauls: number;
  five_wicket_hauls: number;
  bowling_avg: number | null;
  economy: number | null;
  bowling_sr: number | null;
  dot_pct: number | null;
  updated_at: string;
}

export interface FieldingCareer {
  player_id: string;
  format: string;
  matches: number;
  catches: number;
  stumpings: number;
  run_outs: number;
}

export interface PlayerVsOpposition {
  player_id: string;
  opposition: string;
  format: string;
  bat_innings: number;
  bat_runs: number;
  bat_balls: number;
  bat_not_outs: number;
  bat_dismissals: number;
  bat_fifties: number;
  bat_hundreds: number;
  bowl_innings: number;
  bowl_balls: number;
  bowl_runs: number;
  bowl_wickets: number;
  batting_avg: number | null;
  bowling_avg: number | null;
}

export interface H2HRecord {
  batter_id: string;
  bowler_id: string;
  format: string;
  balls: number;
  runs: number;
  dismissals: number;
  dot_balls: number;
  fours: number;
  sixes: number;
  strike_rate: number;
  batting_avg: number | null;
  dot_pct: number;
  last_dismissal_kind: string | null;
  last_encounter: string | null;
}

export interface BattingPosition {
  player_id: string;
  format: string;
  position: number;
  innings: number;
  not_outs: number;
  total_runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  fifties: number;
  hundreds: number;
  ducks: number;
  batting_avg: number | null;
  strike_rate: number | null;
}

export interface Partnership {
  batter1_id: string;
  batter2_id: string;
  format: string;
  innings_together: number;
  total_runs: number;
  balls_faced: number;
  highest_stand: number;
  fifty_stands: number;
  hundred_stands: number;
  run_rate: number | null;
}

export interface PlayerWithCareer {
  id: string;
  name: string;
  country: string;
  gender: string;
  batting: BattingCareer | null;
  bowling: BowlingCareer | null;
  fielding: FieldingCareer | null;
}

// ── Individual Player Hooks ──────────────────────────────────────────

export function usePlayerBattingCareer(playerId: string) {
  return useQuery({
    queryKey: ['analytics', 'batting-career', playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_batting_career')
        .select('*')
        .eq('player_id', playerId)
        .order('format');
      if (error) throw error;
      return data as BattingCareer[];
    },
    enabled: !!playerId,
    staleTime: 1000 * 60 * 10,
  });
}

export function usePlayerBowlingCareer(playerId: string) {
  return useQuery({
    queryKey: ['analytics', 'bowling-career', playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_bowling_career')
        .select('*')
        .eq('player_id', playerId)
        .order('format');
      if (error) throw error;
      return data as BowlingCareer[];
    },
    enabled: !!playerId,
    staleTime: 1000 * 60 * 10,
  });
}

export function usePlayerFieldingCareer(playerId: string) {
  return useQuery({
    queryKey: ['analytics', 'fielding-career', playerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_fielding_career')
        .select('*')
        .eq('player_id', playerId)
        .order('format');
      if (error) throw error;
      return data as FieldingCareer[];
    },
    enabled: !!playerId,
    staleTime: 1000 * 60 * 10,
  });
}

// Full player card with all career data in one query
export function usePlayerFullCareer(playerId: string, format: string) {
  return useQuery({
    queryKey: ['analytics', 'full-career', playerId, format],
    queryFn: async () => {
      const [batting, bowling, fielding] = await Promise.all([
        supabase
          .from('analytics_batting_career')
          .select('*')
          .eq('player_id', playerId)
          .eq('format', format)
          .maybeSingle(),
        supabase
          .from('analytics_bowling_career')
          .select('*')
          .eq('player_id', playerId)
          .eq('format', format)
          .maybeSingle(),
        supabase
          .from('analytics_fielding_career')
          .select('*')
          .eq('player_id', playerId)
          .eq('format', format)
          .maybeSingle(),
      ]);
      if (batting.error) throw batting.error;
      if (bowling.error) throw bowling.error;
      if (fielding.error) throw fielding.error;
      return {
        batting: batting.data as BattingCareer | null,
        bowling: bowling.data as BowlingCareer | null,
        fielding: fielding.data as FieldingCareer | null,
      };
    },
    enabled: !!playerId && !!format,
    staleTime: 1000 * 60 * 10,
  });
}

// ── Comparison Hooks ─────────────────────────────────────────────────

// Returns both players' batting stats in one query — for compare page
export function useCompareBatters(
  player1Id: string,
  player2Id: string,
  format: string
) {
  return useQuery({
    queryKey: ['analytics', 'compare-bat', player1Id, player2Id, format],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_batting_career')
        .select('*, players!inner(id, name, country, gender)')
        .in('player_id', [player1Id, player2Id])
        .eq('format', format);
      if (error) throw error;
      return data;
    },
    enabled: !!player1Id && !!player2Id && !!format,
    staleTime: 1000 * 60 * 10,
  });
}

export function useCompareBowlers(
  player1Id: string,
  player2Id: string,
  format: string
) {
  return useQuery({
    queryKey: ['analytics', 'compare-bowl', player1Id, player2Id, format],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_bowling_career')
        .select('*, players!inner(id, name, country, gender)')
        .in('player_id', [player1Id, player2Id])
        .eq('format', format);
      if (error) throw error;
      return data;
    },
    enabled: !!player1Id && !!player2Id && !!format,
    staleTime: 1000 * 60 * 10,
  });
}

// Allrounder compare — fetches both batting and bowling for two players
export function useCompareAllrounders(
  player1Id: string,
  player2Id: string,
  format: string
) {
  return useQuery({
    queryKey: ['analytics', 'compare-all', player1Id, player2Id, format],
    queryFn: async () => {
      const [batting, bowling] = await Promise.all([
        supabase
          .from('analytics_batting_career')
          .select('*, players!inner(id, name, country, gender)')
          .in('player_id', [player1Id, player2Id])
          .eq('format', format),
        supabase
          .from('analytics_bowling_career')
          .select('*, players!inner(id, name, country, gender)')
          .in('player_id', [player1Id, player2Id])
          .eq('format', format),
      ]);
      if (batting.error) throw batting.error;
      if (bowling.error) throw bowling.error;

      // Merge by player_id into one object per player
      const merged = [player1Id, player2Id].map(pid => ({
        player_id: pid,
        batting: batting.data?.find(b => b.player_id === pid) ?? null,
        bowling: bowling.data?.find(b => b.player_id === pid) ?? null,
        // Allround index: weighted composite score
        allround_index: (() => {
          const bat = batting.data?.find(b => b.player_id === pid);
          const bowl = bowling.data?.find(b => b.player_id === pid);
          if (!bat && !bowl) return null;
          const batScore = (bat?.batting_avg ?? 0) * 0.35 +
                           (bat?.strike_rate ?? 0) * 0.15;
          const bowlScore = bowl?.bowling_avg
            ? Math.max(0, (50 - bowl.bowling_avg)) * 0.35
            : 0;
          const econScore = bowl?.economy
            ? Math.max(0, (12 - bowl.economy)) * 0.15
            : 0;
          return Math.round((batScore + bowlScore + econScore) * 100) / 100;
        })(),
      }));
      return merged;
    },
    enabled: !!player1Id && !!player2Id && !!format,
    staleTime: 1000 * 60 * 10,
  });
}

// ── H2H Hook ─────────────────────────────────────────────────────────

export function useH2H(
  batterId: string,
  bowlerId: string,
  format: string
) {
  return useQuery({
    queryKey: ['analytics', 'h2h', batterId, bowlerId, format],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_player_vs_player')
        .select('*')
        .eq('batter_id', batterId)
        .eq('bowler_id', bowlerId)
        .eq('format', format)
        .maybeSingle();
      if (error) throw error;
      return data as H2HRecord | null;
    },
    enabled: !!batterId && !!bowlerId && !!format,
    staleTime: 1000 * 60 * 10,
  });
}

// All bowlers a batter has faced — for the batter's H2H table
export function useBatterVsAllBowlers(
  batterId: string,
  format: string,
  minBalls = 6
) {
  return useQuery({
    queryKey: ['analytics', 'batter-vs-bowlers', batterId, format, minBalls],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_player_vs_player')
        .select('*, players!bowler_id(id, name, country)')
        .eq('batter_id', batterId)
        .eq('format', format)
        .gte('balls', minBalls)
        .order('balls', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!batterId && !!format,
    staleTime: 1000 * 60 * 10,
  });
}

// All batters a bowler has bowled to — for the bowler's H2H table
export function useBowlerVsAllBatters(
  bowlerId: string,
  format: string,
  minBalls = 6
) {
  return useQuery({
    queryKey: ['analytics', 'bowler-vs-batters', bowlerId, format, minBalls],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_player_vs_player')
        .select('*, players!batter_id(id, name, country)')
        .eq('bowler_id', bowlerId)
        .eq('format', format)
        .gte('balls', minBalls)
        .order('dismissals', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!bowlerId && !!format,
    staleTime: 1000 * 60 * 10,
  });
}

// ── Opposition & Position Hooks ──────────────────────────────────────

export function usePlayerVsOpposition(
  playerId: string,
  format: string
) {
  return useQuery({
    queryKey: ['analytics', 'vs-opposition', playerId, format],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_player_vs_opposition')
        .select('*')
        .eq('player_id', playerId)
        .eq('format', format)
        .order('bat_runs', { ascending: false });
      if (error) throw error;
      return data as PlayerVsOpposition[];
    },
    enabled: !!playerId && !!format,
    staleTime: 1000 * 60 * 10,
  });
}

export function useBattingPosition(
  playerId: string,
  format: string
) {
  return useQuery({
    queryKey: ['analytics', 'batting-position', playerId, format],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_batting_position')
        .select('*')
        .eq('player_id', playerId)
        .eq('format', format)
        .order('position');
      if (error) throw error;
      return data as BattingPosition[];
    },
    enabled: !!playerId && !!format,
    staleTime: 1000 * 60 * 10,
  });
}

// Best partnerships for a player
export function usePlayerPartnerships(
  playerId: string,
  format: string,
  limit = 10
) {
  return useQuery({
    queryKey: ['analytics', 'partnerships', playerId, format],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_partnerships')
        .select('*, b1:players!batter1_id(id, name, country), b2:players!batter2_id(id, name, country)')
        .or(`batter1_id.eq.${playerId},batter2_id.eq.${playerId}`)
        .eq('format', format)
        .order('total_runs', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    enabled: !!playerId && !!format,
    staleTime: 1000 * 60 * 10,
  });
}

// ── Leaderboard Hooks ────────────────────────────────────────────────

export function useAnalyticsTopBatters(
  format: string,
  gender: string = 'male',
  limit = 10
) {
  return useQuery({
    queryKey: ['analytics', 'top-batters', format, gender, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_batting_career')
        .select('*, players!inner(id, name, country, gender)')
        .eq('format', format)
        .eq('players.gender', gender)
        .gte('innings', 10)
        .not('batting_avg', 'is', null)
        .order('batting_avg', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    enabled: !!format,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAnalyticsTopBowlers(
  format: string,
  gender: string = 'male',
  limit = 10
) {
  return useQuery({
    queryKey: ['analytics', 'top-bowlers', format, gender, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_bowling_career')
        .select('*, players!inner(id, name, country, gender)')
        .eq('format', format)
        .eq('players.gender', gender)
        .gte('innings_bowled', 10)
        .not('bowling_avg', 'is', null)
        .order('bowling_avg', { ascending: true })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    enabled: !!format,
    staleTime: 1000 * 60 * 5,
  });
}
