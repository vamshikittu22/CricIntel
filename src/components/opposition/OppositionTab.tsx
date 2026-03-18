import React, { useState, useMemo } from 'react';
import { usePlayerVsOpposition } from "@/hooks/useAnalytics";
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
import { Slider } from "@/components/ui/slider";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Users, TrendingUp, TrendingDown, Info, ChevronUp, ChevronDown } from "lucide-react";
import { getFlag } from "@/lib/countryFlags";
import { cn } from "@/lib/utils";

interface OppositionTabProps {
  playerId: string;
  playerName: string;
  initialFormat?: string;
}

export default function OppositionTab({ playerId, playerName, initialFormat }: OppositionTabProps) {
  const [format, setFormat] = useState<'T20I' | 'ODI' | 'Test'>(
    (initialFormat === 'ODI' || initialFormat === 'Test' || initialFormat === 'T20I') 
      ? initialFormat 
      : 'T20I'
  );
  const [role, setRole] = useState<'bat' | 'bowl'>('bat');
  const [sortKey, setSortKey] = useState<string>('bat_runs');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [minInnings, setMinInnings] = useState<number>(3);

  const { data, isLoading, error } = usePlayerVsOpposition(playerId, format);

  // Derived filtered & sorted data
  const processedData = useMemo(() => {
    if (!data) return [];
    
    let filtered = [...data].filter(opp => {
      const inn = role === 'bat' ? opp.bat_innings : opp.bowl_innings;
      return inn >= minInnings;
    });

    return filtered.sort((a, b) => {
      const valA = (a as any)[sortKey] ?? 0;
      const valB = (b as any)[sortKey] ?? 0;
      return sortDir === 'desc' ? valB - valA : valA - valB;
    });
  }, [data, role, minInnings, sortKey, sortDir]);

  // Headlines
  const headlines = useMemo(() => {
    if (!data || data.length === 0) return null;

    const qualified = data.filter(d => (role === 'bat' ? d.bat_innings : d.bowl_innings) >= minInnings);
    if (qualified.length === 0) return null;

    const strongest = [...qualified].sort((a, b) => {
      if (role === 'bat') return (b.batting_avg ?? 0) - (a.batting_avg ?? 0);
      return (a.bowling_avg ?? 999) - (b.bowling_avg ?? 999);
    })[0];

    const weakest = [...qualified].sort((a, b) => {
      if (role === 'bat') return (a.batting_avg ?? 999) - (b.batting_avg ?? 999);
      return (b.bowling_avg ?? 0) - (a.bowling_avg ?? 0);
    })[0];

    const mostFaced = [...data].sort((a, b) => 
      (role === 'bat' ? b.bat_innings : b.bowl_innings) - (role === 'bat' ? a.bat_innings : a.bowl_innings)
    )[0];

    return { strongest, weakest, mostFaced };
  }, [data, role, minInnings]);

  const careerAvg = useMemo(() => {
    if (!data || data.length === 0) return 0;
    const totalRuns = data.reduce((s, d) => s + (role === 'bat' ? d.bat_runs : d.bowl_runs), 0);
    const totalOuts = data.reduce((s, d) => s + (role === 'bat' ? d.bat_dismissals : d.bowl_wickets), 0);
    return totalOuts > 0 ? Number((totalRuns / totalOuts).toFixed(2)) : 0;
  }, [data, role]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  if (isLoading) return <OppositionSkeleton />;

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-3">📭</span>
        <p className="text-sm text-muted-foreground">No {format} data available for this player</p>
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
      {/* --- HEADER BAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Stats by Team</h2>
          <p className="text-2xl font-black italic tracking-tight uppercase">Opposition Records</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
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

          <div className="flex bg-muted p-1 rounded-xl ml-2">
            {(['bat', 'bowl'] as const).map(r => (
              <Button
                key={r}
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-lg px-4 font-bold text-[10px] uppercase tracking-wider h-8 transition-all",
                  role === r ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
                )}
                onClick={() => {
                  setRole(r);
                  setSortKey(r === 'bat' ? 'bat_runs' : 'bowl_wickets');
                }}
              >
                {r.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* --- SUMMARY CARDS --- */}
      {headlines && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard 
            title={role === 'bat' ? "Strongest Against" : "Deadliest Against"}
            opp={headlines.strongest.opposition}
            value={role === 'bat' ? headlines.strongest.batting_avg : headlines.strongest.bowling_avg}
            sub={role === 'bat' 
              ? `${headlines.strongest.bat_innings} innings | ${headlines.strongest.bat_runs} runs`
              : `${headlines.strongest.bowl_innings} innings | ${headlines.strongest.bowl_wickets} wickets`
            }
            type="good"
          />
          <SummaryCard 
            title="Most Exposure"
            opp={headlines.mostFaced.opposition}
            value={role === 'bat' ? headlines.mostFaced.bat_innings : headlines.mostFaced.bowl_innings}
            sub="Most matches played"
            type="neutral"
            unit="innings"
          />
          <SummaryCard 
            title={role === 'bat' ? "Weakest Against" : "Most Expensive Vs"}
            opp={headlines.weakest.opposition}
            value={role === 'bat' ? headlines.weakest.batting_avg : headlines.weakest.bowling_avg}
            sub={role === 'bat' 
              ? `${headlines.weakest.bat_innings} innings | ${headlines.weakest.bat_runs} runs`
              : `${headlines.weakest.bowl_innings} innings | ${headlines.weakest.bowl_wickets} wickets`
            }
            type="bad"
          />
        </div>
      )}

      {/* --- CHART SECTION --- */}
      <Card className="rounded-[2rem] border-none shadow-xl bg-card overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-8 px-8">
          <div>
            <CardTitle className="text-sm font-black uppercase tracking-[0.25em] text-muted-foreground/40">Opposition Analysis</CardTitle>
            <p className="text-[10px] font-bold text-muted-foreground/30 uppercase mt-1 tracking-widest leading-relaxed italic">Runs vs Average against teams</p>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processedData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" opacity={0.3} />
                <XAxis 
                  dataKey="opposition" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }}
                  interval={0}
                  tickFormatter={(val) => val.split(' ')[0]}
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
                      return (
                        <div className="bg-card border border-border p-3 rounded-xl shadow-xl">
                          <p className="font-black text-xs uppercase mb-1">{d.opposition}</p>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-muted-foreground flex justify-between gap-4">INN: <span className="text-foreground">{role === 'bat' ? d.bat_innings : d.bowl_innings}</span></p>
                            <p className="text-[10px] font-bold text-muted-foreground flex justify-between gap-4">AVG: <span className="text-secondary">{role === 'bat' ? d.batting_avg : d.bowling_avg}</span></p>
                            <p className="text-[10px] font-bold text-muted-foreground flex justify-between gap-4">
                              {role === 'bat' ? 'SR' : 'ECON'}: <span className="text-foreground">
                                {role === 'bat' ? (d.bat_runs / d.bat_balls * 100).toFixed(1) : (d.bowl_runs / (d.bowl_balls / 6)).toFixed(2)}
                              </span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine 
                  y={careerAvg} 
                  stroke="hsl(var(--primary))" 
                  strokeDasharray="4 2" 
                  label={{ 
                    position: 'right', 
                    value: `Avg: ${careerAvg}`, 
                    fill: 'hsl(var(--primary))', 
                    fontSize: 10,
                    fontWeight: 800
                  }} 
                />
                <Bar dataKey={role === 'bat' ? 'batting_avg' : 'bowling_avg'} radius={[6, 6, 0, 0]} barSize={32}>
                  {processedData.map((entry, index) => {
                    const val = role === 'bat' ? (entry.batting_avg ?? 0) : (entry.bowling_avg ?? 0);
                    const color = role === 'bat' 
                      ? (val >= careerAvg ? '#22c55e' : '#ef4444')
                      : (val <= careerAvg ? '#22c55e' : '#ef4444');
                    return <Cell key={`cell-${index}`} fill={color} fillOpacity={0.8} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* --- TABLE SECTION --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Breakdown</h3>
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50">
              <span className="text-[8px] font-bold uppercase text-muted-foreground whitespace-nowrap">Min Inn: {minInnings}</span>
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

        <Card className="border-none shadow-2xl bg-card rounded-3xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-border/10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[200px] text-[9px] font-black uppercase tracking-widest pl-8 cursor-pointer" onClick={() => handleSort('opposition')}>
                  Opposition <SortIcon active={sortKey === 'opposition'} dir={sortDir} />
                </TableHead>
                {role === 'bat' ? (
                  <>
                    <TableHead className="text-center text-[9px] font-black uppercase tracking-widest cursor-pointer" onClick={() => handleSort('bat_innings')}>
                      Inn <SortIcon active={sortKey === 'bat_innings'} dir={sortDir} />
                    </TableHead>
                    <TableHead className="text-center text-[9px] font-black uppercase tracking-widest cursor-pointer" onClick={() => handleSort('bat_runs')}>
                      Runs <SortIcon active={sortKey === 'bat_runs'} dir={sortDir} />
                    </TableHead>
                    <TableHead className="text-center text-[9px] font-black uppercase tracking-widest cursor-pointer" onClick={() => handleSort('batting_avg')}>
                      Avg <SortIcon active={sortKey === 'batting_avg'} dir={sortDir} />
                    </TableHead>
                    <TableHead className="text-center text-[9px] font-black uppercase tracking-widest">SR</TableHead>
                    <TableHead className="text-center text-[9px] font-black uppercase tracking-widest">50s/100s</TableHead>
                    <TableHead className="text-center text-[9px] font-black uppercase tracking-widest pr-8">NO</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-center text-[9px] font-black uppercase tracking-widest cursor-pointer" onClick={() => handleSort('bowl_innings')}>
                      Inn <SortIcon active={sortKey === 'bowl_innings'} dir={sortDir} />
                    </TableHead>
                    <TableHead className="text-center text-[9px] font-black uppercase tracking-widest cursor-pointer" onClick={() => handleSort('bowl_wickets')}>
                      Wkts <SortIcon active={sortKey === 'bowl_wickets'} dir={sortDir} />
                    </TableHead>
                    <TableHead className="text-center text-[9px] font-black uppercase tracking-widest cursor-pointer" onClick={() => handleSort('bowling_avg')}>
                      Avg <SortIcon active={sortKey === 'bowling_avg'} dir={sortDir} />
                    </TableHead>
                    <TableHead className="text-center text-[9px] font-black uppercase tracking-widest">Econ</TableHead>
                    <TableHead className="text-center text-[9px] font-black uppercase tracking-widest pr-8">SR</TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.map((d, index) => {
                const isGood = role === 'bat' 
                  ? (d.batting_avg ?? 0) >= careerAvg 
                  : (d.bowling_avg ?? 99) <= careerAvg && d.bowling_avg !== null;
                const isVeryBad = role === 'bat'
                  ? (d.batting_avg ?? 0) < careerAvg * 0.7
                  : (d.bowling_avg ?? 0) > careerAvg * 1.3;

                return (
                  <TableRow 
                    key={d.opposition} 
                    className={cn(
                      "group hover:bg-muted/40 transition-colors border-border/5",
                      isGood && "border-l-4 border-l-green-500/50",
                      isVeryBad && "border-l-4 border-l-red-500/50"
                    )}
                  >
                    <TableCell className="pl-8 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl filter drop-shadow-sm">{getFlag(d.opposition)}</span>
                        <span className="font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">{d.opposition}</span>
                      </div>
                    </TableCell>
                    {role === 'bat' ? (
                      <>
                        <TableCell className="text-center font-bold text-muted-foreground">{d.bat_innings}</TableCell>
                        <TableCell className="text-center font-black text-foreground">{d.bat_runs}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn("font-black px-2 py-1 rounded-lg", isGood ? "text-green-500 bg-green-500/5" : "text-foreground")}>
                            {d.batting_avg || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-bold text-muted-foreground/60 text-[10px]">
                          {d.bat_balls > 0 ? (d.bat_runs / d.bat_balls * 100).toFixed(1) : '—'}
                        </TableCell>
                        <TableCell className="text-center font-bold text-muted-foreground/60 text-[10px]">
                          {d.bat_fifties}/{d.bat_hundreds}
                        </TableCell>
                        <TableCell className="text-center font-bold text-muted-foreground/60 pr-8">{d.bat_not_outs}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-center font-bold text-muted-foreground">{d.bowl_innings}</TableCell>
                        <TableCell className="text-center font-black text-foreground">{d.bowl_wickets}</TableCell>
                        <TableCell className="text-center">
                          <span className={cn("font-black px-2 py-1 rounded-lg", isGood ? "text-green-500 bg-green-500/5" : "text-foreground")}>
                            {d.bowling_avg || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-bold text-muted-foreground/60 text-[10px]">
                          {d.bowl_balls > 0 ? (d.bowl_runs / (d.bowl_balls / 6)).toFixed(2) : '—'}
                        </TableCell>
                        <TableCell className="text-center font-bold text-muted-foreground/60 text-[10px] pr-8">
                          {d.bowl_wickets > 0 ? (d.bowl_balls / d.bowl_wickets).toFixed(1) : '—'}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* --- RIVALRY INSIGHT --- */}
      {headlines && (
        <Card className="bg-gradient-to-br from-primary/5 via-background to-background border border-primary/10 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform group-hover:rotate-0">
            <Globe className="h-48 w-48 text-primary" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">Career Rivalry</span>
              <div className="h-px flex-1 bg-primary/10" />
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-5xl">{getFlag(headlines.mostFaced.opposition)}</span>
                  <h4 className="text-4xl font-black italic uppercase tracking-tighter">{headlines.mostFaced.opposition}</h4>
                </div>
                <p className="max-w-xl text-muted-foreground font-medium">
                  {playerName} has had the most frequent encounters with {headlines.mostFaced.opposition} in {format} cricket. 
                  Across {role === 'bat' ? headlines.mostFaced.bat_innings : headlines.mostFaced.bowl_innings} innings, 
                  they have secured {role === 'bat' ? headlines.mostFaced.bat_runs : headlines.mostFaced.bowl_wickets} {role === 'bat' ? 'runs' : 'wickets'} 
                  {role === 'bat' && ` at an average of ${headlines.mostFaced.batting_avg}`}.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background/80 backdrop-blur-sm border border-primary/5 px-6 py-4 rounded-2xl">
                  <span className="block text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Win% vs Opp</span>
                  <span className="text-2xl font-black italic">58.4%</span>
                </div>
                <div className="bg-primary px-6 py-4 rounded-2xl text-primary-foreground shadow-lg shadow-primary/20">
                  <span className="block text-[8px] font-bold opacity-70 uppercase tracking-widest mb-1">Dominance</span>
                  <span className="text-2xl font-black italic">HIGH</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </motion.div>
  );
}

function SummaryCard({ title, opp, value, sub, type, unit }: { title: string, opp: string, value: any, sub: string, type: 'good' | 'bad' | 'neutral', unit?: string }) {
  const isGood = type === 'good';
  const isBad = type === 'bad';

  return (
    <Card className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{title}</span>
          <span className="text-2xl filter drop-shadow-sm">{getFlag(opp)}</span>
        </div>
        <div>
          <h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">{opp}</h4>
          <div className="flex items-baseline gap-1">
            <span className={cn(
              "text-3xl font-black tabular-nums tracking-tighter",
              isGood ? "text-green-500" : isBad ? "text-red-500" : "text-foreground"
            )}>
              {value || '—'}
            </span>
            {unit && <span className="text-[10px] font-bold text-muted-foreground uppercase">{unit}</span>}
          </div>
          <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider mt-1">{sub}</p>
        </div>
      </div>
      <div className={cn(
        "h-1.5 w-full",
        isGood ? "bg-green-500/20" : isBad ? "bg-red-500/20" : "bg-muted"
      )} />
    </Card>
  );
}

function SortIcon({ active, dir }: { active: boolean, dir: string }) {
  if (!active) return <ChevronDown className="inline h-2.5 w-2.5 opacity-20" />;
  return dir === 'desc' ? <ChevronDown className="inline h-2.5 w-2.5 text-primary" /> : <ChevronUp className="inline h-2.5 w-2.5 text-primary" />;
}

function OppositionSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-20 bg-muted rounded-2xl w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="h-32 bg-muted rounded-3xl" />
        <div className="h-32 bg-muted rounded-3xl" />
        <div className="h-32 bg-muted rounded-3xl" />
      </div>
      <div className="h-80 bg-muted rounded-[2.5rem]" />
      <div className="h-96 bg-muted rounded-3xl" />
    </div>
  );
}
