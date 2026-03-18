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

export interface MatchDetail {
  id: string;
  format: string;
  match_date: string;
  venue: string;
  team1: string;
  team2: string;
  winner: string | null;
  result: string | null;
  toss_winner: string | null;
  toss_decision: string | null;
  event_name: string | null;
}

export interface MatchPlayerStat {
  match_id: string;
  player_id: string;
  player_name: string;
  team: string;
  inning: number;
  is_batter: boolean;
  is_bowler: boolean;
  bat_runs: number;
  bat_balls: number;
  bat_fours: number;
  bat_sixes: number;
  bat_dismissal_kind: string | null;
  bat_not_out: boolean;
  bowl_overs: string;
  bowl_maidens: number;
  bowl_runs: number;
  bowl_wickets: number;
  bowl_econ: string;
}

export interface MatchDelivery {
  id: number;
  match_id: string;
  innings: number;
  over_number: number;
  ball_number: number;
  striker: string;
  non_striker: string;
  bowler: string;
  batting_team: string;
  bowling_team: string;
  runs_off_bat: number;
  extras: number;
  is_wicket: boolean;
  player_dismissed: string | null;
  dismissal_kind: string | null;
  fielder: string | null;
  phase: string;
}

export interface OverSummary {
  overNumber: number;
  innings: number;
  runs: number;
  wickets: number;
  deliveries: MatchDelivery[];
  bowler: string;
  cumulativeRuns: number;
  cumulativeWickets: number;
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

export interface DismissalKind {
  kind: string;
  count: number;
}

// ── Individual Player Hooks ──────────────────────────────────────────

export function usePlayerBattingCareer(playerId: string) {
  return useQuery({
    queryKey: ['analytics', 'batting-career', playerId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('analytics_batting_career')
        .select('*')
        .eq('player_id', playerId)
        .order('format');
      if (error) throw error;
      return (data as BattingCareer[]) || [];
    },
    enabled: !!playerId,
    staleTime: 1000 * 60 * 10,
  });
}

export function usePlayerBowlingCareer(playerId: string) {
  return useQuery({
    queryKey: ['analytics', 'bowling-career', playerId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('analytics_bowling_career')
        .select('*')
        .eq('player_id', playerId)
        .order('format');
      if (error) throw error;
      return (data as BowlingCareer[]) || [];
    },
    enabled: !!playerId,
    staleTime: 1000 * 60 * 10,
  });
}

export function usePlayerFieldingCareer(playerId: string) {
  return useQuery({
    queryKey: ['analytics', 'fielding-career', playerId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('analytics_fielding_career')
        .select('*')
        .eq('player_id', playerId)
        .order('format');
      if (error) throw error;
      return (data as FieldingCareer[]) || [];
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
        (supabase as any)
          .from('analytics_batting_career')
          .select('*')
          .eq('player_id', playerId)
          .eq('format', format)
          .maybeSingle(),
        (supabase as any)
          .from('analytics_bowling_career')
          .select('*')
          .eq('player_id', playerId)
          .eq('format', format)
          .maybeSingle(),
        (supabase as any)
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

export function useBowlerDismissalKinds(bowlerId: string, format: string) {
  return useQuery({
    queryKey: ['analytics', 'dismissal-kinds', bowlerId, format],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_bowler_dismissal_kinds', {
        p_bowler_id: bowlerId,
        p_format: format
      });
      if (error) throw error;
      return (data as any[]).map(d => ({ 
        kind: d.dismissal_kind, 
        count: Number(d.count) 
      })) as DismissalKind[];
    },
    enabled: !!bowlerId && !!format,
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
      const { data, error } = await (supabase as any)
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
      const { data, error } = await (supabase as any)
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
        (supabase as any)
          .from('analytics_batting_career')
          .select('*, players!inner(id, name, country, gender)')
          .in('player_id', [player1Id, player2Id])
          .eq('format', format),
        (supabase as any)
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
        batting: batting.data?.find((b: any) => b.player_id === pid) ?? null,
        bowling: bowling.data?.find((b: any) => b.player_id === pid) ?? null,
        // Allround index: weighted composite score
        allround_index: (() => {
          const bat = batting.data?.find((b: any) => b.player_id === pid);
          const bowl = bowling.data?.find((b: any) => b.player_id === pid);
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
      const { data, error } = await (supabase as any)
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
      const { data, error } = await (supabase as any)
        .from('analytics_player_vs_player')
        .select('*, players!bowler_id(id, name, country)')
        .eq('batter_id', batterId)
        .eq('format', format)
        .gte('balls', minBalls)
        .order('dismissals', { ascending: false })
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
      const { data, error } = await (supabase as any)
        .from('analytics_player_vs_player')
        .select('*, players!batter_id(id, name, country)')
        .eq('bowler_id', bowlerId)
        .eq('format', format)
        .gte('balls', minBalls)
        .gte('balls', minBalls)
        .order('dismissals', { ascending: false })
        .order('balls', { ascending: false });
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
      const { data, error } = await (supabase as any)
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
      const { data, error } = await (supabase as any)
        .from('analytics_batting_position')
        .select('*')
        .eq('player_id', playerId)
        .eq('format', format)
        .order('position');
      if (error) throw error;
      return (data as BattingPosition[]) || [];
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
      const { data, error } = await (supabase as any)
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
      const { data, error } = await (supabase as any)
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
      const { data, error } = await (supabase as any)
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

// ── Match Analysis Hooks ──────────────────────────────────────────

export function useMatchDetail(matchId: string | undefined) {
  return useQuery({
    queryKey: ['match', 'detail', matchId],
    queryFn: async () => {
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId!)
        .single();
      if (matchError) throw matchError;

      const { data: stats, error: statsError } = await (supabase as any)
        .from('match_player_stats')
        .select('*, players!inner(name)')
        .eq('match_id', matchId!);
      if (statsError) throw statsError;

      return {
        match: match as MatchDetail,
        stats: (stats || []).map((s: any) => ({
          ...s,
          player_name: s.players?.name || 'Unknown'
        })) as MatchPlayerStat[]
      };
    },
    enabled: !!matchId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useMatchDeliveries(matchId: string | undefined) {
  return useQuery({
    queryKey: ['match', 'deliveries', matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('match_id', matchId!)
        .order('innings', { ascending: true })
        .order('over_number', { ascending: true })
        .order('ball_number', { ascending: true });
      if (error) throw error;
      return data as MatchDelivery[];
    },
    enabled: !!matchId,
    staleTime: Infinity, // Delivery data is historical/static
  });
}

