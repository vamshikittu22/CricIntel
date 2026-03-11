
-- Fix security definer view by recreating with security_invoker
DROP VIEW IF EXISTS public.player_recent_matches_view;
CREATE VIEW public.player_recent_matches_view WITH (security_invoker = true) AS
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
