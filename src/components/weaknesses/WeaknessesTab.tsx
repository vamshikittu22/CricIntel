import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";
import { AlertTriangle, Shield, TrendingDown, TrendingUp, Copy, Check, Crosshair, HelpCircle } from "lucide-react";
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
  fieldSetup?: string;
  topic: "batting" | "bowling";
}

function analyzeFromSummary(stats: PlayerSummary | null): InsightRule[] {
  const rules: InsightRule[] = [];
  if (!stats) return rules;

  if (stats.innings_bat > 10) {
    // SR Analysis
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

    // Dismissal Mode Analysis
    const b = stats.dismissals_breakdown || {};
    const totalDismissals = stats.innings_bat - (stats.not_outs || 0);
    if (totalDismissals > 5) {
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

  if (isLoading) return <div className="p-12"><Skeleton className="h-48 w-full" /></div>;

  if (stats && (stats.innings_bat || 0) < 10) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <HelpCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-black uppercase tracking-widest mb-2">Insufficient Data</h3>
        <p className="text-xs text-muted-foreground max-w-[300px] leading-relaxed">
          Weakness engine requires at least 10 innings to generate high-confidence patterns for {format}.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(briefing);
    setCopied(true);
    toast({ title: "Copied!", description: "Tactical briefing copied." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-12">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Stumps Visualization */}
        <section className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
             <Crosshair className="h-3 w-3" /> Dismissal Target Profile
          </h3>
          <Card className="border-border/60 bg-card/40 relative h-[360px] flex items-center justify-center overflow-hidden">
             {/* Stumps SVG */}
             <svg viewBox="0 0 200 200" className="w-64 h-64 opacity-20 text-foreground">
                <rect x="70" y="80" width="8" height="100" fill="currentColor" rx="2" />
                <rect x="96" y="80" width="8" height="100" fill="currentColor" rx="2" />
                <rect x="122" y="80" width="8" height="100" fill="currentColor" rx="2" />
                <rect x="68" y="75" width="64" height="6" fill="currentColor" rx="2" />
             </svg>
             
             {/* Mode Dots (Mock based on breakdown) */}
             <div className="absolute inset-0 flex items-center justify-center">
                {stats?.dismissals_breakdown && Object.entries(stats.dismissals_breakdown).map(([mode, count], idx) => {
                  if (count === 0) return null;
                  const angles = [45, 135, 225, 315, 90, 270];
                  const angle = angles[idx % angles.length];
                  const dist = 60 + (idx * 5);
                  const x = Math.cos(angle * Math.PI / 180) * dist;
                  const y = Math.sin(angle * Math.PI / 180) * dist;
                  
                  return (
                    <motion.div 
                      key={mode}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      className="absolute group cursor-help"
                    >
                      <div className="h-4 w-4 rounded-full bg-primary/80 border-2 border-background shadow-lg" />
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border px-2 py-1 rounded text-[8px] font-black uppercase whitespace-nowrap z-20">
                        {mode}: {count}
                      </div>
                    </motion.div>
                  );
                })}
             </div>
             
             <div className="absolute bottom-4 left-4 right-4 text-center">
                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-50">Spatial Dismissal Mode Density</p>
             </div>
          </Card>
        </section>

        {/* Tactical Report */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               <Shield className="h-3 w-3" /> Tactical Report
            </h3>
            <button onClick={handleCopy} className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 hover:opacity-70 transition-opacity">
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          
          <Card className="border-primary/20 bg-primary/5 min-h-[360px] flex flex-col">
            <CardContent className="p-6 flex-1">
              <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed tabular-nums">
                {briefing}
              </pre>
            </CardContent>
            <div className="px-6 py-4 border-t border-primary/10">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary/60">
                <AlertTriangle className="h-3 w-3" /> Note: Based on statistical patterns only.
              </div>
            </div>
          </Card>
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rules.map((rule, i) => (
          <Card key={i} className={`border-l-4 ${rule.type === 'weakness' ? 'border-l-destructive bg-destructive/5' : 'border-l-success bg-success/5'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest">{rule.title}</span>
                <Badge variant="outline" className="text-[8px] font-black">{rule.confidence}% CONF</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{rule.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
