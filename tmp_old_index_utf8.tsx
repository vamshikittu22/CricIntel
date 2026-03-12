import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { useRecentMatches } from "@/lib/hooks/usePlayers";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFlag } from "@/lib/countryFlags";
import { Clock, Trophy, MapPin, Calendar, TrendingUp, User, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const genderFilters = [
  { value: "all", label: "All" },
  { value: "male", label: "Men" },
  { value: "female", label: "Women" },
];

const Index = () => {
  const navigate = useNavigate();
  const [recentSearches, setRecentSearches] = useState<{ id: string; name: string; country: string }[]>([]);
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const { data: recentMatches } = useRecentMatches(10, genderFilter);

  const { data: topBatters } = useQuery({
    queryKey: ["top-batters", genderFilter],
    queryFn: async () => {
      let q = supabase
        .from("player_stats_summary")
        .select("*, players(name, country, gender)")
        .eq("format", "ODI");
      if (genderFilter !== "all") {
        q = q.eq("players.gender", genderFilter);
      }
      const { data } = await q.order("runs", { ascending: false }).limit(10);
      return data || [];
    }
  });

  const { data: topBowlers } = useQuery({
    queryKey: ["top-bowlers", genderFilter],
    queryFn: async () => {
      let q = supabase
        .from("player_stats_summary")
        .select("*, players(name, country, gender)")
        .eq("format", "ODI");
      if (genderFilter !== "all") {
        q = q.eq("players.gender", genderFilter);
      }
      const { data } = await q.order("wickets", { ascending: false }).limit(10);
      return data || [];
    }
  });

  const { data: dateRange } = useQuery({
    queryKey: ["date-range", genderFilter],
    queryFn: async () => {
      let q = supabase.from("matches").select("match_date");
      if (genderFilter !== "all") {
        q = q.eq("gender", genderFilter);
      }
      const { data } = await q.order("match_date", { ascending: true }).limit(1);
      const { data: data2 } = await q.order("match_date", { ascending: false }).limit(1);
      return { start: data?.[0]?.match_date, end: data2?.[0]?.match_date };
    }
  });

  useEffect(() => {
    const stored = localStorage.getItem("cricintel_recent");
    if (stored) {
      try { setRecentSearches(JSON.parse(stored)); } catch {}
    }
  }, []);

  const handlePlayerClick = (playerId: string, playerName: string, playerCountry: string) => {
    const updated = [{ id: playerId, name: playerName, country: playerCountry }, ...recentSearches.filter(r => r.id !== playerId)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem("cricintel_recent", JSON.stringify(updated));
    navigate(`/player/${playerId}`);
  };

  const formatYear = (dateStr: string) => new Date(dateStr).getFullYear();
  const periodText = dateRange?.start && dateRange?.end 
    ? `${formatYear(dateRange.start)} - ${formatYear(dateRange.end)}`
    : "";

  const renderTopPlayers = (title: string, players: any[], stat: string, direction: "left" | "right") => {
    const scrollClass = direction === "left" ? "animate-scroll-left" : "animate-scroll-right";
    return (
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h2>
          {periodText && <span className="text-xs text-muted-foreground ml-2">({periodText})</span>}
        </div>
        <div className={`overflow-hidden`}>
          <div className={`flex gap-3 ${scrollClass}`} style={{ width: 'calc(200px * 20)' }}>
            {[...players, ...players].map((p: any, idx: number) => (
              <button
                key={`${p.player_id}-${idx}`}
                onClick={() => handlePlayerClick(p.player_id, p.players?.name, p.players?.country)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all shrink-0 min-w-[200px]"
              >
                <span className="text-2xl">{getFlag(p.players?.country)}</span>
                <div className="text-left">
                  <div className="text-sm font-bold truncate max-w-[120px]">{p.players?.name}</div>
                  <div className="text-xs text-primary font-medium">{p[stat].toLocaleString()} {stat}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
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

      {/* Gender Filter for Stats */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs uppercase font-bold text-muted-foreground">Stats:</span>
          {genderFilters.map((g) => (
            <button
              key={g.value}
              onClick={() => setGenderFilter(g.value as "all" | "male" | "female")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                genderFilter === g.value
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
      </div>

      {/* Top Batters */}
      {topBatters && topBatters.length > 0 && renderTopPlayers("Top Run Scorers (ODI)", topBatters, "runs", "left")}

      {/* Top Bowlers */}
      {topBowlers && topBowlers.length > 0 && renderTopPlayers("Top Wicket Takers (ODI)", topBowlers, "wickets", "right")}

      {/* Recent Matches */}
      {recentMatches && recentMatches.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Matches</h2>
          </div>
          <div className="grid gap-3">
            {recentMatches.map((match) => (
              <button
                key={match.id}
                onClick={() => navigate(`/match/${match.id}`)}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all text-left group"
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                      {match.format}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(match.match_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xl">{getFlag(match.team1)}</span>
                      <span className="text-sm font-medium truncate">{match.team1}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">vs</span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xl">{getFlag(match.team2)}</span>
                      <span className="text-sm font-medium truncate">{match.team2}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                  {match.result && (
                    <span className="text-xs font-medium text-primary">
                      {match.result}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span className="max-w-[100px] truncate">{match.venue}</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => navigate("/matches")}>
              View All Matches
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
