import { AppHeader } from "@/components/AppHeader";
import { SearchBar } from "@/components/SearchBar";
import { PlayerCard } from "@/components/PlayerCard";
import { useFeaturedPlayers, usePlayerSearch } from "@/lib/hooks/usePlayers";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFlag } from "@/lib/countryFlags";
import { TrendingUp, Clock, Star } from "lucide-react";

const quickPicks = [
  { name: "Virat Kohli", country: "India" },
  { name: "Steve Smith", country: "Australia" },
  { name: "Babar Azam", country: "Pakistan" },
  { name: "Jasprit Bumrah", country: "India" },
  { name: "Ben Stokes", country: "England" },
  { name: "Kane Williamson", country: "New Zealand" },
];

const formatFilters = ["All", "Test", "ODI", "T20I", "IPL"];

const Index = () => {
  const { data: players, isLoading } = useFeaturedPlayers();
  const navigate = useNavigate();
  const [activeFormat, setActiveFormat] = useState("All");
  const [recentSearches, setRecentSearches] = useState<{ id: string; name: string; country: string }[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("cricintel_recent");
    if (stored) {
      try { setRecentSearches(JSON.parse(stored)); } catch {}
    }
  }, []);

  const handleQuickPick = (name: string) => {
    const found = players?.find((p) => p.name === name);
    if (found) {
      // Save to recent
      const updated = [{ id: found.id, name: found.name, country: found.country }, ...recentSearches.filter(r => r.id !== found.id)].slice(0, 10);
      setRecentSearches(updated);
      localStorage.setItem("cricintel_recent", JSON.stringify(updated));
      navigate(`/player/${found.id}`);
    }
  };

  const featuredPlayer = players?.[0];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Sticky Format Filter Bar */}
      <div className="sticky top-16 z-40 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-1 py-2 overflow-x-auto no-scrollbar">
            {formatFilters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFormat(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  activeFormat === f
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_60%)]" />
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Cricket Player{" "}
              <span className="text-primary">Analytics</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Ball-by-ball performance insights, tactical intelligence, and
              data-driven decisions for cricket.
            </p>
          </motion.div>

          {/* Large Centered Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10"
          >
            <SearchBar />
          </motion.div>

          {/* Quick-Pick Chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 flex flex-wrap justify-center gap-2"
          >
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
              <button
                key={r.id}
                onClick={() => navigate(`/player/${r.id}`)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card text-sm whitespace-nowrap hover:border-primary/50 transition-all card-hover"
              >
                <span>{getFlag(r.country)}</span>
                {r.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Featured Player Card */}
      {featuredPlayer && (
        <section className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Featured Player</h2>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card
              className="cursor-pointer overflow-hidden border-primary/20 bg-gradient-to-r from-card to-accent/20"
              onClick={() => navigate(`/player/${featuredPlayer.id}`)}
            >
              <CardContent className="p-6 flex items-center gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted text-3xl ring-2 ring-primary/30">
                  {getFlag(featuredPlayer.country)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-foreground truncate">{featuredPlayer.name}</h3>
                  <p className="text-sm text-muted-foreground">{featuredPlayer.country} · {featuredPlayer.role}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="outline" className="text-xs capitalize">{featuredPlayer.role}</Badge>
                    <Badge variant="outline" className="text-xs">{featuredPlayer.batting_style}</Badge>
                  </div>
                </div>
                <TrendingUp className="h-8 w-8 text-primary opacity-40" />
              </CardContent>
            </Card>
          </motion.div>
        </section>
      )}

      {/* All Players Grid */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold mb-5">All Players</h2>
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players?.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <PlayerCard player={p} />
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
