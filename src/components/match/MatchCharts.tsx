import { useMemo } from "react";
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, AreaChart, Area, BarChart, Bar, Legend, 
  ComposedChart, Scatter, LabelList, Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchDelivery, OverSummary, MatchDetail } from "@/hooks/useAnalytics";
import { motion } from "framer-motion";
import { TrendingUp, Activity, BarChart3, ScatterChart } from "lucide-react";

interface MatchChartsProps {
  deliveries: MatchDelivery[];
  match: MatchDetail;
}

export default function MatchCharts({ deliveries, match }: MatchChartsProps) {
  // Derive over-by-over summaries
  const overByOverData = useMemo(() => {
    const inningsData: Record<number, OverSummary[]> = {};
    const individualInnings = Array.from(new Set(deliveries.map(d => d.innings))).sort();

    individualInnings.forEach(inningNum => {
      const inningDeliveries = deliveries.filter(d => d.innings === inningNum);
      const overs = Array.from(new Set(inningDeliveries.map(d => d.over_number))).sort((a,b) => a-b);
      
      let cumulativeRuns = 0;
      let cumulativeWickets = 0;
      
      inningsData[inningNum] = overs.map(overNum => {
        const overDeliveries = inningDeliveries.filter(d => d.over_number === overNum);
        const runs = overDeliveries.reduce((sum, d) => sum + d.runs_off_bat + d.extras, 0);
        const wickets = overDeliveries.filter(d => d.is_wicket).length;
        
        cumulativeRuns += runs;
        cumulativeWickets += wickets;
        
        return {
          overNumber: overNum + 1,
          innings: inningNum,
          runs,
          wickets,
          deliveries: overDeliveries,
          bowler: overDeliveries[0]?.bowler || "Unknown",
          cumulativeRuns,
          cumulativeWickets
        };
      });
    });
    return inningsData;
  }, [deliveries]);

  // Chart 1: Worm Chart Data
  const wormData = useMemo(() => {
    const maxOvers = Math.max(...Object.values(overByOverData).map(overs => overs.length), 1);
    const data = [];
    for (let i = 1; i <= maxOvers; i++) {
      const entry: any = { over: i };
      Object.entries(overByOverData).forEach(([inning, overs]) => {
        const overData = overs.find(o => o.overNumber === i);
        if (overData) {
          entry[`inning${inning}`] = overData.cumulativeRuns;
          if (overData.wickets > 0) entry[`inning${inning}Wicket`] = overData.cumulativeRuns;
        }
      });
      data.push(entry);
    }
    return data;
  }, [overByOverData]);

  const colors = ["#256af4", "#f43f5e", "#10b981", "#f59e0b"];

  return (
    <div className="space-y-12">
      {/* Worm & Momentum Trajectory */}
      <Card className="glass rounded-[3rem] border-border/50 overflow-hidden bg-card/60 backdrop-blur-3xl shadow-2xl">
        <CardHeader className="p-10 border-b border-border/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mb-1">Innings Comparison</CardTitle>
                <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Run Progression</h3>
              </div>
            </div>
            <div className="flex gap-4">
                {Object.keys(overByOverData).map((inning, idx) => (
                    <div key={inning} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx] }} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Inning {inning}</span>
                    </div>
                ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10">
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wormData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.1)" vertical={false} />
                <XAxis 
                    dataKey="over" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: "900", fill: "hsl(var(--muted-foreground) / 0.5)" }} 
                />
                <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: "900", fill: "hsl(var(--muted-foreground) / 0.5)" }} 
                />
                <Tooltip 
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "1.25rem", backdropFilter: "blur(20px)", boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                    labelStyle={{ display: "none" }}
                    itemStyle={{ fontSize: "10px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em" }}
                />
                {Object.keys(overByOverData).map((inning, idx) => (
                  <Line 
                    key={inning}
                    type="monotone" 
                    dataKey={`inning${inning}`} 
                    name={`Inning ${inning}`}
                    stroke={colors[idx]} 
                    strokeWidth={4} 
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0, fill: colors[idx] }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Runs Per Over */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Object.entries(overByOverData).slice(0, 2).map(([inning, overs], idx) => (
          <Card key={inning} className="glass rounded-[3rem] border-border/50 bg-card/40 overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-border/50 bg-gradient-to-r from-secondary/30 to-transparent">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Inning {inning}</h3>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.1)" vertical={false} />
                    <XAxis 
                        dataKey="overNumber" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 9, fontWeight: "900", fill: "hsl(var(--muted-foreground) / 0.4)" }} 
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 9, fontWeight: "900", fill: "hsl(var(--muted-foreground) / 0.4)" }} 
                    />
                    <Tooltip 
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "1rem" }}
                        itemStyle={{ fontSize: "10px", fontWeight: "900", textTransform: "uppercase" }}
                    />
                    <Bar dataKey="runs" name="Runs" radius={[4, 4, 0, 0]}>
                      {overs.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={entry.wickets > 0 ? "#f43f5e" : colors[idx % colors.length]} 
                            fillOpacity={entry.runs > 10 ? 1 : 0.6}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
