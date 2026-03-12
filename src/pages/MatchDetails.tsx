import { AppHeader } from "@/components/AppHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getFlag } from "@/lib/countryFlags";
import { useParams, Link } from "react-router-dom";
import { 
  Calendar, MapPin, Trophy, ArrowLeft, Loader2, Info, 
  Users, Shield, Target, Zap, Activity, History, 
  TrendingUp, BarChart3, Crosshair, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useMemo } from "react";

interface MatchInfo {
  id: string;
  format: string;
  match_date: string;
  venue: string;
  team1: string;
  team2: string;
  result: string | null;
  winner: string | null;
  event_name: string | null;
}

interface PlayerMatchRow {
  player_id: string;
  player_name: string;
  team: string;
  inning: number;
  is_batter: boolean;
  is_bowler: boolean;
  bat_runs: number;
  bat_balls: number;
  bat_fours: number;
  bat_sixes: number;
  bat_dismissal_kind: string | null;
  bat_not_out: boolean;
  bowl_overs: number;
  bowl_maidens: number;
  bowl_runs: number;
  bowl_wickets: number;
  bowl_econ: number;
  catches: number;
  stumpings: number;
  run_outs: number;
}


const MatchDetails = () => {
  const { id } = useParams<{ id: string }>();

  // Fetch match info
  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ["match", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as MatchInfo;
    },
    enabled: !!id,
  });

  // Fetch all player stats for this match
  const { data: playerStats, isLoading: statsLoading } = useQuery({
    queryKey: ["match-player-stats", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_player_stats")
        .select("*, players!match_player_stats_player_id_fkey(name)")
        .eq("match_id", id!);
      if (error) throw error;
      
      // Flatten the join
      return (data as any[]).map((row) => ({
        player_id: row.player_id,
        player_name: row.players?.name ?? "Unknown",
        inning: row.inning || 1,
        team: row.team,
        is_batter: row.is_batter,
        is_bowler: row.is_bowler,
        bat_runs: row.bat_runs ?? 0,
        bat_balls: row.bat_balls ?? 0,
        bat_fours: row.bat_fours ?? 0,
        bat_sixes: row.bat_sixes ?? 0,
        bat_dismissal_kind: row.bat_dismissal_kind,
        bat_not_out: row.bat_not_out ?? false,
        bowl_overs: row.bowl_overs ?? 0,
        bowl_maidens: row.bowl_maidens ?? 0,
        bowl_runs: row.bowl_runs ?? 0,
        bowl_wickets: row.bowl_wickets ?? 0,
        bowl_econ: row.bowl_econ ?? 0,
        catches: row.catches ?? 0,
        stumpings: row.stumpings ?? 0,
        run_outs: row.run_outs ?? 0,
      })) as PlayerMatchRow[];
    },
    enabled: !!id,
  });

  // Fetch H2H matches
  const { data: h2hMatches, isLoading: h2hLoading } = useQuery({
    queryKey: ["h2h-matches", match?.team1, match?.team2],
    queryFn: async () => {
      if (!match) return [];
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .or(`and(team1.eq."${match.team1}",team2.eq."${match.team2}"),and(team1.eq."${match.team2}",team2.eq."${match.team1}")`)
        .neq("id", id!)
        .order("match_date", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as MatchInfo[];
    },
    enabled: !!match,
  });

  const isLoading = matchLoading || statsLoading || h2hLoading;

  const matchLeaders = useMemo(() => {
    if (!playerStats) return null;
    const playerMap = new Map<string, { id: string, name: string, team: string, runs: number, wickets: number, fours: number, sixes: number, balls: number, fielding: number }>();
    playerStats.forEach(p => {
      const existing = playerMap.get(p.player_id) || { id: p.player_id, name: p.player_name, team: p.team, runs: 0, wickets: 0, fours: 0, sixes: 0, balls: 0, fielding: 0 };
      existing.runs += p.bat_runs;
      existing.wickets += p.bowl_wickets;
      existing.fours += p.bat_fours;
      existing.sixes += p.bat_sixes;
      existing.balls += p.bat_balls;
      existing.fielding += (p.catches + p.stumpings + p.run_outs);
      playerMap.set(p.player_id, existing);
    });
    const players = Array.from(playerMap.values());
    return {
      topBatters: [...players].filter(p => p.runs > 0).sort((a, b) => b.runs - a.runs || a.balls - b.balls).slice(0, 3),
      topBowlers: [...players].filter(p => p.wickets > 0).sort((a, b) => b.wickets - a.wickets).slice(0, 3),
      topFielders: [...players].filter(p => p.fielding > 0).sort((a, b) => b.fielding - a.fielding).slice(0, 3),
      boundaryKings: [...players].filter(p => (p.fours + p.sixes) > 0).sort((a, b) => (b.fours + b.sixes) - (a.fours + a.sixes)).slice(0, 3),
    };
  }, [playerStats]);

  const h2hStats = useMemo(() => {
    if (!h2hMatches || !match) return null;
    const t1Wins = h2hMatches.filter(m => m.winner === match.team1).length;
    const t2Wins = h2hMatches.filter(m => m.winner === match.team2).length;
    const total = h2hMatches.length;
    return { t1Wins, t2Wins, total };
  }, [h2hMatches, match]);

  // Dynamic KPIs derived from match data
  const kpis = useMemo(() => {
    if (!playerStats || !match) return [];
    
    const totalRuns = playerStats.reduce((sum, p) => sum + (p.bat_runs || 0), 0);
    const totalWickets = playerStats.reduce((sum, p) => sum + (p.bowl_wickets || 0), 0);
    const avgSR = playerStats.length > 0 ? (playerStats.filter(p => p.bat_balls > 0).reduce((sum, p) => sum + (p.bat_runs / p.bat_balls * 100), 0) / Math.max(1, playerStats.filter(p => p.bat_balls > 0).length)).toFixed(1) : "0.0";
    const avgEcon = playerStats.filter(p => p.bowl_overs > 0).length > 0 ? (playerStats.reduce((sum, p) => sum + (p.bowl_econ || 0), 0) / playerStats.filter(p => p.bowl_overs > 0).length).toFixed(1) : "0.0";

    return [
      { label: "Aggregate Intensity", value: totalRuns, icon: Zap, color: "text-primary" },
      { label: "Suppression Level", value: totalWickets, icon: Target, color: "text-accent" },
      { label: "Efficiency Index", value: `${avgSR}%`, icon: Activity, color: "text-emerald-500" },
      { label: "Economy Core", value: avgEcon, icon: Shield, color: "text-blue-500" },
    ];
  }, [playerStats, match]);

  // Mock momentum data for visual trajectory (can be improved with ball-by-ball data later)
  const momentumData = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      over: i + 1,
      team1: Math.floor(Math.random() * 50) + 20,
      team2: Math.floor(Math.random() * 50) + 20,
    }));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-32 text-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="h-24 w-24 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-white/10">
                    <HelpCircle className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-4xl font-black tracking-tighter uppercase italic">Match Void</h2>
                <p className="text-muted-foreground mt-2 font-medium">Coordinate trace failed. Entity not found in database.</p>
                <Button variant="ghost" className="mt-8 rounded-full font-black uppercase text-[10px] tracking-widest" onClick={() => window.history.back()}>
                    <ArrowLeft className="h-3 w-3 mr-2" /> Recover Position
                </Button>
            </motion.div>
        </div>
      </div>
    );
  }

  const sortBatting = (a: PlayerMatchRow, b: PlayerMatchRow) => b.bat_runs - a.bat_runs;
  const sortBowling = (a: PlayerMatchRow, b: PlayerMatchRow) => {
    if (b.bowl_wickets !== a.bowl_wickets) return b.bowl_wickets - a.bowl_wickets;
    return a.bowl_econ - b.bowl_econ;
  };

  const inningsMap = new Map<number, PlayerMatchRow[]>();
  playerStats?.forEach(p => {
    if (!inningsMap.has(p.inning)) inningsMap.set(p.inning, []);
    inningsMap.get(p.inning)!.push(p);
  });

  const matchInnings = Array.from(inningsMap.keys()).sort((a, b) => a - b);

  const formatDismissal = (player: PlayerMatchRow) => {
    if (player.bat_not_out) return <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-none px-3 py-0.5 h-6 font-black uppercase text-[9px] tracking-widest">Invictus</Badge>;
    if (!player.bat_dismissal_kind) return <span className="text-muted-foreground italic opacity-30">—</span>;
    return (
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block max-w-[120px] truncate leading-none">
            {player.bat_dismissal_kind}
        </span>
    );
  };

  const calculateStrikeRate = (runs: number, balls: number) => {
    if (balls === 0) return "0.0";
    return ((runs / balls) * 100).toFixed(1);
  };


  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 pb-32">
      <AppHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-10 flex items-center justify-between">
          <Link to="/matches" className="group">
            <Button variant="ghost" size="sm" className="rounded-full bg-white/5 hover:bg-white/10 border border-white/5">
                <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                <span className="text-[10px] font-black uppercase tracking-widest">Match Archive</span>
            </Button>
          </Link>
          <div className="flex items-center gap-3">
             <Badge variant="outline" className="text-[9px] font-black px-4 py-1.5 bg-primary/10 border-primary/20 uppercase tracking-[0.2em] text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] animate-pulse">
                Live Data Feed
             </Badge>
          </div>
        </div>

        {/* Premium Match Header Hero */}        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="relative p-1 rounded-[3rem] bg-gradient-to-br from-primary/20 via-border to-transparent shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-grid-primary/[0.02] -z-1" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="relative glass rounded-[2.8rem] border border-border/50 overflow-hidden">
                {/* Format Badge Overlay */}
                <div className="absolute top-8 right-10">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-1">Standard</span>
                        <Badge variant="outline" className="text-xl font-black italic bg-primary/10 border-primary/20 px-6 py-2 tracking-tighter rounded-xl text-primary">
                            {match.format}
                        </Badge>
                    </div>
                </div>

                <div className="pt-20 pb-12 px-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-16">
                        {/* Team Alpha */}
                        <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center gap-6">
                            <div className="relative group/flag">
                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover/flag:opacity-100 transition-opacity" />
                                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-secondary/40 backdrop-blur-3xl flex items-center justify-center text-5xl sm:text-7xl font-black shadow-2xl border-4 border-border/5 transition-transform group-hover/flag:scale-110 duration-500">
                                    {getFlag(match.team1)}
                                </div>
                            </div>
                            <div className="text-center">
                                <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase leading-none text-foreground">{match.team1}</h2>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-3">Primary Host</p>
                            </div>
                        </motion.div>

                        {/* Battle Status */}
                        <div className="flex flex-col items-center justify-center gap-8">
                            <div className="relative">
                                <div className="absolute inset-0 blur-3xl bg-secondary/20 rounded-full" />
                                <span className="relative text-5xl sm:text-7xl font-black italic text-foreground/10 select-none tracking-tighter lg:text-8xl">VS</span>
                            </div>
                            
                            {match.result && (
                                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="relative">
                                    <div className="px-8 py-4 bg-gradient-to-r from-primary/20 to-secondary/20 border border-border/5 rounded-[2rem] shadow-2xl backdrop-blur-3xl group/result hover:border-primary/40 transition-all">
                                        <div className="flex flex-col items-center text-center">
                                            <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
                                                <Trophy className="h-3 w-3 shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] text-amber-500" /> Outcome Locked
                                            </span>
                                            <p className="text-sm sm:text-base font-black italic text-foreground leading-tight uppercase tracking-tight">
                                                {match.result}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Team Beta */}
                        <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col items-center gap-6">
                            <div className="relative group/flag">
                                <div className="absolute inset-0 bg-secondary/20 blur-2xl rounded-full opacity-0 group-hover/flag:opacity-100 transition-opacity" />
                                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-secondary/40 backdrop-blur-3xl flex items-center justify-center text-5xl sm:text-7xl font-black shadow-2xl border-4 border-border/50 transition-transform group-hover/flag:scale-110 duration-500">
                                    {getFlag(match.team2)}
                                </div>
                            </div>
                            <div className="text-center">
                                <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase leading-none text-foreground">{match.team2}</h2>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-3">Designated Opponent</p>
                            </div>
                        </motion.div>
                    </div>

                    <div className="mt-20 flex flex-wrap items-center justify-center gap-8 text-[11px] font-black text-muted-foreground border-t border-border/50 pt-10 uppercase tracking-[0.2em]">
                        <span className="flex items-center gap-3 px-6 py-2 rounded-full bg-secondary/30 border border-border/50 hover:bg-secondary/40 transition-colors">
                            <Calendar className="h-4 w-4 text-primary" />
                            {match.match_date ? new Date(match.match_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Deployment pending"}
                        </span>
                        <span className="flex items-center gap-3 px-6 py-2 rounded-full bg-secondary/30 border border-border/50 hover:bg-secondary/40 transition-colors max-w-xs truncate">
                            <MapPin className="h-4 w-4 text-primary" />
                            {match.venue || "Tactical Venue — Classified"}
                        </span>
                        {match.event_name && (
                            <span className="flex items-center gap-3 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary">
                                <Shield className="h-4 w-4" />
                                {match.event_name}
                            </span>
                        )}
                    </div>
                </div>
            </div>
          </div>
        </motion.div>

        {/* H2H Quick Briefing Overlay */}
        {h2hStats && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-12 glass p-8 rounded-[3rem] border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 flex flex-wrap items-center justify-center gap-12"
            >
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">Supremacy Split</span>
                    <div className="flex items-center gap-4">
                        <span className="text-2xl font-black italic text-primary uppercase">{match.team1} {h2hStats.t1Wins}</span>
                        <div className="w-16 h-1.5 bg-secondary/50 rounded-full overflow-hidden flex">
                            <div className="h-full bg-primary" style={{ width: `${(h2hStats.t1Wins / Math.max(1, h2hStats.total)) * 100}%` }} />
                            <div className="h-full bg-accent" style={{ width: `${(h2hStats.t2Wins / Math.max(1, h2hStats.total)) * 100}%` }} />
                        </div>
                        <span className="text-2xl font-black italic text-accent uppercase">{h2hStats.t2Wins} {match.team2}</span>
                    </div>
                </div>
                <div className="h-12 w-px bg-border/50 hidden md:block" />
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2">Historical Dataset</span>
                    <span className="text-2xl font-black italic uppercase tracking-tighter">{h2hStats.total} <span className="text-xs text-muted-foreground not-italic ml-1">Engagements</span></span>
                </div>
            </motion.div>
        )}


        {/* 2-Row KPI Command Grid */}
        <div className="mb-20">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-secondary/30 rounded-xl border border-border/50 shadow-sm">
                    <Activity className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">Operational Metrics Matrix</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {kpis.map((k, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="stat-card glass border-border/50 group hover:border-primary/40 hover:bg-accent/5 flex flex-col justify-between py-6 px-8 rounded-3xl"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">{k.label}</span>
                            <k.icon className={`h-4 w-4 ${k.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
                        </div>
                        <div className={`text-4xl font-black tracking-tighter leading-none ${k.color.includes('text-primary') ? 'text-primary' : 'text-foreground'}`}>
                            {k.value}
                        </div>
                        <div className="mt-4 h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "70%" }}
                                transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                className={`h-full ${k.color.replace('text-', 'bg-') || 'bg-primary/40'}`} 
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* Momentum & Strategic Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
            <div className="lg:col-span-12 xl:col-span-8 p-10 rounded-[3rem] glass border-border/50 bg-gradient-to-br from-card to-transparent shadow-inner">
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary/40 rounded-xl border border-border/50">
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">Live Momentum Trajectory</h3>
                    </div>
                </div>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={momentumData}>
                            <defs>
                                <linearGradient id="colorT1" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#256af4" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#256af4" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorT2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                            <XAxis dataKey="over" hide />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "black", fill: "hsl(var(--muted-foreground) / 0.4)" }} />
                            <Tooltip 
                                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "1.25rem", backdropFilter: "blur(20px)", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                                labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "10px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em" }}
                            />
                            <Area type="monotone" dataKey="team1" name={match.team1} stroke="#256af4" strokeWidth={4} fillOpacity={1} fill="url(#colorT1)" activeDot={{ r: 6, strokeWidth: 0, fill: "#256af4" }} />
                            <Area type="monotone" dataKey="team2" name={match.team2} stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorT2)" activeDot={{ r: 6, strokeWidth: 0, fill: "#f43f5e" }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="lg:col-span-12 xl:col-span-4 p-10 rounded-[3rem] glass border-border/50 bg-card/40">
                <div className="flex items-center gap-3 mb-10">
                    <div className="p-2 bg-secondary/30 rounded-xl border border-border/50">
                        <Target className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em]">Venue Intelligence</h3>
                </div>
                
                <div className="space-y-8">
                    <div className="p-6 rounded-[2rem] bg-secondary/20 border border-border/50 relative overflow-hidden group hover:bg-secondary/30 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 bg-muted rounded-bl-3xl">
                            <Trophy className="h-12 w-12" />
                        </div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Toss Impact</p>
                        <p className="text-lg font-bold italic uppercase tracking-tighter text-foreground">Win Prob +14.2%</p>
                        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed font-medium">Opting to bat first yields critical technical leverage on this surface.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-[2rem] bg-primary/10 border border-primary/30">
                            <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Spin Factor</p>
                            <p className="text-2xl font-black text-foreground">6.2</p>
                            <p className="text-[8px] font-black uppercase text-muted-foreground mt-1">High Turn</p>
                        </div>
                        <div className="p-6 rounded-[2rem] bg-amber-500/10 border border-amber-500/30">
                            <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Pace Index</p>
                            <p className="text-2xl font-black text-foreground">4.8</p>
                            <p className="text-[8px] font-black uppercase text-muted-foreground mt-1">Variable</p>
                        </div>
                    </div>

                    <div className="p-8 rounded-[2rem] glass border-border/50 border-dashed flex flex-col items-center justify-center text-center opacity-40 hover:opacity-100 transition-opacity py-12">
                        <MapPin className="h-8 w-8 text-muted-foreground mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Spatial Heatmap Matrix</p>
                        <Button variant="outline" size="sm" className="mt-4 rounded-full text-[9px] font-bold h-7 px-4 border-border/50">Download PDF Report</Button>
                    </div>
                </div>
            </div>
        </div>
        {/* Scorecard Tabs */}
        {matchInnings.length > 0 ? (
          <Tabs defaultValue="deployment" className="w-full space-y-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/30 rounded-2xl border border-border/50 shadow-xl">
                    <History className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-xl font-black italic tracking-tighter uppercase leading-none text-foreground">Combat Scorecard</h3>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1.5 leading-none">Phase-Encoded Ball by Ball Tracking</p>
                </div>
              </div>
              
              <TabsList className="bg-secondary/30 p-1.5 h-12 rounded-2xl border border-border/50 backdrop-blur-md inline-flex items-center gap-2">
                <TabsTrigger value="deployment" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black px-6 py-2 rounded-xl h-9 text-[11px] uppercase tracking-tighter">Combat Scorecard</TabsTrigger>
                <TabsTrigger value="leaders" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black px-6 py-2 rounded-xl h-9 text-[11px] uppercase tracking-tighter">Match Leadership</TabsTrigger>
                <TabsTrigger value="h2h" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black px-6 py-2 rounded-xl h-9 text-[11px] uppercase tracking-tighter">H2H Analytics</TabsTrigger>
              </TabsList>
            </div>

            <AnimatePresence mode="wait">
              <TabsContent key="deployment-content" value="deployment" className="space-y-12 focus:outline-none">
                <Tabs defaultValue={matchInnings[0].toString()} className="w-full">
                  <div className="flex justify-center mb-10">
                    <TabsList className="bg-secondary/20 p-1 rounded-2xl border border-border/50 h-11">
                      {matchInnings.map((inning) => {
                        const inningPlayers = inningsMap.get(inning) ?? [];
                        const team = inningPlayers[0]?.team || (inning % 2 === 1 ? match.team1 : match.team2);
                        const battingTeamShort = team.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
                        return (
                          <TabsTrigger 
                            key={inning} 
                            value={inning.toString()}
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] font-black px-6 py-2 rounded-xl transition-all text-[11px] uppercase tracking-tighter h-9"
                          >
                            {getFlag(battingTeamShort)} Inning {inning}
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </div>

                  <AnimatePresence mode="wait">
                  {matchInnings.map((inning) => {
                    const inningPlayers = inningsMap.get(inning) ?? [];
                    const battingPlayersInInning = inningPlayers.filter(p => p.is_batter && p.bat_balls > 0);
                    const bowlingPlayersInInning = inningPlayers.filter(p => p.is_bowler && p.bowl_overs > 0);
                    const battingTeam = battingPlayersInInning[0]?.team || (inning % 2 === 1 ? match.team1 : match.team2);
                    
                    const battingStats = [...battingPlayersInInning].sort(sortBatting);
                    const bowlingStats = [...bowlingPlayersInInning].sort(sortBowling);

                    const totalFromBat = battingStats.reduce((sum, p) => sum + p.bat_runs, 0);
                    const totalWickets = bowlingStats.reduce((sum, p) => sum + p.bowl_wickets, 0);

                    const getRoleBadge = (runs: number, sr: number) => {
                        if (sr > 160 && runs < 30) return "Tactical Striker";
                        if (sr > 140 && runs >= 30) return "Power Finisher";
                        if (sr < 120 && runs >= 40) return "Technical Anchor";
                        return "Operational Batter";
                    };

                    return (
                      <TabsContent key={inning} value={inning.toString()} className="space-y-10 focus:outline-none">
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                          {/* Professional Batting Matrix */}
                          <Card className="lg:col-span-12 xl:col-span-8 border-none shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden bg-card/80 backdrop-blur-3xl rounded-[3rem] border border-border/50">
                            <div className="p-8 sm:p-10 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent">
                              <div className="flex items-center justify-between flex-wrap gap-6">
                                <div className="flex items-center gap-6">
                                  <span className="text-4xl sm:text-5xl font-black bg-secondary/40 w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] flex items-center justify-center shadow-inner border border-border/50 transition-transform hover:scale-105 duration-500">
                                    {getFlag(battingTeam)}
                                  </span>
                                  <div>
                                    <h4 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase italic leading-none text-foreground">{battingTeam}</h4>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-3 leading-none">Deployment Matrix — Inning {inning}</p>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end">
                                   <div className="text-4xl sm:text-6xl font-black text-primary tracking-tighter leading-none">{totalFromBat} <span className="text-lg text-foreground/20 select-none">/</span> {totalWickets}</div>
                                   <div className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.3em] leading-none mt-4 text-right">Aggregate Combat Contribution</div>
                                </div>
                              </div>
                            </div>
                            <div className="p-0 overflow-x-auto">
                              <Table>
                                <TableHeader className="bg-secondary/20">
                                  <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="py-5 pl-10 text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground whitespace-nowrap">Entity</TableHead>
                                    <TableHead className="text-right text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Efficiency</TableHead>
                                    <TableHead className="text-right text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Density</TableHead>
                                    <TableHead className="text-right text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground hidden sm:table-cell">Vectors</TableHead>
                                    <TableHead className="text-right text-[10px] uppercase font-black tracking-[0.2em] text-primary whitespace-nowrap">SR Index</TableHead>
                                    <TableHead className="text-right pr-10 text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Outcome</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {battingStats.length > 0 ? battingStats.map((player) => (
                                    <TableRow key={player.player_id} className="group hover:bg-secondary/10 transition-colors border-border/50">
                                      <TableCell className="py-6 pl-10">
                                        <Link to={`/player/${player.player_id}`} className="block group/link">
                                          <div className="flex flex-col">
                                              <span className="font-black text-sm uppercase italic tracking-tight group-hover/link:text-primary transition-colors text-foreground">{player.player_name}</span>
                                              <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1.5">{getRoleBadge(player.bat_runs, parseFloat(calculateStrikeRate(player.bat_runs, player.bat_balls)))}</span>
                                          </div>
                                        </Link>
                                      </TableCell>
                                      <TableCell className="text-right">
                                          <span className="text-2xl font-black text-foreground tracking-tighter italic">{player.bat_runs}</span>
                                          <span className="text-[9px] text-muted-foreground font-black ml-1 uppercase">Runs</span>
                                      </TableCell>
                                      <TableCell className="text-right text-muted-foreground font-black text-sm tabular-nums opacity-80">{player.bat_balls}</TableCell>
                                      <TableCell className="text-right hidden sm:table-cell">
                                          <div className="flex items-center justify-end gap-2 px-2">
                                              <div className="flex flex-col items-center">
                                                  <span className="text-[10px] font-black text-foreground/80 tabular-nums">{player.bat_fours}</span>
                                                  <span className="text-[7px] font-bold text-muted-foreground uppercase">4s</span>
                                              </div>
                                              <div className="h-4 w-px bg-border/50 mx-1" />
                                              <div className="flex flex-col items-center">
                                                  <span className="text-[10px] font-black text-primary tabular-nums">{player.bat_sixes}</span>
                                                  <span className="text-[7px] font-bold text-muted-foreground uppercase">6s</span>
                                              </div>
                                          </div>
                                      </TableCell>
                                      <TableCell className="text-right">
                                          <span className="text-sm font-black text-primary font-mono bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">{calculateStrikeRate(player.bat_runs, player.bat_balls)}</span>
                                      </TableCell>
                                      <TableCell className="text-right pr-10">
                                        {formatDismissal(player)}
                                      </TableCell>
                                    </TableRow>
                                  )) : (
                                    <TableRow>
                                      <TableCell colSpan={6} className="py-20 text-center text-muted-foreground font-black uppercase tracking-widest text-xs opacity-30 italic">No Batting Deployment Recorded</TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </Card>

                          {/* Bowling Analytics Overlay */}
                          <Card className="lg:col-span-12 xl:col-span-4 border-none shadow-[0_0_50px_rgba(0,0,0,0.2)] bg-card/60 backdrop-blur-3xl rounded-[3rem] border border-border/50 flex flex-col h-full">
                            <div className="p-8 sm:p-10 pb-6">
                                <h4 className="text-xl font-black italic tracking-tighter uppercase text-accent mb-2">Supression Analysis</h4>
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Operational Bowling Efficiency</p>
                            </div>
                            <div className="px-0 overflow-x-auto">
                              <Table>
                                <TableHeader className="bg-secondary/10">
                                  <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="py-4 pl-8 text-[9px] uppercase font-black tracking-widest text-muted-foreground">Operator</TableHead>
                                    <TableHead className="text-right text-[9px] uppercase font-black tracking-widest text-muted-foreground">O</TableHead>
                                    <TableHead className="text-right text-[9px] uppercase font-black tracking-widest text-accent">W</TableHead>
                                    <TableHead className="text-right pr-8 text-[9px] uppercase font-black tracking-widest text-muted-foreground">Eco</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {bowlingStats.length > 0 ? bowlingStats.map((player) => (
                                    <TableRow key={player.player_id} className="group hover:bg-secondary/20 transition-colors border-border/50">
                                      <TableCell className="py-4 pl-8">
                                        <Link to={`/player/${player.player_id}`} className="block">
                                          <span className="font-black text-xs uppercase tracking-tight text-foreground group-hover:text-accent transition-colors">{player.player_name}</span>
                                        </Link>
                                      </TableCell>
                                      <TableCell className="text-right text-muted-foreground text-xs font-black tabular-nums">{player.bowl_overs}</TableCell>
                                      <TableCell className="text-right">
                                          <span className="text-xl font-black text-accent italic">{player.bowl_wickets}</span>
                                      </TableCell>
                                      <TableCell className="text-right pr-8">
                                          <div className="flex flex-col items-end">
                                              <span className="text-sm font-black text-foreground/80 tabular-nums">{player.bowl_econ.toFixed(2)}</span>
                                              <span className="text-[6px] font-black uppercase text-muted-foreground tracking-[0.2em]">Overs Runrate</span>
                                          </div>
                                      </TableCell>
                                    </TableRow>
                                  )) : (
                                    <TableRow>
                                      <TableCell colSpan={4} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-20">
                                          <Shield className="h-10 w-10 text-muted-foreground" />
                                          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">No strike data</span>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                            <div className="p-6 bg-secondary/10 border-t border-border/50 flex items-center justify-between mt-auto">
                               <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Active Surveillance</span>
                               </div>
                               <div className="flex gap-4">
                                  <BarChart3 className="h-4 w-4 text-muted-foreground/30" />
                                  <Shield className="h-4 w-4 text-muted-foreground/30" />
                               </div>
                            </div>
                          </Card>
                        </motion.div>
                      </TabsContent>
                    );
                  })}
                  </AnimatePresence>
                </Tabs>
              </TabsContent>

              <TabsContent key="leaders-content" value="leaders" className="space-y-8 focus:outline-none">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Top Batters */}
                    <Card className="glass rounded-[2.5rem] p-6 border-border/50 overflow-hidden relative group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                          <Zap className="w-12 h-12 text-primary" />
                      </div>
                      <h3 className="text-sm font-black italic tracking-tighter uppercase mb-6 border-l-4 border-primary pl-3">Elite Strikers</h3>
                      <div className="space-y-5">
                          {matchLeaders?.topBatters.map((player, idx) => (
                              <div key={`batter-${player.id || idx}`} className="flex items-center justify-between group/item">
                                  <span className={`text-base font-black italic ${idx === 0 ? 'text-primary' : 'text-muted-foreground'}`}>#0{idx + 1}</span>
                                  <div className="flex-1 px-3 truncate">
                                      <p className="font-black text-[11px] uppercase tracking-tight truncate">{player.name}</p>
                                      <p className="text-[8px] font-bold text-muted-foreground uppercase">{player.team}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-xl font-black italic text-foreground leading-none">{player.runs}</p>
                                      <p className="text-[7px] font-black text-muted-foreground uppercase mt-1">Runs</p>
                                  </div>
                              </div>
                          ))}
                          {matchLeaders?.topBatters.length === 0 && <p className="text-[10px] text-muted-foreground uppercase font-black text-center py-4 opacity-30 tracking-widest">No Data</p>}
                      </div>
                    </Card>

                    {/* Top Bowlers */}
                    <Card className="glass rounded-[2.5rem] p-6 border-border/50 overflow-hidden relative group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                          <Target className="w-12 h-12 text-accent" />
                      </div>
                      <h3 className="text-sm font-black italic tracking-tighter uppercase mb-6 border-l-4 border-accent pl-3">Precision Assets</h3>
                      <div className="space-y-5">
                          {matchLeaders?.topBowlers.map((player, idx) => (
                              <div key={`bowler-${player.id || idx}`} className="flex items-center justify-between group/item">
                                  <span className={`text-base font-black italic ${idx === 0 ? 'text-accent' : 'text-muted-foreground'}`}>#0{idx + 1}</span>
                                  <div className="flex-1 px-3 truncate">
                                      <p className="font-black text-[11px] uppercase tracking-tight truncate">{player.name}</p>
                                      <p className="text-[8px] font-bold text-muted-foreground uppercase">{player.team}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-xl font-black italic text-accent leading-none">{player.wickets}</p>
                                      <p className="text-[7px] font-black text-muted-foreground uppercase mt-1">Wickets</p>
                                  </div>
                              </div>
                          ))}
                          {matchLeaders?.topBowlers.length === 0 && <p className="text-[10px] text-muted-foreground uppercase font-black text-center py-4 opacity-30 tracking-widest">No Data</p>}
                      </div>
                    </Card>

                    {/* Top Fielders */}
                    <Card className="glass rounded-[2.5rem] p-6 border-border/50 overflow-hidden relative group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                          <Shield className="w-12 h-12 text-blue-500" />
                      </div>
                      <h3 className="text-sm font-black italic tracking-tighter uppercase mb-6 border-l-4 border-blue-500 pl-3">Guardian Core</h3>
                      <div className="space-y-5">
                          {matchLeaders?.topFielders.map((player, idx) => (
                              <div key={`fielder-${player.id || idx}`} className="flex items-center justify-between group/item">
                                  <span className={`text-base font-black italic ${idx === 0 ? 'text-blue-500' : 'text-muted-foreground'}`}>#0{idx + 1}</span>
                                  <div className="flex-1 px-3 truncate">
                                      <p className="font-black text-[11px] uppercase tracking-tight truncate">{player.name}</p>
                                      <p className="text-[8px] font-bold text-muted-foreground uppercase">{player.team}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-xl font-black italic text-blue-500 leading-none">{player.fielding}</p>
                                      <p className="text-[7px] font-black text-muted-foreground uppercase mt-1">Impacts</p>
                                  </div>
                              </div>
                          ))}
                          {matchLeaders?.topFielders && matchLeaders.topFielders.length === 0 && <p className="text-[10px] text-muted-foreground uppercase font-black text-center py-4 opacity-30 tracking-widest">No Data</p>}
                      </div>
                    </Card>

                    {/* Boundary Kings */}
                    <Card className="glass rounded-[2.5rem] p-6 border-border/50 overflow-hidden relative group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                          <TrendingUp className="w-12 h-12 text-amber-500" />
                      </div>
                      <h3 className="text-sm font-black italic tracking-tighter uppercase mb-6 border-l-4 border-amber-500 pl-3">Range Merchants</h3>
                      <div className="space-y-5">
                          {matchLeaders?.boundaryKings.map((player, idx) => (
                              <div key={`boundary-${player.id || idx}`} className="flex items-center justify-between group/item">
                                  <span className={`text-base font-black italic ${idx === 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>#0{idx + 1}</span>
                                  <div className="flex-1 px-3 truncate">
                                      <p className="font-black text-[11px] uppercase tracking-tight truncate">{player.name}</p>
                                      <p className="text-[8px] font-bold text-muted-foreground uppercase">{player.team}</p>
                                  </div>
                                  <div className="text-right flex items-end gap-2">
                                      <div>
                                          <p className="text-lg font-black italic text-foreground leading-none">{player.fours}</p>
                                          <p className="text-[6px] font-black text-muted-foreground uppercase text-right">4s</p>
                                      </div>
                                      <div className="w-px h-6 bg-border/50" />
                                      <div>
                                          <p className="text-lg font-black italic text-primary leading-none">{player.sixes}</p>
                                          <p className="text-[6px] font-black text-muted-foreground uppercase text-right">6s</p>
                                      </div>
                                  </div>
                              </div>
                          ))}
                          {matchLeaders?.boundaryKings.length === 0 && <p className="text-[10px] text-muted-foreground uppercase font-black text-center py-4 opacity-30 tracking-widest">No Data</p>}
                      </div>
                    </Card>
                 </div>
              </TabsContent>

              <TabsContent key="h2h-content" value="h2h" className="space-y-8 focus:outline-none">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* H2H Win Split */}
                      <div className="lg:col-span-4 space-y-8">
                          <Card className="glass rounded-[2.5rem] p-10 border-border/50">
                              <h3 className="text-xl font-black italic uppercase italic tracking-tighter mb-10">Combat Supremacy</h3>
                              <div className="space-y-12">
                                  <div className="space-y-4">
                                      <div className="flex justify-between items-end">
                                          <span className="text-xs font-black uppercase text-muted-foreground tracking-[0.2em]">{match.team1}</span>
                                          <span className="text-3xl font-black italic italic leading-none">{h2hStats?.t1Wins} <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tight not-italic ml-1">Wins</span></span>
                                      </div>
                                      <div className="h-4 bg-secondary/30 rounded-full overflow-hidden flex border border-border/50">
                                          <motion.div 
                                              initial={{ width: 0 }}
                                              animate={{ width: `${(h2hStats?.t1Wins! / Math.max(1, h2hStats?.total!)) * 100}%` }}
                                              className="h-full bg-primary"
                                          />
                                      </div>
                                  </div>
                                  <div className="space-y-4">
                                      <div className="flex justify-between items-end">
                                          <span className="text-xs font-black uppercase text-muted-foreground tracking-[0.2em]">{match.team2}</span>
                                          <span className="text-3xl font-black italic italic leading-none">{h2hStats?.t2Wins} <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tight not-italic ml-1">Wins</span></span>
                                      </div>
                                      <div className="h-4 bg-secondary/30 rounded-full overflow-hidden flex border border-border/50">
                                          <motion.div 
                                              initial={{ width: 0 }}
                                              animate={{ width: `${(h2hStats?.t2Wins! / Math.max(1, h2hStats?.total!)) * 100}%` }}
                                              className="h-full bg-accent"
                                          />
                                      </div>
                                  </div>
                                  <div className="pt-6 border-t border-border/50 text-center">
                                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Evaluation Dataset: Last {h2hStats?.total} Engagements</p>
                                  </div>
                              </div>
                          </Card>
                      </div>

                      {/* H2H Historical Feed */}
                      <Card className="lg:col-span-8 glass rounded-[2.5rem] overflow-hidden border-border/50">
                          <div className="p-8 border-b border-border/50 bg-secondary/10">
                              <h3 className="text-xl font-black italic uppercase tracking-tighter">Engagement History</h3>
                          </div>
                          <div className="p-0">
                              <Table>
                                  <TableHeader className="bg-secondary/20">
                                      <TableRow className="hover:bg-transparent border-none">
                                          <TableHead className="py-5 pl-10 text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Chronology</TableHead>
                                          <TableHead className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Conflict Location</TableHead>
                                          <TableHead className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Outcome Status</TableHead>
                                          <TableHead className="pr-10 text-right text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">Entity Victor</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                       {h2hMatches && h2hMatches.length > 0 ? h2hMatches.map((m, idx) => (
                                          <TableRow key={m.id || idx} className="group hover:bg-secondary/10 transition-colors border-border/50">
                                              <TableCell className="py-6 pl-10">
                                                  <div className="flex flex-col">
                                                      <span className="font-black text-sm italic text-foreground uppercase tracking-tight">
                                                          {new Date(m.match_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                                                      </span>
                                                      <span className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{m.format}</span>
                                                  </div>
                                              </TableCell>
                                              <TableCell className="font-medium text-xs text-muted-foreground uppercase tracking-tight">{m.venue}</TableCell>
                                              <TableCell>
                                                  <Badge variant="outline" className={`font-black text-[9px] uppercase px-3 py-1 rounded-lg ${m.winner ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                      {m.result || 'Concluded'}
                                                  </Badge>
                                              </TableCell>
                                              <TableCell className="text-right pr-10">
                                                  <span className={`font-black text-sm uppercase italic tracking-tighter ${m.winner === match.team1 ? 'text-primary' : m.winner === match.team2 ? 'text-accent' : 'text-muted-foreground'}`}>
                                                      {m.winner || 'Draw/No Result'}
                                                  </span>
                                              </TableCell>
                                          </TableRow>
                                      )) : (
                                          <TableRow>
                                              <TableCell colSpan={4} className="h-32 text-center text-muted-foreground font-black uppercase tracking-widest text-[10px]">No Prior Engagements Recorded</TableCell>
                                          </TableRow>
                                      )}
                                  </TableBody>
                              </Table>
                          </div>
                      </Card>
                  </div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        ) : (
          <Card className="border-dashed border-2 py-24 sm:py-32 text-center bg-transparent">
            <CardContent>
              <Info className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/20 mx-auto mb-6" />
              <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter">No scorecard data</h3>
              <p className="text-sm sm:text-muted-foreground max-w-md mx-auto mt-2 px-4">
                Detailed ball-by-ball performance stats haven't been processed for this match yet.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center px-6">
                <Button variant="outline" className="font-bold w-full sm:w-auto">
                  Refresh Data
                </Button>
                <Button className="font-bold w-full sm:w-auto">
                  Import Ball-by-Ball
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MatchDetails;
