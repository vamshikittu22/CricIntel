import { Zap, Target, Activity, TrendingUp, History, BarChart3 as BarChartIcon, Crosshair, ShieldCheck, Info, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { DismissalChart } from "@/components/batting/DismissalChart";
import { PaceVsSpin } from "@/components/batting/PaceVsSpin";
import { WagonWheel } from "@/components/batting/WagonWheel";
import { BallLengthMatrix } from "@/components/batting/BallLengthMatrix";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell } from "recharts";
import { useMemo } from "react";
import { usePlayerVsBowling, usePlayerPhaseStats } from "@/lib/hooks/usePlayers";
import type { PlayerSummary, PlayerMatchRow } from "@/lib/hooks/usePlayers";

interface BattingDashboardProps {
  stats: PlayerSummary | null;
  recentMatches: PlayerMatchRow[];
  format: string;
  isLoading?: boolean;
}

export function BattingDashboard({ stats, recentMatches, format, isLoading: parentLoading }: BattingDashboardProps) {
  const { data: vsBowlingStats, isLoading: vsBowlingLoading } = usePlayerVsBowling(
    stats?.player_id, 
    format
  );
  const { data: phaseStats, isLoading: phaseLoading } = usePlayerPhaseStats(
    stats?.player_id,
    format
  );

  const isLoading = parentLoading || vsBowlingLoading || phaseLoading;

  // Compute dismissal breakdown if missing from stats
  const computedDismissals = useMemo(() => {
    if (stats?.dismissals_breakdown && Object.keys(stats.dismissals_breakdown).length > 0) {
      return stats.dismissals_breakdown;
    }
    const breakdown: Record<string, number> = {};
    recentMatches.forEach(m => {
      if (m.is_batter && m.bat_dismissal_kind) {
        const kind = m.bat_dismissal_kind.toLowerCase();
        breakdown[kind] = (breakdown[kind] || 0) + 1;
      }
    });
    return breakdown;
  }, [stats, recentMatches]);

  const processedMatches = useMemo(() => {
    return [...recentMatches]
      .filter((m) => m.is_batter)
      .sort((a, b) => a.match_date.localeCompare(b.match_date))
      .map((m, i) => ({
        inning: i + 1,
        runs: m.bat_runs,
        sr: m.bat_balls > 0 ? +((m.bat_runs / m.bat_balls) * 100).toFixed(1) : 0,
        date: m.match_date,
        year: m.match_date?.substring(0, 4) || "—",
        opponent: `${m.team1} vs ${m.team2}`,
        isNotOut: m.bat_not_out,
      }));
  }, [recentMatches]);

  const consistency = useMemo(() => {
    if (processedMatches.length < 5) return "—";
    const runs = processedMatches.map(m => m.runs);
    const avg = runs.reduce((a, b) => a + b, 0) / runs.length;
    const sqDiffs = runs.map(r => Math.pow(r - avg, 2));
    const variance = sqDiffs.reduce((a, b) => a + b, 0) / runs.length;
    const stdDev = Math.sqrt(variance);
    // Lower CV is better, we invert it for a "score"
    const cv = (stdDev / (avg || 1));
    const score = Math.max(0, Math.min(100, 100 - (cv * 40)));
    return score.toFixed(1);
  }, [processedMatches]);

  const yearStats = useMemo(() => {
    const map = new Map<string, { runs: number; innings: number; avg: number; srTotal: number }>();
    for (const m of processedMatches) {
      const y = m.year;
      if (!map.has(y)) map.set(y, { runs: 0, innings: 0, avg: 0, srTotal: 0 });
      const s = map.get(y)!;
      s.runs += m.runs;
      s.innings++;
      s.srTotal += m.sr;
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, s]) => ({
        year,
        runs: s.runs,
        avg: +(s.runs / s.innings).toFixed(1),
        sr: +(s.srTotal / s.innings).toFixed(1),
      }));
  }, [processedMatches]);

  const bPhaseStats = useMemo(() => {
    if (!phaseStats) return [];
    return phaseStats.map((p: any) => ({
      name: p.phase.charAt(0).toUpperCase() + p.phase.slice(1),
      runs: p.bat_runs,
      sr: p.bat_balls > 0 ? +((p.bat_runs / p.bat_balls) * 100).toFixed(1) : 0,
      avg: p.bat_dismissals > 0 ? +(p.bat_runs / p.bat_dismissals).toFixed(1) : p.bat_runs,
    }));
  }, [phaseStats]);

  const recentTrend = useMemo(() => processedMatches.slice(-30), [processedMatches]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-[1.5rem]" />)}
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
           <Skeleton className="h-[400px] rounded-[2rem]" />
           <Skeleton className="h-[400px] rounded-[2rem]" />
        </div>
      </div>
    );
  }

  if (!stats && processedMatches.length === 0) {
    return <EmptyState message={`No ${format} batting data available`} />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-24">
      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {[
          { label: "Aggregate Matches", value: stats?.matches ?? processedMatches.length, icon: History },
          { label: "Total Runs", value: stats?.runs ?? processedMatches.reduce((a,b) => a+b.runs, 0), highlight: true, icon: Trophy },
          { label: "Elite Average", value: stats?.average ?? "—", icon: ShieldCheck },
          { label: "Strike Index", value: stats?.strike_rate ?? "—", icon: Zap },
          { label: "Boundary Fours", value: stats?.fours ?? "—", icon: Target },
          { label: "Terminal Sixes", value: stats?.sixes ?? "—", icon: TrendingUp },
        ].map((s, i) => (
          <div key={i} className={`stat-card glass ${s.highlight ? "border-primary/30 active-glow" : "border-border/50"} group`}>
            <div className="flex items-center justify-between mb-3">
              <span className="label leading-none">{s.label}</span>
              <s.icon className={`h-3 w-3 ${s.highlight ? 'text-primary' : 'text-muted-foreground'} opacity-50 group-hover:opacity-100 transition-opacity`} />
            </div>
            <span className={`value mt-1 ${s.highlight ? "text-primary" : ""}`}>{s.value}</span>
            <div className="mt-2 h-1 w-full bg-secondary/30 rounded-full overflow-hidden">
               <motion.div initial={{ width: 0 }} animate={{ width: "60%" }} className={`h-full ${s.highlight ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Dissmissal breakdown */}
        <div className="p-8 rounded-[2.5rem] glass border-border/50 relative overflow-hidden group hover:border-primary/20 transition-all">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-secondary rounded-lg">
              <Crosshair className="h-4 w-4 text-muted-foreground" />
            </div>
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Exit Vectors</h3>
          </div>
          <DismissalChart breakdown={computedDismissals} />
          <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-medium text-muted-foreground leading-relaxed italic">
             "Exit vector analysis reveals technical vulnerabilities in high-pressure scenarios."
          </div>
        </div>

        {/* Phase Performance Grid */}
        <div className="lg:col-span-2 p-8 rounded-[2.5rem] glass border-border/50 overflow-hidden relative">
          <div className="flex items-center justify-between mb-10">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Strategic Phase Engagement</h3>
             </div>
             <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Consistency:</span>
                <span className="text-[10px] font-black text-primary">{consistency}%</span>
             </div>
          </div>

          {bPhaseStats.length > 0 ? (
            <div className="grid grid-cols-3 gap-6">
               {bPhaseStats.map((p, i) => (
                 <div key={i} className="p-6 rounded-3xl bg-secondary/20 border border-white/5 hover:bg-white/5 transition-all">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">{p.name}</p>
                    <div className="space-y-4">
                       <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Runs Index</p>
                          <p className="text-2xl font-black tracking-tighter">{p.runs}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <p className="text-[8px] font-bold text-muted-foreground uppercase">Strike</p>
                             <p className="text-sm font-black text-primary">{p.sr}</p>
                          </div>
                          <div>
                             <p className="text-[8px] font-bold text-muted-foreground uppercase">Avg</p>
                             <p className="text-sm font-black text-white/60">{p.avg}</p>
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/40">
               <Info className="h-10 w-10 mb-2 opacity-20" />
               <p className="text-[10px] font-black uppercase tracking-widest">Insufficient phase-tagged data</p>
            </div>
          )}

          <div className="mt-10 p-4 border-t border-white/5 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="flex flex-col">
                   <span className="text-[8px] font-black uppercase text-muted-foreground/50 tracking-widest">Primary Role</span>
                   <span className="text-[10px] font-black uppercase">Technical Stabilizer</span>
                </div>
             </div>
             <div className="h-8 w-px bg-white/10" />
             <div className="flex flex-col text-right">
                <span className="text-[8px] font-black uppercase text-muted-foreground/50 tracking-widest">Calculated Impact</span>
                <span className="text-[10px] font-black uppercase text-success">High Probability</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Dynamic Splits Card */}
        <div className="p-8 rounded-[2.5rem] glass border-border/50">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Kinetic vs Variable Splits</h3>
          </div>
          <PaceVsSpin stats={vsBowlingStats as any} />
        </div>

        {/* Intensity Chart */}
        <div className="p-8 rounded-[2.5rem] glass border-border/50">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-secondary rounded-lg">
              <History className="h-4 w-4 text-muted-foreground" />
            </div>
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Intensity Progression Matrix</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={recentTrend}>
              <defs>
                <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="inning" hide />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "black", fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                content={({ payload }) => {
                  if (!payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl px-4 py-3 text-xs shadow-2xl ring-1 ring-white/10">
                      <p className="font-black text-white/50 uppercase tracking-widest text-[10px] mb-2">{d.opponent}</p>
                      <div className="flex items-center justify-between gap-6">
                        <p className="text-primary font-black text-2xl tracking-tighter">{d.runs}{d.isNotOut ? "*" : ""}</p>
                        <p className="text-[10px] text-white/40 font-bold uppercase">{d.date}</p>
                      </div>
                    </div>
                  );
                }}
              />
              <Area 
                type="monotone" 
                dataKey="runs" 
                stroke="hsl(var(--primary))" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorRuns)"
                activeDot={{ r: 6, strokeWidth: 0, fill: "hsl(var(--primary))" }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Seasonal Velocity */}
      <div className="p-10 rounded-[2.5rem] glass border-border/50 bg-white/[0.02]">
        <div className="flex items-center gap-3 mb-10">
           <div className="p-2 bg-secondary rounded-lg">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
           </div>
           <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Seasonal Run Velocity</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={yearStats}>
            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "black", fill: "hsl(var(--muted-foreground))" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "black", fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
              contentStyle={{ background: "rgba(10, 10, 10, 0.9)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.25rem", color: "#fff", fontSize: "11px", fontWeight: "900" }}
            />
            <Bar dataKey="runs" fill="hsl(var(--primary))" radius={[12, 12, 4, 4]} barSize={48}>
               {yearStats.map((entry, index) => (
                 <Cell key={`cell-${index}`} fill={index === yearStats.length - 1 ? "hsl(var(--primary))" : "rgba(var(--primary-rgb), 0.4)"} />
               ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}


