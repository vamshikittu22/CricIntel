
-- Add inning column to match_player_stats and update primary key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='match_player_stats' AND column_name='inning') THEN
        ALTER TABLE public.match_player_stats ADD COLUMN inning integer NOT NULL DEFAULT 1;
    END IF;
END $$;

-- Handle Primary Key update
DO $$
BEGIN
    -- Check if the current PK is only (match_id, player_id)
    -- This is a bit complex in SQL, easier to just try to drop and recreate safely
    PERFORM 1 FROM pg_constraint WHERE conname = 'match_player_stats_pkey';
    IF FOUND THEN
        ALTER TABLE public.match_player_stats DROP CONSTRAINT match_player_stats_pkey;
    END IF;
    
    -- Add the new composite PK
    ALTER TABLE public.match_player_stats ADD PRIMARY KEY (match_id, player_id, inning);
EXCEPTION WHEN OTHERS THEN
    -- If PK already includes inning or something else went wrong, we can log or ignore
    RAISE NOTICE 'Primary key update skipped or already applied';
END $$;

-- Update the view to include inning
DROP VIEW IF EXISTS public.player_recent_matches_view;
CREATE VIEW public.player_recent_matches_view WITH (security_invoker = true) AS
SELECT
  mps.match_id,
  mps.player_id,
  mps.inning,
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
