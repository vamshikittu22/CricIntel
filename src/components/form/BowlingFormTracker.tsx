import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { format as dateFmt } from "date-fns";
import type { PlayerMatchRow } from "@/lib/hooks/usePlayers";
import { TrendingUp, Activity, History, Zap, Trophy, TrendingDown, Target } from "lucide-react";

interface BowlingFormTrackerProps {
  recentMatches: PlayerMatchRow[];
  format: string;
}

function calcBowlingFormScore(wickets: number, econ: number) {
  let score = wickets * 3.0; // 2 wkts = 6.0
  if (wickets >= 5) score += 5.0;
  else if (wickets >= 3) score += 2.0;

  if (econ < 6.5) score += 3.0;
  else if (econ < 8.5) score += 1.5;
  else if (econ > 11.0) score -= 3.0;
  
  return +Math.min(10, Math.max(1, score)).toFixed(1);
}

function getFormLabel(score: number) {
  if (score >= 7.5) return { label: "Elite Performance", color: "text-primary", icon: Zap };
  if (score >= 5.5) return { label: "Sustained Momentum", color: "text-blue-400", icon: TrendingUp };
  if (score >= 4.0) return { label: "Neutral Phase", color: "text-amber-400", icon: Activity };
  return { label: "Performance Deficit", color: "text-rose-500", icon: TrendingDown };
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
          formScore: calcBowlingFormScore(m.bowl_wickets, econ),
          opponent: `${m.team1} vs ${m.team2}`,
          dateFormatted: m.match_date ? dateFmt(new Date(m.match_date), "d MMM yyyy") : "—",
        };
      }), [recentMatches]);

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
  const { label: formLabel, color: formColor, icon: FormIcon } = currentFormScore
    ? getFormLabel(currentFormScore)
    : { label: "Insufficient Data", color: "text-muted-foreground", icon: Target };

  return (
    <div className="space-y-12">
      {/* Performance Status Banner */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 p-8 rounded-[2rem] glass border-border/50 relative overflow-hidden flex flex-col justify-between">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FormIcon className={`h-5 w-5 ${formColor}`} />
              </div>
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Momentum Intelligence Index</h3>
           </div>
           
           <div className="flex items-end gap-6">
              <div className="flex flex-col">
                 <span className={`text-6xl font-black tracking-tighter ${formColor}`}>{currentFormScore ?? "—"}</span>
                 <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Impact Rating / 10</p>
              </div>
              <div className="flex-1 pb-2">
                 <h4 className={`text-xl font-black uppercase tracking-tighter ${formColor} mb-2`}>{formLabel}</h4>
                 <div className="h-3 w-full rounded-full bg-white/5 border border-white/5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentFormScore ?? 0) / 10) * 100}%` }}
                      className={`h-full rounded-full ${formColor.replace('text-', 'bg-')} shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]`}
                    />
                 </div>
              </div>
           </div>
           
           <div className="absolute top-0 right-0 p-8 flex flex-col items-end opacity-20 pointer-events-none">
              <Target className="h-24 w-24 text-white" />
           </div>
        </div>

        <div className="stat-card glass border-border/50 flex flex-col justify-center gap-4">
           <div className="space-y-1">
              <p className="label">Best Figures</p>
              <p className="value text-primary">{overallSummary.bestBowling}</p>
           </div>
           <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
              <div>
                 <p className="label">4w+ Hauls</p>
                 <p className="text-lg font-black">{overallSummary.fourWPlus}</p>
              </div>
              <div>
                 <p className="label">Lifetime Wkts</p>
                 <p className="text-lg font-black">{overallSummary.wickets}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Career Aggregates Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-6">
          {[
            { label: "Wickets Taken", value: overallSummary.wickets, highlight: true },
            { label: "Bowling Average", value: overallSummary.avg ?? "—" },
            { label: "Economy Rate", value: overallSummary.econ ?? "—" },
            { label: "Strike Rate", value: overallSummary.sr ?? "—" },
          ].map((s, i) => (
            <div key={i} className={`stat-card glass ${s.highlight ? "border-primary/30" : "border-border/50"}`}>
              <span className="label leading-none">{s.label}</span>
              <span className={`value mt-1 ${s.highlight ? "text-primary" : ""}`}>{s.value}</span>
            </div>
          ))}
      </div>

      {/* Form Progression Chart */}
      <div className="p-8 rounded-[2rem] glass border-border/50">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-secondary rounded-lg">
                <History className="h-4 w-4 text-muted-foreground" />
             </div>
             <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Impact Progression Analysis</h3>
          </div>
          
          <div className="flex gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5 max-w-[400px] overflow-x-auto no-scrollbar">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  selectedYear === y ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={recentForChart}>
            <XAxis dataKey="dateFormatted" hide />
            <YAxis yAxisId="wickets" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: "bold", fill: "hsl(var(--muted-foreground))" }} />
            <YAxis yAxisId="form" orientation="right" hide domain={[0, 10]} />
            <Tooltip
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl px-4 py-3 text-xs shadow-2xl ring-1 ring-white/10 min-w-[200px]">
                    <p className="font-black text-white/50 uppercase tracking-widest text-[10px] mb-2">{d.opponent}</p>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-2xl font-black">{d.bowl_wickets}/{d.bowl_runs}</span>
                       <span className={`text-base font-black ${getFormLabel(d.formScore).color}`}>{d.formScore} IDx</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground pt-2 border-t border-white/5">
                       <span>ECON: {d.econ}</span>
                       <span>OVERS: {d.bowl_overs}</span>
                    </div>
                  </div>
                );
              }}
            />
            <Line yAxisId="wickets" type="stepAfter" dataKey="bowl_wickets" stroke="hsl(var(--primary))" strokeWidth={5} dot={false} activeDot={{ r: 8, strokeWidth: 0, fill: "hsl(var(--primary))" }} />
            <Line yAxisId="form" type="monotone" dataKey="formScore" stroke="rgba(255,255,255,0.1)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
         {/* Annual Intensity Bar Chart */}
         <div className="p-8 rounded-[2rem] glass border-border/50">
            <div className="flex items-center gap-3 mb-8">
               <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-primary" />
               </div>
               <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Annual Deployment Yield</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={yearSummaries}>
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: "bold", fill: "hsl(var(--muted-foreground))" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: "bold", fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.05)" }}
                  contentStyle={{ background: "rgba(10, 10, 10, 0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "1.25rem", color: "#fff" }}
                />
                <Bar dataKey="wickets" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
         </div>

         {/* Detailed Ledger Table */}
         <div className="p-8 rounded-[2rem] glass border-border/50 overflow-hidden">
            <div className="flex items-center gap-3 mb-8">
               <div className="p-2 bg-secondary rounded-lg">
                  <Activity className="h-4 w-4 text-muted-foreground" />
               </div>
               <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Terminal Match Ledger</h3>
            </div>
            <div className="overflow-x-auto -mx-8 max-h-[400px] no-scrollbar overflow-y-auto">
               <table className="w-full">
                  <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground sticky top-0 z-10">
                     <tr>
                        <th className="px-8 py-4 text-left">Match Details</th>
                        <th className="px-8 py-4 text-right">Figures</th>
                        <th className="px-8 py-4 text-right">Momentum</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {[...filteredMatches].reverse().map((m, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors group">
                           <td className="px-8 py-4">
                              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{m.dateFormatted}</p>
                              <p className="text-xs font-bold truncate max-w-[200px]">{m.opponent}</p>
                           </td>
                           <td className="px-8 py-4 text-right">
                              <span className="font-black text-lg">{m.bowl_wickets}/{m.bowl_runs}</span>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase">{m.bowl_overs} Ov · {m.econ} EC</p>
                           </td>
                           <td className="px-8 py-4 text-right">
                              <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${getFormLabel(m.formScore).color} bg-white/5`}>{m.formScore}</span>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
}
