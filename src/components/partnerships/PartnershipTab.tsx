import React, { useState, useMemo } from 'react';
import { usePlayerPartnerships } from "@/hooks/useAnalytics";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine
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
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Users2, Trophy, Zap, Clock, Globe } from "lucide-react";
import { getFlag } from "@/lib/countryFlags";
import { cn } from "@/lib/utils";

interface PartnershipTabProps {
  playerId: string;
  playerName: string;
  initialFormat?: string;
}

export default function PartnershipTab({ playerId, playerName, initialFormat }: PartnershipTabProps) {
  const [format, setFormat] = useState<'T20I' | 'ODI' | 'Test'>(
    (initialFormat === 'ODI' || initialFormat === 'Test' || initialFormat === 'T20I') 
      ? initialFormat 
      : 'T20I'
  );
  const [sortKey, setSortKey] = useState<'total_runs' | 'run_rate' | 'innings_together' | 'highest_stand'>('total_runs');
  const [minInnings, setMinInnings] = useState<number>(3);
  const [showTop, setShowTop] = useState<number>(10);

  const { data, isLoading } = usePlayerPartnerships(playerId, format, 40);

  // Derived Values
  const partnerships = useMemo(() => {
    if (!data) return [];
    
    const processed = (data as any[]).map(p => ({
      ...p,
      partner: p.batter1_id === playerId ? p.b2 : p.b1,
    }));

    const filtered = processed.filter(p => p.innings_together >= minInnings);
    
    return filtered.sort((a, b) => {
      const valA = (a as any)[sortKey] ?? 0;
      const valB = (b as any)[sortKey] ?? 0;
      return valB - valA;
    });
  }, [data, playerId, sortKey, minInnings]);

  const stats = useMemo(() => {
    if (!partnerships.length) return null;
    
    const bestStand = partnerships.reduce((max, p) => p.highest_stand > max.highest_stand ? p : max, partnerships[0]);
    const mostFrequent = [...partnerships].sort((a, b) => b.innings_together - a.innings_together)[0];
    const totalCount = partnerships.length;
    const avgRR = partnerships.reduce((sum, p) => sum + (p.run_rate ?? 0), 0) / (totalCount || 1);

    return { bestStand, mostFrequent, totalCount, avgRR };
  }, [partnerships]);

  if (isLoading) return <PartnershipSkeleton />;

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-3">📭</span>
        <p className="text-sm text-muted-foreground">No {format} partnership data archived</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-8 pb-10"
    >
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Partnership Records</h2>
          <p className="text-2xl font-black italic tracking-tight uppercase">Dynamic Duos</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
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
          <div className="flex items-center gap-3 bg-muted px-4 py-1.5 rounded-xl border border-border/10">
              <span className="text-[9px] font-black uppercase text-muted-foreground whitespace-nowrap">Min Innings: {minInnings}</span>
              <Slider 
                value={[minInnings]} 
                onValueChange={(v) => setMinInnings(v[0])} 
                max={15} 
                min={1} 
                step={1} 
                className="w-24"
              />
          </div>
        </div>
      </div>

      {/* --- HL STATS --- */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="bg-gradient-to-br from-primary/10 via-card to-card border-none rounded-[2.5rem] shadow-xl p-8 group relative overflow-hidden">
            <Trophy className="absolute right-[-10%] bottom-[-10%] h-32 w-32 text-primary opacity-10 group-hover:rotate-[-20deg] transition-all duration-700" />
            <div className="relative z-10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Best Stand</span>
                <span className="text-2xl">{getFlag(stats.bestStand.partner?.country)}</span>
              </div>
              <div>
                <span className="text-4xl font-black tracking-tighter italic text-primary">{stats.bestStand.highest_stand}</span>
                <span className="text-xs font-bold ml-1 uppercase">Runs</span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-tight">With {stats.bestStand.partner?.name}</p>
                <p className="text-[10px] font-black uppercase text-muted-foreground/40 mt-0.5 tracking-[0.2em]">{stats.bestStand.partner?.country}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-card border border-border rounded-[2.5rem] shadow-sm p-8 group relative overflow-hidden">
             <Clock className="absolute right-[-10%] bottom-[-10%] h-32 w-32 text-muted-foreground/5" />
             <div className="relative z-10 space-y-3">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2 block">Most Frequent</span>
               <div>
                  <span className="text-4xl font-black tracking-tighter italic">{stats.mostFrequent.innings_together}</span>
                  <span className="text-xs font-bold ml-1 uppercase">Innings</span>
               </div>
               <div>
                 <p className="text-xs font-bold uppercase tracking-tight">with {stats.mostFrequent.partner?.name}</p>
                 <div className="flex items-center gap-2 mt-1">
                   <div className="px-2 py-0.5 rounded-full bg-muted text-[8px] font-black uppercase border border-border/10 tracking-widest">
                     {stats.mostFrequent.total_runs} Total Runs
                   </div>
                 </div>
               </div>
             </div>
          </Card>

          <Card className="bg-card border border-border rounded-[2.5rem] shadow-sm p-8 relative overflow-hidden">
            <Users2 className="absolute right-[-10%] bottom-[-10%] h-32 w-32 text-muted-foreground/5" />
            <div className="relative z-10 space-y-3">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 block mb-2">Unique Partnerships</span>
               <span className="text-5xl font-black tracking-tighter italic">{stats.totalCount}</span>
               <p className="text-[10px] font-black uppercase text-secondary mt-1 tracking-[0.2em]">In {format} Cricket</p>
            </div>
          </Card>
        </div>
      )}

      {/* --- CHARTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-card overflow-hidden">
          <CardHeader className="pt-10 px-10">
            <CardTitle className="text-sm font-black uppercase tracking-[0.25em] text-muted-foreground/40">Efficiency Scatter</CardTitle>
            <p className="text-[10px] font-bold text-muted-foreground/30 uppercase mt-1 tracking-widest leading-relaxed italic">Innings Frequency vs Scoring Rate</p>
          </CardHeader>
          <CardContent className="px-6 pb-10">
            <div className="h-[280px] w-full relative">
              {/* --- Quadrant Labels --- */}
              <div className="absolute top-4 right-10 pointer-events-none opacity-30">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-green-500">Consistent & Productive</span>
              </div>
              <div className="absolute top-4 left-44 pointer-events-none opacity-30">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-blue-500">Lethal but rare</span>
              </div>
              <div className="absolute bottom-16 right-10 pointer-events-none opacity-30">
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-amber-500">Frequent but slow</span>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" opacity={0.2} />
                  <XAxis 
                    type="number" 
                    dataKey="innings_together" 
                    name="Innings" 
                    axisLine={false} tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 900 }}
                    label={{ value: 'INNINGS TOGETHER', position: 'bottom', fontSize: 8, fontWeight: 900, fill: 'hsl(var(--muted-foreground))', opacity: 0.3 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="run_rate" 
                    name="Run Rate" 
                    axisLine={false} tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 900 }}
                    label={{ value: 'RUN RATE', angle: -90, position: 'left', fontSize: 8, fontWeight: 900, fill: 'hsl(var(--muted-foreground))', opacity: 0.3 }}
                    domain={[0, 'auto']}
                  />
                  <ZAxis type="number" dataKey="total_runs" range={[60, 400]} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-card/95 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl min-w-[200px]">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xl">{getFlag(d.partner?.country)}</span>
                              <span className="text-xs font-black uppercase tracking-tight">{d.partner?.name}</span>
                            </div>
                            <div className="space-y-1.5 border-t border-border/10 pt-2">
                               <p className="text-[10px] font-bold text-muted-foreground flex justify-between">Innings: <span className="text-foreground">{d.innings_together}</span></p>
                               <p className="text-[10px] font-bold text-muted-foreground flex justify-between">Total Runs: <span className="text-primary">{d.total_runs}</span></p>
                               <p className="text-[10px] font-bold text-muted-foreground flex justify-between">Run Rate: <span className="text-secondary">{d.run_rate}</span></p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={stats?.avgRR || 1} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" opacity={0.3} />
                  <Scatter name="Partners" data={partnerships} fill="hsl(var(--primary))" shape="circle" fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-card overflow-hidden">
          <CardHeader className="pt-10 px-10 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-[0.25em] text-muted-foreground/40">Top Contributors</CardTitle>
            <div className="flex gap-1.5 bg-muted p-1 rounded-xl">
               {(['total_runs', 'run_rate', 'innings_together'] as const).map(k => (
                 <Button
                   key={k}
                   variant="ghost"
                   size="sm"
                   className={cn(
                     "h-7 rounded-lg text-[8px] font-black uppercase transition-all px-3",
                     sortKey === k ? "bg-background shadow text-primary" : "text-muted-foreground/50 hover:text-foreground"
                   )}
                   onClick={() => setSortKey(k)}
                 >
                   {k.replace('_', ' ')}
                 </Button>
               ))}
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-10">
            <div className="h-[280px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={partnerships.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted))" opacity={0.2} />
                    <XAxis type="number" axisLine={false} tickLine={false} hide />
                    <YAxis 
                      dataKey="partner.name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9, fontWeight: 900, width: 60 }} 
                      width={100}
                    />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }} content={() => null} />
                    <Bar 
                      dataKey={sortKey} 
                      radius={[0, 10, 10, 0]} 
                      barSize={18} 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.8}
                    />
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- TABLE --- */}
      <Card className="border-none shadow-2xl bg-card rounded-3xl overflow-hidden pt-6">
        <Table>
          <TableHeader className="bg-muted/10 border-b border-border/5">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Partner</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Country</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inn</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Runs</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Highest</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">Run Rate</TableHead>
              <TableHead className="text-center pr-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground">50/100s</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partnerships.map((p, idx) => (
              <TableRow 
                key={p.partner?.id || idx}
                className={cn(
                  "group hover:bg-muted/50 transition-colors border-border/5",
                  p.highest_stand === stats?.bestStand.highest_stand && "bg-primary/[0.03] border-l-4 border-primary"
                )}
              >
                <TableCell className="pl-10 py-5">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getFlag(p.partner?.country)}</span>
                    <span className="font-black tracking-tight group-hover:text-primary transition-colors">{p.partner?.name}</span>
                    {p.highest_stand === stats?.bestStand.highest_stand && <Trophy className="h-3 w-3 text-primary animate-pulse" />}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="text-[10px] font-black text-muted-foreground/60 uppercase racking-widest">{p.partner?.country}</span>
                </TableCell>
                <TableCell className="text-center font-bold text-muted-foreground">{p.innings_together}</TableCell>
                <TableCell className="text-center font-black text-foreground">{p.total_runs}</TableCell>
                <TableCell className="text-center font-black text-secondary italic">
                  {p.highest_stand}
                </TableCell>
                <TableCell className="text-center font-black text-foreground/80 tabular-nums">
                  {Number(p.run_rate || 0).toFixed(2)}
                </TableCell>
                <TableCell className="text-center pr-10 font-bold text-muted-foreground/60">
                   {p.fifty_stands}/{p.hundred_stands}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
}

function PartnershipSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-20 bg-muted rounded-2xl w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="h-44 bg-muted rounded-[2.5rem]" />
        <div className="h-44 bg-muted rounded-[2.5rem]" />
        <div className="h-44 bg-muted rounded-[2.5rem]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-muted rounded-[2.5rem]" />
        <div className="h-80 bg-muted rounded-[2.5rem]" />
      </div>
      <div className="h-96 bg-muted rounded-3xl" />
    </div>
  );
}
