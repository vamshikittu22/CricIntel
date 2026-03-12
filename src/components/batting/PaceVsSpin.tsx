import { useMemo } from "react";
import { Zap, Wind, TrendingUp, Target, Activity } from "lucide-react";
import { motion } from "framer-motion";

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

  const renderCard = (title: string, icon: React.ReactNode, data: BowlingTypeStats | null, derived: any, color: string) => (
    <div className={`p-8 rounded-[2rem] glass border-border/40 relative overflow-hidden group transition-all hover:border-${color}/30 active:scale-[0.98]`}>
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}/10 blur-[60px] -translate-y-1/2 translate-x-1/2 opacity-30 group-hover:opacity-60 transition-opacity`} />
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-${color}/10 border border-${color}/20 text-${color}`}>
            {icon}
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">vs {title} Attack</h4>
        </div>
        {!data || data.bat_balls === 0 ? (
          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded bg-white/5 border border-white/5 opacity-50">Pending Data</span>
        ) : (
          <div className={`h-2 w-2 rounded-full bg-${color} shadow-[0_0_10px_rgba(var(--${color}-rgb),0.5)]`} />
        )}
      </div>

      {!data || data.bat_balls === 0 ? (
        <div className="flex flex-col items-center justify-center py-6">
           <p className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.3em]">Technical Signature Empty</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Impact Runs</p>
              <p className="text-3xl font-black tracking-tighter">{data.bat_runs}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Samples</p>
              <p className="text-xl font-black text-muted-foreground/60 tracking-tighter">{data.bat_balls} <span className="text-[8px] uppercase">balls</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 p-4 rounded-2xl bg-white/5 border border-white/5">
            <div>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Average</p>
              <p className={`text-lg font-black text-${color}`}>{derived.avg}</p>
            </div>
            <div>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Strike Rate</p>
              <p className="text-lg font-black">{derived.sr}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
               <span className="text-muted-foreground/60">Efficiency Index</span>
               <span className={`text-${color}`}>{derived.efficiency.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }} 
                 animate={{ width: `${derived.efficiency}%` }} 
                 className={`h-full bg-${color} shadow-[0_0_12px_rgba(var(--${color}-rgb),0.4)]`} 
               />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-white/5">
             <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Wickets Conceded</span>
             <span className={`text-sm font-black ${data.bat_dismissals > 3 ? "text-destructive" : "text-foreground"}`}>
                {data.bat_dismissals}
             </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {renderCard("Kinetic", <Zap className="h-4 w-4" />, pace, paceDerived, "primary")}
      {renderCard("Variable", <Wind className="h-4 w-4" />, spin, spinDerived, "accent")}
    </div>
  );
}

