import React, { useState, useMemo } from 'react';
import { useBattingPosition } from "@/hooks/useAnalytics";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Cell
} from 'recharts';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ListOrdered, TrendingUp, Zap, Target, History, Trophy, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface BattingPositionTabProps {
  playerId: string;
  playerName: string;
  initialFormat?: string;
}

type Metric = 'batting_avg' | 'strike_rate' | 'total_runs' | 'innings';

export default function BattingPositionTab({ playerId, playerName, initialFormat }: BattingPositionTabProps) {
  const [format, setFormat] = useState<'T20I' | 'ODI' | 'Test'>(
    (initialFormat === 'ODI' || initialFormat === 'Test' || initialFormat === 'T20I') 
      ? initialFormat 
      : 'T20I'
  );
  const [metric, setMetric] = useState<Metric>('batting_avg');
  const [minInnings, setMinInnings] = useState<number>(3);

  const { data, isLoading } = useBattingPosition(playerId, format);

  // Derived values
  const derived = useMemo(() => {
    if (!data || data.length === 0) return null;

    const primary = [...data].sort((a, b) => b.innings - a.innings)[0];
    const qualified = data.filter(p => p.innings >= minInnings);
    const mostProductive = [...qualified].sort((a, b) => (b.batting_avg ?? 0) - (a.batting_avg ?? 0))[0] 
                           || [...data].sort((a, b) => (b.batting_avg ?? 0) - (a.batting_avg ?? 0))[0];
    
    const positions = data.map(p => p.position);
    const range = `#${Math.min(...positions)} – #${Math.max(...positions)}`;
    
    const careerMetricAvg = data.reduce((s, d) => s + (d[metric] ?? 0), 0) / data.length;

    // Fill all 1-11 positions for chart
    const fullChartData = Array.from({ length: 11 }, (_, i) => {
      const pos = i + 1;
      const found = data.find(p => p.position === pos);
      return found ? { ...found } : { position: pos, [metric]: 0, innings: 0, placeholder: true };
    });

    return { primary, mostProductive, range, careerMetricAvg, fullChartData };
  }, [data, format, metric, minInnings]);

  const metrics: { id: Metric, label: string, icon: any }[] = [
    { id: 'batting_avg', label: 'Average', icon: Trophy },
    { id: 'strike_rate', label: 'Strike Rate', icon: Zap },
    { id: 'total_runs', label: 'Total Runs', icon: TrendingUp },
    { id: 'innings', label: 'Innings', icon: History }
  ];

  if (isLoading) return <PositionSkeleton />;

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-3">📭</span>
        <p className="text-sm text-muted-foreground">No {format} position data available</p>
      </div>
    );
  }

  return ( derived && (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-8 pb-10"
    >
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Stats by Position</h2>
          <p className="text-2xl font-black italic tracking-tight uppercase">Batting Position</p>
        </div>
        
        <div className="flex bg-muted p-1 rounded-xl">
          {(['T20I', 'ODI', 'Test'] as const).map(f => (
            <Button
              key={f}
              variant="ghost"
              size="sm"
              className={cn(
                "rounded-lg px-4 font-bold text-[10px] uppercase tracking-wider h-8 transition-all",
                format === f ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
              )}
              onClick={() => setFormat(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* --- SUMMARY BADGES --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border-2 border-primary/20 p-6 rounded-[2rem] flex items-center justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-1 block">Primary Role</span>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black italic text-primary">#{derived.primary.position}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-tight">Main Slot</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{derived.primary.innings} Innings here</p>
              </div>
            </div>
          </div>
          <Target className="h-10 w-10 text-primary opacity-20 absolute -right-2 -bottom-2 group-hover:scale-125 transition-transform" />
        </div>

        <div className="bg-card border border-border p-6 rounded-[2rem] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1 block">Order Range</span>
            <span className="text-3xl font-black italic uppercase tracking-tighter">{derived.range}</span>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Versatility across {data.length} slots</p>
          </div>
          <ListOrdered className="h-10 w-10 text-muted-foreground/10" />
        </div>

        <div className="bg-card border-2 border-green-500/20 p-6 rounded-[2rem] flex items-center justify-between relative group shadow-sm shadow-green-500/5">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500/60 mb-1 block">Most Productive</span>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black italic text-green-500">#{derived.mostProductive.position}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-tight text-green-600">{derived.mostProductive.batting_avg} AVG</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Best in {format}</p>
              </div>
            </div>
          </div>
          <Trophy className="h-10 w-10 text-green-500 opacity-20 absolute -right-2 -bottom-2 group-hover:rotate-12 transition-transform" />
        </div>
      </div>

      {/* --- CHART SECTION --- */}
      <Card className="rounded-[2.5rem] border-none shadow-2xl bg-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4 pt-10 px-10">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/40">Performance across 1-11</CardTitle>
          <div className="flex gap-1.5 bg-muted p-1 rounded-xl">
             {metrics.map(m => (
               <Button
                 key={m.id}
                 variant="ghost"
                 size="sm"
                 className={cn(
                   "h-8 rounded-lg text-[9px] px-3 font-bold uppercase transition-all",
                   metric === m.id ? "bg-background shadow-md text-primary" : "text-muted-foreground/60 hover:text-foreground"
                 )}
                 onClick={() => setMetric(m.id)}
               >
                 <m.icon className="h-3 w-3 mr-1.5" />
                 {m.label}
               </Button>
             ))}
          </div>
        </CardHeader>
        <CardContent className="px-10 pb-10">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={derived.fullChartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" opacity={0.3} />
                <XAxis 
                  dataKey="position" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 800 }}
                  label={{ value: 'POSITION', position: 'insideBottom', offset: -5, fontSize: 9, fontWeight: 900, fill: 'hsl(var(--muted-foreground))', opacity: 0.3 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      if (!d.innings) return null;
                      return (
                        <div className="bg-card/90 backdrop-blur-xl border border-border p-5 rounded-2xl shadow-2xl space-y-3 min-w-[200px]">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-primary tracking-widest">POSITION #{d.position}</span>
                            <span className="px-2 py-0.5 rounded bg-primary/10 text-[9px] font-black uppercase text-primary">QUALIFIED</span>
                          </div>
                          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                            <div><p className="text-[9px] font-bold text-muted-foreground uppercase">Innings</p><p className="text-sm font-black italic">{d.innings}</p></div>
                            <div><p className="text-[9px] font-bold text-muted-foreground uppercase">Not Outs</p><p className="text-sm font-black italic">{d.not_outs}</p></div>
                            <div><p className="text-[9px] font-bold text-muted-foreground uppercase">Average</p><p className="text-sm font-black italic text-secondary">{d.batting_avg || '—'}</p></div>
                            <div><p className="text-[9px] font-bold text-muted-foreground uppercase">Strike Rate</p><p className="text-sm font-black italic">{d.strike_rate || '—'}</p></div>
                            <div><p className="text-[9px] font-bold text-muted-foreground uppercase">Runs</p><p className="text-sm font-black italic">{d.total_runs}</p></div>
                            <div><p className="text-[9px] font-bold text-muted-foreground uppercase">100 / 50</p><p className="text-sm font-black italic">{d.hundreds}/{d.fifties}</p></div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine 
                  y={derived.careerMetricAvg} 
                  stroke="hsl(var(--primary))" 
                  strokeDasharray="4 2" 
                  opacity={0.4}
                />
                <Bar dataKey={metric} radius={[12, 12, 12, 12]} barSize={40}>
                  {derived.fullChartData.map((entry, index) => {
                    const isPrimary = entry.position === derived.primary.position;
                    const hasNoData = !entry.innings;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isPrimary ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} 
                        fillOpacity={hasNoData ? 0.05 : isPrimary ? 1 : 0.2}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* --- TABLE --- */}
      <Card className="border-none shadow-2xl bg-card rounded-3xl overflow-hidden pt-6">
        <Table>
          <TableHeader className="bg-muted/10 border-b border-border/5">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-20">POS</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inn</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Runs</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Avg</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">SR</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">HS</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">50/100</TableHead>
              <TableHead className="text-center pr-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ducks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.sort((a,b) => a.position - b.position).map((p) => {
              const isPrimary = p.position === derived.primary.position;
              return (
                <TableRow 
                  key={p.position}
                  className={cn(
                    "group hover:bg-muted/50 transition-colors border-border/5",
                    isPrimary && "bg-primary/[0.03] border-l-4 border-primary"
                  )}
                >
                  <TableCell className="pl-10 py-5">
                    <span className={cn("text-xl font-black italic", isPrimary ? "text-primary" : "text-muted-foreground/40")}>#{p.position}</span>
                  </TableCell>
                  <TableCell className="text-center font-bold text-foreground">{p.innings}</TableCell>
                  <TableCell className="text-center font-black text-foreground">{p.total_runs}</TableCell>
                  <TableCell className="text-center font-black text-secondary">{p.batting_avg || '—'}</TableCell>
                  <TableCell className="text-center font-bold text-muted-foreground/60">{p.strike_rate || '—'}</TableCell>
                  <TableCell className="text-center font-bold text-muted-foreground/60">{p.total_runs > 0 ? 'N/A' : '—'}</TableCell>
                  <TableCell className="text-center font-bold text-muted-foreground/60">{p.fifties}/{p.hundreds}</TableCell>
                  <TableCell className="text-center pr-10">
                    <span className={cn("font-bold", p.ducks > 2 ? "text-red-500" : "text-muted-foreground/30")}>{p.ducks}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* --- INSIGHT TEXT --- */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        className="p-8 bg-muted/20 border border-border/30 rounded-[2rem] flex flex-col md:flex-row items-center gap-6"
      >
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Info className="h-6 w-6" />
        </div>
        <div className="text-center md:text-left">
          <p className="text-lg text-foreground font-medium italic">
            "{playerName} is most effective batting at <span className="text-primary font-black ml-1">#{derived.primary.position}</span>, 
            where they have played {derived.primary.innings} innings in {format}. 
            {derived.primary.position === derived.mostProductive.position 
              ? ` This is also their most productive slot with an average of ${derived.primary.batting_avg}.`
              : ` However, their statistics peak at #${derived.mostProductive.position} with a superior average of ${derived.mostProductive.batting_avg}.`
            }
            {data.length > 4 && " Their versatility is evident from contributions across a wide range of batting positions."}"
          </p>
        </div>
      </motion.div>
    </motion.div>
  )) || null;
}

function PositionSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-20 bg-muted rounded-2xl w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-32 bg-muted rounded-[2rem]" />
        <div className="h-32 bg-muted rounded-[2rem]" />
        <div className="h-32 bg-muted rounded-[2rem]" />
      </div>
      <div className="h-80 bg-muted rounded-[2.5rem]" />
      <div className="h-96 bg-muted rounded-3xl" />
    </div>
  );
}
