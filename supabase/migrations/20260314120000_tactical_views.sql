-- Migration: Tactical Intelligence Views
-- Task: Create views for delivery patterns to enable deep tactical analysis

-- 1. Create player_delivery_patterns view
-- Aggregates batting performance by length, line, and phase
CREATE OR REPLACE VIEW public.player_delivery_patterns AS
SELECT 
    d.striker as player_id,
    m.format,
    d.phase,
    d.ball_length,
    d.ball_line,
    COUNT(*) as total_balls,
    SUM(d.runs_off_bat) as total_runs,
    SUM(CASE WHEN d.is_wicket THEN 1 ELSE 0 END) as total_dismissals,
    CASE 
        WHEN COUNT(*) > 0 THEN (SUM(d.runs_off_bat)::float / COUNT(*)) * 100 
        ELSE 0 
    END as strike_rate,
    CASE 
        WHEN SUM(CASE WHEN d.is_wicket THEN 1 ELSE 0 END) > 0 
        THEN SUM(d.runs_off_bat)::float / SUM(CASE WHEN d.is_wicket THEN 1 ELSE 0 END)
        ELSE SUM(d.runs_off_bat)::float
    END as average
FROM public.deliveries d
JOIN public.matches m ON m.id = d.match_id
GROUP BY d.striker, m.format, d.phase, d.ball_length, d.ball_line;

-- 2. Create bowler_delivery_patterns view
-- Aggregates bowling performance by length, line, and phase
CREATE OR REPLACE VIEW public.bowler_delivery_patterns AS
SELECT 
    d.bowler as player_id,
    m.format,
    d.phase,
    d.ball_length,
    d.ball_line,
    COUNT(*) as total_balls,
    SUM(d.runs_off_bat + d.extras) as runs_conceded,
    SUM(CASE WHEN d.is_wicket AND d.dismissal_kind NOT IN ('run out', 'retired hurt', 'obstructing the field') THEN 1 ELSE 0 END) as wickets,
    CASE 
        WHEN COUNT(*) > 0 THEN (SUM(d.runs_off_bat + d.extras)::float / COUNT(*)) * 6
        ELSE 0 
    END as economy,
    CASE 
        WHEN SUM(CASE WHEN d.is_wicket AND d.dismissal_kind NOT IN ('run out', 'retired hurt', 'obstructing the field') THEN 1 ELSE 0 END) > 0 
        THEN (COUNT(*)::float / SUM(CASE WHEN d.is_wicket AND d.dismissal_kind NOT IN ('run out', 'retired hurt', 'obstructing the field') THEN 1 ELSE 0 END))
        ELSE 0 
    END as strike_rate
FROM public.deliveries d
JOIN public.matches m ON m.id = d.match_id
GROUP BY d.bowler, m.format, d.phase, d.ball_length, d.ball_line;

-- 3. Enable RLS for views (exposed by Supabase automatically if underlying tables have RLS, but policies are needed for the views if we want explicit control)
-- Supabase views inherit RLS from underlying tables by default. 
-- Since 'players', 'matches', and 'deliveries' have RLS enabled with public read access, these views are safe.

-- 4. Create an index on deliveries to speed up these views (if not already present)
-- We already have indexes on striker, bowler, match_id.
-- Let's ensure ball_length and ball_line are indexed for the aggregation.
CREATE INDEX IF NOT EXISTS idx_deliveries_length_line ON public.deliveries(ball_length, ball_line);
CREATE INDEX IF NOT EXISTS idx_deliveries_phase ON public.deliveries(phase);
