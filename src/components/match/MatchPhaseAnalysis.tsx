import { useMemo, useState } from "react";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchDelivery } from "@/hooks/useAnalytics";
import { motion } from "framer-motion";
import { Target, Shield, Zap, Activity } from "lucide-react";

interface MatchPhaseAnalysisProps {
  deliveries: MatchDelivery[];
}

export default function MatchPhaseAnalysis({ deliveries }: MatchPhaseAnalysisProps) {
  const [activeInning, setActiveInning] = useState<number>(1);
  const innings = useMemo(() => Array.from(new Set(deliveries.map(d => d.innings))).sort(), [deliveries]);

  const phaseData = useMemo(() => {
    const inningDeliveries = deliveries.filter(d => d.innings === activeInning);
    const phases = [
      { name: "Powerplay", start: 0, end: 5 },
      { name: "Middle", start: 6, end: 14 },
      { name: "Death", start: 15, end: 19 }
    ];

    return phases.map(phase => {
      const phaseBalls = inningDeliveries.filter(d => d.over_number >= phase.start && d.over_number <= phase.end);
      const runs = phaseBalls.reduce((sum, d) => sum + d.runs_off_bat + d.extras, 0);
      const wickets = phaseBalls.filter(d => d.is_wicket).length;
      const balls = phaseBalls.length;
      const rr = balls > 0 ? (runs / (balls / 6)) : 0;
      
      return {
        name: phase.name,
        runs,
        wickets,
        rr: parseFloat(rr.toFixed(2)),
        dots: phaseBalls.filter(d => d.runs_off_bat === 0 && d.extras === 0).length,
        boundaries: phaseBalls.filter(d => d.runs_off_bat === 4 || d.runs_off_bat === 6).length
      };
    });
  }, [deliveries, activeInning]);

  const radarData = useMemo(() => {
    return phaseData.map(p => ({
        subject: p.name,
        RR: p.rr * 5, // Normalize for chart
        Wickets: p.wickets * 10,
        Boundaries: p.boundaries * 2,
        fullMark: 100
    }));
  }, [phaseData]);

  return (
    <div className="space-y-12">
       <div className="flex justify-center mb-10">
        <Tabs value={activeInning.toString()} onValueChange={(v) => setActiveInning(parseInt(v))}>
          <TabsList className="bg-secondary/20 p-1 rounded-2xl border border-border/50 h-11">
            {innings.map(inn => (
              <TabsTrigger 
                key={inn} 
                value={inn.toString()}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black px-8 py-2 rounded-xl text-[11px] uppercase tracking-tighter"
              >
                Inning {inn}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Radar Map */}
        <Card className="glass rounded-[3rem] border-border/50 bg-card/40 overflow-hidden shadow-2xl flex flex-col items-center justify-center py-10">
            <div className="text-center mb-10">
                <Target className="h-6 w-6 text-primary mx-auto mb-3" />
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-muted-foreground">Innings Phase Analysis</h3>
            </div>
            <div className="h-[400px] w-full max-w-md">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="hsl(var(--muted-foreground)/0.2)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: "900", fill: "hsl(var(--muted-foreground)/0.6)" }} />
                        <Radar 
                            name="Run Rate" 
                            dataKey="RR" 
                            stroke="#256af4" 
                            fill="#256af4" 
                            fillOpacity={0.6} 
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </Card>

        {/* Phase Grid */}
        <div className="grid grid-cols-1 gap-6">
            {phaseData.map((phase, idx) => (
                <motion.div 
                    key={phase.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass rounded-[2rem] border-border/50 bg-secondary/10 p-8 flex items-center justify-between group hover:bg-secondary/20 transition-all border group-hover:border-primary/20"
                >
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-card border border-border/50 shadow-inner group-hover:border-primary/40 transition-colors">
                            <Activity className={`h-6 w-6 ${idx === 0 ? 'text-primary' : idx === 1 ? 'text-emerald-500' : 'text-red-500'}`} />
                        </div>
                        <div>
                            <h4 className="text-xl font-black italic uppercase tracking-tighter leading-none">{phase.name} Phase</h4>
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-2 block opacity-40">Match Segment Performance</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-12 pr-6">
                        <div className="flex flex-col items-end">
                            <span className="text-3xl font-black italic tracking-tighter leading-none text-primary">{phase.rr}</span>
                            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mt-1.5 opacity-60">Run Rate</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-3xl font-black italic tracking-tighter leading-none text-foreground">{phase.wickets}</span>
                            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mt-1.5 opacity-60">Wickets</span>
                        </div>
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-3xl font-black italic tracking-tighter leading-none text-muted-foreground/40">{phase.boundaries}</span>
                            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mt-1.5 opacity-60">4s/6s</span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
}
