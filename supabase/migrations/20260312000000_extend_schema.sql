-- Migration: Extend Schema for CricIntel
-- Task 1: Fix and Extend the Database Schema

-- 1. Update players table
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS role text,
ADD COLUMN IF NOT EXISTS debut_year integer,
ADD COLUMN IF NOT EXISTS last_played_year integer,
ADD COLUMN IF NOT EXISTS formats_played text[];

-- 2. Update player_stats_summary table
ALTER TABLE public.player_stats_summary 
ADD COLUMN IF NOT EXISTS hundreds integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS fifties integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS best_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS bowl_five_wickets integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS bowl_best_figures text,
ADD COLUMN IF NOT EXISTS dismissals_breakdown jsonb DEFAULT '{}';

-- 3. Ensure player_phase_stats has all required fields
-- (Values already exist in previous migrations, but let's ensure types and defaults)
ALTER TABLE public.player_phase_stats 
ALTER COLUMN bat_runs SET DEFAULT 0,
ALTER COLUMN bat_balls SET DEFAULT 0,
ALTER COLUMN bat_fours SET DEFAULT 0,
ALTER COLUMN bat_sixes SET DEFAULT 0,
ALTER COLUMN bat_dismissals SET DEFAULT 0,
ALTER COLUMN bowl_balls SET DEFAULT 0,
ALTER COLUMN bowl_runs SET DEFAULT 0,
ALTER COLUMN bowl_wickets SET DEFAULT 0;

-- 4. Ensure player_vs_bowling_type has all required fields
ALTER TABLE public.player_vs_bowling_type 
ALTER COLUMN bat_runs SET DEFAULT 0,
ALTER COLUMN bat_balls SET DEFAULT 0,
ALTER COLUMN bat_dismissals SET DEFAULT 0;

-- 5. Update player_recent_matches_view
DROP VIEW IF EXISTS public.player_recent_matches_view;
CREATE VIEW public.player_recent_matches_view AS
SELECT 
    mps.player_id,
    mps.match_id,
    m.match_date,   
    m.format,
    mps.team,
    mps.inning,
    mps.is_batter,
    mps.is_bowler,
    mps.bat_runs,
    mps.bat_balls,
    mps.bat_fours,
    mps.bat_sixes,
    mps.bat_not_out,
    mps.bat_dismissal_kind,
    mps.bowl_overs,
    mps.bowl_runs,
    mps.bowl_wickets,
    mps.bowl_maidens,
    mps.bowl_econ,
    m.venue,
    m.team1,
    m.team2,
    m.result
FROM public.match_player_stats mps
JOIN public.matches m ON m.id = mps.match_id;

-- Ensure RLS is enabled and policies are set (they should be from previous migrations, but no harm in re-applying)
ALTER TABLE public.player_phase_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_vs_bowling_type ENABLE ROW LEVEL SECURITY;

-- Drop and re-create policies to avoid "already exists" errors if they exist, 
-- or just use if not exists if supported (Supabase/PG doesn't support IF NOT EXISTS for policies easily in one line)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Anon read player_phase_stats') THEN
        CREATE POLICY "Anon read player_phase_stats" ON public.player_phase_stats FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Anon read player_vs_bowling_type') THEN
        CREATE POLICY "Anon read player_vs_bowling_type" ON public.player_vs_bowling_type FOR SELECT USING (true);
    END IF;
END $$;
