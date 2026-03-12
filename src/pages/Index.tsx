import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { useFeaturedPlayers, useCountries } from "@/lib/hooks/usePlayers";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getFlag } from "@/lib/countryFlags";
import { Clock, TrendingUp, User, UserCheck, Swords, Target, RefreshCw, Trophy, Zap, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { safeStorage } from "@/lib/safeStorage";

const genderFilters = [
  { value: "all", label: "All" },
  { value: "male", label: "Men" },
  { value: "female", label: "Women" },
];

const Index = () => {
  const navigate = useNavigate();
  const [recentSearches, setRecentSearches] = useState<{ id: string; name: string; country: string }[]>([]);
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const [activeFormat, setActiveFormat] = useState("All");
  const [activeCountry, setActiveCountry] = useState("All Countries");
  const bannerRef = useRef<HTMLDivElement>(null);
  const featuredCategories = ["topScorers", "mostBoundaries", "highestAverage", "bestStrikeRate", "mostWickets", "bestBowlingAvg", "mostFiveWicketHauls"];

  // Map UI format values to database format values
  // Based on the import script, formats are stored as: Test, ODI, T20I
  const getDbFormat = (format: string): string => {
    if (format === "T20") return "T20I";
    if (format === "ODI") return "ODI";
    if (format === "Test") return "Test";
    return format;
  };

  const { data: countries } = useCountries();

  // Fetch ALL player stats summaries once and cache it
  const { data: allStatsRaw, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ["player-stats-all"],
    queryFn: async () => {
      const cached = safeStorage.getItem("cricintel_stats_cache");
      
      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      try {
        while (hasMore) {
          const { data, error } = await supabase
            .from("player_stats_summary")
            .select("*, players!inner(name, country, gender)")
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (error) throw error;
          
          if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (data.length < pageSize) hasMore = false;
            page++;
          } else {
            hasMore = false;
          }
        }

        if (allData.length > 0) {
          safeStorage.setItem("cricintel_stats_cache", JSON.stringify(allData));
          return allData;
        }
      } catch (err) {
        console.error("Error fetching stats pages:", err);
        if (cached) return JSON.parse(cached);
        throw err;
      }
      
      return cached ? JSON.parse(cached) : [];
    },
    staleTime: 10 * 60 * 1000, 
  });

  // Calculate top batters, bowlers and featured categories in memory
  const processedData = useMemo(() => {
    if (!allStatsRaw) return null;

    // Filter by gender and format first
    const filtered = allStatsRaw.filter((stat: any) => {
      if (!stat.players) return false;
      
      const pGender = stat.players.gender?.toLowerCase();
      const fGender = genderFilter.toLowerCase();
      const genderMatch = fGender === "all" || pGender === fGender;
      
      const pFormat = stat.format?.toUpperCase();
      const fFormat = getDbFormat(activeFormat).toUpperCase();
      const formatMatch = activeFormat === "All" || pFormat === fFormat;
      
      return genderMatch && formatMatch;
    });

    // If activeFormat is NOT "All", we can just use the records directly
    // If it IS "All", we need to aggregate across formats for each player
    let aggregated: any[] = [];
    if (activeFormat !== "All") {
      aggregated = filtered;
    } else {
      const playerMap = new Map<string, any>();
      filtered.forEach((stat: any) => {
        const pid = stat.player_id;
        if (!playerMap.has(pid)) {
          playerMap.set(pid, {
            ...stat,
            matches: 0, runs: 0, balls: 0, fours: 0, sixes: 0, not_outs: 0,
            innings_bat: 0, innings_bowl: 0, overs: 0, bowl_runs: 0, wickets: 0
          });
        }
        const p = playerMap.get(pid);
        p.matches += stat.matches || 0;
        p.runs += stat.runs || 0;
        p.balls += stat.balls || 0;
        p.fours += stat.fours || 0;
        p.sixes += stat.sixes || 0;
        p.not_outs += stat.not_outs || 0;
        p.innings_bat += stat.innings_bat || 0;
        p.innings_bowl += stat.innings_bowl || 0;
        p.overs += stat.overs || 0;
        p.bowl_runs += stat.bowl_runs || 0;
        p.wickets += stat.wickets || 0;
      });
      // Re-calculate averages for the aggregate
      aggregated = Array.from(playerMap.values()).map(p => {
        const dismissals = p.innings_bat - p.not_outs;
        p.average = dismissals > 0 ? Math.round((p.runs / dismissals) * 100) / 100 : null;
        p.strike_rate = p.balls > 0 ? Math.round((p.runs / p.balls) * 10000) / 100 : null;
        p.bowl_average = p.wickets > 0 ? Math.round((p.bowl_runs / p.wickets) * 100) / 100 : null;
        p.econ = p.overs > 0 ? Math.round((p.bowl_runs / p.overs) * 100) / 100 : null;
        return p;
      });
    }

    // Pre-calculate categories for leaderboards and cards
    return {
      topBatters: [...aggregated].sort((a, b) => (b.runs || 0) - (a.runs || 0)).slice(0, 10),
      topBowlers: [...aggregated].sort((a, b) => (b.wickets || 0) - (a.wickets || 0)).slice(0, 10),
      topScorers: [...aggregated].sort((a, b) => (b.runs || 0) - (a.runs || 0)).slice(0, 5),
      mostBoundaries: aggregated.map(p => ({ ...p, boundaries: (p.fours || 0) + (p.sixes || 0) }))
        .sort((a, b) => b.boundaries - a.boundaries).slice(0, 5),
      highestAverage: [...aggregated].filter(p => p.average > 0).sort((a, b) => b.average - a.average).slice(0, 5),
      bestStrikeRate: [...aggregated].filter(p => p.strike_rate > 0).sort((a, b) => b.strike_rate - a.strike_rate).slice(0, 5),
      mostWickets: [...aggregated].sort((a, b) => (b.wickets || 0) - (a.wickets || 0)).slice(0, 5),
      bestBowlingAvg: [...aggregated].filter(p => p.bowl_average > 0).sort((a, b) => a.bowl_average - b.bowl_average).slice(0, 5),
    };
  }, [allStatsRaw, genderFilter, activeFormat]);

  const { data: mostFiveWicketHauls } = useQuery({
    queryKey: ["featured-most-5fors", genderFilter, activeFormat],
    queryFn: async () => {
      const dbFormat = getDbFormat(activeFormat);
      
      let q = supabase
        .from("match_player_stats")
        .select("player_id, bowl_wickets, matches!inner(format, gender), players!inner(name, country, gender)")
        .gte("bowl_wickets", 5);

      if (genderFilter !== "all") {
        q = q.eq("players.gender", genderFilter);
      }
      
      if (activeFormat !== "All") {
        q = q.eq("matches.format", dbFormat);
      }

      const { data: hauls } = await q;
      if (!hauls) return [];

      const playerHauls = new Map<string, any>();
      for (const haul of hauls) {
        if (!playerHauls.has(haul.player_id)) {
          playerHauls.set(haul.player_id, { 
            player_id: haul.player_id, 
            players: haul.players, 
            count: 0 
          });
        }
        playerHauls.get(haul.player_id).count++;
      }
      return Array.from(playerHauls.values()).sort((a, b) => b.count - a.count).slice(0, 5);
    },
    staleTime: 15 * 60 * 1000,
  });

  const hashFormat = (f: any) => f === "T20" ? "T20I" : f;

  const { data: dateRange } = useQuery({
    queryKey: ["date-range", genderFilter, activeFormat],
    queryFn: async () => {
      let q1 = supabase.from("matches").select("match_date");
      let q2 = supabase.from("matches").select("match_date");
      if (activeFormat !== "All") {
        q1 = q1.eq("format", getDbFormat(activeFormat));
        q2 = q2.eq("format", getDbFormat(activeFormat));
      }
      if (genderFilter !== "all") {
        q1 = q1.eq("gender", genderFilter);
        q2 = q2.eq("gender", genderFilter);
      }
      const { data } = await q1.order("match_date", { ascending: true }).limit(1);
      const { data: data2 } = await q2.order("match_date", { ascending: false }).limit(1);
      return { start: data?.[0]?.match_date, end: data2?.[0]?.match_date };
    },
    staleTime: 60 * 60 * 1000,
  });

  useEffect(() => {
    const stored = safeStorage.getItem("cricintel_recent");
    if (stored) {
      try { setRecentSearches(JSON.parse(stored)); } catch { }
    }
  }, []);

  const handlePlayerClick = (playerId: string, playerName: string, playerCountry: string) => {
    const updated = [{ id: playerId, name: playerName, country: playerCountry }, ...recentSearches.filter(r => r.id !== playerId)].slice(0, 10);
    setRecentSearches(updated);
    safeStorage.setItem("cricintel_recent", JSON.stringify(updated));
    navigate(`/player/${playerId}`);
  };

  const formatYear = (dateStr: string) => new Date(dateStr).getFullYear();
  const periodText = dateRange?.start && dateRange?.end 
    ? `${formatYear(dateRange.start)} - ${formatYear(dateRange.end)}`
    : "";

  const renderFeaturedCard = (title: string, players: any[], stat: string, color: string, Icon: React.ElementType) => {
    const colorMap: Record<string, string> = {
      emerald: "bg-emerald-500",
      orange: "bg-orange-500",
      blue: "bg-blue-500",
      purple: "bg-purple-500",
      red: "bg-red-500",
      pink: "bg-pink-500",
      amber: "bg-amber-500",
    };
    const colorClass = colorMap[color] || colorMap.emerald;
    
    const getStatValue = (player: any) => {
      if (stat === "runs") return player.runs?.toLocaleString() + " runs";
      if (stat === "boundaries") return player.boundaries + " boundaries";
      if (stat === "average") return player.average?.toFixed(2) + " avg";
      if (stat === "strike_rate") return player.strike_rate?.toFixed(2) + " SR";
      if (stat === "wickets") return player.wickets?.toLocaleString() + " wickets";
      if (stat === "bowl_average") return player.bowl_average?.toFixed(2) + " avg";
      if (stat === "count") return player.count + " five-fors";
      return "";
    };

    return (
      <div className="min-w-[280px] flex-shrink-0 card-hover p-5 mx-3 rounded-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className={`p-2.5 ${colorClass} rounded-xl shadow-lg ring-4 ring-background`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div className="text-right">
            <h3 className="text-sm font-bold uppercase tracking-wider">{title}</h3>
            <span className="text-[10px] text-muted-foreground font-bold">{activeFormat}</span>
          </div>
        </div>
        {players && players.length > 0 ? (
          <div className="space-y-3">
            {players.map((player, index) => (
              <div
                key={player.player_id}
                className="group flex items-center gap-3 py-1 cursor-pointer"
                onClick={() => handlePlayerClick(player.player_id, player.players?.name || "Player", player.players?.country || "")}
              >
                <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  index === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 
                  'bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold truncate text-sm">{player.players?.name}</span>
                    <span className="text-sm">{getFlag(player.players?.country || "")}</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <span className="text-xs text-muted-foreground">{player.players?.country}</span>
                    <span className="text-xs font-bold mono text-primary">{getStatValue(player)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <RefreshCw className="w-8 h-8 opacity-20 mb-2" />
            <p className="text-xs font-medium">No data available</p>
          </div>
        )}
      </div>
    );
  };


  const renderTopPlayers = (title: string, players: any[], stat: string, label: string, Icon: React.ElementType, direction: "left" | "right") => {
    if (!players || players.length === 0) return null;

    return (
      <div className="mb-12">
        <div className="container mx-auto px-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{title}</h2>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{activeFormat} Leaderboard {periodText && `• ${periodText}`}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-primary font-bold hover:bg-primary/5 rounded-full">
            View All
          </Button>
        </div>
        <div className="overflow-hidden py-4">
          <div className="flex gap-6 animate-scroll" style={{ animationName: direction === "left" ? "scroll-left" : "scroll-right", animationDuration: "40s", width: `calc(300px * ${players.length * 2})` }}>
            {[...players, ...players].map((p: any, idx: number) => {
              const playerData = p.players;
              if (!playerData) return null;

              return (
                <div
                  key={`${p.player_id}-${idx}`}
                  onClick={() => handlePlayerClick(p.player_id, playerData.name || "Player", playerData.country || "")}
                  className="flex items-center gap-4 p-4 rounded-2xl card-hover shrink-0 min-w-[280px] group cursor-pointer"
                >
                  <div className="relative">
                    <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all">{getFlag(playerData.country)}</span>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-background rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate group-hover:text-primary transition-colors uppercase tracking-tight">
                      {playerData.name || "Unknown Player"}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-bold text-muted-foreground">
                        {playerData.country}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold mono text-primary">
                        <Icon className="h-3 w-3" />
                        {(p[stat] || 0).toLocaleString()} {label}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <AppHeader />

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 overflow-hidden">
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-secondary opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}></div>
          </div>
          
          <div className="container relative mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black tracking-widest mb-6 border border-primary/20 uppercase">
                <Trophy className="w-3.5 h-3.5" />
                <span>FAANG-Level Cricket Intelligence</span>
              </div>
              <h1 className="text-6xl font-black tracking-tighter sm:text-8xl mb-8 leading-[0.9]">
                Cric<span className="text-primary italic">Intel</span>. 
              </h1>
              <p className="text-xl text-muted-foreground mb-12 leading-relaxed font-medium max-w-2xl mx-auto">
                Real-time performance analytics and tactical insights. 
                Everything you need to master the game, powered by data.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }} className="max-w-2xl mx-auto">
              <div className="relative group p-1.5 bg-gradient-to-r from-primary via-secondary to-accent rounded-3xl shadow-2xl transition-all duration-500 hover:shadow-primary/30">
                <div className="bg-background rounded-[1.25rem]">
                  <SearchBar />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Highlight Stats */}
        <section className="container mx-auto px-4 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Matches Tracked", value: "10K+", icon: Trophy },
              { label: "Players Analyzed", value: "5K+", icon: User },
              { label: "Data Points", value: "1M+", icon: TrendingUp },
              { label: "Accuracy", value: "99.9%", icon: Target },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="stat-card glass border-border/50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <stat.icon className="w-4 h-4 text-primary" />
                  <span className="label leading-none">{stat.label}</span>
                </div>
                <div className="value">{stat.value}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <section className="container mx-auto px-4 py-8 mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-1.5 bg-muted rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">History</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {recentSearches.map((r) => (
                <button 
                  key={r.id} 
                  onClick={() => navigate(`/player/${r.id}`)} 
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl border border-border bg-card group hover:border-primary hover:bg-primary/5 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <span className="text-xl group-hover:scale-125 transition-transform">{getFlag(r.country)}</span>
                  <span className="text-sm font-bold">{r.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Main Filters & Content */}
        <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-y border-border py-6 mb-12">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-2xl border border-border">
                {["All", "Test", "ODI", "T20"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFormat(f)}
                    className={`px-5 py-2 rounded-xl text-xs font-black transition-all uppercase tracking-tighter ${activeFormat === f
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                  >
                    {f === "T20" ? "T20I" : f}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-2xl border border-border">
                {genderFilters.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGenderFilter(g.value as "all" | "male" | "female")}
                    className={`px-5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 uppercase tracking-tighter ${genderFilter === g.value
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            
            <button 
              onClick={() => {
                safeStorage.removeItem("cricintel_stats_cache");
                refetch();
              }}
              className={`p-3 rounded-2xl bg-secondary hover:bg-primary/10 transition-colors group ${statsLoading ? "animate-spin" : ""}`}
              title="Refresh Data"
            >
              <RefreshCw className="h-5 w-5 text-primary group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </div>
        </div>

        {/* Featured Analytics - Adjusted to 2 rows grid */}
        <section className="container mx-auto px-4 mb-20">
          <div className="mb-8">
             <h2 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
               <TrendingUp className="w-4 h-4" />
               Featured Analytics
             </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderFeaturedCard("Run Machines", processedData?.topScorers || [], "runs", "blue", TrendingUp)}
            {renderFeaturedCard("Boundary Elite", processedData?.mostBoundaries || [], "boundaries", "orange", Target)}
            {renderFeaturedCard("Consistency Kings", processedData?.highestAverage || [], "average", "blue", UserCheck)}
            {renderFeaturedCard("Power Hitters", processedData?.bestStrikeRate || [], "strike_rate", "purple", Zap)}
            {renderFeaturedCard("Wicket Takers", processedData?.mostWickets || [], "wickets", "red", Swords)}
            {renderFeaturedCard("Bowling Prowess", processedData?.bestBowlingAvg || [], "bowl_average", "pink", Target)}
            {renderFeaturedCard("Match Winners", mostFiveWicketHauls || [], "count", "amber", Swords)}
            
            {/* Strategy Insight Card to fill the 8th slot */}
            <div className="flex-shrink-0 card-hover p-6 rounded-2xl bg-secondary/20 border border-white/5 flex flex-col justify-center items-center text-center opacity-60 hover:opacity-100 transition-opacity">
               <div className="p-3 bg-white/5 rounded-full mb-4">
                  <Activity className="w-6 h-6 text-muted-foreground" />
               </div>
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 text-white/40">Strategic Engine</h3>
               <p className="text-xs font-medium text-muted-foreground px-4">Tactical overlays and deployment logic updated in real-time.</p>
            </div>
          </div>
        </section>

        {/* Leaderboards - Side by Side on LG */}
        <section className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {renderTopPlayers("Top Batters", processedData?.topBatters || [], "runs", "Runs", Swords, "left")}
            {renderTopPlayers("Top Bowlers", processedData?.topBowlers || [], "wickets", "Wickets", Target, "right")}
          </div>
        </section>
      </main>
    </div>
  );
};


  export default Index;
