-- Migration: Add Fielding Stats to Player Summary
-- Task: Track catches, stumpings, and run-outs

ALTER TABLE public.player_stats_summary 
ADD COLUMN IF NOT EXISTS catches integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS stumpings integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS run_outs integer DEFAULT 0;

-- Optional: Add to phase stats for deeper analysis
ALTER TABLE public.player_phase_stats 
ADD COLUMN IF NOT EXISTS catches integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS run_outs integer DEFAULT 0;
