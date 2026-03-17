import { useMemo } from "react";
import { 
  ShieldAlert, 
  Swords, 
  Target, 
  Zap, 
  Brain, 
  Info, 
  ArrowRight,
  ChevronDown,
  Skull,
  Crosshair,
  TrendingDown,
  ZapOff,
  Wind
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  usePlayerDeliveries, 
  usePlayerVsBowling,
  type PlayerSummary 
} from "@/lib/hooks/usePlayers";
import { useTacticalPatterns } from "@/lib/hooks/useTactical";
import { Skeleton } from "@/components/ui/skeleton";
import { DismissalChart } from "@/components/batting/DismissalChart";

interface WeaknessesTabProps {
  stats: PlayerSummary | null;
  format: string;
  isLoading?: boolean;
}

export function WeaknessesTab({ stats, format, isLoading: parentLoading }: WeaknessesTabProps) {
  const { data: tacticalData, isLoading: tacticalLoading } = useTacticalPatterns(
    stats?.player_id,
    format,
    { role: "striker" }
  );

  const tactical = (tacticalData as any[]) || [];

  const { data: deliveriesData, isLoading: deliveriesLoading } = usePlayerDeliveries(
    stats?.player_id,
    format,
    { role: "striker" }
  );

  const deliveries = (deliveriesData as any[]) || [];

  const { data: vsBowlingStats, isLoading: vsBowlingLoading } = usePlayerVsBowling(
    stats?.player_id,
    format
  );

  const isLoading = parentLoading || tacticalLoading || deliveriesLoading || vsBowlingLoading;

  // Pace/Spin dismissal counts from aggregated database stats
  const kineticDismissals = useMemo(() => {
    if (!vsBowlingStats) return { pace: 0, spin: 0 };
    return (vsBowlingStats as any[]).reduce((acc, curr) => {
      if (curr.bowling_type === 'pace') acc.pace += (curr.bat_dismissals || 0);
      if (curr.bowling_type === 'spin') acc.spin += (curr.bat_dismissals || 0);
      return acc;
    }, { pace: 0, spin: 0 });
  }, [vsBowlingStats]);

  // Identify high-threat adversaries (bowlers who dismissed the player most)
  const highThreatBowlers = useMemo(() => {
    if (!deliveries) return [];
    
    const dismissalCounts: Record<string, { count: number; balls: number; runs: number }> = {};
    
    deliveries.forEach(d => {
      if (d.is_wicket && d.player_dismissed === d.striker) {
        const bowler = d.bowler;
        if (!dismissalCounts[bowler]) dismissalCounts[bowler] = { count: 0, balls: 0, runs: 0 };
        dismissalCounts[bowler].count++;
      }
      const bowler = d.bowler;
      if (!dismissalCounts[bowler]) dismissalCounts[bowler] = { count: 0, balls: 0, runs: 0 };
      dismissalCounts[bowler].balls++;
      dismissalCounts[bowler].runs += (d.runs_off_bat || 0);
    });

    return Object.entries(dismissalCounts)
      .map(([name, stats]) => ({
        name,
        ...stats,
        avg: stats.count > 0 ? (stats.runs / stats.count).toFixed(1) : "—",
        sr: stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : "—"
      }))
      .filter(b => b.count >= 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [deliveries]);

  const vulnerabilityData = useMemo(() => {
    if (!tactical) return null;
    
    const weaknesses = tactical.filter((t: any) => (t.avg || 0) < 25 && (t.sample_size || 0) > 15);
    return weaknesses.sort((a: any, b: any) => (a.avg || 0) - (b.avg || 0)).slice(0, 3);
  }, [tactical]);

  if (isLoading) {
    return (
      <div className="space-y-12 animate-pulse pb-24">
        <Skeleton className="h-64 rounded-[3rem]" />
        <div className="grid md:grid-cols-2 gap-10">
           <Skeleton className="h-96 rounded-[3rem]" />
           <Skeleton className="h-96 rounded-[3rem]" />
        </div>
      </div>
    );
  }

  if (!stats && highThreatBowlers.length === 0) {
     return <div className="py-20 text-center uppercase font-black text-muted-foreground tracking-widest opacity-40">No technical weakness data detected</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-16 pb-24">
      {/* Strategic Intelligence Header */}
      <div className="p-10 md:p-14 rounded-[4rem] glass border-rose-500/20 bg-rose-500/[0.03] relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 blur-[120px] rounded-full pointer-events-none" />
         <div className="flex flex-col md:flex-row items-start md:items-center gap-10 relative z-10">
            <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/20 shadow-inner">
               <ShieldAlert className="h-10 w-10 text-rose-500" />
            </div>
            <div className="flex-1 space-y-4">
               <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.4em] mb-2 leading-none">Combat Intelligence Report</h3>
               <p className="text-xl md:text-2xl font-black text-foreground dark:text-foreground leading-snug tracking-tight">
                  {vulnerabilityData && vulnerabilityData.length > 0 
                    ? `Critical vulnerability detected against ${vulnerabilityData[0].ball_length} length ${vulnerabilityData[0].bowling_type} delivery vectors.` 
                    : "No major statistical anomalies detected in current technical profile."}
               </p>
               <div className="flex flex-wrap gap-4 pt-2">
                  <span className="px-5 py-2 rounded-full bg-rose-500/10 border border-rose-500/10 text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-widest">Priority: High</span>
                  <span className="px-5 py-2 rounded-full bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none flex items-center gap-2">
                    <Brain className="h-3 w-3" /> Technical Analysis Engine v4.2
                  </span>
               </div>
            </div>
         </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Kinetic Exit Vectors (extension to the Exit Vector concept) */}
        <div className="p-10 rounded-[3.5rem] glass border-border/50 bg-muted/5 relative overflow-hidden flex flex-col shadow-2xl">
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div className="flex items-center gap-5">
              <div className="p-3.5 bg-rose-500/10 rounded-2xl shadow-inner border border-rose-500/20">
                <Skull className="h-6 w-6 text-rose-500" />
              </div>
               <div>
                <h3 className="text-xs font-black text-foreground dark:text-foreground/90 uppercase tracking-[0.3em] mb-1">Exit Vector Analysis</h3>
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground dark:text-muted-foreground/50 leading-none">Kinetic & Nemesis Intelligence</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-10 mb-12 relative z-10">
            {/* Pace vs Spin Pie */}
            <div className="w-full xl:w-1/2 flex items-center justify-center p-6 rounded-3xl bg-white/5 border border-black/5 dark:border-white/5 shadow-inner">
               <div className="w-full h-[220px]">
                  <DismissalChart breakdown={{ pace: kineticDismissals.pace, spin: kineticDismissals.spin }} />
               </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="flex-1 grid grid-cols-1 gap-4">
               <div className="p-6 rounded-3xl bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 transition-all group/item overflow-hidden relative">
                  <Zap className="absolute -right-4 -top-4 h-16 w-16 text-rose-500 opacity-5 group-hover/item:opacity-10 transition-opacity" />
                  <span className="text-[9px] font-black text-rose-500/60 uppercase tracking-widest block mb-1">Pace Dismissals</span>
                  <p className="text-4xl font-black text-rose-500 tracking-tighter leading-none">{kineticDismissals.pace}</p>
               </div>
               <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10 transition-all group/item overflow-hidden relative">
                  <Wind className="absolute -right-4 -top-4 h-16 w-16 text-amber-500 opacity-5 group-hover/item:opacity-10 transition-opacity" />
                  <span className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest block mb-1">Spin Dismissals</span>
                  <p className="text-4xl font-black text-amber-500 tracking-tighter leading-none">{kineticDismissals.spin}</p>
               </div>
            </div>
          </div>

          <div className="space-y-4 relative z-10 flex-1 border-t border-black/5 dark:border-white/5 pt-10">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-6 italic">Primary Combat Nemeses</h4>
            {highThreatBowlers.length > 0 ? highThreatBowlers.map((bowler, i) => (
              <div key={i} className="group p-5 rounded-3xl bg-slate-100/50 dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-rose-500/40 transition-all flex items-center justify-between shadow-sm relative overflow-hidden">
                 {i === 0 && <div className="absolute top-0 right-0 px-3 py-1 bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-lg">TOP THREAT</div>}
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 p-0.5 shadow-lg group-hover:scale-110 transition-transform">
                       <div className="h-full w-full rounded-[0.75rem] bg-background flex items-center justify-center font-black text-rose-500 text-sm mono">
                          {bowler.count}
                       </div>
                    </div>
                    <div>
                       <p className="text-sm font-black text-foreground uppercase tracking-tight group-hover:text-rose-500 transition-colors leading-none mb-1">{bowler.name}</p>
                       <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{bowler.count} exits in {format}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-black text-foreground mono leading-none mb-1">{bowler.avg}</p>
                    <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest">AVG VS BOX</p>
                 </div>
              </div>
            )) : (
              <div className="flex-1 flex flex-col items-center justify-center py-10 opacity-30">
                 <ZapOff className="h-10 w-10 mb-4 text-muted-foreground/40" />
                 <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">No recurring threats</p>
              </div>
            )}
          </div>
          <div className="absolute -right-20 -bottom-20 h-64 w-64 bg-rose-500/5 blur-[120px] rounded-full pointer-events-none" />
        </div>

        {/* Threat Exposure Heatmap */}
        <div className="p-10 rounded-[3.5rem] glass border-border/50 bg-muted/5 relative overflow-hidden flex flex-col shadow-2xl">
          <div className="flex items-center gap-5 mb-12 relative z-10">
             <div className="p-3.5 bg-primary/10 rounded-2xl shadow-inner border border-primary/20">
                <Crosshair className="h-6 w-6 text-primary" />
             </div>
             <div>
                <h3 className="text-xs font-black text-foreground/80 uppercase tracking-[0.3em] mb-1">Threat Exposure Area</h3>
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/50 leading-none">Ball Type Intelligence</p>
             </div>
          </div>

          <div className="space-y-5 relative z-10">
             {tactical?.slice(0, 5).map((t: any, i: number) => {
                return (
                  <div key={i} className="p-6 rounded-[2rem] bg-slate-100/50 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-5">
                     <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground/80">{t.ball_length} {t.ball_line}</span>
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 leading-none">Avg</span>
                           <span className={cn("text-sm font-black mono", t.average < 25 ? "text-rose-500" : "text-foreground")}>{t.average?.toFixed(1) || "—"}</span>
                        </div>
                     </div>
                     <div className="h-2.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (300 / (t.average || 1)) * 5)}%` }}
                          className={cn("h-full rounded-full shadow-lg", t.average < 25 ? "bg-rose-500" : "bg-primary")}
                        />
                     </div>
                  </div>
                );
             })}
          </div>
          <div className="absolute -left-20 -top-20 h-64 w-64 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        </div>
      </div>

      {/* Tactical Strategy Briefing */}
      <div className="p-12 rounded-[4rem] glass border-amber-500/20 bg-amber-500/[0.02] relative overflow-hidden shadow-2xl">
         <div className="absolute -right-20 -top-20 h-96 w-96 bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
         <div className="flex flex-col lg:flex-row gap-16 relative z-10">
            <div className="lg:w-1/3 space-y-10">
               <div className="flex items-center gap-5">
                  <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-inner">
                     <Brain className="h-8 w-8 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tight leading-none">Tactical <br/>Briefing</h3>
               </div>
               
               <div className="space-y-8 p-8 rounded-[2.5rem] bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5 shadow-inner">
                  <div className="flex items-center justify-between pb-6 border-b border-black/5 dark:border-white/5">
                     <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Success Delta</span>
                     <span className="text-xl font-black text-amber-500 leading-none">+12.4%</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Risk Index</span>
                     <span className="text-xl font-black text-rose-500 leading-none">Critical</span>
                  </div>
               </div>
            </div>

            <div className="flex-1 space-y-10">
               <div className="grid gap-8 sm:grid-cols-2">
                  <div className="p-10 rounded-[3rem] bg-white/95 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-2xl transition-all hover:bg-white dark:hover:bg-white/10 group">
                     <div className="flex items-center gap-4 mb-8">
                        <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                           <Target className="h-5 w-5 text-primary group-hover:text-inherit" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/80">Offensive Pivot</span>
                     </div>
                     <p className="text-sm font-black text-foreground/90 uppercase tracking-tight leading-relaxed">
                        Exploit the <span className="text-primary italic">"Lower Density"</span> middle-overs phase by utilizing late-cuts and sweeps against spin.
                     </p>
                  </div>
                  <div className="p-10 rounded-[3rem] bg-white/95 dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-2xl transition-all hover:bg-white dark:hover:bg-white/10 group">
                     <div className="flex items-center gap-4 mb-8">
                        <div className="p-2.5 bg-rose-500/10 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-all">
                           <TrendingDown className="h-5 w-5 text-rose-500 group-hover:text-inherit" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground/80">Defensive Patch</span>
                     </div>
                     <p className="text-sm font-black text-foreground/90 uppercase tracking-tight leading-relaxed">
                        Implement a <span className="text-rose-500 italic">"Higher Guard"</span> stance when facing {vulnerabilityData?.[0]?.bowling_type || "pace"} above 140kph on a good length.
                     </p>
                  </div>
               </div>
               
               <div className="p-10 rounded-[3rem] bg-amber-500/10 border border-amber-500/20 shadow-inner flex items-start gap-8 group">
                  <div className="p-3 bg-amber-500 text-amber-950 rounded-2xl group-hover:scale-110 transition-transform shadow-xl">
                     <Info className="h-6 w-6" />
                  </div>
                  <div>
                     <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-[0.25em] mb-2 block">Analyst Summary</span>
                     <p className="text-sm font-black text-foreground/90 uppercase tracking-wide leading-relaxed">
                        Current telemetry suggests a technical drift in the {format} format when countering variations in pace. Recommended focus on back-foot stability and front-pad clearance in the next session.
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </motion.div>
  );
}
