import { Zap, Target, Activity, TrendingUp, History, BarChart3 as BarChartIcon, Crosshair, ShieldCheck, Info, Trophy, Map as MapIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { DismissalChart } from "@/components/batting/DismissalChart";
import { PaceVsSpin } from "@/components/batting/PaceVsSpin";
import { WagonWheel } from "@/components/batting/WagonWheel";
import { BallLengthMatrix } from "@/components/batting/BallLengthMatrix";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell } from "recharts";
import { useMemo } from "react";
import { usePlayerVsBowling, usePlayerPhaseStats, usePlayerDeliveries } from "@/lib/hooks/usePlayers";
import type { PlayerSummary, PlayerMatchRow } from "@/lib/hooks/usePlayers";
import { cn } from "@/lib/utils";

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
  const { data: deliveries, isLoading: deliveriesLoading } = usePlayerDeliveries(
    stats?.player_id,
    format.toUpperCase() === "ALL" ? undefined : format,
    { role: "striker" }
  );

  const isLoading = parentLoading || vsBowlingLoading || phaseLoading || deliveriesLoading;

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

  // New useMemos for weakness tab extensions - use bowler_type from vsBowlingStats (not bowling_type)
  const paceDismissals = useMemo(() => {
    return vsBowlingStats?.reduce((acc, curr) => acc + (curr.bowler_type === 'pace' ? curr.bat_dismissals : 0), 0) || 0;
  }, [vsBowlingStats]);

  const spinDismissals = useMemo(() => {
    return vsBowlingStats?.reduce((acc, curr) => acc + (curr.bowler_type === 'spin' ? curr.bat_dismissals : 0), 0) || 0;
  }, [vsBowlingStats]);

  const bowlerDismissals = useMemo(() => {
    return vsBowlingStats
      ?.map(bowler => ({
        name: bowler.bowler_name || bowler.bowler, // Fallback to bowler field if bowler_name not available
        dismissals: bowler.bat_dismissals
      }))
      .filter(bowler => bowler.dismissals > 0)
      .sort((a, b) => b.dismissals - a.dismissals) || [];
  }, [vsBowlingStats]);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse pb-20">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {[
          { label: "Matches", value: stats?.matches ?? processedMatches.length, icon: History, color: "text-muted-foreground" },
          { label: "Total Runs", value: stats?.runs ?? processedMatches.reduce((a, b) => a + b.runs, 0), highlight: true, icon: Trophy, color: "text-primary" },
          { label: "Average", value: stats?.average ?? "—", icon: ShieldCheck, color: "text-blue-600 dark:text-blue-500" },
          { label: "Strike Rate", value: stats?.strike_rate ?? "—", icon: Zap, color: "text-amber-600 dark:text-amber-500" },
          { label: "Total Fours", value: stats?.fours ?? "—", icon: Target, color: "text-primary/70" },
          { label: "Total Sixes", value: stats?.sixes ?? "—", icon: TrendingUp, color: "text-accent" },
        ].map((s, i) => (
          <div key={i} className={cn(
            "p-6 rounded-3xl glass flex flex-col justify-between group overflow-hidden transition-all active:scale-[0.98] shadow-lg",
            s.highlight ? "border-primary/40 shadow-primary/5 ring-1 ring-primary/10 bg-primary/5" : "border-border/50 bg-white/5 dark:bg-white/1"
          )}>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground leading-none">{s.label}</span>
              <s.icon className={cn("h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity", s.color)} />
            </div>
            <span className={cn(
              "value mt-1 tracking-tighter relative z-10 leading-none",
              s.highlight ? "text-primary text-4xl font-black" : "text-3xl font-black text-foreground"
            )}>{s.value}</span>
            <div className="mt-4 h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden relative z-10 p-0.5 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "60%" }}
                className={cn("h-full rounded-full", s.highlight ? 'bg-primary' : 'bg-muted-foreground/30')}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Dissmissal breakdown */}
        <div className="p-8 rounded-[2.5rem] glass border-border/50 bg-white/5 dark:bg-white/1 relative overflow-hidden group hover:border-primary/20 transition-all shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] opacity-80">Dismissals</h3>
          </div>
          <DismissalChart breakdown={computedDismissals} />
          {/* New: Pace and Spin dismissals */}
          <div className="mt-6 grid grid-cols-2 gap-4 text-[10px] font-black text-muted-foreground">
            <div>
              <p className="mb-1">vs Pace</p>
              <p className="text-2xl font-black text-foreground">{paceDismissals}</p>
            </div>
            <div>
              <p className="mb-1">vs Spin</p>
              <p className="text-2xl font-black text-foreground">{spinDismissals}</p>
            </div>
          </div>
          {/* New: Bowler dismissals list */}
          <div className="mt-6">
            <p className="mb-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Dismissals by Bowler</p>
            {bowlerDismissals.length > 0 ? (
              <div className="space-y-2">
                {bowlerDismissals.map((bowler, index) => (
                  <div key={index} className="flex justify-between text-[9px] font-black text-muted-foreground">
                    <span>{bowler.name}</span>
                    <span>{bowler.dismissals}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[9px] font-black text-muted-foreground italic">No bowler dismissal data available</p>
            )}
          </div>
          <div className="mt-6 p-5 rounded-2xl bg-slate-100/50 dark:bg-secondary/30 border border-black/[0.08] dark:border-border text-[10px] font-bold text-muted-foreground dark:text-muted-foreground/80 leading-relaxed italic shadow-inner">
            "Exit vector analysis reveals technical vulnerabilities in high-pressure scenarios."
          </div>
        </div>

        {/* Phase Performance Grid */}
        <div className="lg:col-span-2 p-8 rounded-[2.5rem] glass border-border/50 bg-white/5 dark:bg-white/1 overflow-hidden relative shadow-2xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-3">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] opacity-80">Batting by Phase</h3>
          </div>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-secondary border border-black/5 dark:border-border shadow-sm">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">Consistency:</span>
              <span className="text-[10px] font-black text-primary">{consistency}%</span>
            </div>
          </div>

          {bPhaseStats.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {bPhaseStats.map((p, i) => (
                <div key={i} className="p-6 rounded-[2rem] bg-slate-50 dark:bg-secondary/40 border border-black/5 dark:border-border hover:bg-slate-100 dark:hover:bg-muted/50 transition-all group shadow-sm">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-5 group-hover:text-primary transition-colors">{p.name}</p>
                  <div className="space-y-5">
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Runs Index</p>
                      <p className="text-3xl font-black tracking-tighter text-foreground leading-none">{p.runs}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-black/[0.08] dark:border-white/5 pt-4">
                      <div>
                        <p className="text-[8px] font-black text-muted-foreground/70 dark:text-muted-foreground/60 uppercase tracking-wider">Strike</p>
                        <p className="text-sm font-black text-primary leading-none">{p.sr}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-muted-foreground/70 dark:text-muted-foreground/60 uppercase tracking-wider">Avg</p>
                        <p className="text-sm font-black text-foreground dark:text-foreground/70 leading-none">{p.avg}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground/40">
              <Info className="h-12 w-12 mb-4 opacity-10" />
              <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">Insufficient phase-tagged data</p>
            </div>
          )}

          <div className="mt-12 p-6 border-t border-black/5 dark:border-border flex items-center justify-between bg-slate-50/50 dark:bg-muted/20 -mx-8 -mb-8 shadow-inner">
            <div className="flex items-center px-8">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1 opacity-70">Primary Role</span>
                <span className="text-[11px] font-black uppercase text-foreground/90">{consistency !== "—" && +consistency > 60 ? "Technical Stabilizer" : "Explosive Catalyst"}</span>
              </div>
            </div>
            <div className="h-10 w-px bg-black/5 dark:bg-border" />
            <div className="flex flex-col text-right px-8">
              <span className="text-[8px] font-black uppercase text-muted-foreground/60 tracking-widest mb-1 opacity-70">Calculated Impact</span>
              <span className={cn("text-[11px] font-black uppercase", consistency !== "—" && +consistency > 75 ? "text-success" : "text-amber-600")}>High Probability</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="p-8 rounded-[3rem] glass border-border/50 bg-white/5 dark:bg-white/1 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] opacity-80">Ball Length Matrix</h3>
          </div>
          <BallLengthMatrix deliveries={deliveries ?? []} />
        </div>

        <div className="p-8 rounded-[3rem] glass border-border/50 bg-white/5 dark:bg-white/1 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-10">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] opacity-80">Wagon Wheel</h3>
          </div>
          <WagonWheel deliveries={deliveries ?? []} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Dynamic Splits Card */}
        <div className="p-8 rounded-[3rem] glass border-border/50 bg-white/5 dark:bg-white/1 shadow-2xl">
          <div className="flex items-center gap-3 mb-10">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] opacity-80">Pace vs Spin</h3>
          </div>
          <PaceVsSpin stats={vsBowlingStats as any} />
        </div>

        {/* Intensity Chart */}
        <div className="p-8 rounded-[3rem] glass border-border/50 bg-white/5 dark:bg-white/1 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-slate-100 dark:bg-secondary rounded-lg">
              <History className="h-4 w-4 text-muted-foreground" />
            </div>
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] opacity-80">Intensity Progression Matrix</h3>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentTrend}>
                <defs>
                  <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="inning" hide />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "900", fill: "currentColor" }} className="text-muted-foreground" />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-[2.5rem] border border-border bg-popover/95 backdrop-blur-3xl p-8 text-xs shadow-2xl min-w-[240px]">
                        <p className="font-black text-muted-foreground uppercase tracking-[0.2em] text-[9px] mb-4 opacity-60">{d.opponent}</p>
                        <div className="flex items-end justify-between gap-8">
                          <p className="text-primary font-black text-5xl tracking-tighter leading-none">{d.runs}{d.isNotOut ? "*" : ""}</p>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-60">{d.date}</p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="runs"
                  stroke="hsl(var(--primary))"
                  strokeWidth={5}
                  fillOpacity={1}
                  fill="url(#colorRuns)"
                  activeDot={{ r: 10, strokeWidth: 0, fill: "hsl(var(--primary))", shadow: "0 0 20px rgba(var(--primary-rgb), 0.5)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Seasonal Velocity */}
      <div className="p-10 rounded-[3rem] glass border-border/50 bg-white/5 dark:bg-white/1 shadow-2xl overflow-hidden relative">
        <div className="flex items-center gap-3 mb-10 relative z-10">
          <div className="p-2 bg-slate-100 dark:bg-secondary rounded-lg">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] opacity-90">Seasonal Run Velocity</h3>
        </div>
        <div className="h-[340px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "900", fill: "currentColor" }} className="text-muted-foreground" dy={15} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "900", fill: "currentColor" }} className="text-muted-foreground" />
              <Tooltip
                cursor={{ fill: "rgba(var(--primary-rgb), 0.05)", radius: 10 }}
                contentStyle={{ background: "hsl(var(--popover))", backdropFilter: "blur(20px)", border: "1px solid hsl(var(--border))", borderRadius: "1.5rem", padding: "12px 16px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
                labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "10px", fontWeight: "900", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.1em" }}
              />
              <Bar dataKey="runs" fill="hsl(var(--primary))" radius={[12, 12, 4, 4]} barSize={48}>
                {yearStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === yearStats.length - 1 ? "hsl(var(--primary))" : "rgba(var(--primary-rgb), 0.3)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
