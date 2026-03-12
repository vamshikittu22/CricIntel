import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { useFeaturedPlayers, useCountries } from "@/lib/hooks/usePlayers";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getFlag } from "@/lib/countryFlags";
import { Clock, TrendingUp, User, UserCheck, Swords, Target, RefreshCw } from "lucide-react";
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
    const colorMap: Record<string, { bg: string; text: string; border: string; shadow: string }> = {
      emerald: { bg: "from-emerald-500/20 via-emerald-600/10 to-transparent", text: "text-emerald-400", border: "border-emerald-500/30", shadow: "shadow-emerald-500/20" },
      orange: { bg: "from-orange-500/20 via-orange-600/10 to-transparent", text: "text-orange-400", border: "border-orange-500/30", shadow: "shadow-orange-500/20" },
      blue: { bg: "from-blue-500/20 via-blue-600/10 to-transparent", text: "text-blue-400", border: "border-blue-500/30", shadow: "shadow-blue-500/20" },
      purple: { bg: "from-purple-500/20 via-purple-600/10 to-transparent", text: "text-purple-400", border: "border-purple-500/30", shadow: "shadow-purple-500/20" },
      red: { bg: "from-red-500/20 via-red-600/10 to-transparent", text: "text-red-400", border: "border-red-500/30", shadow: "shadow-red-500/20" },
      pink: { bg: "from-pink-500/20 via-pink-600/10 to-transparent", text: "text-pink-400", border: "border-pink-500/30", shadow: "shadow-pink-500/20" },
      amber: { bg: "from-amber-500/20 via-amber-600/10 to-transparent", text: "text-amber-400", border: "border-amber-500/30", shadow: "shadow-amber-500/20" },
    };
    const colors = colorMap[color] || colorMap.emerald;
    
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
      <div className={`min-w-[260px] flex-shrink-0 bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-xl p-4 shadow-lg hover:${colors.shadow} transition-all duration-300 mx-2`}>
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-2 bg-${color}-500 rounded-lg`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className={`text-sm font-bold ${colors.text}`}>{title}</h3>
            <span className="text-xs text-muted-foreground">({activeFormat})</span>
          </div>
        </div>
        {players && players.length > 0 ? (
          <div className="space-y-2">
            {players.map((player, index) => (
              <div
                key={player.player_id}
                className={`flex items-center gap-3 py-2 cursor-pointer hover:${color}-500/10 rounded-lg px-2 transition-all`}
                onClick={() => handlePlayerClick(player.player_id, player.players?.name || "Player", player.players?.country || "")}
              >
                <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-gray-400 text-black' : index === 2 ? 'bg-amber-700 text-white' : 'bg-muted text-muted-foreground'}`}>{index + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-medium">{player.players?.name}</span>
                    <span className="text-xs">{getFlag(player.players?.country || "")}</span>
                  </div>
                  <span className={`text-xs ${colors.text} font-semibold`}>{getStatValue(player)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center">No data available</p>
        )}
      </div>
    );
  };

  const renderTopPlayers = (title: string, players: any[], stat: string, label: string, Icon: React.ElementType, direction: "left" | "right") => {
    if (!players || players.length === 0) return null;
    const scrollClass = direction === "left" ? "animate-scroll-left" : "animate-scroll-right";

    return (
      <div className="mb-8">
        <div className="container mx-auto px-4 flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title} ({activeFormat})</h2>
          {periodText && <span className="text-xs text-muted-foreground ml-2">({periodText})</span>}
        </div>
        <div className="overflow-hidden bg-card/40 border-y border-border py-4 shadow-sm">
          <div className="flex gap-4" style={{ animationName: direction === "left" ? "scroll-left" : "scroll-right", animationDuration: "30s", animationTimingFunction: "linear", animationIterationCount: "infinite", width: `calc(240px * ${players.length * 2})` }}>
            {[...players, ...players].map((p: any, idx: number) => {
              const playerData = p.players;
              if (!playerData) return null;

              return (
                <button
                  key={`${p.player_id}-${idx}`}
                  onClick={() => handlePlayerClick(p.player_id, playerData.name || "Player", playerData.country || "")}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-full border bg-background hover:border-primary/50 hover:shadow-md transition-all shrink-0 min-w-[220px]"
                >
                  <span className="text-xl">{getFlag(playerData.country)}</span>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">
                      {playerData.name || "Unknown Player"}
                      {activeFormat === "All" && (
                        <span className="ml-1 text-[10px] uppercase font-semibold text-muted-foreground">({p.format})</span>
                      )}
                    </div>
                    <div className="text-xs text-primary font-medium flex items-center gap-1.5 mt-0.5">
                      <Icon className="h-3 w-3" />
                      {(p[stat] || 0).toLocaleString()} {label}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
      <AppHeader />

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_60%)]" />
          <div className="container relative mx-auto px-4 py-16 md:py-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                Cricket Player <span className="text-primary">Analytics</span>
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                Ball-by-ball performance insights, tactical intelligence, and data-driven decisions for cricket.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-8">
              <SearchBar />
            </motion.div>
          </div>
        </section>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <section className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Searches</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {recentSearches.map((r) => (
                <button key={r.id} onClick={() => navigate(`/player/${r.id}`)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm whitespace-nowrap hover:border-primary/50 transition-all">
                  <span>{getFlag(r.country)}</span>
                  {r.name}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Format & Gender Filters */}
        <div className="container mx-auto px-4 py-4 flex flex-col gap-4 items-center sm:flex-row sm:justify-center relative">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Format:</span>
            {["All", "Test", "ODI", "T20"].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFormat(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFormat === f
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-border"
                  }`}
              >
                {f === "T20" ? "T20I" : f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Gender:</span>
            {genderFilters.map((g) => (
              <button
                key={g.value}
                onClick={() => setGenderFilter(g.value as "all" | "male" | "female")}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${genderFilter === g.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-border"
                  }`}
              >
                {g.value === "male" && <User className="h-3 w-3" />}
                {g.value === "female" && <UserCheck className="h-3 w-3" />}
                {g.label}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => {
              safeStorage.removeItem("cricintel_stats_cache");
              refetch();
            }}
            className="sm:absolute sm:right-4 p-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${statsLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Featured Players - Infinite Scrolling Banner */}
        <div className="container mx-auto px-4 py-6 overflow-hidden">
          <div className="relative">
            <style>{`
              @keyframes infiniteScroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .scroll-container {
                display: flex;
                width: fit-content;
                animation: infiniteScroll 60s linear infinite;
              }
              .scroll-container:hover {
                animation-play-state: paused;
              }
            `}</style>
            <div className="scroll-container">
              {/* First set of cards */}
              {renderFeaturedCard("Top Run Scorers", processedData?.topScorers || [], "runs", "emerald", TrendingUp)}
              {renderFeaturedCard("Most Boundaries", processedData?.mostBoundaries || [], "boundaries", "orange", Target)}
              {renderFeaturedCard("Highest Average", processedData?.highestAverage || [], "average", "blue", User)}
              {renderFeaturedCard("Best Strike Rate", processedData?.bestStrikeRate || [], "strike_rate", "purple", Clock)}
              {renderFeaturedCard("Most Wickets", processedData?.mostWickets || [], "wickets", "red", Swords)}
              {renderFeaturedCard("Best Bowling Avg", processedData?.bestBowlingAvg || [], "bowl_average", "pink", Target)}
              {renderFeaturedCard("Most 5-Fors", mostFiveWicketHauls || [], "count", "amber", Swords)}
              
              {/* Duplicate set for infinite loop */}
              {renderFeaturedCard("Top Run Scorers", processedData?.topScorers || [], "runs", "emerald", TrendingUp)}
              {renderFeaturedCard("Most Boundaries", processedData?.mostBoundaries || [], "boundaries", "orange", Target)}
              {renderFeaturedCard("Highest Average", processedData?.highestAverage || [], "average", "blue", User)}
              {renderFeaturedCard("Best Strike Rate", processedData?.bestStrikeRate || [], "strike_rate", "purple", Clock)}
              {renderFeaturedCard("Most Wickets", processedData?.mostWickets || [], "wickets", "red", Swords)}
              {renderFeaturedCard("Best Bowling Avg", processedData?.bestBowlingAvg || [], "bowl_average", "pink", Target)}
              {renderFeaturedCard("Most 5-Fors", mostFiveWicketHauls || [], "count", "amber", Swords)}
            </div>
          </div>
        </div>

        {/* Top Batters */}
              {renderTopPlayers("Top Batters", processedData?.topBatters || [], "runs", "Runs", Swords, "left")}

              {renderTopPlayers("Top Bowlers", processedData?.topBowlers || [], "wickets", "Wickets", Target, "right")}
            </div>
    );
  };

  export default Index;
