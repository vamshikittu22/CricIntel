
-- Create enum types for cricket data
CREATE TYPE public.match_format AS ENUM ('Test', 'ODI', 'T20');
CREATE TYPE public.player_role AS ENUM ('batter', 'bowler', 'all-rounder', 'wicket-keeper');
CREATE TYPE public.batting_style AS ENUM ('right-hand', 'left-hand');
CREATE TYPE public.bowling_style AS ENUM ('right-arm-fast', 'right-arm-medium', 'left-arm-fast', 'left-arm-medium', 'right-arm-offspin', 'right-arm-legspin', 'left-arm-orthodox', 'left-arm-chinaman', 'none');
CREATE TYPE public.ball_length_type AS ENUM ('yorker', 'full', 'good', 'short', 'bouncer');
CREATE TYPE public.ball_line_type AS ENUM ('off-stump', 'middle', 'leg-stump', 'outside-off', 'outside-leg', 'wide');
CREATE TYPE public.shot_type AS ENUM ('drive', 'cut', 'pull', 'hook', 'sweep', 'flick', 'glance', 'defense', 'edge', 'loft', 'scoop', 'reverse-sweep', 'late-cut');
CREATE TYPE public.dismissal_type AS ENUM ('caught', 'bowled', 'lbw', 'run-out', 'stumped', 'hit-wicket', 'caught-behind', 'not-out');
CREATE TYPE public.bowler_type AS ENUM ('pace', 'spin');

-- Players table
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  role public.player_role NOT NULL,
  batting_style public.batting_style NOT NULL,
  bowling_style public.bowling_style NOT NULL DEFAULT 'none',
  photo_url TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Matches table
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_date DATE NOT NULL,
  format public.match_format NOT NULL,
  venue TEXT NOT NULL,
  team1 TEXT NOT NULL,
  team2 TEXT NOT NULL,
  result TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Deliveries table (ball-by-ball core)
CREATE TABLE public.deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  innings INTEGER NOT NULL CHECK (innings BETWEEN 1 AND 4),
  over_number INTEGER NOT NULL CHECK (over_number >= 0),
  ball_number INTEGER NOT NULL CHECK (ball_number BETWEEN 1 AND 6),
  batter_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  bowler_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  runs_batter INTEGER NOT NULL DEFAULT 0,
  runs_extras INTEGER NOT NULL DEFAULT 0,
  is_boundary BOOLEAN NOT NULL DEFAULT false,
  is_six BOOLEAN NOT NULL DEFAULT false,
  is_wicket BOOLEAN NOT NULL DEFAULT false,
  wicket_type public.dismissal_type,
  ball_length public.ball_length_type,
  ball_line public.ball_line_type,
  shot_type public.shot_type,
  bowler_type public.bowler_type,
  scoring_zone INTEGER CHECK (scoring_zone BETWEEN 1 AND 8),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_deliveries_batter ON public.deliveries(batter_id);
CREATE INDEX idx_deliveries_bowler ON public.deliveries(bowler_id);
CREATE INDEX idx_deliveries_match ON public.deliveries(match_id);
CREATE INDEX idx_deliveries_batter_bowler_type ON public.deliveries(batter_id, bowler_type);
CREATE INDEX idx_players_name ON public.players USING gin(to_tsvector('english', name));

-- Enable RLS (public read-only)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read access" ON public.players FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON public.matches FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access" ON public.deliveries FOR SELECT TO anon, authenticated USING (true);

-- Batting analytics view
CREATE OR REPLACE VIEW public.batting_analytics AS
SELECT
  d.batter_id AS player_id,
  m.format,
  COUNT(DISTINCT m.id) AS matches,
  COUNT(*) AS balls_faced,
  SUM(d.runs_batter) AS total_runs,
  ROUND(
    CASE WHEN COUNT(*) FILTER (WHERE d.is_wicket) > 0
      THEN SUM(d.runs_batter)::NUMERIC / COUNT(*) FILTER (WHERE d.is_wicket)
      ELSE SUM(d.runs_batter)::NUMERIC
    END, 2
  ) AS average,
  ROUND(SUM(d.runs_batter)::NUMERIC * 100 / NULLIF(COUNT(*), 0), 2) AS strike_rate,
  COUNT(*) FILTER (WHERE d.runs_batter = 0 AND d.runs_extras = 0) AS dots,
  COUNT(*) FILTER (WHERE d.is_boundary AND NOT d.is_six) AS fours,
  COUNT(*) FILTER (WHERE d.is_six) AS sixes,
  COUNT(*) FILTER (WHERE d.is_wicket) AS dismissals,
  COUNT(*) FILTER (WHERE d.is_wicket AND d.wicket_type = 'caught') AS caught,
  COUNT(*) FILTER (WHERE d.is_wicket AND d.wicket_type = 'bowled') AS bowled_out,
  COUNT(*) FILTER (WHERE d.is_wicket AND d.wicket_type = 'lbw') AS lbw,
  COUNT(*) FILTER (WHERE d.is_wicket AND d.wicket_type = 'run-out') AS run_out,
  COUNT(*) FILTER (WHERE d.is_wicket AND d.wicket_type = 'stumped') AS stumped
FROM public.deliveries d
JOIN public.matches m ON d.match_id = m.id
GROUP BY d.batter_id, m.format;
