
-- Fix security definer view by recreating with security_invoker
DROP VIEW IF EXISTS public.batting_analytics;
CREATE OR REPLACE VIEW public.batting_analytics WITH (security_invoker = on) AS
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
