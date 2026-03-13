import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { format as dateFmt } from "date-fns";
import type { PlayerMatchRow } from "@/lib/hooks/usePlayers";
import { TrendingUp, Activity, History, Zap, Trophy, TrendingDown, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface BowlingFormTrackerProps {
  recentMatches: PlayerMatchRow[];
  format: string;
}

function calcBowlingFormScore(wickets: number, econ: number, format: string) {
  // Volume Index (Success Rate)
  let score = wickets * 3.0; 
  
  // Tactical Breakthrough Bonuses
  if (wickets >= 5) score += 5.0;
  else if (wickets >= 3) score += 2.0;

  const isT20 = format === "T20I" || format === "IPL" || format === "T20";
  const isODI = format === "ODI";
  
  // Suppression Metrics (Economy) - Context Aware
  if (isT20) {
    if (econ < 6.5) score += 3.0;
    else if (econ < 8.0) score += 1.5;
    else if (econ > 10.0) score -= 3.0;
  } else if (isODI) {
    if (econ < 4.5) score += 3.0;
    else if (econ < 5.5) score += 1.5;
    else if (econ > 7.5) score -= 3.0;
  } else { // Multi-Day / Test Deployment
    if (econ < 2.5) score += 3.0;
    else if (econ < 3.5) score += 1.5;
    else if (econ > 4.5) score -= 3.0;
  }
  
  // Final Evaluation - Clamp to normalized [1, 10] range
  const normalizedScore = Math.min(10, Math.max(1, score));
  return +normalizedScore.toFixed(1);
}

function getFormLabel(score: number) {
  if (score >= 7.5) return { label: "Elite Performance", color: "text-primary", icon: Zap, bg: "bg-primary/10" };
  if (score >= 5.5) return { label: "Sustained Momentum", color: "text-blue-600 dark:text-blue-400", icon: TrendingUp, bg: "bg-blue-500/10" };
  if (score >= 4.0) return { label: "Neutral Phase", color: "text-amber-600 dark:text-amber-400", icon: Activity, bg: "bg-amber-500/10" };
  return { label: "Performance Deficit", color: "text-rose-600 dark:text-rose-500", icon: TrendingDown, bg: "bg-rose-500/10" };
}

export function BowlingFormTracker({ recentMatches, format }: BowlingFormTrackerProps) {
  const [selectedYear, setSelectedYear] = useState<string>("All");

  const bowlingMatches = useMemo(() =>
    [...recentMatches]
      .filter((m) => m.is_bowler)
      .sort((a, b) => a.match_date.localeCompare(b.match_date))
      .map((m) => {
        const econ = m.bowl_overs > 0 ? +(m.bowl_runs / m.bowl_overs).toFixed(1) : 0;
        const year = m.match_date ? m.match_date.substring(0, 4) : "—";
        return {
          ...m,
          econ,
          year,
          formScore: calcBowlingFormScore(m.bowl_wickets, econ, format),
          opponent: `${m.team1} vs ${m.team2}`,
          dateFormatted: m.match_date ? dateFmt(new Date(m.match_date), "d MMM yyyy") : "—",
        };
      }), [recentMatches, format]);

  const yearSummaries = useMemo(() => {
    const map = new Map<string, { matches: number; wickets: number; runs: number; overs: number }>();
    for (const m of bowlingMatches) {
      const y = m.year;
      if (!map.has(y)) map.set(y, { matches: 0, wickets: 0, runs: 0, overs: 0 });
      const s = map.get(y)!;
      s.matches++;
      s.wickets += m.bowl_wickets;
      s.runs += m.bowl_runs;
      s.overs += m.bowl_overs;
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, s]) => {
        const avg = s.wickets > 0 ? +(s.runs / s.wickets).toFixed(1) : null;
        const econ = s.overs > 0 ? +(s.runs / s.overs).toFixed(1) : null;
        return { year, matches: s.matches, wickets: s.wickets, runs: s.runs, overs: s.overs, avg, econ };
      });
  }, [bowlingMatches]);

  const overallSummary = useMemo(() => {
    const innings = bowlingMatches.length;
    const wickets = bowlingMatches.reduce((sum, m) => sum + m.bowl_wickets, 0);
    const runs = bowlingMatches.reduce((sum, m) => sum + m.bowl_runs, 0);
    const overs = bowlingMatches.reduce((sum, m) => sum + m.bowl_overs, 0);
    const maidens = bowlingMatches.reduce((sum, m) => sum + m.bowl_maidens, 0);
    const avg = wickets > 0 ? +(runs / wickets).toFixed(1) : null;
    const econ = overs > 0 ? +(runs / overs).toFixed(1) : null;
    const sr = wickets > 0 ? +((overs * 6) / wickets).toFixed(1) : null;
    const fourWPlus = bowlingMatches.filter((m) => m.bowl_wickets >= 4).length;
    
    let bestBowling = { w: 0, r: 0 };
    for (const m of bowlingMatches) {
      if (m.bowl_wickets > bestBowling.w || (m.bowl_wickets === bestBowling.w && m.bowl_runs < bestBowling.r)) {
        bestBowling = { w: m.bowl_wickets, r: m.bowl_runs };
      }
    }
    return { innings, wickets, avg, econ, sr, maidens, fourWPlus, bestBowling: `${bestBowling.w}/${bestBowling.r}` };
  }, [bowlingMatches]);

  const years = useMemo(() => ["All", ...yearSummaries.map((y) => y.year)], [yearSummaries]);
  const filteredMatches = useMemo(() =>
    selectedYear === "All" ? bowlingMatches : bowlingMatches.filter((m) => m.year === selectedYear),
    [bowlingMatches, selectedYear]);

  const recentForChart = filteredMatches.slice(-20);
  const currentFormScore = recentForChart.length ? recentForChart[recentForChart.length - 1].formScore : null;
  const { label: formLabel, color: formColor, icon: FormIcon, bg: formBg } = currentFormScore
    ? getFormLabel(currentFormScore)
    : { label: "Insufficient Data", color: "text-muted-foreground", icon: Target, bg: "bg-muted/10" };

  return (
    <div className="space-y-12">
      {/* Performance Status Banner */}
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 p-10 rounded-[2.5rem] glass border-black/5 dark:border-border/50 bg-white/5 dark:bg-white/1 relative overflow-hidden flex flex-col justify-between shadow-2xl">
           <div className="flex items-center gap-4 mb-8">
              <div className={cn("p-2.5 rounded-xl shadow-inner", formBg)}>
                <FormIcon className={cn("h-6 w-6", formColor)} />
              </div>
              <div>
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.25em] opacity-60 mb-1">Momentum Intelligence Index</h3>
                <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/30 leading-none">Context-Aware Performance Mapping</p>
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
                      className={cn("h-full rounded-full shadow-lg transition-colors", formColor.replace('text-', 'bg-'))}
                    />
                 </div>
              </div>
           </div>
           
           <div className="absolute top-0 right-0 p-12 flex flex-col items-end opacity-[0.03] pointer-events-none text-foreground">
              <Target className="h-32 w-32" />
           </div>
        </div>

        <div className="p-10 rounded-[2.5rem] glass border-black/5 dark:border-border/50 bg-white/5 dark:bg-white/1 flex flex-col justify-center gap-10 shadow-2xl overflow-hidden relative active:scale-[0.98]">
           <div className="space-y-2 relative z-10">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.25em] opacity-50">Best Performance</p>
              <p className="text-5xl font-black text-primary tracking-tighter leading-none">{overallSummary.bestBowling}</p>
           </div>
           <div className="grid grid-cols-2 gap-8 border-t border-black/5 dark:border-white/5 pt-10 relative z-10">
              <div className="space-y-1.5">
                 <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] opacity-40">4w+ Hauls</p>
                 <p className="text-2xl font-black text-foreground/80 tracking-tight leading-none">{overallSummary.fourWPlus}</p>
              </div>
              <div className="text-right space-y-1.5">
                 <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] opacity-40">Lifetime Wkts</p>
                 <p className="text-2xl font-black text-foreground/80 tracking-tight leading-none">{overallSummary.wickets}</p>
              </div>
           </div>
           <div className="absolute -right-6 -bottom-6 h-32 w-32 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />
        </div>
      </div>

      {/* Career Aggregates Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-8">
          {[
            { label: "Wickets Taken", value: overallSummary.wickets, highlight: true },
            { label: "Bowling Average", value: overallSummary.avg ?? "—" },
            { label: "Economy Rate", value: overallSummary.econ ?? "—" },
            { label: "Strike Rate", value: overallSummary.sr ?? "—" },
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
               <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.25em] opacity-80 mb-1">Impact Progression</h3>
               <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/30 leading-none">Inning-by-Inning Tactical Analysis</p>
             </div>
          </div>
          
          <div className="flex gap-2.5 bg-slate-100/80 dark:bg-secondary/20 p-2 rounded-[1.5rem] border border-black/5 dark:border-border/50 max-w-full overflow-x-auto no-scrollbar shadow-inner ring-1 ring-black/5">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={cn(
                  "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all min-w-[70px]",
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
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={recentForChart}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted-foreground" strokeOpacity={0.05} />
            <XAxis dataKey="dateFormatted" hide />
            <YAxis yAxisId="wickets" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: "900", fill: "currentColor" }} className="text-muted-foreground opacity-60" />
            <YAxis yAxisId="form" orientation="right" hide domain={[0, 10]} />
            <Tooltip
              cursor={{ stroke: "currentColor", strokeOpacity: 0.1, strokeWidth: 2 }}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                const { label: L, color: C } = getFormLabel(d.formScore);
                return (
                  <div className="rounded-[3rem] border border-black/5 dark:border-border bg-popover/95 backdrop-blur-3xl p-10 text-xs shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] min-w-[320px] ring-1 ring-black/5">
                    <p className="font-black text-muted-foreground uppercase tracking-[0.3em] text-[9px] mb-8 opacity-40 leading-relaxed max-w-[220px]">{d.opponent}</p>
                    <div className="flex items-end justify-between gap-12 mb-10 pb-10 border-b border-black/5 dark:border-white/5">
                       <span className="text-6xl font-black text-foreground tracking-tighter leading-none">{d.bowl_wickets}<span className="text-lg opacity-30 ml-2">WKTS</span></span>
                       <div className="text-right">
                          <p className={cn("text-3xl font-black tracking-tighter leading-none mb-1 text-primary transition-colors", C)}>{d.formScore}</p>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-30">Impact Rating</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-10 text-[10px] font-black uppercase text-muted-foreground">
                       <div className="space-y-2.5">
                          <p className="opacity-40 tracking-[0.2em] text-[9px]">Economy Control</p>
                          <p className="text-foreground tracking-tight text-xl leading-none">{d.econ}</p>
                       </div>
                       <div className="space-y-2.5 text-right">
                          <p className="opacity-40 tracking-[0.2em] text-[9px]">Attack Volume</p>
                          <p className="text-foreground tracking-tight text-xl leading-none">{d.bowl_overs} <span className="text-[10px] opacity-30">OV</span></p>
                       </div>
                    </div>
                  </div>
                );
              }}
            />
            <Line yAxisId="wickets" type="stepAfter" dataKey="bowl_wickets" stroke="hsl(var(--primary))" strokeWidth={7} dot={false} activeDot={{ r: 12, strokeWidth: 4, stroke: "hsl(var(--primary-foreground))", fill: "hsl(var(--primary))" }} />
            <Line yAxisId="form" type="monotone" dataKey="formScore" stroke="currentColor" strokeOpacity={0.08} strokeWidth={3} dot={false} strokeDasharray="6 6" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
         {/* Annual Intensity Bar Chart */}
         <div className="p-12 rounded-[3.5rem] glass border-black/5 dark:border-border/50 bg-white/5 dark:bg-white/1 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-4 mb-12">
               <div className={cn("p-3 rounded-2xl bg-primary/10 shadow-inner")}>
                  <TrendingUp className="h-6 w-6 text-primary" />
               </div>
               <div>
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.25em] opacity-80 mb-1">Annual Deployment Yield</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/30 leading-none">Long-Term Performance Breakdown</p>
               </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={yearSummaries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-muted-foreground" strokeOpacity={0.05} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: "900", fill: "currentColor" }} className="text-muted-foreground opacity-60" dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: "900", fill: "currentColor" }} className="text-muted-foreground opacity-60" />
                <Tooltip
                  cursor={{ fill: "currentColor", opacity: 0.03, radius: 12 }}
                  contentStyle={{ background: "hsl(var(--popover))", backdropFilter: "blur(20px)", border: "1px solid hsl(var(--border))", borderRadius: "1.8rem", padding: "16px 20px", boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "10px", fontWeight: "900", textTransform: "uppercase", marginBottom: "10px", letterSpacing: "0.25em", opacity: 0.5 }}
                />
                <Bar dataKey="wickets" fill="hsl(var(--primary))" radius={[12, 12, 0, 0]} barSize={55} />
              </BarChart>
            </ResponsiveContainer>
         </div>

         {/* Detailed Ledger Table */}
         <div className="p-10 rounded-[3.5rem] glass border-black/5 dark:border-border/50 bg-white/5 dark:bg-white/1 shadow-2xl flex flex-col relative overflow-hidden">
            <div className="flex items-center gap-4 mb-12 p-2">
               <div className="p-3 bg-slate-100 dark:bg-secondary rounded-2xl shadow-inner">
                  <Activity className="h-6 w-6 text-muted-foreground opacity-60" />
               </div>
               <div>
                  <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.25em] opacity-80 mb-1">Match Sector Ledger</h3>
                  <p className="text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/30 leading-none">Granular Telemetry Logs</p>
               </div>
            </div>
            <div className="overflow-x-auto -mx-10 max-h-[480px] no-scrollbar overflow-y-auto flex-1 shadow-inner">
               <table className="w-full">
                  <thead className="bg-slate-50/80 dark:bg-secondary/40 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground sticky top-0 z-10 backdrop-blur-3xl shadow-sm opacity-60">
                     <tr>
                        <th className="px-12 py-8 text-left">Engagement</th>
                        <th className="px-12 py-8 text-right">Result</th>
                        <th className="px-12 py-8 text-right">Momentum</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-border/50">
                     {[...filteredMatches].reverse().map((m, i) => {
                        const { color: C } = getFormLabel(m.formScore);
                        return (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-muted/30 transition-all cursor-default group/row">
                             <td className="px-12 py-8">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2.5 opacity-40">{m.dateFormatted}</p>
                                <p className="text-sm font-black truncate max-w-[210px] text-foreground/70 group-hover/row:text-primary transition-colors leading-none">{m.opponent}</p>
                             </td>
                             <td className="px-12 py-8 text-right">
                                <p className="text-3xl font-black text-foreground tracking-tighter leading-none mb-2 group-hover/row:scale-105 transition-transform origin-right">{m.bowl_wickets}/{m.bowl_runs}</p>
                                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-40 leading-none">{m.bowl_overs} OV · {m.econ} EC</p>
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
