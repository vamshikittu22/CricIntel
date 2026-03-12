import { Card, CardContent } from "@/components/ui/card";
import { Zap, Target, ShieldCheck, TrendingUp, Trophy, Star, History, Info, Activity, Globe } from "lucide-react";
import type { PlayerSummary } from "@/lib/hooks/usePlayers";
import { useMemo } from "react";
import { motion } from "framer-motion";

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
    { label: "Elite 100s", value: bs?.hundreds ?? 0, icon: Trophy, color: "text-amber-500", glow: "rgba(245, 158, 11, 0.2)" },
    { label: "Major 50s", value: bs?.fifties ?? 0, icon: Star, color: "text-blue-400", glow: "rgba(96, 165, 250, 0.2)" },
    { label: "Personal Best", value: bs?.best_score ?? 0, icon: Target, color: "text-primary", glow: "rgba(var(--primary-rgb), 0.2)" },
    { label: "5W Hauls", value: bw?.bowl_five_wickets ?? 0, icon: ShieldCheck, color: "text-success", glow: "rgba(34, 197, 94, 0.2)" },
    { label: "BBI Match", value: bw?.bowl_best_figures ?? "—", icon: TrendingUp, color: "text-accent", glow: "rgba(var(--accent-rgb), 0.2)" },
  ];

  const insights: InsightCard[] = [];
  if (isInsufficientData) {
    insights.push({
      icon: <Info className="h-5 w-5 text-muted-foreground" />,
      title: "Building Profile",
      description: `Analysis in progress. Need ${5 - innings} more innings for high-confidence tactical insights.`,
      borderColor: "border-l-muted",
      bgGradient: "from-muted/5 to-transparent"
    });
  } else {
    if (bs) {
      if ((bs.strike_rate || 0) > 130) {
        insights.push({
          icon: <Zap className="h-5 w-5 text-primary" />,
          title: "Aggressive Intent",
          description: `Strike rate of ${bs.strike_rate?.toFixed(1)} shows dominant attacking play in ${format}.`,
          borderColor: "border-l-primary",
          bgGradient: "from-primary/10 to-transparent"
        });
      } else if ((bs.average || 0) > 40) {
          insights.push({
            icon: <ShieldCheck className="h-5 w-5 text-success" />,
            title: "Reliable Anchor",
            description: `Average of ${bs.average?.toFixed(1)} makes them a vital technical stabilizer.`,
            borderColor: "border-l-success",
            bgGradient: "from-success/10 to-transparent"
          });
      }
      if (balls > 0 && boundaryBalls / balls > 0.15) {
        insights.push({
          icon: <Target className="h-5 w-5 text-accent" />,
          title: "Boundary Hitter",
          description: `${boundaryPct}% boundary frequency — high efficiency in finding gaps.`,
          borderColor: "border-l-accent",
          bgGradient: "from-accent/10 to-transparent"
        });
      }
    }
  }

  return (
    <div className="space-y-12">
      {/* Milestone Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {milestones.map((s, i) => (
          <motion.div 
            key={s.label} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="stat-card glass border-border/50 group hover:border-primary/20 relative"
          >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-radial-at-tr`} style={{ backgroundImage: `radial-gradient(circle at top right, ${s.glow}, transparent)` }} />
            <div className="flex items-center justify-between mb-3">
              <span className="label leading-none">{s.label}</span>
              <s.icon className={`h-4 w-4 ${s.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
            </div>
            <div className="value tracking-tighter">{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Insights Section */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="h-5 w-5 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
            </div>
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Tactical Intelligence</h3>
          </div>
          <div className="grid gap-5">
            {insights.length > 0 ? insights.map((insight, i) => (
              <div key={i} className={`p-6 rounded-[1.5rem] glass border-l-4 ${insight.borderColor} bg-gradient-to-r ${insight.bgGradient} shadow-lg transition-all hover:translate-x-1`}>
                <div className="flex items-start gap-5">
                  <div className="p-3 rounded-2xl bg-secondary/50 border border-border">
                    {insight.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg tracking-tighter uppercase whitespace-nowrap">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground font-medium mt-1 leading-relaxed opacity-80">{insight.description}</p>
                  </div>
                </div>
              </div>
            )) : (
               <div className="p-8 rounded-[1.5rem] border border-dashed border-border/60 flex flex-col items-center justify-center text-center opacity-40">
                  <Activity className="h-8 w-8 mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Generating profile insights...</p>
               </div>
            )}
          </div>
        </section>

        {/* Highlights Section */}
        <section className="space-y-8">
           <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Star className="h-5 w-5 text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]" />
            </div>
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Career Highlights</h3>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {peakSeason ? (
              <div className="p-6 rounded-[2rem] glass bg-primary/5 border-primary/20 relative overflow-hidden group hover:bg-primary/10 transition-all active:scale-[0.98]">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <History className="h-24 w-24" />
                </div>
                <div className="flex items-center gap-2 text-primary mb-3">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Peak Season</span>
                </div>
                <div className="text-4xl font-black tracking-tighter mono">{peakSeason.year}</div>
                <p className="text-sm text-muted-foreground font-bold uppercase mt-1">
                  {peakSeason.value} {peakSeason.type} recorded
                </p>
              </div>
            ) : (
                <div className="p-6 rounded-[2rem] border border-dashed border-border/60 flex flex-col items-center justify-center opacity-40 h-[140px]">
                   <p className="text-[10px] font-black uppercase tracking-widest">Historical peak profile pending</p>
                </div>
            )}

            {totals && (
              <div className="p-6 rounded-[2rem] glass bg-accent/5 border-accent/20 relative overflow-hidden group hover:bg-accent/10 transition-all active:scale-[0.98]">
                 <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-accent">
                  <Trophy className="h-24 w-24" />
                </div>
                <div className="flex items-center gap-2 text-accent mb-3">
                  <Globe className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Global Status</span>
                </div>
                <div className="text-4xl font-black tracking-tighter uppercase leading-none">All-Star</div>
                <p className="text-sm text-muted-foreground font-bold uppercase mt-1">
                  Proven across multiple formats
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Career Summary */}
      {totals && (
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-secondary rounded-lg">
              <History className="h-5 w-5 text-muted-foreground shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
            </div>
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Aggregate Lifetime Performance</h3>
          </div>
          <div className="p-10 rounded-[2.5rem] glass border-border/60 bg-white/[0.01] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Globe className="h-32 w-32" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 relative z-10">
              {[
                { label: "Lifetime Matches", value: totals.matches, icon: Activity },
                { label: "Aggregate Runs", value: totals.runs, icon: Trophy, color: 'text-primary' },
                { label: "Aggregate Wickets", value: totals.wickets, icon: Target, color: 'text-accent' },
                { label: "Active Innings", value: totals.innings_bat, icon: Zap },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                     <item.icon className={`h-3 w-3 ${item.color || 'text-muted-foreground'} opacity-50`} />
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</p>
                  </div>
                  <p className={`text-4xl font-black mono tracking-tighter ${item.color || ''}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}


