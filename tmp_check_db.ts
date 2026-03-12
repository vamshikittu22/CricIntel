import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

async function run() {
  const { count, error } = await supabase.from("player_stats_summary").select("*", { count: "exact", head: true });
  console.log("Count:", count, "Error:", error);
}

run();
