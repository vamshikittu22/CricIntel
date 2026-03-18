import React, { useState, useMemo, useEffect } from 'react';
import { 
  useBatterVsAllBowlers, 
  useBowlerVsAllBatters, 
  useBowlerDismissalKinds 
} from "@/hooks/useAnalytics";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart,
  Pie,
  Cell,
  Legend
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Target, Crosshair, PieChart as PieIcon, TrendingUp, UserMinus, ShieldAlert } from "lucide-react";
import { getFlag } from "@/lib/countryFlags";
import { cn } from "@/lib/utils";

interface H2HDashboardProps {
  playerId: string;
  playerName: string;
  initialFormat?: string;
  initialView?: 'nemesis' | 'victims';
  onViewChange?: (view: 'nemesis' | 'victims') => void;
}

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function H2HDashboard({ 
  playerId, 
  playerName, 
  initialFormat, 
  initialView = 'nemesis',
  onViewChange 
}: H2HDashboardProps) {
  const [format, setFormat] = useState<'T20I' | 'ODI' | 'Test'>(
    (initialFormat === 'ODI' || initialFormat === 'Test' || initialFormat === 'T20I') 
      ? initialFormat 
      : 'T20I'
  );
  
  const [view, setView] = useState<'nemesis' | 'victims'>(initialView);

  // Sync state with props if they change externally (e.g. via navigation)
  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  const handleViewChange = (newView: 'nemesis' | 'victims') => {
    setView(newView);
    if (onViewChange) onViewChange(newView);
  };

  const { data: nemesisData, isLoading: loadingNemesis } = useBatterVsAllBowlers(playerId, format, 4);
  const { data: victimsData, isLoading: loadingVictims } = useBowlerVsAllBatters(playerId, format, 4);
  const { data: dismissalKinds, isLoading: loadingDismissals } = useBowlerDismissalKinds(playerId, format);

  const activeData = useMemo(() => {
    const rawData = view === 'nemesis' ? nemesisData : victimsData;
    if (!rawData) return null;
    return [...rawData].sort((a: any, b: any) => {
      if (b.dismissals !== a.dismissals) return b.dismissals - a.dismissals;
      return b.balls - a.balls;
    });
  }, [view, nemesisData, victimsData]);

  const headlines = useMemo(() => {
    if (!activeData || activeData.length === 0) return null;
    
    const top = activeData[0];
    const avgBalls = activeData.reduce((s: number, d: any) => s + (d.balls || 0), 0) / activeData.length;
    const totalDismissals = activeData.reduce((s: number, d: any) => s + (d.dismissals || 0), 0);
    
    return { top, avgBalls, totalDismissals };
  }, [activeData]);

  if (loadingNemesis || loadingVictims) return <H2HSkeleton />;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-8 pb-10"
    >
      {/* ── HEADER & TOGGLE ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-8 rounded-3xl border border-border shadow-sm">
        <div className="flex items-center gap-5">
           <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 animate-in zoom-in duration-500">
             <Swords className="h-8 w-8" />
           </div>
           <div>
             <h2 className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/60 mb-1">Head to Head</h2>
             <p className="text-3xl font-black italic tracking-tight uppercase">H2H Records</p>
           </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={view} onValueChange={(v: any) => handleViewChange(v)} className="bg-muted p-1 rounded-2xl h-12 shadow-inner border border-border/10">
            <TabsList className="bg-transparent h-full">
              <TabsTrigger value="nemesis" className="rounded-xl px-6 h-full font-black text-[10px] uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all">
                <ShieldAlert className="h-3 w-3 mr-2" />
                Batting H2H
              </TabsTrigger>
              <TabsTrigger value="victims" className="rounded-xl px-6 h-full font-black text-[10px] uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-green-500 transition-all">
                <Target className="h-3 w-3 mr-2" />
                Bowling H2H
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex bg-muted p-1 rounded-2xl h-12 border border-border/10 ml-2">
            {(['T20I', 'ODI', 'Test'] as const).map(f => (
              <Button
                key={f}
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-xl px-6 h-full font-black text-[10px] uppercase tracking-wider transition-all",
                  format === f ? "bg-background shadow-md text-secondary" : "text-muted-foreground/50 hover:text-foreground"
                )}
                onClick={() => setFormat(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* ── SUMMARY STATS ─────────────────────────────────────────────────── */}
      {headlines && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={cn(
            "rounded-[2.5rem] border-none shadow-xl p-8 group relative overflow-hidden h-48",
            view === 'nemesis' ? "bg-gradient-to-br from-red-500/10 to-card" : "bg-gradient-to-br from-green-500/10 to-card"
          )}>
            <div className="relative z-10 flex flex-col justify-between h-full">
               <div className="flex justify-between items-start">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{view === 'nemesis' ? 'Most Dismissals By' : 'Most Wickets Against'}</span>
                  <span className="text-3xl filter drop-shadow-md">{getFlag(headlines.top.players?.country)}</span>
               </div>
               <div>
                  <h4 className="text-xl font-black italic uppercase italic tracking-tight mb-1">{headlines.top.players?.name}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                    Out {headlines.top.dismissals} times in {headlines.top.balls || 0} balls
                  </p>
               </div>
            </div>
            <div className="absolute right-[-15%] bottom-[-20%] opacity-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-1000">
               {view === 'nemesis' ? <UserMinus className="h-48 w-48 text-red-500" /> : <Crosshair className="h-48 w-48 text-green-500" />}
            </div>
          </Card>

          <Card className="rounded-[2.5rem] bg-card border border-border/50 shadow-sm p-8 h-48 flex flex-col justify-between">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 shrink-0 mb-4 block">Total Dismissals</span>
             <div className="flex items-end gap-3">
               <span className="text-5xl font-black tabular-nums tracking-tighter italic text-foreground">
                 {headlines.totalDismissals}
               </span>
               <span className="text-[10px] font-black uppercase text-secondary mb-2 tracking-[0.2em]">Dismissals</span>
             </div>
             <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-2">
                <div className="h-full bg-secondary w-2/3" />
             </div>
          </Card>

          <Card className="rounded-[2.5rem] bg-card border border-border/50 shadow-sm p-8 h-48 flex flex-col justify-between relative overflow-hidden group">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 block mb-4">Average Balls per Dismissal</span>
             <span className="text-5xl font-black tabular-nums tracking-tighter italic text-foreground/80">
               {Math.round(headlines.avgBalls)}
             </span>
             <div className="bg-muted px-4 py-1.5 rounded-xl border border-border/20 text-[9px] font-bold uppercase w-fit mt-2 group-hover:bg-primary/5 transition-colors">
               Samples: {activeData?.length} rivals
             </div>
             <TrendingUp className="h-10 w-10 text-muted-foreground/10 absolute right-8 bottom-8" />
          </Card>
        </div>
      )}

      {/* ── CHARTS ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* H2H Chart: Dismissal Dominance */}
        <Card className="rounded-[3rem] border-none shadow-2xl bg-card overflow-hidden">
          <CardHeader className="pt-10 px-10">
            <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/40 leading-relaxed">
              Head to Head Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-10">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeData?.slice(0, 8)} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" opacity={0.3} />
                  <XAxis 
                    dataKey="players.name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9, fontWeight: 900 }}
                    tickFormatter={(val) => val.split(' ').pop()} 
                  />
                  <YAxis 
                    axisLine={false} tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                    content={({ active, payload }) => {
                       if (active && payload && payload.length) {
                         const d = payload[0].payload;
                         return (
                           <div className="bg-card/90 backdrop-blur-xl border border-border p-4 rounded-xl shadow-2xl min-w-[160px]">
                             <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-2 italic">#{d.players?.name}</p>
                             <div className="space-y-1">
                                <p className="text-[10px] font-bold text-muted-foreground flex justify-between">DIS: <span className="text-foreground">{d.dismissals}</span></p>
                                <p className="text-[10px] font-bold text-muted-foreground flex justify-between">BALLS: <span className="text-foreground">{d.balls}</span></p>
                                <p className="text-[10px] font-bold text-muted-foreground flex justify-between">AVERAGE: <span className="text-secondary font-black">{d.batting_avg || '—'}</span></p>
                             </div>
                           </div>
                         );
                       }
                       return null;
                    }}
                  />
                  <Bar dataKey="dismissals" radius={[10, 10, 10, 10]} barSize={32}>
                    {(activeData?.slice(0, 8) || []).map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={view === 'nemesis' ? '#ef4444' : '#10b981'} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Dismissal Type Chart (Only for Bowler View) */}
        <Card className="rounded-[3rem] border-none shadow-2xl bg-card overflow-hidden">
          <CardHeader className="pt-10 px-10 flex flex-row items-center justify-between">
             <div>
               <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground/40 leading-relaxed">
                 Mode of Dismissal
               </CardTitle>
               <p className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest italic">{view === 'nemesis' ? 'How rivals get them out' : 'How they get victims out'}</p>
             </div>
             <PieIcon className="h-5 w-5 text-muted-foreground/20" />
          </CardHeader>
          <CardContent className="px-6 pb-10">
            <div className="h-[320px] w-full">
              {loadingDismissals ? (
                <div className="h-full flex items-center justify-center"><Skeleton className="h-48 w-48 rounded-full" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dismissalKinds || []}
                      cx="50%" cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={8}
                      dataKey="count"
                      nameKey="kind"
                      stroke="none"
                    >
                      {(dismissalKinds || []).map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.9} stroke="hsl(var(--card))" strokeWidth={4} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '16px', border: '1px solid hsl(var(--border))', fontSize: '10px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend 
                      verticalAlign="bottom" align="center" 
                      wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', paddingBottom: '20px' }} 
                      iconType="circle"
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── FULL BREAKDOWN TABLE ────────────────────────────────────────── */}
      <Card className="border-none shadow-2xl bg-card rounded-[3rem] overflow-hidden pt-8">
        <div className="px-10 pb-6">
           <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/50">Full Matchup Database</h3>
        </div>
        <Table>
          <TableHeader className="bg-muted/10 border-b border-border/5">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-12 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Rival</TableHead>
              <TableHead className="text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground">Country</TableHead>
              <TableHead className="text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground">Dismissals</TableHead>
              <TableHead className="text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground">Balls</TableHead>
              <TableHead className="text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground">Runs</TableHead>
              <TableHead className="text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground">Avg</TableHead>
              <TableHead className="text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground">SR</TableHead>
              <TableHead className="text-center pr-12 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Last Encounter</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(activeData || []).map((d: any, index: number) => {
              const rival = d.players;
              return (
                <TableRow 
                  key={rival?.id || index}
                  className="group hover:bg-muted/40 transition-colors border-border/5"
                >
                  <TableCell className="pl-12 py-6">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl filter drop-shadow-sm group-hover:scale-125 transition-transform duration-500">{getFlag(rival?.country)}</span>
                      <span className="font-black italic tracking-tighter text-lg uppercase transition-colors group-hover:text-primary">{rival?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                     <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{rival?.country || '—'}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "font-black text-xl tabular-nums rounded-xl px-4 py-2",
                      view === 'nemesis' ? (d.dismissals > 5 ? "bg-red-500/10 text-red-500" : "text-foreground") : (d.dismissals > 5 ? "bg-green-500/10 text-green-500" : "text-foreground")
                    )}>
                      {d.dismissals}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-bold text-muted-foreground/60">{d.balls}</TableCell>
                  <TableCell className="text-center font-black text-foreground">{d.runs}</TableCell>
                  <TableCell className={cn("text-center font-black", (d.batting_avg || 0) > 40 ? "text-green-500" : "text-secondary")}>
                    {d.batting_avg || '—'}
                  </TableCell>
                  <TableCell className="text-center font-bold text-muted-foreground/60 tabular-nums">
                    {d.strike_rate || '—'}
                  </TableCell>
                  <TableCell className="text-center pr-12 text-[10px] font-black uppercase text-muted-foreground/30 tracking-widest">
                    {d.last_encounter ? new Date(d.last_encounter).getFullYear() : 'N/A'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* H2H Logic Note */}
      <div className="p-8 bg-muted/10 border border-border/20 rounded-[3rem] text-center">
         <p className="max-w-3xl mx-auto text-xs font-bold text-muted-foreground italic leading-relaxed">
           "H2H analysis reflects all deliveries recorded in {format} format between {playerName} and these specific opponents. 
           {view === 'nemesis' ? ' Nemesis view tracks who has dismissed the player most frequently.' : ' Victims view tracks the batters dismissed most by this bowler.'} 
           Data is synchronized live with the CricIntel analytics engine."
         </p>
      </div>
    </motion.div>
  );
}

function H2HSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-32 bg-muted rounded-3xl w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-48 bg-muted rounded-[2.5rem]" />
        <div className="h-48 bg-muted rounded-[2.5rem]" />
        <div className="h-48 bg-muted rounded-[2.5rem]" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[400px] bg-muted rounded-[3rem]" />
        <div className="h-[400px] bg-muted rounded-[3rem]" />
      </div>
    </div>
  );
}
