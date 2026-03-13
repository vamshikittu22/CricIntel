import { Card, CardContent } from "@/components/ui/card";
import { Grid3X3, Info } from "lucide-react";
import type { Delivery } from "@/lib/hooks/usePlayers";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export function BallLengthMatrix({ deliveries }: { deliveries: Delivery[] }) {
  const lengths = ["Short", "Good", "Full", "Yorker"];
  const lines = ["Outside Off", "On Stumps", "Down Leg"];

  const matrix = useMemo(() => {
    const m: Record<string, { runs: number; balls: number; dismissals: number }> = {};
    lengths.forEach(len => {
      lines.forEach(lin => {
        m[`${len}_${lin}`] = { runs: 0, balls: 0, dismissals: 0 };
      });
    });

    deliveries.forEach(d => {
      if (d.ball_length && d.ball_line) {
        const key = `${d.ball_length}_${d.ball_line}`;
        if (m[key]) {
          m[key].runs += d.runs_off_bat;
          m[key].balls += 1;
          if (d.is_wicket) m[key].dismissals++;
        }
      }
    });

    return m;
  }, [deliveries]);

  const hasData = deliveries.some(d => d.ball_length !== null);

  if (!hasData) {
    return (
      <div className="rounded-[2.5rem] border border-border/50 bg-slate-50 dark:bg-muted/10 border-dashed relative overflow-hidden h-[400px] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white/80 dark:bg-background/80 backdrop-blur-sm p-10 rounded-[2rem] border border-black/5 dark:border-border shadow-2xl relative z-10 max-w-[280px]">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Grid3X3 className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-3 text-foreground">No Length Data</h3>
          <p className="text-[11px] text-muted-foreground font-bold leading-relaxed opacity-70">
            Detailed ball length and line data is not available for these matches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[2.5rem] border border-black/5 dark:border-border/50 bg-white/5 dark:bg-background/50 relative overflow-hidden h-auto">
      <div className="p-8 overflow-auto no-scrollbar">
        <div className="min-w-[440px]">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="col-span-1" />
            {lines.map(line => (
              <div key={line} className="text-[10px] font-black uppercase text-center text-muted-foreground tracking-[0.15em] opacity-60">
                {line}
              </div>
            ))}
          </div>
          {lengths.map(len => (
            <div key={len} className="grid grid-cols-4 gap-4 mb-4">
              <div key={len} className="text-[10px] font-black uppercase flex items-center text-muted-foreground tracking-[0.15em] opacity-60">
                {len}
              </div>
              {lines.map(line => {
                const cell = matrix[`${len}_${line}`];
                const sr = cell.balls > 0 ? +((cell.runs / cell.balls) * 100).toFixed(0) : 0;
                const opacity = Math.min(1, cell.balls / 20) + 0.05;
                const isDangerous = cell.dismissals > 0;
                
                return (
                  <div 
                    key={line} 
                    className={cn(
                      "p-5 rounded-2xl border border-black/5 dark:border-border/50 flex flex-col items-center justify-center gap-1.5 group transition-all shadow-sm",
                      cell.balls > 0 ? "hover:scale-105" : "opacity-20 grayscale"
                    )}
                    style={{ 
                      backgroundColor: cell.balls > 0 
                        ? (isDangerous ? `rgba(244, 63, 94, ${opacity * 0.15})` : `rgba(var(--primary-rgb), ${opacity * 0.15})`)
                        : "transparent"
                    }}
                  >
                    <span className="text-2xl font-black tracking-tighter text-foreground leading-none">{cell.balls > 0 ? sr : "—"}</span>
                    <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest opacity-60 group-hover:text-primary transition-colors">Efficiency SR</span>
                    {cell.dismissals > 0 && (
                      <div className="mt-2 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[8px] font-black uppercase tracking-tighter border border-rose-500/20">
                        {cell.dismissals} TERMINATED
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
