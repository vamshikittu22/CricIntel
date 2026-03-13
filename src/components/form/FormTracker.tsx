import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { format as dateFmt } from "date-fns";
import type { PlayerMatchRow } from "@/lib/hooks/usePlayers";
import { TrendingUp, Activity, History, Zap, Trophy, TrendingDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormTrackerProps {
  recentMatches: PlayerMatchRow[];
  format: string;
}

function calcFormScore(runs: number, sr: number, notOut: boolean) {
  // Base score from volume
  let score = runs / 10.0;
  
  // Tactical Bonuses (Milestones)
  if (runs >= 100) score += 5.0;
  else if (runs >= 50) score += 3.0;
  else if (runs >= 30) score += 1.5;
  
  // Strike Rate Efficiency Index
  if (sr > 180) score += 4.0;
  else if (sr > 140) score += 2.0;
  else if (sr > 0 && sr < 100 && runs > 0) score -= 2.0;
  
  // Resilience Quotient (Not Out Bonus)
  if (notOut && runs > 15) score += 1.5;
  
  // Final Evaluation - Clamp to normalized [1, 10] range
  const normalizedScore = Math.min(10, Math.max(1, score));
  return +normalizedScore.toFixed(1);
}

function getFormLabel(score: number) {
  if (score >= 7.5) return { label: "Elite Performance", color: "text-primary", bg: "bg-primary/10", bar: "bg-primary", icon: Zap };
  if (score >= 5.5) return { label: "Sustained Momentum", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", bar: "bg-blue-500", icon: TrendingUp };
  if (score >= 4.0) return { label: "Neutral Phase", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", bar: "bg-amber-500", icon: Activity };
  return { label: "Performance Deficit", color: "text-rose-600 dark:text-rose-500", bg: "bg-rose-500/10", bar: "bg-rose-500", icon: TrendingDown };
}

export function FormTracker({ recentMatches, format }: FormTrackerProps) {
  const [selectedYear, setSelectedYear] = useState<string>("All");

  const battingMatches = useMemo(() =>
    [...recentMatches]
      .filter((m) => m.is_batter)
      .sort((a, b) => a.match_date.localeCompare(b.match_date))
      .map((m) => {
        const sr = m.bat_balls > 0 ? +((m.bat_runs / m.bat_balls) * 100).toFixed(1) : 0;
        const year = m.match_date ? m.match_date.substring(0, 4) : "—";
        return {
          ...m,
          sr,
          year,
          formScore: calcFormScore(m.bat_runs, sr, m.bat_not_out),
          opponent: `${m.team1} vs ${m.team2}`,
          dateFormatted: m.match_date ? dateFmt(new Date(m.match_date), "d MMM yyyy") : "—",
        };
      }), [recentMatches, format]);

  const yearSummaries = useMemo(() => {
    const map = new Map<string, { matches: number; runs: number; balls: number; notOuts: number; innings: number }>();
    for (const m of battingMatches) {
      const y = m.year;
      if (!map.has(y)) map.set(y, { matches: 0, runs: 0, balls: 0, notOuts: 0, innings: 0 });
      const s = map.get(y)!;
      s.matches++;
      s.innings++;
      s.runs += m.bat_runs;
      s.balls += m.bat_balls;
      if (m.bat_not_out) s.notOuts++;
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, s]) => {
        const dismissals = s.innings - s.notOuts;
        const avg = dismissals > 0 ? +(s.runs / dismissals).toFixed(1) : null;
        const sr = s.balls > 0 ? +(s.runs / s.balls * 100).toFixed(1) : null;
        return { year, matches: s.matches, runs: s.runs, avg, sr };
      });
  }, [battingMatches]);

  const overallSummary = useMemo(() => {
    const innings = battingMatches.length;
    const runs = battingMatches.reduce((sum, m) => sum + m.bat_runs, 0);
    const balls = battingMatches.reduce((sum, m) => sum + m.bat_balls, 0);
    const notOuts = battingMatches.filter((m) => m.bat_not_out).length;
    const dismissals = innings - notOuts;
    const avg = dismissals > 0 ? +(runs / dismissals).toFixed(1) : null;
    const sr = balls > 0 ? +(runs / balls * 100).toFixed(1) : null;
    const fifties = battingMatches.filter((m) => m.bat_runs >= 50 && m.bat_runs < 100).length;
    const hundreds = battingMatches.filter((m) => m.bat_runs >= 100).length;
    const highScore = Math.max(0, ...battingMatches.map((m) => m.bat_runs));
    return { innings, runs, notOuts, avg, sr, fifties, hundreds, highScore };
  }, [battingMatches]);

  const years = useMemo(() => ["All", ...yearSummaries.map((y) => y.year)], [yearSummaries]);
  const filteredMatches = useMemo(() =>
    selectedYear === "All" ? battingMatches : battingMatches.filter((m) => m.year === selectedYear),
    [battingMatches, selectedYear]);

  const recentForChart = filteredMatches.slice(-20);
  const currentFormScore = recentForChart.length ? recentForChart[recentForChart.length - 1].formScore : null;
  const { label: formLabel, color: formColor, bg: formBg, bar: formBar, icon: FormIcon } = currentFormScore
    ? getFormLabel(currentFormScore)
    : { label: "Insufficient Data", color: "text-muted-foreground", bg: "bg-muted/10", bar: "bg-muted", icon: Activity };

  return (
    <div className="space-y-12">
      {/* Performance Status Banner */}
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 p-10 rounded-[2.5rem] glass border-black/5 dark:border-border/50 bg-white/5 dark:bg-white/1 relative overflow-hidden flex flex-col justify-between group shadow-2xl transition-all">
           <div className="flex items-center gap-4 mb-8 relative z-10">
              <div className={cn("p-2.5 rounded-xl shadow-inner", formBg)}>
                <FormIcon className={cn("h-6 w-6", formColor)} />
              </div>
              <div>
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.25em] opacity-60 mb-1">Momentum Intelligence Index</h3>
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/30 leading-none">Real-Time Performance Mapping</p>
              </div>
           </div>
           
           <div className="flex items-end gap-10 relative z-10">
              <div className="flex flex-col">
                 <span className={cn("text-7xl font-black tracking-tighter leading-none transition-colors", formColor)}>{currentFormScore ?? "—"}</span>
                 <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mt-3 opacity-50">Impact Rating / 10</p>
              </div>
              <div className="flex-1 pb-2">
                 <h4 className={cn("text-2xl font-black uppercase tracking-tighter mb-4 leading-none", formColor)}>{formLabel}</h4>
                 <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 overflow-hidden shadow-inner p-1">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentFormScore ?? 0) / 10) * 100}%` }}
                      className={cn("h-full rounded-full shadow-lg transition-colors", formBar)}
                    />
                 </div>
              </div>
           </div>
           
           <div className="absolute top-0 right-0 p-12 flex flex-col items-end opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform text-foreground">
              <Trophy className="h-32 w-32" />
           </div>
        </div>

        <div className="p-10 rounded-[2.5rem] glass border-black/5 dark:border-border/50 bg-white/5 dark:bg-white/1 flex flex-col justify-center gap-10 shadow-2xl relative overflow-hidden active:scale-[0.98]">
           <div className="space-y-2 relative z-10">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.25em] opacity-50">Aggregate Peak</p>
              <p className="text-5xl font-black text-primary tracking-tighter leading-none">{overallSummary.highScore}</p>
           </div>
           <div className="grid grid-cols-2 gap-8 border-t border-black/5 dark:border-white/5 pt-10 relative z-10">
              <div className="space-y-1.5">
                 <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] opacity-40">Milestones</p>
                 <p className="text-2xl font-black text-foreground/80 tracking-tight leading-none">{overallSummary.hundreds} + {overallSummary.fifties}</p>
              </div>
              <div className="text-right space-y-1.5">
                 <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] opacity-40">Deployment</p>
                 <p className="text-2xl font-black text-foreground/80 tracking-tight leading-none">{overallSummary.innings} <span className="text-[10px] opacity-30">INN</span></p>
              </div>
           </div>
           <div className="absolute -right-6 -bottom-6 h-32 w-32 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
        </div>
      </div>

      {/* Career Aggregates Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-8">
          {[
            { label: "Aggregate Runs", value: overallSummary.runs, highlight: true },
            { label: "Batting Average", value: overallSummary.avg ?? "—" },
            { label: "Strike Rate", value: overallSummary.sr ?? "—" },
            { label: "Not Outs", value: overallSummary.notOuts },
          ].map((s, i) => (
            <div key={i} className={cn(
              "p-8 rounded-[2rem] glass shadow-xl transition-all active:scale-[0.98] group relative overflow-hidden",
              s.highlight ? "border-primary/40 bg-primary/5" : "border-black/5 dark:border-border/50 bg-white/5 dark:bg-white/1"
            )}>
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.25em] opacity-50 relative z-10">{s.label}</span>
              <span className={cn(
                "block mt-4 text-4xl font-black tracking-tighter leading-none relative z-10 transition-transform group-hover:scale-105 origin-left",
                s.highlight ? "text-primary" : "text-foreground"
              )}>{s.value}</span>
              {s.highlight && <div className="absolute -right-4 -bottom-4 h-16 w-16 bg-primary/10 blur-[40px] rounded-full" />}
            </div>
          ))}
      </div>

      {/* Form Progression Chart */}
      <div className="p-12 rounded-[3.5rem] glass border-black/5 dark:border-border/50 bg-white/5 dark:bg-white/1 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-16 relative z-10">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-slate-100 dark:bg-secondary rounded-2xl shadow-inner">
                <History className="h-6 w-6 text-muted-foreground opacity-60" />
             </div>
             <div>
               <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.25em] opacity-80 mb-1">Performance Evolution</h3>
               <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/30 leading-none">Sustained Output Analytics</p>
             </div>
          </div>
          
          <div className="flex gap-2.5 bg-slate-100/80 dark:bg-secondary/20 p-2 rounded-[1.5rem] border border-black/5 dark:border-border/50 max-w-full overflow-x-auto no-scrollbar shadow-inner ring-1 ring-black/5">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={cn(
                  "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all min-w-[75px]",
                  selectedYear === y 
                    ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105 active:scale-95" 
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-200 dark:hover:bg-secondary/40 active:scale-95"
                )}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-[400px] w-full">
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={recentForChart}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted-foreground" strokeOpacity={0.05} />
               <XAxis dataKey="dateFormatted" hide />
               <YAxis yAxisId="runs" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: "900", fill: "currentColor" }} className="text-muted-foreground opacity-60" />
               <YAxis yAxisId="form" orientation="right" hide domain={[0, 10]} />
               <Tooltip
                 cursor={{ stroke: "currentColor", strokeOpacity: 0.1, strokeWidth: 2 }}
                 content={({ payload }) => {
                   if (!payload?.length) return null;
                   const d = payload[0].payload;
                   const { label: L, color: C } = getFormLabel(d.formScore);
                   return (
                     <div className="rounded-[3rem] border border-black/5 dark:border-border bg-popover/95 backdrop-blur-3xl p-10 text-xs shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] min-w-[320px] ring-1 ring-black/5">
                       <p className="font-black text-muted-foreground uppercase tracking-[0.3em] text-[10px] mb-8 opacity-40 leading-relaxed max-w-[220px]">{d.opponent}</p>
                       <div className="flex items-end justify-between gap-12 mb-10 pb-10 border-b border-black/5 dark:border-white/5">
                          <span className="text-6xl font-black text-foreground tracking-tighter leading-none">{d.bat_runs}<span className="text-lg opacity-30 ml-2">{d.bat_not_out ? '*' : ''}</span></span>
                          <div className="text-right">
                             <p className={cn("text-3xl font-black tracking-tighter leading-none mb-1 text-primary transition-colors", C)}>{d.formScore}</p>
                             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-30">Impact Rating</p>
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-10 text-[10px] font-black uppercase text-muted-foreground">
                          <div className="space-y-2.5">
                             <p className="opacity-40 tracking-[0.2em] text-[9px]">Strike Efficiency</p>
                             <p className="text-foreground tracking-tight text-xl leading-none">{d.sr}</p>
                          </div>
                          <div className="space-y-2.5 text-right">
                             <p className="opacity-40 tracking-[0.2em] text-[9px]">Engagement Date</p>
                             <p className="text-foreground tracking-tight text-[11px] leading-none">{d.dateFormatted}</p>
                          </div>
                       </div>
                     </div>
                   );
                 }}
               />
               <Line yAxisId="runs" type="monotone" dataKey="bat_runs" stroke="hsl(var(--primary))" strokeWidth={7} dot={false} activeDot={{ r: 12, strokeWidth: 4, stroke: "hsl(var(--primary-foreground))", fill: "hsl(var(--primary))" }} />
               <Line yAxisId="form" type="monotone" dataKey="formScore" stroke="currentColor" strokeOpacity={0.08} strokeWidth={3} dot={false} strokeDasharray="6 6" />
             </LineChart>
           </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
         {/* Annual Intensity Bar Chart */}
         <div className="p-12 rounded-[3.5rem] glass border-black/5 dark:border-border/50 bg-white/5 dark:bg-white/1 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-4 mb-12">
               <div className="p-3 bg-primary/10 rounded-2xl shadow-inner">
                  <TrendingUp className="h-6 w-6 text-primary" />
               </div>
               <div>
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.25em] opacity-80 mb-1">Annual Yield Intensity</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/30 leading-none">Historical Productivity Mapping</p>
               </div>
            </div>
            <div className="h-[320px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={yearSummaries}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted-foreground" strokeOpacity={0.05} />
                   <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: "900", fill: "currentColor" }} className="text-muted-foreground opacity-60" dy={15} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: "900", fill: "currentColor" }} className="text-muted-foreground opacity-60" />
                   <Tooltip
                     cursor={{ fill: "currentColor", opacity: 0.03, radius: 12 }}
                     contentStyle={{ background: "hsl(var(--popover))", backdropFilter: "blur(20px)", border: "1px solid hsl(var(--border))", borderRadius: "1.8rem", padding: "16px 20px", boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}
                     labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "10px", fontWeight: "900", textTransform: "uppercase", marginBottom: "10px", letterSpacing: "0.25em", opacity: 0.5 }}
                   />
                   <Bar dataKey="runs" fill="hsl(var(--primary))" radius={[12, 12, 0, 0]} barSize={55} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Detailed Ledger Table */}
         <div className="p-10 rounded-[3.5rem] glass border-black/5 dark:border-border/50 bg-white/5 dark:bg-white/1 shadow-2xl flex flex-col relative overflow-hidden">
            <div className="flex items-center gap-4 mb-12 p-2">
               <div className="p-3 bg-slate-100 dark:bg-secondary rounded-2xl shadow-inner">
                  <Activity className="h-6 w-6 text-muted-foreground opacity-60" />
               </div>
               <div>
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.25em] opacity-80 mb-1">Tactical Match Ledger</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/30 leading-none">Engagement Telemetry Logs</p>
               </div>
            </div>
            <div className="overflow-x-auto -mx-10 flex-1 max-h-[480px] no-scrollbar overflow-y-auto shadow-inner">
               <table className="w-full">
                  <thead className="bg-slate-50/80 dark:bg-secondary/40 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground sticky top-0 z-10 backdrop-blur-3xl shadow-sm opacity-60">
                     <tr>
                        <th className="px-12 py-8 text-left">Deployment</th>
                        <th className="px-12 py-8 text-right">Yield</th>
                        <th className="px-12 py-8 text-right">Momentum</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                     {[...filteredMatches].reverse().map((m, i) => {
                        const { color: C, bg: B, bar: Br } = getFormLabel(m.formScore);
                        return (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-muted/30 transition-all cursor-default group/row">
                             <td className="px-12 py-8">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2.5 opacity-40 leading-none">{m.dateFormatted}</p>
                                <p className="text-sm font-black truncate max-w-[210px] text-foreground/70 group-hover/row:text-primary transition-colors leading-none">{m.opponent}</p>
                             </td>
                             <td className="px-12 py-8 text-right">
                                <span className="text-3xl font-black text-foreground tracking-tighter leading-none group-hover/row:scale-105 transition-transform origin-right block mb-1">
                                   {m.bat_runs}<span className="text-muted-foreground/30 ml-0.5">{m.bat_not_out ? '*' : ''}</span>
                                </span>
                                <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-40 leading-none">{m.sr} SR</span>
                             </td>
                             <td className="px-12 py-8 text-right">
                                <span className={cn(
                                   "inline-block px-5 py-2 rounded-2xl text-[12px] font-black tracking-tighter uppercase transition-all shadow-sm ring-1 ring-black/5",
                                   C,
                                   "bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 group-hover/row:scale-110"
                                )}>
                                   {m.formScore}
                                </span>
                             </td>
                          </tr>
                        );
                     })}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
}
