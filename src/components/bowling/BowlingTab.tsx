import { useMemo } from "react";
import { 
  Zap, 
  Target, 
  Activity, 
  TrendingUp, 
  History, 
  Trophy, 
  ShieldAlert,
  BarChart3,
  Dna,
  ZapOff,
  Skull,
  Crosshair
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { usePlayerDeliveries } from "@/lib/hooks/usePlayers";
import type { PlayerSummary, PlayerMatchRow } from "@/lib/hooks/usePlayers";
import { cn } from "@/lib/utils";

interface BowlingTabProps {
  stats: PlayerSummary | null;
  recentMatches: PlayerMatchRow[];
  format: string;
  isLoading?: boolean;
}

export function BowlingTab({ stats, recentMatches, format, isLoading: parentLoading }: BowlingTabProps) {
  const { data: deliveries, isLoading: deliveriesLoading } = usePlayerDeliveries(
    stats?.player_id,
    format.toUpperCase() === "ALL" ? undefined : format,
    { role: "bowler" }
  );

  const isLoading = parentLoading || deliveriesLoading;

  // Identify prized scalps (batters dismissed most by this bowler)
  const prizedScalps = useMemo(() => {
    if (!deliveries) return [];
    
    // In our deliveries, 'player_dismissed' is the batter, and 'bowler' is the player of this tab
    const wicketCounts: Record<string, number> = {};
    
    deliveries.forEach(d => {
      if (d.is_wicket && d.player_dismissed) {
        // Double check formatting of dismissal kind to exclude non-bowler wickets if needed (e.g. run outs)
        // But usually deliveries with is_wicket=true and player_dismissed are what we want
        const batter = d.player_dismissed;
        wicketCounts[batter] = (wicketCounts[batter] || 0) + 1;
      }
    });

    return Object.entries(wicketCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [deliveries]);

  const bowlStats = useMemo(() => {
    if (!stats) return null;
    return [
      { label: "Aggregate Wickets", value: stats.wickets, icon: Target, color: "text-rose-500", highlight: true },
      { label: "Economy Protocol", value: stats.econ || "—", icon: Activity, color: "text-blue-500" },
      { label: "Strike Vector", value: stats.bowl_strike_rate || "—", icon: Zap, color: "text-amber-500" },
      { label: "Average Impact", value: stats.bowl_average || "—", icon: Trophy, color: "text-primary" },
      { label: "Five Wicket Hauls", value: stats.bowl_five_wickets || 0, icon: ShieldAlert, color: "text-rose-600" },
      { label: "Best Execution", value: stats.bowl_best_figures || "—", icon: History, color: "text-muted-foreground" },
    ];
  }, [stats]);

  if (isLoading) {
    return (
      <div className="space-y-12 animate-pulse pb-24">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-[2.5rem]" />)}
        </div>
        <Skeleton className="h-96 rounded-[3.5rem]" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <ZapOff className="h-16 w-16 text-muted-foreground/30 mb-8" />
        <h3 className="text-2xl font-black uppercase tracking-widest text-muted-foreground/60">No Intelligence Logged</h3>
        <p className="text-xs text-muted-foreground/40 mt-4 uppercase font-black tracking-widest">Awaiting sector match data for {format}</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-16 pb-24">
      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
         {bowlStats?.map((s, i) => (
          <div key={i} className={cn(
            "p-10 rounded-[3rem] glass flex flex-col justify-between group overflow-hidden transition-all active:scale-[0.98] shadow-2xl relative",
            s.highlight ? "border-rose-500/30 bg-rose-500/[0.03] shadow-rose-500/5 ring-1 ring-rose-500/20" : "border-border/50 bg-slate-100/50 dark:bg-muted/5 shadow-sm"
          )}>
            <div className="flex items-center justify-between mb-8 relative z-10">
              <span className="text-[10px] uppercase font-black tracking-[0.25em] text-muted-foreground leading-none opacity-80">{s.label}</span>
              <div className={cn("p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 shadow-inner border border-black/5 dark:border-white/5 transition-all group-hover:scale-110", s.highlight ? 'bg-rose-500/10 text-rose-500' : s.color)}>
                 <s.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="flex items-end justify-between relative z-10">
               <span className={cn(
                 "value mt-2 tracking-tighter leading-none",
                 s.highlight ? "text-rose-500 text-6xl font-black" : "text-4xl font-black text-foreground"
               )}>{s.value}</span>
               {s.highlight && <span className="text-[10px] font-black uppercase text-rose-500/60 tracking-widest mb-2">Lifetime</span>}
            </div>
            <div className="absolute -right-6 -bottom-6 h-24 w-24 bg-primary/5 blur-[50px] rounded-full group-hover:bg-primary/10 transition-colors pointer-events-none" />
          </div>
        ))}
      </div>

      <div className="grid gap-12 lg:grid-cols-5">
         {/* Prized Scalps Section (Bunnies) */}
         <div className="lg:col-span-2 p-12 rounded-[4rem] glass border-rose-500/20 bg-rose-500/[0.02] shadow-2xl relative overflow-hidden flex flex-col">
            <div className="flex items-center gap-5 mb-12 relative z-10">
               <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 shadow-inner">
                  <Skull className="h-8 w-8 text-rose-500" />
               </div>
               <div>
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-1">Prized Scalps</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/60 leading-none">Frequent Victimized Targets</p>
               </div>
            </div>

            <div className="space-y-6 relative z-10 flex-1">
               {prizedScalps.length > 0 ? prizedScalps.map((batter, i) => (
                 <div key={i} className="group p-8 rounded-[2.5rem] bg-white dark:bg-black/40 border border-black/5 dark:border-white/5 hover:border-rose-500/40 transition-all flex items-center justify-between shadow-xl hover:-translate-y-2">
                    <div className="flex items-center gap-6">
                       <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-rose-500 to-primary p-0.5 shadow-xl group-hover:rotate-12 transition-transform">
                          <div className="h-full w-full rounded-[1.2rem] bg-background flex items-center justify-center font-black text-rose-500 text-2xl mono">
                             {batter.count}
                          </div>
                       </div>
                       <div>
                          <p className="text-lg font-black text-foreground uppercase tracking-tight mb-1 group-hover:text-rose-500 transition-colors">{batter.name}</p>
                          <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest italic">Dismissed {batter.count} times</p>
                       </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                       <Target className="h-6 w-6 text-rose-500" />
                    </div>
                 </div>
               )) : (
                 <div className="flex flex-col items-center justify-center py-20 opacity-30">
                    <History className="h-16 w-16 mb-6 text-muted-foreground/40" />
                    <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Awaiting scalp confirmation</p>
                 </div>
               )}
            </div>
            <div className="absolute -right-24 -bottom-24 h-80 w-80 bg-rose-500/5 blur-[120px] rounded-full pointer-events-none" />
         </div>

         {/* Technical DNA & Metrics */}
         <div className="lg:col-span-3 p-12 rounded-[4rem] glass border-primary/20 bg-primary/[0.02] shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
               <div className="flex items-center gap-5 mb-12">
                  <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
                     <Dna className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-1">Execution DNA</h3>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 leading-none">Statistical Performance Mapping</p>
                  </div>
               </div>

               <div className="grid gap-8">
                  {[
                    { label: "Wicket Efficiency", value: stats.bowl_strike_rate, trend: "Stable", target: 30 },
                    { label: "Economic Integrity", value: stats.econ, trend: "Rising", target: 8.5 },
                  ].map((m, i) => {
                     const val = Number(m.value) || 0;
                     const progress = Math.max(0, Math.min(100, (m.target / (val || 1)) * 100));
                     return (
                       <div key={i} className="p-10 rounded-[3rem] bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5 shadow-inner">
                          <div className="flex items-center justify-between mb-8">
                             <div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2 opacity-60">{m.label}</p>
                                <p className="text-5xl font-black text-foreground tracking-tighter leading-none">{m.value}</p>
                             </div>
                             <div className="p-4 rounded-3xl bg-primary/10 border border-primary/10 flex flex-col items-center justify-center min-w-[90px]">
                                <TrendingUp className="h-5 w-5 text-primary mb-1" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{m.trend}</span>
                             </div>
                          </div>
                          <div className="h-3 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden p-0.5 shadow-inner">
                             <motion.div 
                               initial={{ width: 0 }} 
                               animate={{ width: `${progress}%` }} 
                               className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full shadow-lg"
                             />
                          </div>
                       </div>
                     );
                  })}
               </div>
            </div>

            <div className="mt-12 p-10 rounded-[3rem] bg-white/95 dark:bg-black/30 border border-black/5 dark:border-white/10 shadow-2xl relative z-10 flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <div className="p-3 bg-primary/10 rounded-2xl">
                     <Crosshair className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                     <p className="text-xs font-black text-foreground uppercase tracking-tight">Active Combat Status</p>
                     <p className="text-[10px] font-black text-success uppercase tracking-widest">High Reliability Tier</p>
                  </div>
               </div>
               <div className="h-12 w-px bg-black/5 dark:bg-white/5" />
               <div className="text-right">
                  <p className="text-2xl font-black text-primary mono leading-none">{(Number(stats.wickets) / Math.max(1, stats.matches)).toFixed(2)}</p>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Scalps / Match</p>
               </div>
            </div>
            
            <div className="absolute -left-32 -top-32 h-96 w-96 bg-primary/10 blur-[140px] rounded-full pointer-events-none" />
         </div>
      </div>
    </motion.div>
  );
}
