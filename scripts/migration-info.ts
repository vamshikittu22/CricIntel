import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log("Applying database migration...");

  const sql = `
    -- Add inning column to match_player_stats and update primary key
    ALTER TABLE public.match_player_stats ADD COLUMN IF NOT EXISTS inning integer NOT NULL DEFAULT 1;

    -- To change primary key, we must first drop the existing one
    ALTER TABLE public.match_player_stats DROP CONSTRAINT IF EXISTS match_player_stats_pkey;
    ALTER TABLE public.match_player_stats ADD PRIMARY KEY (match_id, player_id, inning);

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
  `;

  // We can't run raw SQL easily via the standard client without a custom RPC or using postgrest directly in advanced ways.
  // But wait, Supabase JS client doesn't have a .sql() method.
  // I should check if there is an RPC I can use, or if I should just tell the user to run it in the SQL Editor.
  
  // Actually, I can try to use the Postgres connection directly if I had it, but I don't.
  // Let's check if the user has any 'exec_sql' RPC.
  
  console.log("Please run the following SQL in your Supabase SQL Editor:");
  console.log(sql);
}

main();
