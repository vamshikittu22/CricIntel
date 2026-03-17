-- Migration: Fix Tactical Views and Deliveries Constraints
-- Task: Resolve player_id mapping and prevent duplicate deliveries

-- 1. Add unique constraint to deliveries to prevent duplicate imports
-- Using match_id, innings, over_number, ball_number as unique identifier
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_delivery') THEN
        ALTER TABLE public.deliveries 
        ADD CONSTRAINT unique_delivery UNIQUE (match_id, innings, over_number, ball_number);
    END IF;
END $$;

-- 2. Fix player_delivery_patterns view to use player IDs instead of names
-- This ensures useTacticalPatterns hook works correctly with Cricsheet IDs
CREATE OR REPLACE VIEW public.player_delivery_patterns AS
SELECT 
    p.id as player_id,
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
JOIN public.players p ON p.name = d.striker
GROUP BY p.id, m.format, d.phase, d.ball_length, d.ball_line;

-- 3. Fix bowler_delivery_patterns view to use player IDs instead of names
CREATE OR REPLACE VIEW public.bowler_delivery_patterns AS
SELECT 
    p.id as player_id,
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
JOIN public.players p ON p.name = d.bowler
GROUP BY p.id, m.format, d.phase, d.ball_length, d.ball_line;
