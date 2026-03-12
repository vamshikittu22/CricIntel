import { Zap, Shield, Target, Activity, TrendingUp, History, BarChart3 as BarChartIcon, Wind, Fan, ZapOff, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { useMemo } from "react";
import { usePlayerPhaseStats } from "@/lib/hooks/usePlayers";
import type { PlayerSummary, PlayerMatchRow } from "@/lib/hooks/usePlayers";

interface BowlingTabProps {
  stats: PlayerSummary | null;
  recentMatches: PlayerMatchRow[];
  format: string;
  isLoading: boolean;
}

export function BowlingTab({ stats, recentMatches, format, isLoading: parentLoading }: BowlingTabProps) {
  const { data: phaseStats, isLoading: phaseLoading } = usePlayerPhaseStats(stats?.player_id, format);
  
  const isLoading = parentLoading || phaseLoading;

  const processedBowling = useMemo(() => {
    return [...recentMatches]
      .filter((m) => m.is_bowler)
      .sort((a, b) => a.match_date.localeCompare(b.match_date))
      .map((m, i) => ({
        inning: i + 1,
        wickets: m.bowl_wickets,
        runs: m.bowl_runs,
        overs: m.bowl_overs,
        econ: +m.bowl_econ,
        date: m.match_date,
        year: m.match_date?.substring(0, 4) || "—",
        opponent: `${m.team1} vs ${m.team2}`,
      }));
  }, [recentMatches]);

  const yearStats = useMemo(() => {
    const map = new Map<string, { wickets: number; innings: number; runsTotal: number; econTotal: number }>();
    for (const m of processedBowling) {
      const y = m.year;
      if (!map.has(y)) map.set(y, { wickets: 0, innings: 0, runsTotal: 0, econTotal: 0 });
      const s = map.get(y)!;
      s.wickets += m.wickets;
      s.innings++;
      s.runsTotal += m.runs;
      s.econTotal += m.econ;
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, s]) => ({
        year,
        wickets: s.wickets,
        avgWickets: +(s.wickets / s.innings).toFixed(1),
        econ: +(s.econTotal / s.innings).toFixed(2),
      }));
  }, [processedBowling]);

  const recentTrend = useMemo(() => processedBowling.slice(-40), [processedBowling]);

  if (isLoading) {
    return (
      <div className="space-y-12 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-[2rem]" />)}
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
           <Skeleton className="h-[450px] rounded-[2.5rem]" />
           <Skeleton className="lg:col-span-2 h-[450px] rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  const hasData = (stats && stats.innings_bowl > 0) || processedBowling.length > 0;
  if (!hasData) {
    return <EmptyState message={`No ${format} bowling data available`} icon={<ZapOff className="h-10 w-10 text-muted-foreground/30" />} />;
  }

  const ppStats = phaseStats?.find(p => p.phase === "powerplay");
  const midStats = phaseStats?.find(p => p.phase === "middle");
  const deathStats = phaseStats?.find(p => p.phase === "death");

  const calcEcon = (runs: number, balls: number) => {
    if (balls === 0) return "—";
    return ((runs / balls) * 6).toFixed(2);
  };

  const phaseData = [
    { name: "Powerplay", econ: ppStats ? calcEcon(ppStats.bowl_runs, ppStats.bowl_balls) : "—", wickets: ppStats?.bowl_wickets ?? 0, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { name: "Middle Overs", econ: midStats ? calcEcon(midStats.bowl_runs, midStats.bowl_balls) : "—", wickets: midStats?.bowl_wickets ?? 0, icon: Shield, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { name: "Death Overs", econ: deathStats ? calcEcon(deathStats.bowl_runs, deathStats.bowl_balls) : "—", wickets: deathStats?.bowl_wickets ?? 0, icon: Target, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-16 pb-20">
      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Wickets", value: stats?.wickets ?? 0, highlight: true, icon: Target, color: "text-primary" },
          { label: "Economy Rate", value: stats?.econ ?? "—", icon: Wind, color: "text-accent" },
          { label: "Best Match", value: stats?.bowl_best_figures ?? "—", icon: Trophy, color: "text-amber-500" },
          { label: "5w Conversion", value: stats?.bowl_five_wickets ?? 0, icon: Zap, color: "text-success" },
          { label: "Average", value: stats?.bowl_average ?? "—", icon: Activity },
          { label: "Strike Rate", value: stats?.bowl_strike_rate ?? "—", icon: TrendingUp },
          { label: "Deployment", value: `${stats?.innings_bowl ?? 0} Innings`, icon: History },
          { label: "Volume", value: `${stats?.overs ?? 0} Overs`, icon: Fan },
        ].map((s, i) => (
          <div key={i} className={`stat-card glass flex flex-col justify-between group overflow-hidden ${s.highlight ? "border-primary/40 ring-1 ring-primary/10" : "border-border/50"}`}>
            <div className="flex items-center justify-between pointer-events-none">
              <span className="label leading-none">{s.label}</span>
              {s.icon && <s.icon className={`h-4 w-4 ${s.color || "text-muted-foreground"} opacity-30 group-hover:opacity-100 transition-opacity`} />}
            </div>
            <div className={`value mt-4 tracking-tighter ${s.highlight ? "text-primary text-5xl" : "text-4xl"}`}>{s.value}</div>
            {s.highlight && <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-primary/10 blur-3xl rounded-full" />}
          </div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        {/* Phase Breakdown Card */}
        <div className="p-8 rounded-[3rem] glass border-border/50 relative overflow-hidden group h-full flex flex-col">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-secondary/50 rounded-xl">
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.25em]">Phase Intelligence</h3>
          </div>
          <div className="space-y-6 flex-1">
            {phaseData.map((p) => (
              <div key={p.name} className={`p-6 rounded-[2rem] glass border ${p.border} transition-all hover:bg-white/[0.02] group/item relative overflow-hidden`}>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-5">
                    <div className={`p-4 rounded-2xl ${p.bg} border border-white/5`}>
                      <p.icon className={`h-6 w-6 ${p.color}`} />
                    </div>
                    <div>
                      <h4 className="font-black text-lg tracking-tight uppercase leading-none">{p.name}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase font-black mono tracking-[0.2em] mt-2">ECON: <span className="text-foreground">{p.econ}</span></p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-black ${p.color} tracking-tighter`}>{p.wickets}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1">Wickets</p>
                  </div>
                </div>
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover/item:opacity-5 transition-opacity bg-gradient-to-r from-transparent via-${p.color.split('-')[1]} to-transparent`} />
              </div>
            ))}
          </div>
        </div>

        {/* Annual Evolution Chart */}
        <div className="lg:col-span-2 p-10 rounded-[3rem] glass border-border/50 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-primary/10 rounded-xl">
              <BarChartIcon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.25em]">Annual Deployment Metrics</h3>
          </div>
          <div className="h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                   <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "900", fill: "hsl(var(--muted-foreground))" }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "900", fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)", radius: 10 }}
                  contentStyle={{ background: "rgba(10, 10, 10, 0.9)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.5rem", padding: "12px 16px" }}
                  labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", fontWeight: "900", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.1em" }}
                />
                <Bar dataKey="wickets" fill="url(#barGrad)" radius={[10, 10, 0, 0]} barSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Trend Progression */}
        <div className="p-10 rounded-[3.5rem] glass border-border/50 relative overflow-hidden bg-gradient-to-br from-secondary/10 to-transparent">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-secondary/80 rounded-xl">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.25em]">Impact Progression</h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentTrend}>
                <defs>
                   <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                   </linearGradient>
                </defs>
                <XAxis dataKey="inning" hide />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "900", fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-[2rem] border border-white/10 bg-black/90 backdrop-blur-3xl p-6 text-xs shadow-2xl ring-1 ring-white/20 min-w-[200px]">
                        <p className="font-black text-white/30 uppercase tracking-[0.2em] text-[9px] mb-3">{d.opponent}</p>
                        <div className="flex items-end justify-between gap-8 mb-4">
                          <p className="text-primary font-black text-5xl tracking-tighter leading-none">{d.wickets}<span className="text-sm uppercase tracking-widest ml-1 opacity-50">w</span></p>
                          <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{d.date}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                           <div>
                             <p className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">Economy</p>
                             <p className="text-sm font-black mono text-foreground">{d.econ}</p>
                           </div>
                           <div className="text-right">
                             <p className="text-[8px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">Overs</p>
                             <p className="text-sm font-black mono text-foreground">{d.overs}</p>
                           </div>
                        </div>
                      </div>
                    );
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="wickets" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4} 
                  fill="url(#lineGrad)"
                  activeDot={{ r: 10, strokeWidth: 0, fill: "hsl(var(--primary))", shadow: "0 0 20px rgba(var(--primary-rgb), 0.5)" }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Annual Summary Table */}
        <div className="p-10 rounded-[3.5rem] glass border-border/50 overflow-hidden relative">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-secondary/80 rounded-xl">
              <History className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.25em]">Career Sector Breakdown</h3>
          </div>
          <div className="overflow-x-auto -mx-10 no-scrollbar">
            <table className="w-full">
               <thead className="bg-white/5 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                  <tr>
                    <th className="px-10 py-6 text-left">Timeline</th>
                    <th className="px-10 py-6 text-right">Total Wickets</th>
                    <th className="px-10 py-6 text-right">Impact Index</th>
                    <th className="px-10 py-6 text-right">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {yearStats.map((y, i) => (
                    <tr key={y.year} className="group/row hover:bg-white/[0.03] transition-all cursor-default">
                      <td className="px-10 py-6 font-black text-sm tracking-tight text-foreground/80">{y.year}</td>
                      <td className="px-10 py-6 text-right font-black text-primary text-2xl tracking-tighter group-hover/row:scale-110 transition-transform origin-right">{y.wickets}</td>
                      <td className="px-10 py-6 text-right font-black text-muted-foreground/60 text-[11px] uppercase tracking-widest">{y.avgWickets} <span className="text-[8px] font-bold">avg</span></td>
                      <td className="px-10 py-6 text-right font-black mono text-xs group-hover/row:text-accent transition-colors">{y.econ}</td>
                    </tr>
                  ))}
                </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

