import { Card, CardContent } from "@/components/ui/card";
import { Map, Info } from "lucide-react";
import type { Delivery } from "@/lib/hooks/usePlayers";
import { cn } from "@/lib/utils";

export function WagonWheel({ deliveries }: { deliveries: Delivery[] }) {
  const hasCoordinates = deliveries.some(d => d.wagon_x !== null && d.wagon_y !== null);

  if (!hasCoordinates) {
    return (
      <div className="rounded-[2.5rem] border border-border/50 bg-slate-50 dark:bg-muted/10 border-dashed relative overflow-hidden h-[400px] flex flex-col items-center justify-center p-6 text-center shadow-inner">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none text-foreground">
          <svg viewBox="-120 -120 240 240" className="w-full h-full">
            <circle cx="0" cy="0" r="100" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="0" cy="0" r="60" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            <rect x="-3" y="-12" width="6" height="24" fill="currentColor" rx="1" />
          </svg>
        </div>
        
        <div className="bg-white/80 dark:bg-background/80 backdrop-blur-sm p-10 rounded-[2rem] border border-black/5 dark:border-border shadow-2xl relative z-10 max-w-[280px]">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Map className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-3 text-foreground">No Geospatial Data</h3>
          <p className="text-[11px] text-muted-foreground font-bold leading-relaxed opacity-70">
            Ball-by-ball coordinates are not available for this player's technical profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[2.5rem] border border-black/5 dark:border-border/50 bg-white/5 dark:bg-background/50 relative overflow-hidden h-[400px] shadow-2xl">
      <div className="h-full p-6 flex flex-col items-center justify-center">
        <div className="relative w-full h-full max-w-[340px] aspect-square">
          <svg viewBox="-110 -110 220 220" className="w-full h-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
            {/* Outfield */}
            <circle cx="0" cy="0" r="100" fill="currentColor" className="text-emerald-500/10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />
            {/* 30-yard circle */}
            <circle cx="0" cy="0" r="62" fill="none" stroke="currentColor" className="text-muted-foreground" strokeOpacity="0.15" strokeWidth="1" strokeDasharray="4 4" />
            {/* Pitch */}
            <rect x="-5" y="-18" width="10" height="36" fill="currentColor" className="text-amber-500/40" rx="2" />
            
            {/* Delivery Dots */}
            {deliveries.map((d, i) => {
              if (d.wagon_x === null || d.wagon_y === null) return null;
              const color = d.runs_off_bat === 4 ? "#fbbf24" : d.runs_off_bat === 6 ? "#f43f5e" : "#3b82f6";
              const r = d.runs_off_bat === 4 ? 3.5 : d.runs_off_bat === 6 ? 4.5 : 2.5;
              return (
                <circle 
                  key={i} 
                  cx={d.wagon_x} 
                  cy={d.wagon_y} 
                  r={r} 
                  fill={color} 
                  className="animate-in fade-in zoom-in duration-500 shadow-md" 
                  style={{ animationDelay: `${i * 12}ms` }}
                >
                  <title>{`${d.runs_off_bat} runs vs ${d.bowler}`}</title>
                </circle>
              );
            })}
          </svg>
          
          {/* Legend */}
          <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-6 text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground opacity-80">
            <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shadow-sm" /> 
               <span>Rotations</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] shadow-sm" /> 
               <span>Boundaries</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] shadow-sm" /> 
               <span>Maximus</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
