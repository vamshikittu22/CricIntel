import { useState, useMemo } from "react";
import { 
  History, Search, Filter, ArrowUpRight, 
  ChevronDown, ChevronUp, User, Shield, Zap, Target
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchDelivery } from "@/hooks/useAnalytics";
import { motion, AnimatePresence } from "framer-motion";

interface MatchBallByBallProps {
  deliveries: MatchDelivery[];
}

export default function MatchBallByBall({ deliveries }: MatchBallByBallProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeInning, setActiveInning] = useState<number>(1);
  const [expandedOvers, setExpandedOvers] = useState<Set<number>>(new Set([0])); // Start with over 0 expanded

  const innings = useMemo(() => Array.from(new Set(deliveries.map(d => d.innings))).sort(), [deliveries]);

  const overGroups = useMemo(() => {
    const inningDeliveries = deliveries.filter(d => d.innings === activeInning);
    const groups: Record<number, MatchDelivery[]> = {};
    inningDeliveries.forEach(d => {
      if (!groups[d.over_number]) groups[d.over_number] = [];
      groups[d.over_number].push(d);
    });
    
    // Sort overs descending if needed, but chronology is usually better
    return Object.entries(groups)
      .sort((a,b) => parseInt(a[0]) - parseInt(b[0]))
      .filter(([over, balls]) => {
        if (!searchTerm) return true;
        const lowTerm = searchTerm.toLowerCase();
        return balls.some(b => 
          b.striker.toLowerCase().includes(lowTerm) || 
          b.bowler.toLowerCase().includes(lowTerm) ||
          b.player_dismissed?.toLowerCase().includes(lowTerm) ||
          (b.runs_off_bat + b.extras).toString() === searchTerm
        );
      });
  }, [deliveries, activeInning, searchTerm]);

  const toggleOver = (over: number) => {
    const next = new Set(expandedOvers);
    if (next.has(over)) next.delete(over);
    else next.add(over);
    setExpandedOvers(next);
  };

  const getBallOutcome = (ball: MatchDelivery) => {
    if (ball.is_wicket) return <span className="text-red-500 font-black">W</span>;
    if (ball.runs_off_bat === 6) return <span className="text-primary font-black">6</span>;
    if (ball.runs_off_bat === 4) return <span className="text-emerald-500 font-black">4</span>;
    if (ball.extras > 0) return <span className="text-blue-500 font-black">{ball.runs_off_bat + ball.extras}EX</span>;
    return <span className="text-muted-foreground font-black opacity-60">{ball.runs_off_bat}</span>;
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12">
        <Tabs value={activeInning.toString()} onValueChange={(v) => setActiveInning(parseInt(v))} className="h-11">
          <TabsList className="bg-secondary/30 rounded-2xl p-1 border border-border/50">
            {innings.map(inn => (
              <TabsTrigger 
                key={inn} 
                value={inn.toString()}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-black px-6 py-2 rounded-xl text-[10px] uppercase tracking-tighter"
              >
                Inning {inn}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full lg:w-96 group">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-1" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search Striker, Bowler or Events..." 
            className="pl-12 h-12 bg-card/40 backdrop-blur-2xl border-border/50 rounded-2xl font-black text-[11px] uppercase tracking-widest focus-visible:ring-primary shadow-2xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-6">
        {overGroups.length === 0 ? (
          <div className="py-40 text-center glass rounded-[3rem] border-dashed border-border/50 opacity-20">
            <Target className="h-16 w-16 mx-auto mb-6" />
            <h3 className="text-xl font-black uppercase tracking-widest">No Sequences Validated</h3>
            <p className="text-[10px] font-bold uppercase mt-2">Try refining your tactical parameters</p>
          </div>
        ) : (
          overGroups.map(([overStr, balls]) => {
            const overNum = parseInt(overStr);
            const isExpanded = expandedOvers.has(overNum);
            const runsInOver = balls.reduce((sum, b) => sum + b.runs_off_bat + b.extras, 0);
            const wicketsInOver = balls.filter(b => b.is_wicket).length;
            const bowler = balls[0]?.bowler || "Operator Unknown";

            return (
              <motion.div 
                key={overStr}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`glass border-border/50 rounded-[2.5rem] overflow-hidden transition-all duration-300 ${isExpanded ? 'bg-secondary/20 shadow-2xl border-primary/20 ring-1 ring-primary/10' : 'hover:bg-secondary/10'}`}
              >
                <div 
                    className="p-6 cursor-pointer flex items-center justify-between group/over"
                    onClick={() => toggleOver(overNum)}
                >
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center justify-center bg-card w-16 h-16 rounded-3xl border border-border/50 shadow-inner group-hover/over:border-primary/40 transition-colors">
                        <span className="text-[10px] font-black uppercase text-muted-foreground leading-none mb-1 opacity-60">Over</span>
                        <span className="text-2xl font-black italic text-foreground tracking-tighter leading-none">{overNum + 1}</span>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <span className="font-black text-sm uppercase italic tracking-tight text-foreground">{bowler}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Strike Operator</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                             {balls.map((b, i) => (
                                <div key={i} className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black shadow-sm border border-border/30 ${b.is_wicket ? 'bg-red-500/10 border-red-500/40 text-red-500' : 'bg-card/40'}`}>
                                    {b.runs_off_bat === 4 ? '4' : b.runs_off_bat === 6 ? '6' : b.is_wicket ? 'W' : b.runs_off_bat + b.extras}
                                </div>
                             ))}
                        </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-10">
                    <div className="text-right flex items-center gap-6 pr-6">
                        <div className="flex flex-col items-end">
                            <span className="text-2xl font-black italic text-primary leading-none tracking-tighter">{runsInOver} <span className="text-xs text-muted-foreground/30 not-italic">/</span> <span className={wicketsInOver > 0 ? 'text-red-500' : 'text-foreground'}>{wicketsInOver}</span></span>
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.3em] mt-1.5 leading-none">Net Over Impact</span>
                        </div>
                        <div className={`p-2 rounded-xl border border-border/50 bg-card transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary border-primary/20' : 'group-hover/over:scale-110'}`}>
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-background/30 backdrop-blur-3xl border-t border-border/50"
                    >
                        <div className="p-8 space-y-4">
                            {balls.map((ball, i) => (
                                <div key={i} className="group/ball p-5 rounded-[2rem] bg-card/20 border border-border/30 hover:bg-card/40 hover:border-primary/30 transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-8">
                                        <div className="w-12 h-12 rounded-2xl bg-secondary/40 flex items-center justify-center text-xs font-black shadow-inner border border-border/30 relative">
                                            <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-lg text-[10px] flex items-center justify-center text-primary-foreground shadow-lg">{ball.ball_number}</span>
                                            {ball.over_number}.{ball.ball_number}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-black uppercase text-foreground">{ball.striker}</span>
                                                <ArrowUpRight className="h-3 w-3 text-muted-foreground/30" />
                                                <span className="text-xs font-black uppercase text-muted-foreground/60">{ball.bowler}</span>
                                            </div>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase mt-2 tracking-widest leading-relaxed">
                                                {ball.is_wicket ? <span className="text-red-500 font-black">STRIKE: {ball.dismissal_kind || 'OUT'} — {ball.player_dismissed}</span> : `${ball.runs_off_bat} runs delivered into the ${ball.phase} orbit`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`text-2xl font-black italic tracking-tighter sm:text-4xl ${ball.is_wicket ? 'text-red-500' : ball.runs_off_bat >= 4 ? 'text-primary' : 'text-foreground opacity-20'}`}>
                                        {ball.is_wicket ? 'W' : ball.runs_off_bat + ball.extras}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
