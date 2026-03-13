import { useMemo } from "react";
import { Zap, Wind, TrendingUp, Target, Activity, Skull } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BowlingTypeStats {
  bowling_type: string;
  bat_runs: number;
  bat_balls: number;
  bat_dismissals: number;
}

interface PaceVsSpinProps {
  stats?: BowlingTypeStats[] | null;
}

export function PaceVsSpin({ stats }: PaceVsSpinProps) {
  const pace = useMemo(() => stats?.find(s => s.bowling_type === "pace") || null, [stats]);
  const spin = useMemo(() => stats?.find(s => s.bowling_type === "spin") || null, [stats]);

  const calcDerived = (s: BowlingTypeStats | null) => {
    if (!s || s.bat_balls === 0) return { avg: "—", sr: "—", efficiency: 0 };
    const avg = s.bat_dismissals > 0 ? (s.bat_runs / s.bat_dismissals).toFixed(1) : s.bat_runs.toString() + "*";
    const sr = ((s.bat_runs / s.bat_balls) * 100).toFixed(1);
    const efficiency = Math.min(100, (Number(sr) / 1.5) + (s.bat_dismissals === 0 ? 20 : 0));
    return { avg, sr, efficiency };
  };

  const paceDerived = calcDerived(pace);
  const spinDerived = calcDerived(spin);

  const renderCard = (title: string, icon: React.ReactNode, data: BowlingTypeStats | null, derived: any, type: "primary" | "accent") => {
    const isPrimary = type === "primary";
    
    return (
      <div className={cn(
        "p-10 rounded-[3rem] glass border-border/40 bg-slate-100/50 dark:bg-white/1 relative overflow-hidden group transition-all active:scale-[0.98] shadow-2xl h-full flex flex-col justify-between",
        isPrimary ? "hover:border-primary/30" : "hover:border-accent/30"
      )}>
        <div className={cn(
          "absolute top-0 right-0 w-48 h-48 blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none",
          isPrimary ? "bg-primary/30" : "bg-accent/30"
        )} />
        
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-4 rounded-2xl border transition-all group-hover:scale-110 shadow-inner",
              isPrimary ? "bg-primary/10 border-primary/20 text-primary" : "bg-accent/10 border-accent/20 text-accent"
            )}>
              {icon}
            </div>
            <div>
               <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground dark:text-muted-foreground/60 opacity-80">Kinetic Split</h4>
               <p className="text-sm font-black text-foreground dark:text-foreground/80 tracking-tight uppercase">vs {title} Attack</p>
            </div>
          </div>
          {!data || data.bat_balls === 0 ? (
            <span className="text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/5 border border-black/[0.08] dark:border-white/5 opacity-60">Awaiting Telemetry</span>
          ) : (
            <div className={cn(
              "p-3 rounded-2xl border flex flex-col items-center justify-center min-w-[70px] shadow-xl",
              isPrimary ? "bg-primary/10 border-primary/20" : "bg-accent/10 border-accent/20"
            )}>
               <p className={cn("text-2xl font-black leading-none tracking-tighter", isPrimary ? "text-primary" : "text-accent")}>{derived.efficiency.toFixed(0)}%</p>
               <p className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60">Eff.</p>
            </div>
          )}
        </div>

        {!data || data.bat_balls === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 relative z-10 opacity-30">
             <Activity className="h-12 w-12 mb-6 animate-pulse text-muted-foreground/30" />
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Signature Map Offline</p>
          </div>
        ) : (
          <div className="space-y-10 relative z-10">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase mb-2 opacity-50 tracking-widest">Strike runs</p>
                <p className="text-6xl font-black tracking-tighter text-foreground leading-none">{data.bat_runs}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-muted-foreground uppercase mb-2 opacity-50 tracking-widest">Exposure</p>
                <p className="text-2xl font-black text-muted-foreground/40 tracking-tighter leading-none">{data.bat_balls} <span className="text-[10px] uppercase tracking-widest font-black opacity-30 ml-1">Balls</span></p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 p-6 rounded-[2rem] bg-slate-200/50 dark:bg-muted/30 border border-black/10 dark:border-border/50 shadow-inner group/stats">
              <div className="space-y-2">
                <p className="text-[9px] font-black text-muted-foreground dark:text-muted-foreground/50 uppercase tracking-[0.2em] mb-1">Average</p>
                <p className={cn("text-2xl font-black leading-none group-hover/stats:scale-110 transition-transform origin-left", isPrimary ? "text-primary" : "text-accent")}>{derived.avg}</p>
              </div>
              <div className="text-right space-y-2 border-l border-black/10 dark:border-white/5 pl-8">
                <p className="text-[9px] font-black text-muted-foreground dark:text-muted-foreground/50 uppercase tracking-[0.2em] mb-1">Strike Rate</p>
                <p className="text-2xl font-black text-foreground dark:text-foreground/90 leading-none mono">{derived.sr}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 items-center border-t border-black/5 dark:border-white/5 pt-8">
               <div className="col-span-1">
                  <div className="flex items-center gap-3">
                     <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Wickets</span>
                  </div>
                  <p className={cn(
                    "text-4xl font-black leading-none mt-2 tracking-tighter",
                    data.bat_dismissals > 3 ? "text-rose-500" : "text-foreground opacity-80"
                  )}>
                    {data.bat_dismissals}
                  </p>
               </div>
               
               <div className="col-span-2 space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-muted-foreground/40 italic">Kinetic Integrity</span>
                     <span className={isPrimary ? "text-primary" : "text-accent"}>{derived.efficiency.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden p-0.5 shadow-inner">
                     <motion.div 
                       initial={{ width: 0 }} 
                       animate={{ width: `${derived.efficiency}%` }} 
                       className={cn(
                         "h-full rounded-full shadow-lg",
                         isPrimary ? "bg-primary shadow-primary/40" : "bg-accent shadow-accent/40"
                       )} 
                     />
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {renderCard("Pace", <Zap className="h-6 w-6" />, pace, paceDerived, "primary")}
      {renderCard("Spin", <Wind className="h-6 w-6" />, spin, spinDerived, "accent")}
    </div>
  );
}
