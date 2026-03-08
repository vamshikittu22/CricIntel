
-- Bowling analytics view (mirrors batting_analytics but for bowler perspective)
CREATE OR REPLACE VIEW public.bowling_analytics WITH (security_invoker = on) AS
SELECT
  d.bowler_id AS player_id,
  m.format,
  COUNT(DISTINCT m.id) AS matches,
  COUNT(*) AS balls_bowled,
  SUM(d.runs_batter + d.runs_extras) AS runs_conceded,
  SUM(CASE WHEN d.runs_batter = 0 AND d.runs_extras = 0 THEN 1 ELSE 0 END) AS dots,
  SUM(CASE WHEN d.is_wicket AND d.wicket_type != 'run-out' THEN 1 ELSE 0 END) AS wickets,
  CASE WHEN SUM(CASE WHEN d.is_wicket AND d.wicket_type != 'run-out' THEN 1 ELSE 0 END) > 0
    THEN ROUND(SUM(d.runs_batter + d.runs_extras)::numeric / SUM(CASE WHEN d.is_wicket AND d.wicket_type != 'run-out' THEN 1 ELSE 0 END), 2)
    ELSE NULL END AS average,
  ROUND(SUM(d.runs_batter + d.runs_extras)::numeric / NULLIF(COUNT(*), 0) * 6, 2) AS economy,
  ROUND(COUNT(*)::numeric / NULLIF(SUM(CASE WHEN d.is_wicket AND d.wicket_type != 'run-out' THEN 1 ELSE 0 END), 0), 1) AS strike_rate,
  SUM(CASE WHEN d.is_wicket AND d.wicket_type = 'caught' THEN 1 ELSE 0 END) AS caught,
  SUM(CASE WHEN d.is_wicket AND d.wicket_type = 'bowled' THEN 1 ELSE 0 END) AS bowled_out,
  SUM(CASE WHEN d.is_wicket AND d.wicket_type = 'lbw' THEN 1 ELSE 0 END) AS lbw,
  SUM(CASE WHEN d.is_wicket AND d.wicket_type = 'stumped' THEN 1 ELSE 0 END) AS stumped,
  SUM(CASE WHEN d.is_wicket AND d.wicket_type = 'caught-behind' THEN 1 ELSE 0 END) AS caught_behind
FROM public.deliveries d
JOIN public.matches m ON m.id = d.match_id
GROUP BY d.bowler_id, m.format;

-- Head-to-head function: batter vs bowler stats
CREATE OR REPLACE FUNCTION public.head_to_head(p_batter_id uuid, p_bowler_id uuid, p_format text DEFAULT NULL)
RETURNS TABLE(
  format text,
  balls_faced bigint,
  runs_scored bigint,
  dismissals bigint,
  dots bigint,
  fours bigint,
  sixes bigint,
  strike_rate numeric,
  average numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    m.format::text,
    COUNT(*)::bigint AS balls_faced,
    SUM(d.runs_batter)::bigint AS runs_scored,
    SUM(CASE WHEN d.is_wicket THEN 1 ELSE 0 END)::bigint AS dismissals,
    SUM(CASE WHEN d.runs_batter = 0 THEN 1 ELSE 0 END)::bigint AS dots,
    SUM(CASE WHEN d.is_boundary THEN 1 ELSE 0 END)::bigint AS fours,
    SUM(CASE WHEN d.is_six THEN 1 ELSE 0 END)::bigint AS sixes,
    ROUND(SUM(d.runs_batter)::numeric / NULLIF(COUNT(*), 0) * 100, 2) AS strike_rate,
    CASE WHEN SUM(CASE WHEN d.is_wicket THEN 1 ELSE 0 END) > 0
      THEN ROUND(SUM(d.runs_batter)::numeric / SUM(CASE WHEN d.is_wicket THEN 1 ELSE 0 END), 2)
      ELSE NULL END AS average
  FROM deliveries d
  JOIN matches m ON m.id = d.match_id
  WHERE d.batter_id = p_batter_id
    AND d.bowler_id = p_bowler_id
    AND (p_format IS NULL OR m.format::text = p_format)
  GROUP BY m.format;
$$;
