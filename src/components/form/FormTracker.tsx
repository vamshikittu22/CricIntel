import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import { format as dateFmt } from "date-fns";
import type { PlayerMatchRow } from "@/lib/hooks/usePlayers";

interface FormTrackerProps {
  recentMatches: PlayerMatchRow[];
  format: string;
}

function calcFormScore(runs: number, sr: number, notOut: boolean) {
  // Base score from runs (e.g. 50 runs -> 5.0)
  let score = runs / 10.0;
  
  // Milestones
  if (runs >= 100) score += 5.0;
  else if (runs >= 50) score += 3.0;
  else if (runs >= 30) score += 1.5;
  
  // Strike Rate Performance
  if (sr > 180) score += 4.0;
  else if (sr > 140) score += 2.0;
  else if (sr < 100 && runs > 0) score -= 2.0;

  // Reliability
  if (notOut && runs > 15) score += 1.5;
  
  return +Math.min(10, Math.max(1, score)).toFixed(1);
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

function getRunsBg(runs: number) {
  if (runs >= 100) return "border-l-2 border-l-purple-500 bg-purple-500/5";
  if (runs >= 50) return "border-l-2 border-l-emerald-500 bg-emerald-500/5";
  if (runs < 20) return "border-l-2 border-l-red-500 bg-red-500/5";
  return "";
}

const RunsTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl space-y-1">
      <p className="font-semibold text-foreground">{d?.year}</p>
      <p className="text-blue-400">Matches: <span className="font-bold text-foreground">{d?.matches}</span></p>
      <p className="text-emerald-400">Runs: <span className="font-bold text-foreground">{d?.runs}</span></p>
      <p className="text-yellow-400">Average: <span className="font-bold text-foreground">{d?.avg ?? "—"}</span></p>
      <p className="text-primary">SR: <span className="font-bold text-foreground">{d?.sr ?? "—"}</span></p>
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
      <p className="text-blue-400">Runs: <span className="font-bold text-foreground">{d?.bat_runs}{d?.bat_not_out ? "*" : ""}</span></p>
      <p className="text-emerald-400">SR: <span className="font-bold text-foreground">{d?.sr}</span></p>
    </div>
  );
};

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
      }), [recentMatches]);

  // Year-by-year summary
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

  // Overall career summary
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

  // Available years for filter
  const years = useMemo(() => ["All", ...yearSummaries.map((y) => y.year)], [yearSummaries]);

  // Filtered matches for table/chart
  const filteredMatches = useMemo(() =>
    selectedYear === "All" ? battingMatches : battingMatches.filter((m) => m.year === selectedYear),
    [battingMatches, selectedYear]);

  // Recent 20 for the form timeline chart
  const recentForChart = filteredMatches.slice(-20);

  const currentFormScore = recentForChart.length ? recentForChart[recentForChart.length - 1].formScore : null;
  const { label: formLabel, color: formColor } = currentFormScore
    ? getFormLabel(currentFormScore)
    : { label: "No Data", color: "text-muted-foreground" };

  if (!battingMatches.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="text-4xl">🏏</div>
        <p className="text-muted-foreground">No batting data available for {format}.</p>
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
              { label: "Runs", value: overallSummary.runs },
              { label: "Average", value: overallSummary.avg ?? "—" },
              { label: "Strike Rate", value: overallSummary.sr ?? "—" },
              { label: "50s", value: overallSummary.fifties },
              { label: "100s", value: overallSummary.hundreds },
              { label: "High Score", value: overallSummary.highScore },
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
              <YAxis yAxisId="runs" orientation="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="form" orientation="right" domain={[0, 10]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <ReferenceLine yAxisId="runs" y={50} stroke="hsl(var(--success))" strokeDasharray="4 4" strokeOpacity={0.4} />
              <Tooltip content={<MatchTooltip />} />
              <Legend />
              <Line yAxisId="runs" type="monotone" dataKey="bat_runs" stroke="hsl(210,70%,60%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(210,70%,60%)" }} name="Runs" />
              <Line yAxisId="form" type="monotone" dataKey="formScore" stroke="hsl(174,72%,40%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(174,72%,40%)" }} name="Form Score" />
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
          <CardTitle className="text-base">Year-by-Year Runs</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={yearSummaries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip content={<RunsTooltip />} />
              <Bar dataKey="runs" fill="hsl(210,70%,60%)" radius={[4, 4, 0, 0]} name="Runs" />
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
                  <th className="text-right py-3 px-4 font-medium">Runs</th>
                  <th className="text-right py-3 px-4 font-medium">Average</th>
                  <th className="text-right py-3 px-4 font-medium">SR</th>
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
                    <td className="py-3 px-4 text-right font-bold text-foreground">{y.runs}</td>
                    <td className="py-3 px-4 text-right">{y.avg ?? "—"}</td>
                    <td className="py-3 px-4 text-right">{y.sr ?? "—"}</td>
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
                  <th className="text-right py-3 px-4 font-medium">Runs</th>
                  <th className="text-right py-3 px-4 font-medium">Balls</th>
                  <th className="text-right py-3 px-4 font-medium">SR</th>
                  <th className="text-right py-3 px-4 font-medium">4s</th>
                  <th className="text-right py-3 px-4 font-medium">6s</th>
                  <th className="text-right py-3 px-4 font-medium">Form</th>
                </tr>
              </thead>
              <tbody>
                {[...filteredMatches].reverse().map((m, i) => (
                  <tr key={i} className={`border-b border-border/30 transition-colors hover:bg-muted/30 ${getRunsBg(m.bat_runs)}`}>
                    <td className="py-2.5 px-4 text-muted-foreground whitespace-nowrap text-xs">{m.dateFormatted}</td>
                    <td className="py-2.5 px-4 font-medium text-xs max-w-[180px] truncate">{m.opponent}</td>
                    <td className="py-2.5 px-4 text-right font-bold">
                      {m.bat_runs >= 100
                        ? <span className="text-purple-400">{m.bat_runs}{m.bat_not_out && "*"}</span>
                        : m.bat_runs >= 50
                        ? <span className="text-emerald-400">{m.bat_runs}{m.bat_not_out && "*"}</span>
                        : <span>{m.bat_runs}{m.bat_not_out && "*"}</span>}
                    </td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground">{m.bat_balls}</td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground">{m.sr}</td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground">{m.bat_fours}</td>
                    <td className="py-2.5 px-4 text-right text-muted-foreground">{m.bat_sixes}</td>
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
