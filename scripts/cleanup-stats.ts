import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanup() {
  console.log("Cleaning up old stats data...");
  
  const { error: err1 } = await supabase.from("match_player_stats").delete().neq("match_id", "force_delete_all");
  if (err1) console.error("Error deleting match_player_stats:", err1.message);
  else console.log("Cleared match_player_stats");

  const { error: err2 } = await supabase.from("player_stats_summary").delete().neq("player_id", "force_delete_all");
  if (err2) console.error("Error deleting player_stats_summary:", err2.message);
  else console.log("Cleared player_stats_summary");

  console.log("Cleanup complete!");
}

cleanup().catch(console.error);
