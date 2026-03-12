import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { format as dateFmt } from "date-fns";
import type { PlayerMatchRow } from "@/lib/hooks/usePlayers";

interface BowlingFormTrackerProps {
  recentMatches: PlayerMatchRow[];
  format: string;
}

function calcBowlingFormScore(wickets: number, econ: number) {
  // Impact: Wickets are the primary metric
  let score = wickets * 3.0; // 2 wkts = 6.0, 3 wkts = 9.0
  
  // Milestone Bonuses
  if (wickets >= 5) score += 5.0;
  else if (wickets >= 3) score += 2.0;

  // Economy Bonuses (Format Agnostic Baseline)
  if (econ < 6.5) score += 3.0;
  else if (econ < 8.5) score += 1.5;
  else if (econ > 11.0) score -= 3.0;
  
  return +Math.min(10, Math.max(1, score)).toFixed(1);
}

function getFormLabel(score: number) {
  if (score >= 7) return { label: "Good Form", color: "text-emerald-400" };
  if (score >= 5) return { label: "Average Form", color: "text-yellow-400" };
  return { label: "Poor Form", color: "text-red-400" };
}

function getWicketsBg(wickets: number) {
  if (wickets >= 5) return "border-l-2 border-l-purple-500 bg-purple-500/5";
  if (wickets >= 3) return "border-l-2 border-l-emerald-500 bg-emerald-500/5";
  if (wickets === 0) return "border-l-2 border-l-red-500 bg-red-500/5";
  return "";
}

const WicketsTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl space-y-1">
      <p className="font-semibold text-foreground">{d?.year}</p>
      <p className="text-blue-400">Matches: <span className="font-bold text-foreground">{d?.matches}</span></p>
      <p className="text-emerald-400">Wickets: <span className="font-bold text-foreground">{d?.wickets}</span></p>
      <p className="text-yellow-400">Average: <span className="font-bold text-foreground">{d?.avg ?? "—"}</span></p>
      <p className="text-primary">Econ: <span className="font-bold text-foreground">{d?.econ ?? "—"}</span></p>
    </div>
  );
};

const MatchTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl space-y-1">
      <p className="font-semibold text-foreground">{d?.opponent}</p>
      <p className="text-muted-foreground">{d?.dateFormatted} · {d?.venue}</p>
      <p className="text-emerald-400">Figures: <span className="font-bold text-foreground">{d?.bowl_wickets}/{d?.bowl_runs}</span> ({d?.bowl_overs} overs)</p>
      <p className="text-blue-400">Econ: <span className="font-bold text-foreground">{d?.econ}</span></p>
    </div>
  );
};

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

  // Year-by-year summary
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

  // Overall career summary
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

  // Available years for filter
  const years = useMemo(() => ["All", ...yearSummaries.map((y) => y.year)], [yearSummaries]);

  // Filtered matches for table/chart
  const filteredMatches = useMemo(() =>
    selectedYear === "All" ? bowlingMatches : bowlingMatches.filter((m) => m.year === selectedYear),
    [bowlingMatches, selectedYear]);

  // Recent 20 for the form timeline chart
  const recentForChart = filteredMatches.slice(-20);

  const currentFormScore = recentForChart.length ? recentForChart[recentForChart.length - 1].formScore : null;
  const { label: formLabel, color: formColor } = currentFormScore
    ? getFormLabel(currentFormScore)
    : { label: "No Data", color: "text-muted-foreground" };

  if (!bowlingMatches.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="text-4xl">🏏</div>
        <p className="text-muted-foreground">No bowling data available for {format}.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* ── Overall Career Summary ── */}
      <Card className="border-border/50 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Overall Career Summary ({format})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 text-center">
            {[
              { label: "Innings", value: overallSummary.innings },
              { label: "Wickets", value: overallSummary.wickets },
              { label: "Average", value: overallSummary.avg ?? "—" },
              { label: "Economy", value: overallSummary.econ ?? "—" },
              { label: "Strike Rate", value: overallSummary.sr ?? "—" },
              { label: "4+ Wickets", value: overallSummary.fourWPlus },
              { label: "Best Bowling", value: overallSummary.bestBowling },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-muted/40 p-3">
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Current Form Status ── */}
      <Card className="border-border/50 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/40" />
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Form {selectedYear !== "All" ? `(${selectedYear})` : ""} — last 20 innings</p>
              <div className="flex items-center gap-3">
                <span className={`text-4xl font-bold ${formColor}`}>{currentFormScore ?? "—"}</span>
                <div>
                  <p className={`text-base font-semibold ${formColor}`}>{formLabel}</p>
                  <p className="text-xs text-muted-foreground">out of 10</p>
                </div>
              </div>
              <div className="h-2 w-48 rounded-full bg-muted overflow-hidden mt-1">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${((currentFormScore ?? 0) / 10) * 100}%`,
                    background: (currentFormScore ?? 0) >= 7 ? "hsl(var(--success))" : (currentFormScore ?? 0) >= 5 ? "hsl(var(--warning))" : "hsl(var(--destructive))",
                  }}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-right">
              {filteredMatches.length} innings<br />
              <span className="text-xs">{selectedYear === "All" ? "all years" : selectedYear}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── Form Timeline Chart ── */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Form Timeline {selectedYear !== "All" ? `— ${selectedYear}` : "— Last 20 Innings"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={recentForChart} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dateFormatted" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval="preserveStartEnd" />
              <YAxis yAxisId="wickets" orientation="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="form" orientation="right" domain={[0, 10]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <ReferenceLine yAxisId="wickets" y={3} stroke="hsl(var(--success))" strokeDasharray="4 4" strokeOpacity={0.4} />
              <Tooltip content={<MatchTooltip />} />
              <Legend />
              <Line yAxisId="wickets" type="monotone" dataKey="bowl_wickets" stroke="hsl(174,72%,45%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(174,72%,45%)" }} name="Wickets" />
              <Line yAxisId="form" type="monotone" dataKey="formScore" stroke="hsl(210,70%,60%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(210,70%,60%)" }} name="Form Score" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Year Filter Pills ── */}
      <div className="flex flex-wrap gap-2">
        {years.map((y) => (
          <button
            key={y}
            onClick={() => setSelectedYear(y)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
              selectedYear === y
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {y}
          </button>
        ))}
      </div>

      {/* ── Year-by-Year Bar Chart ── */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Year-by-Year Wickets</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={yearSummaries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip content={<WicketsTooltip />} />
              <Bar dataKey="wickets" fill="hsl(174,72%,45%)" radius={[4, 4, 0, 0]} name="Wickets" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ── Year-by-Year Stats Table ── */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Year-by-Year Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-4 font-medium">Year</th>
                  <th className="text-right py-3 px-4 font-medium">Matches</th>
                  <th className="text-right py-3 px-4 font-medium">Wickets</th>
                  <th className="text-right py-3 px-4 font-medium">Average</th>
                  <th className="text-right py-3 px-4 font-medium">Econ</th>
                </tr>
              </thead>
              <tbody>
                {yearSummaries.map((y) => (
                  <tr
                    key={y.year}
                    onClick={() => setSelectedYear(selectedYear === y.year ? "All" : y.year)}
                    className={`border-b border-border/30 transition-colors cursor-pointer hover:bg-muted/30 ${selectedYear === y.year ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
                  >
                    <td className="py-3 px-4 font-semibold">{y.year}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">{y.matches}</td>
                    <td className="py-3 px-4 text-right font-bold text-foreground">{y.wickets}</td>
                    <td className="py-3 px-4 text-right">{y.avg ?? "—"}</td>
                    <td className="py-3 px-4 text-right">{y.econ ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground px-4 py-2">💡 Click a year to filter the charts and match table below</p>
        </CardContent>
      </Card>

      {/* ── Match-by-Match Table ── */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Match by Match {selectedYear !== "All" ? `— ${selectedYear}` : `— All ${filteredMatches.length} innings`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Match</th>
                  <th className="text-right py-3 px-4 font-medium">Overs</th>
                  <th className="text-right py-3 px-4 font-medium">Runs</th>
                  <th className="text-right py-3 px-4 font-medium">Wickets</th>
                  <th className="text-right py-3 px-4 font-medium">Maidens</th>
                  <th className="text-right py-3 px-4 font-medium">Econ</th>
                  <th className="text-right py-3 px-4 font-medium">Form</th>
                </tr>
              </thead>
              <tbody>
                {[...filteredMatches].reverse().map((m, i) => (
                  <tr key={i} className={`border-b border-border/30 transition-colors hover:bg-muted/30 ${getWicketsBg(m.bowl_wickets)}`}>
                    <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap text-xs">{m.dateFormatted}</td>
                    <td className="py-2.5 px-4 font-medium text-xs max-w-[180px] truncate">{m.opponent}</td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground">{m.bowl_overs}</td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground">{m.bowl_runs}</td>
                    <td className="py-2.5 px-4 text-right font-bold">
                      {m.bowl_wickets >= 5
                        ? <span className="text-purple-400">{m.bowl_wickets}</span>
                        : m.bowl_wickets >= 3
                        ? <span className="text-emerald-400">{m.bowl_wickets}</span>
                        : <span>{m.bowl_wickets}</span>}
                    </td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground">{m.bowl_maidens}</td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground">{m.econ}</td>
                    <td className="py-2.5 px-4 text-right">
                      <span className={m.formScore >= 7 ? "text-emerald-400 font-bold" : m.formScore >= 5 ? "text-yellow-400 font-bold" : "text-red-400 font-bold"}>
                        {m.formScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
