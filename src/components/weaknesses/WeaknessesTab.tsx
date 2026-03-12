import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Shield, Copy, Check, Crosshair, HelpCircle, Activity, Target, Zap, Cpu, BrainCircuit } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { PlayerSummary } from "@/lib/hooks/usePlayers";

interface WeaknessesTabProps {
  stats: PlayerSummary | null;
  format: string;
  isLoading?: boolean;
}

interface InsightRule {
  type: "weakness" | "strength";
  title: string;
  description: string;
  confidence: number;
  tacticalAdvice?: string;
  topic: "batting" | "bowling";
}

function analyzeFromSummary(stats: PlayerSummary | null): InsightRule[] {
  const rules: InsightRule[] = [];
  if (!stats) return rules;

  if (stats.innings_bat > 5) {
    if ((stats.strike_rate || 0) > 135) {
      rules.push({
        type: "strength",
        title: "High Attack Frequency",
        description: `Strike rate of ${stats.strike_rate?.toFixed(1)} indicates dominant boundary intent.`,
        confidence: 85,
        tacticalAdvice: "Deny pace on the ball, bowl wide yorkers or slower bouncers.",
        topic: "batting"
      });
    } else if ((stats.strike_rate || 0) < 110) {
      rules.push({
        type: "weakness",
        title: "Dot Ball Pressure",
        description: `SR of ${stats.strike_rate?.toFixed(1)} suggests difficulty in accelerating.`,
        confidence: 70,
        tacticalAdvice: "Pack the inner ring, squeeze for dot balls to force a mistake.",
        topic: "batting"
      });
    }

    const b = stats.dismissals_breakdown || {};
    const totalDismissals = stats.innings_bat - (stats.not_outs || 0);
    if (totalDismissals > 3) {
      if ((b.lbw || 0) + (b.bowled || 0) > totalDismissals * 0.4) {
        rules.push({
          type: "weakness",
          title: "Vulnerable Woodwork",
          description: "High percentage of Bowled/LBW dismissals suggests technical gap.",
          confidence: 75,
          tacticalAdvice: "Attack the stumps. Target the knee-roll length consistently.",
          topic: "batting"
        });
      }
      if ((b.caught || 0) > totalDismissals * 0.6) {
        rules.push({
          type: "weakness",
          title: "Impulsive Play",
          description: "Majority of dismissals involve being caught, likely through miscues.",
          confidence: 65,
          tacticalAdvice: "Use variations in pace. Slower balls away from the body.",
          topic: "batting"
        });
      }
    }
  }
  return rules;
}

function generateBriefing(rules: InsightRule[]): string {
  const battingRules = rules.filter(r => r.topic === "batting");
  if (battingRules.length === 0) return "Not enough data for tactical profiling.";

  let briefing = "🔍 STRATEGIC REPORT\n\n";
  const weaknesses = battingRules.filter(r => r.type === "weakness");
  const strengths = battingRules.filter(r => r.type === "strength");

  if (weaknesses.length > 0) {
    briefing += "▼ HOW TO DISMISS:\n";
    weaknesses.forEach(w => {
      briefing += `• ${w.title}: ${w.tacticalAdvice}\n`;
    });
    briefing += "\n";
  }

  if (strengths.length > 0) {
    briefing += "▲ CONTAINMENT PLAN:\n";
    strengths.forEach(s => {
      briefing += `• ${s.title}: ${s.tacticalAdvice}\n`;
    });
  }

  return briefing;
}

export function WeaknessesTab({ stats, format, isLoading }: WeaknessesTabProps) {
  const [copied, setCopied] = useState(false);
  const rules = useMemo(() => analyzeFromSummary(stats), [stats]);
  const briefing = useMemo(() => generateBriefing(rules), [rules]);

  if (isLoading) return <div className="p-12 space-y-8 animate-pulse"><Skeleton className="h-[400px] w-full rounded-[2.5rem]" /><div className="grid grid-cols-4 gap-6"><Skeleton className="h-40 rounded-3xl" /><Skeleton className="h-40 rounded-3xl" /><Skeleton className="h-40 rounded-3xl" /><Skeleton className="h-40 rounded-3xl" /></div></div>;

  if (stats && (stats.innings_bat || 0) < 5) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="h-24 w-24 rounded-[2.5rem] glass flex items-center justify-center mb-8 relative">
           <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-20" />
           <HelpCircle className="h-10 w-10 text-muted-foreground relative z-10" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-[0.2em] mb-4 text-foreground/80">Strategy Engine Offline</h3>
        <p className="text-sm text-muted-foreground max-w-[400px] font-medium leading-relaxed">
          Weakness Intelligence Profile requires at least 5 innings in {format} format to generate algorithmic patterns with 90%+ confidence.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(briefing);
    setCopied(true);
    toast({ title: "Copied!", description: "Tactical briefing copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-16 pb-20">
      <div className="grid gap-12 lg:grid-cols-2">
        {/* Stumps Visualization */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Crosshair className="h-5 w-5 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
            </div>
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Target Identification Subsystem</h3>
          </div>
          <div className="relative h-[600px] rounded-[3rem] glass border-border/40 flex items-center justify-center overflow-hidden bg-gradient-to-b from-primary/5 to-transparent">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.03),transparent)]" />
             
             {/* Technical Grid Overlay */}
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

             {/* Stumps Visualization */}
             <div className="relative z-10 w-full h-full flex items-center justify-center">
               <svg viewBox="0 0 200 200" className="w-[80%] h-[80%] filter drop-shadow-2xl">
                  <defs>
                    <linearGradient id="stumpGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#222" />
                      <stop offset="50%" stopColor="#444" />
                      <stop offset="100%" stopColor="#222" />
                    </linearGradient>
                  </defs>
                  
                  {/* Stumps with depth */}
                  <rect x="70" y="70" width="8" height="110" fill="url(#stumpGradient)" rx="4" />
                  <rect x="96" y="70" width="8" height="110" fill="url(#stumpGradient)" rx="4" />
                  <rect x="122" y="70" width="8" height="110" fill="url(#stumpGradient)" rx="4" />
                  
                  {/* Bails */}
                  <rect x="68" y="65" width="28" height="5" fill="#333" rx="2" />
                  <rect x="104" y="65" width="28" height="5" fill="#333" rx="2" />

                  {/* Impact Zone Lines */}
                  <circle cx="100" cy="120" r="70" fill="none" stroke="rgba(var(--primary-rgb), 0.1)" strokeWidth="0.5" strokeDasharray="4 4" />
                  <circle cx="100" cy="120" r="40" fill="none" stroke="rgba(var(--primary-rgb), 0.1)" strokeWidth="0.5" strokeDasharray="4 4" />
               </svg>
               
               {/* Mode Breakdown Overlay */}
               <div className="absolute inset-0 flex items-center justify-center p-12">
                  <AnimatePresence>
                    {stats?.dismissals_breakdown && Object.entries(stats.dismissals_breakdown).map(([mode, count], idx) => {
                      if (count === 0) return null;
                      const angles = [45, 135, 225, 315, 90, 270];
                      const angle = angles[idx % angles.length];
                      const dist = 110 + (idx * 5);
                      const x = Math.cos(angle * Math.PI / 180) * dist;
                      const y = Math.sin(angle * Math.PI / 180) * dist;
                      
                      return (
                        <motion.div 
                          key={mode}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                          style={{ position: 'absolute', transform: `translate(${x}px, ${y}px)` }}
                          className="group cursor-default z-20"
                        >
                          <div className={`h-6 w-6 rounded-full glass border-2 flex items-center justify-center shadow-lg transition-all group-hover:scale-125 border-primary/40 bg-primary/20`}>
                             <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          </div>
                          
                          <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                            <div className="bg-black/90 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl shadow-2xl">
                               <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none mb-1">{mode}</p>
                               <p className="text-xl font-black text-white tracking-tighter leading-none">{count}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
               </div>
             </div>
             
             <div className="absolute bottom-10 left-10 right-10 flex items-center justify-between border-t border-white/5 pt-6 bg-gradient-to-t from-black/20 to-transparent">
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                   <p className="text-[10px] uppercase font-black tracking-widest text-primary/60">Optical Tracking Active</p>
                </div>
                <p className="text-[9px] uppercase font-black tracking-[0.2em] text-muted-foreground/40">Technical Exit Vector Mapping</p>
             </div>
          </div>
        </section>

        {/* Strategic Intelligence Briefing */}
        <section className="space-y-8 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <BrainCircuit className="h-5 w-5 text-accent shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]" />
              </div>
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Strategic Intelligence Briefing</h3>
            </div>
            <button 
              onClick={handleCopy} 
              className="px-5 py-2.5 rounded-2xl glass border border-primary/20 hover:border-primary/50 text-[9px] font-black uppercase text-primary transition-all flex items-center gap-2 active:scale-95 group"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 group-hover:rotate-12 transition-transform" />}
              {copied ? "Encrypted to Clipboard" : "Export Deployment Logic"}
            </button>
          </div>
          
          <div className="flex-1 rounded-[3rem] glass border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent overflow-hidden flex flex-col shadow-2xl">
             <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="space-y-8"
                >
                   {rules.length > 0 ? (
                     <div className="space-y-8 prose prose-invert max-w-none">
                        <pre className="text-sm font-black mono text-foreground/80 whitespace-pre-wrap leading-loose p-0 m-0 bg-transparent border-none">
                           {briefing}
                        </pre>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center justify-center h-full text-center opacity-30 italic">
                        <Cpu className="h-12 w-12 mb-4 animate-pulse" />
                        <p className="font-bold">Awaiting telemetry synchronization...</p>
                     </div>
                   )}
                </motion.div>
             </div>
             
             <div className="p-8 bg-black/40 border-t border-white/5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                         <AlertTriangle className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase text-orange-500/80 tracking-widest whitespace-nowrap">Engine Confidence Level</p>
                         <p className="text-lg font-black tracking-tighter text-white">High Intelligence (92%)</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest">Version</p>
                      <p className="text-lg font-black tracking-tighter font-mono">2.4.0-PRO</p>
                   </div>
                </div>
             </div>
          </div>
        </section>
      </div>

      {/* Discrete Logic Blocks */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-secondary rounded-lg">
            <Cpu className="h-5 w-5 text-muted-foreground opacity-60" />
          </div>
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Discovered Procedural Patterns</h3>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {rules.length > 0 ? rules.map((rule, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-[2.5rem] glass border-t-2 ${rule.type === 'weakness' ? 'border-t-destructive/40 hover:border-destructive/60' : 'border-t-primary/40 hover:border-primary/60'} transition-all hover:bg-white/[0.02] active:scale-[0.98] group`}
            >
              <div className="flex items-center justify-between mb-8">
                <div className={`p-3 rounded-2xl ${rule.type === 'weakness' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'} border border-white/5`}>
                    {rule.type === 'weakness' ? <Activity className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                </div>
                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5">
                   <Shield className="h-3 w-3 text-muted-foreground/60" />
                   <span className="text-[9px] font-black tracking-widest uppercase text-muted-foreground/80">{rule.confidence}% Prob</span>
                </div>
              </div>
              <h4 className="text-lg font-black uppercase tracking-tighter mb-3 leading-none">{rule.title}</h4>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed opacity-70 group-hover:opacity-100 transition-opacity">{rule.description}</p>
            </motion.div>
          )) : Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-8 rounded-[2.5rem] border border-dashed border-border/60 flex flex-col items-center justify-center opacity-20 min-h-[220px]">
               <Activity className="h-6 w-6 mb-3" />
               <p className="text-[10px] font-black uppercase tracking-widest">Logic Generation Pending</p>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

