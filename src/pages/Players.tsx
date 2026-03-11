import { AppHeader } from "@/components/AppHeader";
import { PlayerCard } from "@/components/PlayerCard";
import { useFeaturedPlayers } from "@/lib/hooks/usePlayers";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { getFlag } from "@/lib/countryFlags";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const Players = () => {
  const [searchParams] = useSearchParams();
  const country = searchParams.get("country") || "All Countries";
  const { data: players, isLoading } = useFeaturedPlayers(0, 1000, country);
  
  const { data: countData } = useQuery({
    queryKey: ["player-count", country],
    queryFn: async () => {
      let q = supabase.from("players").select("*", { count: "exact", head: true });
      if (country && country !== "All Countries") {
        q = q.eq("country", country);
      }
      const { count } = await q;
      return count || 0;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-4xl">{getFlag(country)}</span>
          <div>
            <h1 className="text-3xl font-bold">{country} Players</h1>
            <p className="text-muted-foreground">
              {countData} players
            </p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players?.map((player, i) => (
              <motion.div 
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.5) }}
              >
                <PlayerCard player={player} />
              </motion.div>
            ))}
          </div>
        )}
        
        {players?.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No players found for this team</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Players;
