import { AppHeader } from "@/components/AppHeader";
import { getFlag } from "@/lib/countryFlags";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, MapPin, Trophy, Search, User, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const formatFilters = ["All", "ODI", "T20I", "Test", "IPL"];
const genderFilters = [
  { value: "all", label: "All", icon: null },
  { value: "male", label: "Men", icon: User },
  { value: "female", label: "Women", icon: UserCheck },
];

const Matches = () => {
  const [activeFormat, setActiveFormat] = useState("All");
  const [activeGender, setActiveGender] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  
  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches", activeFormat, activeGender],
    queryFn: async () => {
      let q = supabase.from("matches").select("*").order("match_date", { ascending: false });
      if (activeFormat !== "All") {
        q = q.eq("format", activeFormat);
      }
      if (activeGender !== "all") {
        q = q.eq("gender", activeGender);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    }
  });
  
  const { data: countData } = useQuery({
    queryKey: ["matches-count", activeFormat, activeGender],
    queryFn: async () => {
      let q = supabase.from("matches").select("*", { count: "exact", head: true });
      if (activeFormat !== "All") {
        q = q.eq("format", activeFormat);
      }
      if (activeGender !== "all") {
        q = q.eq("gender", activeGender);
      }
      const { count } = await q;
      return count || 0;
    }
  });

  const filteredMatches = matches?.filter((match) => {
    const searchLow = searchQuery.toLowerCase();
    return !searchQuery || 
      match.team1?.toLowerCase().includes(searchLow) ||
      match.team2?.toLowerCase().includes(searchLow) ||
      match.venue?.toLowerCase().includes(searchLow) ||
      match.event_name?.toLowerCase().includes(searchLow) ||
      match.match_date?.includes(searchQuery);
  }) ?? [];

  const groupedMatches = useMemo(() => {
    const grouped = new Map<string, Map<string, typeof filteredMatches>>();
    filteredMatches.forEach(match => {
      const year = match.match_date?.substring(0, 4) || "—";
      const event = match.event_name || "Bilateral / Regular Matches";
      
      if (!grouped.has(year)) grouped.set(year, new Map());
      const yearMap = grouped.get(year)!;
      if (!yearMap.has(event)) yearMap.set(event, []);
      yearMap.get(event)!.push(match);
    });
    
    // Sort array descending dynamically
    return Array.from(grouped.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([year, eventsMap]) => ({
        year,
        events: Array.from(eventsMap.entries()).map(([event, matchesList]) => ({
          event,
          matches: matchesList
        }))
      }));
  }, [filteredMatches]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Matches</h1>
          <p className="text-muted-foreground">Browse all cricket matches</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Gender Tabs */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground mr-2 shrink-0">Gender:</span>
            {genderFilters.map((g) => (
              <button
                key={g.value}
                onClick={() => setActiveGender(g.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeGender === g.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-border"
                }`}
              >
                {g.icon && <g.icon className="h-4 w-4" />}
                {g.label}
              </button>
            ))}
          </div>

          {/* Format Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <span className="text-[10px] uppercase font-bold text-muted-foreground mr-2 shrink-0">Format:</span>
            {formatFilters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFormat(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  activeFormat === f
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-border"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teams or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Matches Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {isLoading ? "Loading..." : `${countData} matches`}
        </div>

        {/* Matches List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No matches found</p>
            <p className="text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedMatches.map((yearGroup) => (
              <div key={yearGroup.year} className="space-y-4">
                <h2 className="text-xl font-black bg-gradient-to-r from-primary to-primary/40 bg-clip-text text-transparent inline-block pb-1 border-b-2 border-primary/20">
                  {yearGroup.year} Matches
                </h2>
                
                {yearGroup.events.map((eventGroup) => (
                  <div key={eventGroup.event} className="space-y-3">
                    <div className="flex items-center gap-2 mt-4 mb-2 text-foreground/90">
                      <Trophy className="h-4 w-4 text-primary" />
                      <h3 className="text-[13px] font-bold uppercase tracking-wider">{eventGroup.event}</h3>
                    </div>
                    
                    <div className="grid gap-3">
                      {eventGroup.matches.map((match) => (
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
                                {match.match_date ? new Date(match.match_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Unknown Date"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xl">{getFlag(match.team1)}</span>
                                <span className="text-sm font-medium truncate">{match.team1 || "TBC"}</span>
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0">vs</span>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-xl">{getFlag(match.team2)}</span>
                                <span className="text-sm font-medium truncate">{match.team2 || "TBC"}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                            {match.result && (
                              <span className="text-xs font-medium text-primary max-w-[120px] truncate">
                                {match.result}
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="max-w-[100px] truncate">{match.venue || "Unknown Venue"}</span>
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Matches;
