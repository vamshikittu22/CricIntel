import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchDelivery } from "@/hooks/useAnalytics";
import { motion } from "framer-motion";
import { Users, TrendingUp, Shield, Zap, Target } from "lucide-react";

interface MatchPartnershipsProps {
  deliveries: MatchDelivery[];
}

interface Partnership {
  batter1: string;
  batter2: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  wicket: string | null;
  overStart: number;
  overEnd: number;
}

export default function MatchPartnerships({ deliveries }: MatchPartnershipsProps) {
  const [activeInning, setActiveInning] = useState<number>(1);
  const innings = useMemo(() => Array.from(new Set(deliveries.map(d => d.innings))).sort(), [deliveries]);

  const partnerships = useMemo(() => {
    const inningDeliveries = deliveries.filter(d => d.innings === activeInning);
    const result: Partnership[] = [];
    if (inningDeliveries.length === 0) return result;

    let currentBatter1 = inningDeliveries[0].striker;
    let currentBatter2 = inningDeliveries[0].non_striker;
    let currentRuns = 0;
    let currentBalls = 0;
    let currentFours = 0;
    let currentSixes = 0;
    let overStart = inningDeliveries[0].over_number;

    inningDeliveries.forEach((d, idx) => {
      currentRuns += d.runs_off_bat + d.extras;
      currentBalls++;
      if (d.runs_off_bat === 4) currentFours++;
      if (d.runs_off_bat === 6) currentSixes++;

      if (d.is_wicket || idx === inningDeliveries.length - 1) {
        result.push({
          batter1: currentBatter1,
          batter2: currentBatter2,
          runs: currentRuns,
          balls: currentBalls,
          fours: currentFours,
          sixes: currentSixes,
          wicket: d.is_wicket ? d.player_dismissed : null,
          overStart,
          overEnd: d.over_number
        });

        if (idx < inningDeliveries.length - 1) {
          const nextBall = inningDeliveries[idx + 1];
          currentBatter1 = nextBall.striker;
          currentBatter2 = nextBall.non_striker;
          currentRuns = 0;
          currentBalls = 0;
          currentFours = 0;
          currentSixes = 0;
          overStart = nextBall.over_number;
        }
      }
    });

    return result.sort((a, b) => b.runs - a.runs);
  }, [deliveries, activeInning]);

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {partnerships.map((p, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="glass rounded-[3rem] border-border/50 bg-card/40 overflow-hidden shadow-2xl group hover:border-primary/30 transition-all duration-500">
                <div className="p-8 border-b border-border/10 bg-gradient-to-br from-primary/5 to-transparent relative">
                     <span className="absolute top-8 right-8 text-4xl font-black italic text-foreground/5 pointer-events-none uppercase">#{idx + 1}</span>
                     <div className="flex items-center gap-3 mb-6">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em]">Alliance Formed</span>
                     </div>
                     <div className="flex flex-col gap-2">
                        <h4 className="text-xl font-black italic tracking-tighter uppercase leading-none group-hover:text-primary transition-colors">{p.batter1}</h4>
                        <span className="text-[9px] font-black uppercase text-muted-foreground opacity-40">&</span>
                        <h4 className="text-xl font-black italic tracking-tighter uppercase leading-none">{p.batter2}</h4>
                     </div>
                </div>
                <div className="p-8 space-y-6 bg-secondary/10">
                    <div className="flex justify-between items-end border-b border-border/10 pb-6">
                        <div className="flex flex-col">
                            <span className="text-4xl font-black italic text-primary leading-none tracking-tighter">{p.runs}</span>
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-2">{p.balls} balls faced</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-xl font-black tracking-tighter text-foreground mb-1">{(p.runs / (p.balls || 1) * 100).toFixed(1)}</span>
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">SR Index</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-card border border-border/50 flex flex-col items-center">
                            <span className="text-sm font-black text-foreground">{p.fours}</span>
                            <span className="text-[8px] font-black uppercase text-muted-foreground mt-1">Boundaries</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-card border border-border/50 flex flex-col items-center">
                            <span className="text-sm font-black text-primary">{p.sixes}</span>
                            <span className="text-[8px] font-black uppercase text-muted-foreground mt-1">Maximums</span>
                        </div>
                    </div>
                    <div className="pt-4 flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                         <span>Overs {p.overStart + 1} - {p.overEnd + 1}</span>
                         {p.wicket && <Badge className="bg-red-500/10 text-red-500 border-none px-3 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter">Broken by {p.wicket}</Badge>}
                    </div>
                </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
