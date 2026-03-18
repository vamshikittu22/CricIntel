import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { usePlayer, usePlayerRecentMatches } from "@/lib/hooks/usePlayers";
import { getFlag } from "@/lib/countryFlags";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from "recharts";
import { ChevronLeft, Filter, Search, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formats = ["ODI", "T20I", "Test"] as const;

export default function MatchHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [format, setFormat] = useState<string>("ODI");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: player, isLoading: playerLoading } = usePlayer(id);
  // Fetch up to 500 matches for full history
  const { data: recentMatches, isLoading: matchesLoading } = usePlayerRecentMatches(id, format, 500);

  const innings = useMemo(() => {
    if (!recentMatches) return [];
    return recentMatches
      .map((m) => {
        const sr = m.bat_balls > 0 ? +((m.bat_runs / m.bat_balls) * 100).toFixed(1) : 0;
        return {
          matchId: m.match_id,
          date: m.match_date,
          year: m.match_date?.substring(0, 4) || "—",
          event: m.event_name || "Bilateral / Regular Matches",
          opponent: `${m.team1} vs ${m.team2}`,
          venue: m.venue,
          runs: m.bat_runs,
          balls: m.bat_balls,
          fours: m.bat_fours,
          sixes: m.bat_sixes,
          sr,
          isOut: !m.bat_not_out,
          dismissal: m.bat_dismissal_kind,
        };
      })
      .filter(inn => 
        inn.opponent.toLowerCase().includes(searchTerm.toLowerCase()) || 
        inn.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inn.year.includes(searchTerm) ||
        inn.event.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [recentMatches, searchTerm]);

  const groupedInnings = useMemo(() => {
    const grouped = new Map<string, Map<string, typeof innings[0][]>>();
    innings.forEach(inn => {
      if (!grouped.has(inn.year)) grouped.set(inn.year, new Map());
      const yearMap = grouped.get(inn.year)!;
      if (!yearMap.has(inn.event)) yearMap.set(inn.event, []);
      yearMap.get(inn.event)!.push(inn);
    });
    
    // Sort array descending dynamically
    return Array.from(grouped.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([year, eventsMap]) => ({
        year,
        events: Array.from(eventsMap.entries()).map(([event, matches]) => ({
          event,
          matches
        }))
      }));
  }, [innings]);

  const trendData = useMemo(() => {
    return [...innings].reverse().map((inn, i) => ({
      inning: i + 1,
      runs: inn.runs,
      sr: inn.sr,
      label: inn.date,
    }));
  }, [innings]);

  if (playerLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8"><Skeleton className="h-48 rounded-xl" /></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-background text-center py-20">
        <h1 className="text-2xl font-bold">Player not found</h1>
        <Button variant="link" onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl ring-1 ring-border">
                {getFlag(player.country)}
              </div>
              <div>
                <h1 className="text-xl font-bold">{player.name}</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-tight font-medium">Innings History & Metrics</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search matches, venues..."
                className="pl-9 h-9 text-sm border-border/50 bg-muted/30"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Format Selector Tabs */}
        <div className="flex items-center justify-between border-b border-border/50 pb-1">
          <div className="flex gap-1">
            {formats.map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-4 py-2 text-sm font-medium transition-all relative ${
                  format === f ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
                {format === f && (
                  <motion.div layoutId="formatTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Total {innings.length} innings found
          </span>
        </div>

        {matchesLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        ) : innings.length > 0 ? (
          <div className="space-y-6">
            {/* Visual Trend Chart */}
            <Card className="border-border/50 shadow-sm overflow-hidden bg-gradient-to-b from-card to-background">
              <CardHeader className="py-4 px-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <AreaChart className="h-4 w-4 text-primary" /> Career Run Scoring Path
                  </CardTitle>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px]">{format}</Badge>
              </CardHeader>
              <CardContent className="px-2 sm:px-6 pb-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                      <XAxis dataKey="inning" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} hide />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip 
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} 
                        cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1 }}
                      />
                      <Area type="monotone" dataKey="runs" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRuns)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Innings Tables Grouped by Year and Event */}
            <div className="space-y-8">
              {groupedInnings.map((yearGroup) => (
                <div key={yearGroup.year} className="space-y-4">
                  <h2 className="text-xl font-black bg-gradient-to-r from-primary to-primary/40 bg-clip-text text-transparent inline-block pb-1 border-b-2 border-primary/20">
                    {yearGroup.year} Matches
                  </h2>
                  
                  {yearGroup.events.map((eventGroup) => (
                    <Card key={eventGroup.event} className="border-border/50 shadow-sm overflow-hidden">
                      <CardHeader className="py-3 px-6 bg-muted/20 border-b border-border/50">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-primary" />
                          <CardTitle className="text-sm font-semibold tracking-tight">{eventGroup.event}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader className="bg-transparent">
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="w-24 text-[10px] uppercase font-bold text-muted-foreground pl-6">Date</TableHead>
                                <TableHead className="text-[10px] uppercase font-bold text-muted-foreground">Matchup</TableHead>
                                <TableHead className="text-right text-[10px] uppercase font-bold text-muted-foreground">Runs</TableHead>
                                <TableHead className="text-right text-[10px] uppercase font-bold text-muted-foreground">Stats</TableHead>
                                <TableHead className="text-right text-[10px] uppercase font-bold text-muted-foreground">SR</TableHead>
                                <TableHead className="pr-6 text-[10px] uppercase font-bold text-muted-foreground">Out Type</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {eventGroup.matches.map((inn, i) => (
                                <TableRow 
                                  key={`${inn.matchId}-${i}`} 
                                  className="border-border/30 group cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => navigate(`/match/${inn.matchId}`)}
                                >
                                  <TableCell className="text-xs whitespace-nowrap pl-6 py-4 font-mono text-muted-foreground">
                                    {inn.date}
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-semibold">{inn.opponent}</span>
                                      <span className="text-[10px] text-muted-foreground">{inn.venue}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right py-4">
                                    <div className="flex items-center justify-end gap-1">
                                      <span className={`text-base font-black ${inn.runs >= 100 ? "text-purple-500" : inn.runs >= 50 ? "text-emerald-500" : ""}`}>
                                        {inn.runs}
                                      </span>
                                      {!inn.isOut && <span className="text-primary font-bold">*</span>}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right py-4">
                                    <div className="flex flex-col items-end gap-0.5">
                                      <span className="text-[11px] font-medium">{inn.balls} balls</span>
                                      <span className="text-[9px] text-muted-foreground">{inn.fours}✕4, {inn.sixes}✕6</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right py-4">
                                    <Badge variant="outline" className={`font-mono text-[10px] ${inn.sr >= 150 ? "border-primary text-primary" : ""}`}>
                                      {inn.sr}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="pr-6 py-4">
                                    {inn.dismissal ? (
                                      <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                        {inn.dismissal.replace('_', ' ')}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-widest">
                                        NOT OUT
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-border rounded-2xl bg-muted/5">
            <Filter className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium text-foreground">No matches found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}
