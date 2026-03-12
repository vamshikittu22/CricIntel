import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!);

async function run() {
  const { data, error } = await supabase
    .from("player_stats_summary")
    .select("*, players!inner(name, country, gender)")
    .eq("format", "ODI")
    .order("runs", { ascending: false }).limit(10);
  console.log("Batters count:", data?.length, "Error:", error);
}

run();
