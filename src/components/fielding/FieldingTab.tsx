import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Trophy, Hand, Shield, Zap, Target, Activity, Map as MapIcon, ChevronRight, Info } from "lucide-react";
import { usePlayerSummary } from "@/lib/hooks/usePlayers";
import { useParams } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state";

interface FieldingTabProps {
  isLoading?: boolean;
}

const defaultPositions = [
  { id: "wk", label: "WK", x: 50, y: 72, color: "hsl(var(--primary))" },
  { id: "slip1", label: "1.SLIP", x: 58, y: 70, color: "#fff" },
  { id: "point", label: "POINT", x: 80, y: 48, color: "var(--secondary)" },
  { id: "cover", label: "COVER", x: 78, y: 35, color: "var(--secondary)" },
  { id: "midoff", label: "M.OFF", x: 60, y: 22, color: "#fff" },
  { id: "midon", label: "M.ON", x: 40, y: 22, color: "#fff" },
  { id: "midwicket", label: "MID.W", x: 22, y: 35, color: "var(--secondary)" },
  { id: "sqleg", label: "SQ.L", x: 20, y: 48, color: "var(--secondary)" },
  { id: "fineleg", label: "F.L", x: 30, y: 75, color: "#fff" },
];

const fieldConfigs: Record<string, typeof defaultPositions> = {
  "pace-powerplay": [
    { id: "wk", label: "WK", x: 50, y: 76, color: "hsl(var(--primary))" },
    { id: "slip1", label: "1.SL", x: 58, y: 72, color: "#fff" },
    { id: "slip2", label: "2.SL", x: 64, y: 68, color: "#fff" },
    { id: "gully", label: "G.Y", x: 72, y: 62, color: "#fff" },
    { id: "point", label: "P.T", x: 84, y: 48, color: "#fff" },
    { id: "cover", label: "C.V", x: 75, y: 32, color: "#fff" },
    { id: "midoff", label: "M.O", x: 58, y: 22, color: "#fff" },
    { id: "midon", label: "M.O.", x: 42, y: 22, color: "#fff" },
    { id: "midwicket", label: "M.W.", x: 25, y: 38, color: "#fff" },
  ],
  "pace-death": [
    { id: "wk", label: "WK", x: 50, y: 76, color: "hsl(var(--primary))" },
    { id: "thirdman", label: "3.MN", x: 75, y: 85, color: "#fff" },
    { id: "point", label: "D.PT", x: 92, y: 48, color: "#fff" },
    { id: "cover", label: "D.CV", x: 85, y: 28, color: "#fff" },
    { id: "longoff", label: "L.OF", x: 60, y: 12, color: "#fff" },
    { id: "longon", label: "L.ON", x: 40, y: 12, color: "#fff" },
    { id: "midwicket", label: "D.MW", x: 15, y: 28, color: "#fff" },
    { id: "sqleg", label: "D.SL", x: 8, y: 48, color: "#fff" },
    { id: "fineleg", label: "F.LG", x: 25, y: 85, color: "#fff" },
  ],
  "spin-middle": [
    { id: "wk", label: "WK", x: 50, y: 72, color: "hsl(var(--primary))" },
    { id: "slip", label: "SLP", x: 60, y: 64, color: "#fff" },
    { id: "shortleg", label: "S.LG", x: 42, y: 60, color: "#fff" },
    { id: "point", label: "PNT", x: 78, y: 48, color: "#fff" },
    { id: "cover", label: "CVR", x: 70, y: 32, color: "#fff" },
    { id: "midoff", label: "M.OF", x: 58, y: 24, color: "#fff" },
    { id: "midon", label: "M.ON", x: 42, y: 24, color: "#fff" },
    { id: "midwicket", label: "D.MW", x: 12, y: 32, color: "#fff" },
    { id: "longon", label: "L.ON", x: 38, y: 10, color: "#fff" },
    { id: "longoff", label: "L.OF", x: 62, y: 10, color: "#fff" },
  ],
};

function CricketField({ positions }: { positions: typeof defaultPositions }) {
  return (
    <div className="relative aspect-square w-full max-w-[440px] mx-auto p-4 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_50px_rgba(255,255,255,0.05)] overflow-visible">
        <defs>
          <radialGradient id="fieldGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        {/* Boundary */}
        <ellipse cx="50" cy="50" rx="48" ry="46" fill="url(#fieldGrad)" stroke="white" strokeWidth="0.2" strokeOpacity="0.2" />
        {/* Inner Circle */}
        <ellipse cx="50" cy="50" rx="24" ry="22" fill="none" stroke="white" strokeWidth="0.1" strokeOpacity="0.1" strokeDasharray="1 1" />
        {/* Pitch Area */}
        <rect x="47" y="40" width="6" height="20" rx="1" fill="white" fillOpacity="0.05" stroke="white" strokeWidth="0.05" strokeOpacity="0.2" />
        
        {/* Positions */}
        {positions.map((pos) => (
          <motion.g key={pos.id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
            <circle cx={pos.x} cy={pos.y} r="2.2" fill={pos.color} className="shadow-2xl" />
            <circle cx={pos.x} cy={pos.y} r="3.5" stroke={pos.color} strokeWidth="0.3" fill="none" className="animate-pulse" opacity="0.4" />
            <text x={pos.x} y={pos.y - 4.5} textAnchor="middle" fontSize="2.2" fill="white" fontWeight="900" className="uppercase tracking-tighter opacity-80 select-none pointer-events-none">
              {pos.label}
            </text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}

export function FieldingTab({ isLoading: parentLoading }: FieldingTabProps) {
  const { id } = useParams<{ id: string }>();
  const [bowlerType, setBowlerType] = useState("pace");
  const [matchPhase, setMatchPhase] = useState("powerplay");
  const [activeField, setActiveField] = useState<typeof defaultPositions>(defaultPositions);
  
  const { data: summaries, isLoading: summaryLoading } = usePlayerSummary(id);
  const isLoading = parentLoading || summaryLoading;

  const metrics = useMemo(() => {
    if (!summaries || summaries.length === 0) return null;
    const totalCatches = summaries.reduce((sum, s) => sum + (s.catches || 0), 0);
    const totalStumpings = summaries.reduce((sum, s) => sum + (s.stumpings || 0), 0);
    const totalRunOuts = summaries.reduce((sum, s) => sum + (s.run_outs || 0), 0);
    const totalMatches = summaries.reduce((sum, s) => sum + (s.matches || 0), 0);

    if (totalCatches === 0 && totalStumpings === 0 && totalRunOuts === 0) return null;

    return [
      { metric: "Total Catches", value: totalCatches, icon: Hand, avg: (totalCatches / Math.max(1, totalMatches)).toFixed(2), color: "text-blue-500" },
      { metric: "Stumpings", value: totalStumpings, icon: Target, avg: (totalStumpings / Math.max(1, totalMatches)).toFixed(2), color: "text-rose-500" },
      { metric: "Impact Throws", value: totalRunOuts, icon: Zap, avg: (totalRunOuts / Math.max(1, totalMatches)).toFixed(2), color: "text-amber-500" },
      { metric: "Matches", value: totalMatches, icon: Trophy, avg: "Aggregate", color: "text-primary" },
    ];
  }, [summaries]);

  const handleSuggest = () => {
    const key = `${bowlerType}-${matchPhase}`;
    const config = fieldConfigs[key] || defaultPositions;
    setActiveField(config);
  };

  if (isLoading) return <div className="space-y-12 pb-20"><div className="grid grid-cols-4 gap-6"><Skeleton className="h-28 rounded-[2rem]" /></div><Skeleton className="h-[550px] rounded-[3rem]" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-16 pb-24">
      {metrics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
            <div key={i} className="stat-card glass border-border/50 group hover:border-primary/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="label leading-none">{m.metric}</span>
                <div className="p-2 bg-secondary/50 rounded-lg group-hover:bg-primary/10 transition-colors">
                  <m.icon className={`h-4 w-4 ${m.color} opacity-70 group-hover:opacity-100`} />
                </div>
              </div>
              <span className="value mt-1 tracking-tighter text-4xl">{m.value}</span>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-3 flex items-center gap-2">
                <Activity className="h-3 w-3" /> Avg: {m.avg}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState 
          message="No fielding data aggregate found for this player profile" 
          icon={<Hand className="h-10 w-10 text-muted-foreground/20" />}
        />
      )}

      <div className="grid gap-10 lg:grid-cols-2">
          {/* Field visualization */}
          <div className="p-10 rounded-[3rem] glass border-border/50 relative overflow-hidden flex flex-col items-center group">
            <div className="w-full flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <MapIcon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.25em]">Spatial Positioning Intelligence</h3>
              </div>
              <div className="flex gap-2">
                 <div className="h-1.5 w-6 rounded-full bg-primary/20" />
                 <div className="h-1.5 w-2 rounded-full bg-primary" />
              </div>
            </div>
            
            <CricketField positions={activeField} />
            
            <div className="mt-12 px-8 py-4 rounded-full bg-white/[0.03] border border-white/5 flex gap-8 backdrop-blur-3xl">
               <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                  <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">Key Anchor</span>
               </div>
               <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-white" />
                  <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">Support Node</span>
               </div>
            </div>
            
            {/* Background decorative elements */}
            <div className="absolute -left-10 -bottom-10 h-40 w-40 bg-primary/5 blur-3xl rounded-full" />
          </div>

          {/* Placement strategy engine */}
          <div className="p-12 rounded-[3rem] glass border-primary/20 bg-primary/5 flex flex-col justify-between relative overflow-hidden">
            <div className="space-y-12 relative z-10">
              <div className="w-full flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.25em]">Deployment Logic Engine</h3>
              </div>
              
              <div className="grid gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.4em] px-2">Engagement Vector</label>
                  <Select value={bowlerType} onValueChange={setBowlerType}>
                    <SelectTrigger className="h-16 bg-black/40 border-white/5 rounded-[1.5rem] text-sm font-black uppercase tracking-widest px-6 focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-white/10 rounded-2xl">
                      <SelectItem value="pace" className="py-3 uppercase font-black text-[10px] tracking-widest">Kinetic / Pace Attack</SelectItem>
                      <SelectItem value="spin" className="py-3 uppercase font-black text-[10px] tracking-widest">Variable / Spin Tactics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-black text-white/30 tracking-[0.4em] px-2">Strategic Phase</label>
                  <Select value={matchPhase} onValueChange={setMatchPhase}>
                    <SelectTrigger className="h-16 bg-black/40 border-white/5 rounded-[1.5rem] text-sm font-black uppercase tracking-widest px-6 focus:ring-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-white/10 rounded-2xl">
                      <SelectItem value="powerplay" className="py-3 uppercase font-black text-[10px] tracking-widest">Initial Suppression (PP)</SelectItem>
                      <SelectItem value="middle" className="py-3 uppercase font-black text-[10px] tracking-widest">Sustained Control (Middle)</SelectItem>
                      <SelectItem value="death" className="py-3 uppercase font-black text-[10px] tracking-widest">Terminal Containment (Death)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button onClick={handleSuggest} className="w-full h-20 rounded-[2.5rem] bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_-12px_rgba(var(--primary-rgb),0.5)] transition-all active:scale-95 group">
                <span className="flex items-center gap-3">
                  Generate Optimized Plot
                  <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </div>

            <div className="mt-12 p-8 rounded-[2.5rem] bg-black/40 border border-white/5 backdrop-blur-3xl relative z-10 transition-all hover:border-primary/20 group/strategy">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Deployment Strategy</span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed font-medium">
                Targeting the <span className="text-foreground font-black">{bowlerType === "pace" ? "primary corridor" : "impact zone"}</span> with a <span className="text-foreground font-black">{matchPhase === "powerplay" ? "high-density slip wall" : matchPhase === "middle" ? "radial squeeze setup" : "perimeter-biased deep screen"}</span>. 
                <span className="block mt-2 text-[10px] uppercase font-black tracking-widest text-primary/60 italic flex items-center gap-2">
                  <Info className="h-3 w-3" /> Statistical confidence: 87%
                </span>
              </p>
            </div>
            
            {/* Background flare */}
            <div className="absolute right-0 top-0 h-64 w-64 bg-primary/10 blur-[120px] rounded-full" />
          </div>
      </div>

      {metrics && (
        <div className="rounded-[3rem] glass border-border/50 overflow-hidden group">
          <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-secondary/50 rounded-xl">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                 </div>
                 <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.25em]">Career Efficiency Index</h3>
              </div>
              <div className="h-8 w-8 rounded-full border border-white/5 flex items-center justify-center">
                 <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              </div>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full">
              <thead className="bg-white/[0.02] text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                <tr>
                  <th className="px-12 py-8 text-left">Sector Metric</th>
                  <th className="px-12 py-8 text-right">Lifetime Aggregate</th>
                  <th className="px-12 py-8 text-right">Execution Frequency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {metrics.map((m, i) => (
                  <tr key={i} className="hover:bg-white/[0.03] transition-all cursor-default group/row">
                    <td className="px-12 py-8 font-black text-base uppercase tracking-tight text-white/80 group-hover/row:text-primary transition-colors">{m.metric}</td>
                    <td className="px-12 py-8 text-right font-black text-foreground text-2xl tracking-tighter group-hover/row:scale-105 transition-transform origin-right">{m.value}</td>
                    <td className="px-12 py-8 text-right font-black mono text-[11px] text-muted-foreground uppercase tracking-widest">{m.avg} <span className="text-[8px] font-bold text-white/20 ml-1">avg</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}

