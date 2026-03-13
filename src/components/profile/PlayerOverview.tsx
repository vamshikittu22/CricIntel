import { Zap, Target, ShieldCheck, TrendingUp, Trophy, Star, History, Info, Activity, Globe } from "lucide-react";
import type { PlayerSummary } from "@/lib/hooks/usePlayers";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OverviewProps {
  battingStats?: PlayerSummary | null;
  bowlingStats?: PlayerSummary | null;
  format: string;
  totals?: any; // Career totals across all formats
  recentMatches?: any[];
}

interface InsightCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  borderColor: string;
  bgGradient: string;
  primaryColor: string;
}

export function PlayerOverview({ battingStats, bowlingStats, format, totals, recentMatches }: OverviewProps) {
  const bs = battingStats;
  const bw = bowlingStats || bs;

  const innings = bs?.innings_bat || 0;
  const isInsufficientData = innings < 5; // Lower threshold for overview

  const peakSeason = useMemo(() => {
    if (!recentMatches || recentMatches.length === 0) return null;
    const yearStats = new Map<number, { runs: number; wickets: number }>();
    recentMatches.forEach(m => {
      const year = new Date(m.match_date).getFullYear();
      const current = yearStats.get(year) || { runs: 0, wickets: 0 };
      yearStats.set(year, {
        runs: current.runs + (m.bat_runs || 0),
        wickets: current.wickets + (m.bowl_wickets || 0)
      });
    });
    let peakYear = -1;
    let maxVal = -1;
    let type = "Runs";
    const isBowler = (bw?.wickets || 0) > (bs?.runs || 0) / 20;

    for (const [year, stats] of yearStats.entries()) {
      const val = isBowler ? stats.wickets : stats.runs;
      if (val > maxVal) {
        maxVal = val;
        peakYear = year;
        type = isBowler ? "Wickets" : "Runs";
      }
    }
    return peakYear !== -1 ? { year: peakYear, value: maxVal, type } : null;
  }, [recentMatches, bs, bw]);

  const balls = bs?.balls || 0;
  const boundaryBalls = (bs?.fours || 0) + (bs?.sixes || 0);
  const boundaryPct = balls > 0 ? ((boundaryBalls / balls) * 100).toFixed(1) : "—";

  const milestones = [
    { label: "Elite 100s", value: bs?.hundreds ?? 0, icon: Trophy, color: "text-amber-600 dark:text-amber-500", glow: "rgba(245, 158, 11, 0.2)" },
    { label: "Major 50s", value: bs?.fifties ?? 0, icon: Star, color: "text-blue-600 dark:text-blue-500", glow: "rgba(59, 130, 246, 0.2)" },
    { label: "Personal Best", value: bs?.best_score ?? 0, icon: Target, color: "text-primary", glow: "rgba(var(--primary-rgb), 0.2)" },
    { label: "5W Hauls", value: bw?.bowl_five_wickets ?? 0, icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-500", glow: "rgba(16, 185, 129, 0.2)" },
    { label: "BBI Match", value: bw?.bowl_best_figures ?? "—", icon: TrendingUp, color: "text-accent", glow: "rgba(var(--accent-rgb), 0.2)" },
  ];

  const insights: InsightCard[] = [];
  if (isInsufficientData) {
    insights.push({
      icon: <Info className="h-5 w-5 text-muted-foreground" />,
      title: "Building Profile",
      description: `Analysis in progress. Need ${5 - innings} more innings for high-confidence tactical insights.`,
      borderColor: "border-l-slate-400 dark:border-l-muted",
      bgGradient: "from-slate-100 to-transparent dark:from-muted/5",
      primaryColor: "text-muted-foreground"
    });
  } else {
    if (bs) {
      if ((bs.strike_rate || 0) > 130) {
        insights.push({
          icon: <Zap className="h-5 w-5 text-primary" />,
          title: "Aggressive Intent",
          description: `Strike rate of ${bs.strike_rate?.toFixed(1)} shows dominant attacking play in ${format}.`,
          borderColor: "border-l-primary",
          bgGradient: "from-primary/10 to-transparent",
          primaryColor: "text-primary"
        });
      } else if ((bs.average || 0) > 40) {
          insights.push({
            icon: <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />,
            title: "Reliable Anchor",
            description: `Average of ${bs.average?.toFixed(1)} makes them a vital technical stabilizer.`,
            borderColor: "border-l-emerald-500",
            bgGradient: "from-emerald-500/10 to-transparent",
            primaryColor: "text-emerald-600 dark:text-emerald-500"
          });
      }
      if (balls > 0 && boundaryBalls / balls > 0.15) {
        insights.push({
          icon: <Target className="h-5 w-5 text-accent" />,
          title: "Boundary Hitting Profile",
          description: `${boundaryPct}% boundary frequency — high efficiency in finding gaps and power clearances.`,
          borderColor: "border-l-accent",
          bgGradient: "from-accent/10 to-transparent",
          primaryColor: "text-accent"
        });
      }
    }
  }

  return (
    <div className="space-y-12">
      {/* Milestone Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 md:grid-cols-3 gap-8">
        {milestones.map((s, i) => (
          <motion.div 
            key={s.label} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-8 rounded-[2.5rem] glass border-black/5 dark:border-border/50 bg-white/5 dark:bg-white/1 group hover:border-primary/20 relative overflow-hidden transition-all active:scale-[0.98] shadow-xl"
          >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-radial-at-tr`} style={{ backgroundImage: `radial-gradient(circle at top right, ${s.glow}, transparent)` }} />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground leading-none opacity-50">{s.label}</span>
              <s.icon className={cn("h-5 w-5 opacity-30 group-hover:opacity-100 transition-opacity", s.color)} />
            </div>
            <div className="text-4xl font-black tracking-tighter text-foreground relative z-10 leading-none">{s.value}</div>
            <div className="absolute -right-4 -bottom-4 h-16 w-16 bg-primary/5 blur-[40px] rounded-full group-hover:bg-primary/10 transition-colors" />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Insights Section */}
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-primary/10 rounded-2xl shadow-inner">
              <Zap className="h-6 w-6 text-primary shadow-sm" />
            </div>
            <div>
               <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] opacity-80 mb-1">Tactical Analysis</h3>
               <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/30 leading-none">Automated Performance Fingerprint</p>
            </div>
          </div>
          <div className="grid gap-6">
            {insights.length > 0 ? insights.map((insight, i) => (
              <div key={i} className={cn(
                "p-8 rounded-[2.5rem] glass border-l-[8px] shadow-2xl transition-all hover:translate-x-2 bg-white/5 dark:bg-white/1 bg-gradient-to-r relative overflow-hidden",
                insight.borderColor,
                insight.bgGradient
              )}>
                <div className="flex items-start gap-8 relative z-10">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-secondary/50 border border-black/5 dark:border-border shadow-inner">
                    {insight.icon}
                  </div>
                  <div>
                    <h4 className={cn("font-black text-2xl tracking-tighter uppercase leading-none mb-3", insight.primaryColor)}>{insight.title}</h4>
                    <p className="text-sm text-foreground/80 font-black uppercase tracking-tight leading-relaxed opacity-90">{insight.description}</p>
                  </div>
                </div>
                <div className="absolute -right-8 -bottom-8 h-32 w-32 bg-white/5 blur-[60px] rounded-full pointer-events-none" />
              </div>
            )) : (
               <div className="p-14 rounded-[3rem] border border-dashed border-black/20 dark:border-border/60 bg-white/5 dark:bg-white/1 flex flex-col items-center justify-center text-center opacity-40 h-[240px] shadow-inner">
                  <Activity className="h-12 w-12 mb-6 text-muted-foreground opacity-20 animate-pulse" />
                  <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">Generating Profile Intel...</p>
               </div>
            )}
          </div>
        </section>

        {/* Highlights Section */}
        <section className="space-y-10">
           <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-accent/10 rounded-2xl shadow-inner">
              <Star className="h-6 w-6 text-accent shadow-sm" />
            </div>
            <div>
               <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] opacity-80 mb-1">Career Landmarks</h3>
               <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/30 leading-none">High-Impact Engagement Summary</p>
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {peakSeason ? (
              <div className="p-10 rounded-[3rem] glass bg-white/5 dark:bg-primary/5 border-black/5 dark:border-border/50 hover:border-primary/20 relative overflow-hidden group hover:bg-slate-50 dark:hover:bg-muted/30 transition-all active:scale-[0.98] shadow-2xl">
                <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                  <History className="h-40 w-40 text-foreground" />
                </div>
                <div className="flex items-center gap-3 text-primary mb-6 relative z-10">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] opacity-70">Peak Deployment</span>
                </div>
                <div className="text-6xl font-black tracking-tighter text-foreground relative z-10 leading-none mb-4">{peakSeason.year}</div>
                <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest relative z-10 opacity-60">
                   Yield: <span className="text-foreground">{peakSeason.value} {peakSeason.type}</span>
                </p>
                <div className="absolute -left-4 -top-4 h-24 w-24 bg-primary/5 blur-[50px] rounded-full" />
              </div>
            ) : (
                <div className="p-10 rounded-[3rem] border border-dashed border-black/20 dark:border-border/60 bg-white/5 dark:bg-white/1 flex flex-col items-center justify-center opacity-40 h-[220px] shadow-inner">
                   <p className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground italic">Peak Intel Pending</p>
                </div>
            )}

            {totals && (
              <div className="p-10 rounded-[3rem] glass bg-white/5 dark:bg-accent/5 border-black/5 dark:border-border/50 hover:border-accent/20 relative overflow-hidden group hover:bg-slate-50 dark:hover:bg-muted/30 transition-all active:scale-[0.98] shadow-2xl">
                 <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-10 transition-opacity text-accent">
                  <Trophy className="h-40 w-40" />
                </div>
                <div className="flex items-center gap-3 text-accent mb-6 relative z-10">
                  <Globe className="h-5 w-5" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] opacity-70">Technical Bias</span>
                </div>
                <div className="text-6xl font-black tracking-tighter uppercase leading-none text-foreground relative z-10 mb-4">Hybrid</div>
                <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest relative z-10 opacity-60">
                  Proven across <span className="text-accent underline decoration-accent/20 underline-offset-4 decoration-2">All-Sectors</span>
                </p>
                <div className="absolute -left-4 -top-4 h-24 w-24 bg-accent/5 blur-[50px] rounded-full" />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Career Summary */}
      {totals && (
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-slate-100 dark:bg-secondary rounded-2xl shadow-inner border border-black/5 dark:border-white/5">
              <History className="h-6 w-6 text-muted-foreground opacity-60" />
            </div>
            <div>
               <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] opacity-80 mb-1">Lifetime Aggregates</h3>
               <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/30 leading-none">Global Telemetry Summation</p>
            </div>
          </div>
          <div className="p-14 rounded-[3.5rem] glass border-black/5 dark:border-border/60 bg-white/5 dark:bg-white/1 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-14 opacity-[0.02] pointer-events-none text-foreground">
               <Globe className="h-80 w-80" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-16 relative z-10">
              {[
                { label: "Lifetime Matches", value: totals.matches, icon: Activity, color: "" },
                { label: "Aggregate Runs", value: totals.runs, icon: Trophy, color: 'text-primary' },
                { label: "Aggregate Wickets", value: totals.wickets, icon: Target, color: 'text-accent' },
                { label: "Active Innings", value: totals.innings_bat, icon: Zap, color: "" },
              ].map((item, i) => (
                <div key={i} className="space-y-5">
                  <div className="flex items-center gap-3.5">
                     <div className={cn("p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm", item.color)}>
                        <item.icon className="h-4 w-4" />
                     </div>
                     <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-50 leading-none">{item.label}</p>
                  </div>
                  <p className={cn("text-5xl lg:text-7xl font-black tracking-tighter text-foreground leading-none", item.color)}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="absolute -left-12 -bottom-12 h-64 w-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
          </div>
        </section>
      )}
    </div>
  );
}
