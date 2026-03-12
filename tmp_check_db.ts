import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
async function check() {
  const { data, error } = await supabase.from("player_stats_summary").select("*").limit(1);
  if (error) {
    console.error(error);
  } else if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]).join(", "));
  } else {
    // try to get columns via information_schema query
    const { data: cols, error: err2 } = await supabase.rpc('get_table_columns', { table_name: 'player_stats_summary' });
    if (err2) console.error("No data and RPC failed");
    else console.log("Columns (RPC):", cols);
  }
}
check();
