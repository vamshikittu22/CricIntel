
-- Drop existing views
DROP VIEW IF EXISTS public.batting_analytics CASCADE;
DROP VIEW IF EXISTS public.bowling_analytics CASCADE;

-- Drop existing function
DROP FUNCTION IF EXISTS public.head_to_head CASCADE;

-- Drop existing tables
DROP TABLE IF EXISTS public.deliveries CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.players CASCADE;

-- Drop existing enums
DROP TYPE IF EXISTS public.ball_length_type CASCADE;
DROP TYPE IF EXISTS public.ball_line_type CASCADE;
DROP TYPE IF EXISTS public.batting_style CASCADE;
DROP TYPE IF EXISTS public.bowler_type CASCADE;
DROP TYPE IF EXISTS public.bowling_style CASCADE;
DROP TYPE IF EXISTS public.dismissal_type CASCADE;
DROP TYPE IF EXISTS public.match_format CASCADE;
DROP TYPE IF EXISTS public.player_role CASCADE;
DROP TYPE IF EXISTS public.shot_type CASCADE;

-- Create new players table with text PK
CREATE TABLE public.players (
  id text PRIMARY KEY,
  name text NOT NULL,
  country text NOT NULL DEFAULT '',
  gender text NOT NULL DEFAULT 'male',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create new matches table with text PK
CREATE TABLE public.matches (
  id text PRIMARY KEY,
  format text NOT NULL,
  match_type_number integer,
  season text,
  match_date date NOT NULL,
  city text,
  venue text NOT NULL DEFAULT '',
  event_name text,
  match_number integer,
  team_type text,
  team1 text NOT NULL,
  team2 text NOT NULL,
  toss_winner text,
  toss_decision text,
  result text,
  winner text,
  winner_margin_runs integer,
  winner_margin_wickets integer,
  balls_per_over integer NOT NULL DEFAULT 6,
  overs integer,
  gender text NOT NULL DEFAULT 'male',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create match_player_stats table
CREATE TABLE public.match_player_stats (
  match_id text NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id text NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  team text NOT NULL DEFAULT '',
  is_batter boolean NOT NULL DEFAULT false,
  is_bowler boolean NOT NULL DEFAULT false,
  bat_runs integer NOT NULL DEFAULT 0,
  bat_balls integer NOT NULL DEFAULT 0,
  bat_fours integer NOT NULL DEFAULT 0,
  bat_sixes integer NOT NULL DEFAULT 0,
  bat_dismissal_kind text,
  bat_not_out boolean NOT NULL DEFAULT true,
  bowl_overs numeric NOT NULL DEFAULT 0,
  bowl_maidens integer NOT NULL DEFAULT 0,
  bowl_runs integer NOT NULL DEFAULT 0,
  bowl_wickets integer NOT NULL DEFAULT 0,
  bowl_econ numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (match_id, player_id)
);

-- Create player_stats_summary table
CREATE TABLE public.player_stats_summary (
  player_id text NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  format text NOT NULL,
  matches integer NOT NULL DEFAULT 0,
  innings_bat integer NOT NULL DEFAULT 0,
  runs integer NOT NULL DEFAULT 0,
  balls integer NOT NULL DEFAULT 0,
  fours integer NOT NULL DEFAULT 0,
  sixes integer NOT NULL DEFAULT 0,
  not_outs integer NOT NULL DEFAULT 0,
  average numeric,
  strike_rate numeric,
  innings_bowl integer NOT NULL DEFAULT 0,
  overs numeric NOT NULL DEFAULT 0,
  bowl_runs integer NOT NULL DEFAULT 0,
  wickets integer NOT NULL DEFAULT 0,
  econ numeric,
  bowl_average numeric,
  bowl_strike_rate numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, format)
);

-- Create player_phase_stats table (for future use)
CREATE TABLE public.player_phase_stats (
  player_id text NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  format text NOT NULL,
  phase text NOT NULL,
  bat_runs integer NOT NULL DEFAULT 0,
  bat_balls integer NOT NULL DEFAULT 0,
  bat_fours integer NOT NULL DEFAULT 0,
  bat_sixes integer NOT NULL DEFAULT 0,
  bat_dismissals integer NOT NULL DEFAULT 0,
  bat_sr numeric,
  bowl_balls integer NOT NULL DEFAULT 0,
  bowl_runs integer NOT NULL DEFAULT 0,
  bowl_wickets integer NOT NULL DEFAULT 0,
  bowl_econ numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, format, phase)
);

-- Create player_vs_bowling_type table (for future use)
CREATE TABLE public.player_vs_bowling_type (
  player_id text NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  format text NOT NULL,
  bowling_type text NOT NULL,
  bat_runs integer NOT NULL DEFAULT 0,
  bat_balls integer NOT NULL DEFAULT 0,
  bat_fours integer NOT NULL DEFAULT 0,
  bat_sixes integer NOT NULL DEFAULT 0,
  bat_dismissals integer NOT NULL DEFAULT 0,
  bat_sr numeric,
  bat_avg numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (player_id, format, bowling_type)
);

-- Create player_recent_matches_view
CREATE OR REPLACE VIEW public.player_recent_matches_view AS
SELECT
  mps.match_id,
  mps.player_id,
  mps.team,
  mps.is_batter,
  mps.is_bowler,
  mps.bat_runs,
  mps.bat_balls,
  mps.bat_fours,
  mps.bat_sixes,
  mps.bat_dismissal_kind,
  mps.bat_not_out,
  mps.bowl_overs,
  mps.bowl_maidens,
  mps.bowl_runs,
  mps.bowl_wickets,
  mps.bowl_econ,
  m.format,
  m.match_date,
  m.venue,
  m.team1,
  m.team2,
  m.result,
  m.event_name
FROM public.match_player_stats mps
JOIN public.matches m ON m.id = mps.match_id;

-- Enable RLS on all tables
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_phase_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_vs_bowling_type ENABLE ROW LEVEL SECURITY;

-- Public SELECT policies
CREATE POLICY "Public read" ON public.players FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.match_player_stats FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.player_stats_summary FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.player_phase_stats FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.player_vs_bowling_type FOR SELECT USING (true);
