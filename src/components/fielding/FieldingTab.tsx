import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Trophy, Hand, Shield, Zap, Target, Activity, Map as MapIcon, ChevronRight, Info, ZapOff, Crosshair } from "lucide-react";
import { usePlayerSummary } from "@/lib/hooks/usePlayers";
import { useParams } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

import type { PlayerSummary } from "@/lib/hooks/usePlayers";

interface FieldingTabProps {
  stats: PlayerSummary | null;
  format: string;
  isLoading?: boolean;
}

const defaultPositions = [
  { id: "wk", label: "WK", x: 50, y: 72, color: "text-primary" },
  { id: "slip1", label: "1.SLIP", x: 58, y: 70, color: "text-muted-foreground" },
  { id: "point", label: "POINT", x: 80, y: 48, color: "text-muted-foreground" },
  { id: "cover", label: "COVER", x: 78, y: 35, color: "text-muted-foreground" },
  { id: "midoff", label: "M.OFF", x: 60, y: 22, color: "text-muted-foreground" },
  { id: "midon", label: "M.ON", x: 40, y: 22, color: "text-muted-foreground" },
  { id: "midwicket", label: "MID.W", x: 22, y: 35, color: "text-muted-foreground" },
  { id: "sqleg", label: "SQ.L", x: 20, y: 48, color: "text-muted-foreground" },
  { id: "fineleg", label: "F.L", x: 30, y: 75, color: "text-muted-foreground" },
];

const fieldConfigs: Record<string, any[]> = {
  "pace-powerplay": [
    { id: "wk", label: "WK", x: 50, y: 76, color: "text-primary" },
    { id: "slip1", label: "1.SL", x: 58, y: 72, color: "text-muted-foreground" },
    { id: "slip2", label: "2.SL", x: 64, y: 68, color: "text-muted-foreground" },
    { id: "gully", label: "G.Y", x: 72, y: 62, color: "text-muted-foreground" },
    { id: "point", label: "P.T", x: 84, y: 48, color: "text-muted-foreground" },
    { id: "cover", label: "C.V", x: 75, y: 32, color: "text-muted-foreground" },
    { id: "midoff", label: "M.O", x: 58, y: 22, color: "text-muted-foreground" },
    { id: "midon", label: "M.O.", x: 42, y: 22, color: "text-muted-foreground" },
    { id: "midwicket", label: "M.W.", x: 25, y: 38, color: "text-muted-foreground" },
  ],
  "pace-death": [
    { id: "wk", label: "WK", x: 50, y: 76, color: "text-primary" },
    { id: "thirdman", label: "3.MN", x: 75, y: 85, color: "text-muted-foreground" },
    { id: "point", label: "D.PT", x: 92, y: 48, color: "text-muted-foreground" },
    { id: "cover", label: "D.CV", x: 85, y: 28, color: "text-muted-foreground" },
    { id: "longoff", label: "L.OF", x: 60, y: 12, color: "text-muted-foreground" },
    { id: "longon", label: "L.ON", x: 40, y: 12, color: "text-muted-foreground" },
    { id: "midwicket", label: "D.MW", x: 15, y: 28, color: "text-muted-foreground" },
    { id: "sqleg", label: "D.SL", x: 8, y: 48, color: "text-muted-foreground" },
    { id: "fineleg", label: "F.LG", x: 25, y: 85, color: "text-muted-foreground" },
  ],
  "spin-middle": [
    { id: "wk", label: "WK", x: 50, y: 72, color: "text-primary" },
    { id: "slip", label: "SLP", x: 60, y: 64, color: "text-muted-foreground" },
    { id: "shortleg", label: "S.LG", x: 42, y: 60, color: "text-muted-foreground" },
    { id: "point", label: "PNT", x: 78, y: 48, color: "text-muted-foreground" },
    { id: "cover", label: "CVR", x: 70, y: 32, color: "text-muted-foreground" },
    { id: "midoff", label: "M.OF", x: 58, y: 24, color: "text-muted-foreground" },
    { id: "midon", label: "M.ON", x: 42, y: 24, color: "text-muted-foreground" },
    { id: "midwicket", label: "D.MW", x: 12, y: 32, color: "text-muted-foreground" },
    { id: "longon", label: "L.ON", x: 38, y: 10, color: "text-muted-foreground" },
    { id: "longoff", label: "L.OF", x: 62, y: 10, color: "text-muted-foreground" },
  ],
};

function CricketField({ positions }: { positions: any[] }) {
  return (
    <div className="relative aspect-square w-full max-w-[480px] mx-auto p-4 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_60px_rgba(var(--primary-rgb),0.08)] overflow-visible">
        <defs>
          <radialGradient id="fieldGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" className="text-foreground" stopColor="currentColor" stopOpacity="0.12" />
            <stop offset="100%" className="text-foreground" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Boundary */}
        <ellipse cx="50" cy="50" rx="48" ry="46" fill="url(#fieldGrad)" stroke="currentColor" className="text-foreground/20" strokeWidth="0.5" strokeOpacity="1" />
        {/* Inner Circle */}
        <ellipse cx="50" cy="50" rx="26" ry="24" fill="none" stroke="currentColor" className="text-foreground/30" strokeWidth="0.3" strokeOpacity="1" strokeDasharray="2 2" />
        {/* Pitch Area */}
        <rect x="46.5" y="38" width="7" height="24" rx="1.5" fill="currentColor" className="text-foreground" fillOpacity="0.1" stroke="currentColor" strokeWidth="0.2" strokeOpacity="0.4" />
        
        {/* Positions */}
        {positions.map((pos) => (
          <motion.g key={pos.id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
            <circle cx={pos.x} cy={pos.y} r="2.8" className={cn("fill-current", pos.id === 'wk' ? 'text-primary' : 'text-foreground/60')} />
            <circle cx={pos.x} cy={pos.y} r="4.5" className={cn("stroke-current", pos.id === 'wk' ? 'text-primary' : 'text-foreground')} strokeWidth="0.4" fill="none" opacity="0.15" />
            <text x={pos.x} y={pos.y - 7} textAnchor="middle" fontSize="3.5" className="uppercase tracking-[0.1em] select-none pointer-events-none fill-foreground font-black">
              {pos.label}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}

export function FieldingTab({ stats, format, isLoading: parentLoading }: FieldingTabProps) {
  const { id } = useParams<{ id: string }>();
  const [bowlerType, setBowlerType] = useState("pace");
  const [matchPhase, setMatchPhase] = useState("powerplay");
  const [activeField, setActiveField] = useState<any[]>(defaultPositions);
  
  const isLoading = parentLoading;

  const metrics = useMemo(() => {
    if (!stats) return null;
    const { catches, stumpings, run_outs, matches } = stats;

    if (!catches && !stumpings && !run_outs) return null;

    return [
      { metric: "Total Catches", value: catches || 0, icon: Hand, avg: ((catches || 0) / Math.max(1, matches)).toFixed(2), color: "text-blue-600 dark:text-blue-400" },
      { metric: "Stumpings", value: stumpings || 0, icon: Target, avg: ((stumpings || 0) / Math.max(1, matches)).toFixed(2), color: "text-rose-600 dark:text-rose-500" },
      { metric: "Run Outs", value: run_outs || 0, icon: Zap, avg: ((run_outs || 0) / Math.max(1, matches)).toFixed(2), color: "text-amber-600 dark:text-amber-500" },
      { metric: "Appearances", value: matches, icon: Trophy, avg: "Aggregate", color: "text-primary" },
    ];
  }, [stats]);

  const handleSuggest = () => {
    const key = `${bowlerType}-${matchPhase}`;
    const config = fieldConfigs[key] || defaultPositions;
    setActiveField(config);
  };

  if (isLoading) return (
    <div className="space-y-12 pb-24 animate-pulse">
      <div className="grid grid-cols-2 gap-8">
        {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-32 rounded-[2.5rem]" />)}
      </div>
      <Skeleton className="h-[600px] rounded-[3.5rem]" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-16 pb-24">
      {metrics ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((m, i) => (
            <div key={i} className="p-10 rounded-[2.5rem] glass border-black/5 dark:border-border/50 group hover:border-primary/40 transition-all shadow-xl bg-white/5 dark:bg-white/1 overflow-hidden relative active:scale-[0.98]">
              <div className="flex items-center justify-between mb-8 relative z-10">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.25em] opacity-80 leading-none">{m.metric}</span>
                <div className="p-3.5 bg-slate-100 dark:bg-secondary/50 rounded-2xl group-hover:bg-primary/10 transition-colors shadow-inner border border-black/5 dark:border-white/5">
                  <m.icon className={cn("h-6 w-6", m.color)} />
                </div>
              </div>
              <span className="value mt-4 tracking-tighter text-6xl text-foreground font-black leading-none block relative z-10">{m.value}</span>
              <div className="flex items-center gap-3 mt-8 px-5 py-2.5 rounded-full bg-slate-100 dark:bg-muted/20 border border-black/5 dark:border-white/5 w-fit relative z-10 shadow-sm">
                <Activity className="h-4 w-4 text-muted-foreground/50" /> 
                <span className="text-[10px] text-foreground/70 uppercase font-black tracking-widest">Rate: {m.avg}</span>
              </div>
              
              <div className="absolute -right-6 -bottom-6 h-28 w-28 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="h-28 w-28 rounded-[2.5rem] bg-slate-50 dark:bg-muted/10 glass flex items-center justify-center mb-8 relative shadow-inner">
             <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-10" />
             <ZapOff className="h-12 w-12 text-muted-foreground/60 relative z-10" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-[0.2em] mb-4 text-foreground">No Sector Intel</h3>
          <p className="text-[11px] text-muted-foreground max-w-[400px] font-black uppercase tracking-[0.1em] leading-loose opacity-70">
            No {format} fielding statistics available for this player's technical profile.
          </p>
        </div>
      )}

      <div className="grid gap-12 lg:grid-cols-2">
          {/* Field visualization */}
          <div className="p-12 rounded-[4rem] glass border-black/5 dark:border-border/50 bg-white/5 dark:bg-white/1 bg-gradient-to-b from-slate-50/50 dark:from-muted/10 to-transparent relative overflow-hidden flex flex-col items-center group shadow-2xl">
            <div className="w-full flex items-center justify-between mb-16">
              <div className="flex items-center gap-4">
                <div className="p-3.5 bg-primary/10 rounded-2xl shadow-inner border border-primary/20">
                  <MapIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-muted-foreground dark:text-muted-foreground/80 uppercase tracking-[0.3em] mb-1">Spatial Positioning</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/60 dark:text-muted-foreground/40 leading-none">Dynamic Field Plotting System</p>
                </div>
              </div>
              <div className="flex gap-2.5">
                 <div className="h-2.5 w-10 rounded-full bg-primary/20" />
                 <div className="h-2.5 w-4 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)]" />
              </div>
            </div>
            
            <CricketField positions={activeField} />
            
            <div className="mt-16 px-12 py-8 rounded-[2.5rem] bg-white dark:bg-muted/20 border border-black/5 dark:border-white/10 flex gap-12 shadow-2xl backdrop-blur-3xl ring-1 ring-black/5">
               <div className="flex items-center gap-4">
                  <div className="h-4 w-4 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.7)]" />
                  <span className="text-[11px] font-black uppercase text-foreground/80 tracking-widest whitespace-nowrap">High Yield Sector</span>
               </div>
               <div className="flex items-center gap-4 border-l border-black/10 dark:border-white/10 pl-12">
                  <div className="h-4 w-4 rounded-full bg-foreground/20 shadow-inner" />
                  <span className="text-[11px] font-black uppercase text-foreground/60 tracking-widest whitespace-nowrap">Standard Anchor</span>
               </div>
            </div>
            <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-primary/5 blur-[120px] rounded-full" />
          </div>

          {/* Placement strategy engine */}
          <div className="p-12 rounded-[4rem] glass border-primary/20 bg-primary/[0.03] flex flex-col justify-between relative overflow-hidden shadow-2xl">
            <div className="space-y-12 relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3.5 bg-primary/10 rounded-2xl shadow-inner border border-primary/20">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xs font-black text-muted-foreground dark:text-muted-foreground/80 uppercase tracking-[0.3em]">Tactical Strategy Engine</h3>
              </div>
              
              <div className="grid gap-12 sm:grid-cols-2">
                <div className="space-y-5">
                  <label className="text-[10px] uppercase font-black text-muted-foreground/80 dark:text-muted-foreground/60 tracking-[0.4em] px-4 leading-none">Attack Vector</label>
                  <Select value={bowlerType} onValueChange={setBowlerType}>
                    <SelectTrigger className="h-20 bg-white/90 dark:bg-background/60 border-black/10 dark:border-border/50 rounded-[2.2rem] text-sm font-black uppercase tracking-widest px-10 focus:ring-primary/20 shadow-xl transition-all hover:scale-[1.02] border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border rounded-[2.5rem] shadow-2xl p-4 min-w-[280px]">
                      <SelectItem value="pace" className="py-5 px-8 uppercase font-black text-[11px] tracking-[0.2em] rounded-2xl hover:bg-primary/5 cursor-pointer">Kinetic / Pace Attack</SelectItem>
                      <SelectItem value="spin" className="py-5 px-8 uppercase font-black text-[11px] tracking-[0.2em] rounded-2xl hover:bg-primary/5 cursor-pointer">Variable / Spin Tactics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-5">
                  <label className="text-[10px] uppercase font-black text-muted-foreground/80 dark:text-muted-foreground/60 tracking-[0.4em] px-4 leading-none">Strategic Phase</label>
                  <Select value={matchPhase} onValueChange={setMatchPhase}>
                    <SelectTrigger className="h-20 bg-white/90 dark:bg-background/60 border-black/10 dark:border-border/50 rounded-[2.2rem] text-sm font-black uppercase tracking-widest px-10 focus:ring-primary/20 shadow-xl transition-all hover:scale-[1.02] border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border rounded-[2.5rem] shadow-2xl p-4 min-w-[280px]">
                      <SelectItem value="powerplay" className="py-5 px-8 uppercase font-black text-[11px] tracking-[0.2em] rounded-2xl hover:bg-primary/5 cursor-pointer">Initial Surge (PP)</SelectItem>
                      <SelectItem value="middle" className="py-5 px-8 uppercase font-black text-[11px] tracking-[0.2em] rounded-2xl hover:bg-primary/5 cursor-pointer">Control (Middle)</SelectItem>
                      <SelectItem value="death" className="py-5 px-8 uppercase font-black text-[11px] tracking-[0.2em] rounded-2xl hover:bg-primary/5 cursor-pointer">Terminal Squeeze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={handleSuggest} className="w-full h-24 rounded-[3rem] bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.4em] text-xs shadow-2xl shadow-primary/40 transition-all active:scale-[0.97] group border-4 border-primary/20 scale-100 hover:scale-[1.01]">
                <span className="flex items-center gap-6">
                  Initialize Field Plot
                  <ChevronRight className="h-8 w-8 group-hover:translate-x-3 transition-transform" />
                </span>
              </Button>
            </div>

            <div className="mt-16 p-12 rounded-[3.5rem] bg-white/95 dark:bg-background/50 border border-black/10 dark:border-border backdrop-blur-3xl relative z-10 transition-all hover:border-primary/40 group/strategy shadow-2xl ring-1 ring-black/10">
              <div className="flex items-center gap-5 mb-8">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                   <Shield className="h-6 w-6 text-primary" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Deployment Strategy Intel</span>
              </div>
              <p className="text-base text-foreground leading-relaxed font-black uppercase tracking-tight">
                Recommended <span className="text-primary underline decoration-primary/30 underline-offset-8 decoration-4">{bowlerType === "pace" ? "primary corridor" : "impact zone"}</span> alignment for <span className="text-foreground">{matchPhase === "powerplay" ? "high-density slip block" : matchPhase === "middle" ? "radial containment" : "terminal field screening"}</span>. 
                <span className="block mt-8 text-[11px] uppercase font-black tracking-[0.25em] text-primary/70 flex items-center gap-4 border-t border-black/10 pt-8 leading-none">
                  <Crosshair className="h-5 w-5 opacity-60" /> Confidence: 92.8%
                </span>
              </p>
            </div>
            
            <div className="absolute right-0 top-0 h-80 w-80 bg-primary/20 blur-[160px] rounded-full pointer-events-none" />
          </div>
      </div>

      <div className="rounded-[4rem] glass border-black/5 dark:border-border/50 overflow-hidden group shadow-2xl bg-white/5 dark:bg-white/1">
        <div className="p-14 border-b border-black/5 dark:border-border flex items-center justify-between bg-slate-50/80 dark:bg-muted/10 shadow-inner">
            <div className="flex items-center gap-5">
               <div className="p-4 bg-slate-100 dark:bg-secondary/50 rounded-2xl shadow-inner border border-black/5 dark:border-white/5">
                  <Activity className="h-7 w-7 text-muted-foreground opacity-60" />
               </div>
               <div>
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.3em] opacity-80 mb-1">Career Efficiency Index</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/30 leading-none">Technical Deployment Telemetry</p>
               </div>
            </div>
            <div className="h-14 w-14 rounded-full border border-black/5 dark:border-border flex items-center justify-center bg-white dark:bg-background/80 shadow-xl">
               <div className="h-3 w-3 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(var(--primary-rgb),0.6)]" />
            </div>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full">
            <thead className="bg-slate-50/80 dark:bg-muted/10 text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground opacity-50 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-16 py-12 text-left">Sector Metric</th>
                <th className="px-16 py-12 text-right">Aggregate</th>
                <th className="px-16 py-12 text-right">Execution Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-border/60">
              {metrics ? metrics.map((m, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-muted/20 transition-all cursor-default group/row">
                  <td className="px-16 py-14 font-black text-2xl uppercase tracking-tighter text-foreground/80 transition-colors group-hover/row:text-primary leading-none">{m.metric}</td>
                  <td className="px-16 py-14 text-right font-black text-foreground text-5xl tracking-tighter group-hover/row:scale-110 transition-transform origin-right leading-none">{m.value}</td>
                  <td className="px-16 py-14 text-right font-black text-sm uppercase tracking-widest">
                    <span className="text-foreground transition-all group-hover/row:text-primary">{m.avg}</span> 
                    <span className="text-[10px] font-black text-muted-foreground/40 ml-3">per deployment</span>
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan={3} className="px-16 py-32 text-center opacity-40 font-black uppercase tracking-[0.3em] text-muted-foreground italic">No sector intelligence available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
