import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { useCountries, useRecentMatches } from "@/lib/hooks/usePlayers";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFlag } from "@/lib/countryFlags";
import { Clock, Trophy, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const quickPicks = [
  { name: "V Kohli", country: "India" },
  { name: "SPD Smith", country: "Australia" },
  { name: "Babar Azam", country: "Pakistan" },
  { name: "JJ Bumrah", country: "India" },
  { name: "BA Stokes", country: "England" },
  { name: "KS Williamson", country: "New Zealand" },
  { name: "RG Sharma", country: "India" },
  { name: "PJ Cummins", country: "Australia" },
  { name: "JE Root", country: "England" },
  { name: "Shakib Al Hasan", country: "Bangladesh" },
];

const formatFilters = ["All", "Test", "ODI", "T20I", "IPL"];

const Index = () => {
  const [activeCountry, setActiveCountry] = useState("All Countries");
  const { data: countries } = useCountries();
  const { data: recentMatches } = useRecentMatches(10);
  const navigate = useNavigate();
  const [activeFormat, setActiveFormat] = useState("All");
  const [recentSearches, setRecentSearches] = useState<{ id: string; name: string; country: string }[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("cricintel_recent");
    if (stored) {
      try { setRecentSearches(JSON.parse(stored)); } catch {}
    }
  }, []);

  const handleQuickPick = async (name: string) => {
    const { data } = await supabase
      .from("players")
      .select("id, name, country")
      .ilike("name", `%${name}%`)
      .limit(1);
    
    if (data && data.length > 0) {
      const player = data[0];
      const updated = [{ id: player.id, name: player.name, country: player.country }, ...recentSearches.filter(r => r.id !== player.id)].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem("cricintel_recent", JSON.stringify(updated));
      navigate(`/player/${player.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Sticky Filter Bar */}
      <div className="sticky top-16 z-40 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-2 py-3">
            {/* Format Filter */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground mr-2 shrink-0">Format:</span>
              {formatFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFormat(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                    activeFormat === f
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            
            {/* Country Filter */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <span className="text-[10px] uppercase font-bold text-muted-foreground mr-2 shrink-0">Team:</span>
              {countries?.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCountry(c)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeCountry === c
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
                  }`}
                >
                  {c !== "All Countries" && <span>{getFlag(c)}</span>}
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Cricket Player <span className="text-primary">Analytics</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Ball-by-ball performance insights, tactical intelligence, and data-driven decisions for cricket.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-10">
            <SearchBar />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }} className="mt-6 flex flex-wrap justify-center gap-2">
            {quickPicks.map((qp) => (
              <button
                key={qp.name}
                onClick={() => handleQuickPick(qp.name)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-border bg-card text-sm font-medium text-foreground hover:border-primary/50 hover:bg-accent transition-all hover:shadow-md hover:shadow-primary/10"
              >
                <span className="text-base">{getFlag(qp.country)}</span>
                {qp.name}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <section className="container mx-auto px-4 py-6">
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

      {/* Browse by Team */}
      {countries && countries.length > 1 && (
        <section className="container mx-auto px-4 py-8 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Browse by Team</h2>
            <Button variant="ghost" size="sm" onClick={() => setActiveCountry("All Countries")}>
              Reset Filter
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {countries.filter(c => c !== "All Countries").map((c) => (
              <button
                key={c}
                onClick={() => setActiveCountry(c)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:shadow-lg ${
                  activeCountry === c 
                    ? "bg-primary/10 border-primary shadow-md shadow-primary/10" 
                    : "bg-card border-border hover:border-primary/50"
                }`}
              >
                <span className="text-3xl">{getFlag(c)}</span>
                <span className="text-xs font-bold text-center line-clamp-1">{c}</span>
              </button>
            ))}
          </div>
        </section>
      )}

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
