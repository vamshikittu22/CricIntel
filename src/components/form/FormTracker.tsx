import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { format as dateFmt } from "date-fns";

interface FormTrackerProps {
  deliveries: any[];
  playerRole: string;
  format: string;
}

function calcFormScore(runs: number, sr: number, wickets?: number, economy?: number) {
  if (wickets !== undefined && economy !== undefined) {
    // bowler form
    const wScore = Math.min(10, wickets * 2.5);
    const eScore = economy < 6 ? 10 : economy < 8 ? 7 : economy < 10 ? 4 : 2;
    return +((wScore * 0.6 + eScore * 0.4)).toFixed(1);
  }
  return Math.min(10, Math.max(1, (sr / 20 + runs / 15))).toFixed(1);
}

function getFormLabel(score: number): { label: string; color: string } {
  if (score >= 9) return { label: "Excellent Form", color: "text-success" };
  if (score >= 7) return { label: "Good Form", color: "text-success" };
  if (score >= 5) return { label: "Average Form", color: "text-warning" };
  if (score >= 3) return { label: "Poor Form", color: "text-destructive" };
  return { label: "Out of Form", color: "text-destructive" };
}

function getRowBg(runs: number, wickets?: number) {
  if (wickets !== undefined) {
    if (wickets >= 3) return "border-l-2 border-l-success bg-success/5";
    if (wickets === 0) return "border-l-2 border-l-destructive bg-destructive/5";
    return "";
  }
  if (runs >= 50) return "border-l-2 border-l-success bg-success/5";
  if (runs < 20) return "border-l-2 border-l-destructive bg-destructive/5";
  return "";
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-border/50 bg-card px-3 py-2 text-xs shadow-xl space-y-1">
      <p className="font-semibold text-foreground">{d?.matchLabel}</p>
      <p className="text-muted-foreground">{d?.venue}</p>
      {d?.runs !== undefined && <p className="text-primary">Runs: <span className="font-bold text-foreground">{d.runs}</span></p>}
      {d?.wickets !== undefined && <p className="text-primary">Wickets: <span className="font-bold text-foreground">{d.wickets}</span></p>}
      <p className="text-teal-400">Form Score: <span className="font-bold">{d?.formScore}</span>/10</p>
    </div>
  );
};

export function FormTracker({ deliveries, playerRole, format }: FormTrackerProps) {
  const isBowler = playerRole === "bowler";

  // Group deliveries by match
  const matchData = useMemo(() => {
    const map = new Map<string, { deliveries: any[]; match: any }>();
    deliveries.forEach((d) => {
      const mid = d.match_id;
      if (!map.has(mid)) map.set(mid, { deliveries: [], match: d.matches });
      map.get(mid)!.deliveries.push(d);
    });

    const rows: any[] = [];
    map.forEach(({ deliveries: mds, match }) => {
      if (!match) return;
      const runs = mds.reduce((s: number, d: any) => s + (d.runs_batter || 0), 0);
      const balls = mds.length;
      const sr = balls > 0 ? +(runs / balls * 100).toFixed(1) : 0;
      const wickets = mds.filter((d: any) => d.is_wicket && d.wicket_type !== "run-out").length;
      const runsConceded = mds.reduce((s: number, d: any) => s + (d.runs_batter || 0) + (d.runs_extras || 0), 0);
      const economy = balls > 0 ? +(runsConceded / balls * 6).toFixed(2) : 0;
      const dismissalType = mds.find((d: any) => d.is_wicket && d.wicket_type)?.wicket_type;

      const formScore = isBowler
        ? +calcFormScore(0, 0, wickets, economy)
        : +calcFormScore(runs, sr);

      const opponent = match.team1 || match.team2 || "Unknown";
      rows.push({
        matchId: match.id || Math.random(),
        date: match.match_date,
        opponent,
        venue: match.venue || "-",
        runs,
        balls,
        sr,
        wickets,
        economy,
        dismissalType,
        formScore,
        result: match.result || "-",
        matchLabel: `vs ${opponent}`,
        format: match.format,
      });
    });

    return rows
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10);
  }, [deliveries, isBowler]);

  const currentFormScore = matchData.length ? matchData[matchData.length - 1].formScore : null;
  const { label: formLabel, color: formColor } = currentFormScore
    ? getFormLabel(currentFormScore)
    : { label: "No Data", color: "text-muted-foreground" };

  const chartData = matchData.map((m) => ({
    ...m,
    date: m.date ? dateFmt(new Date(m.date), "d MMM") : "-",
  }));

  const recentScores = matchData.slice(-3).map((m) =>
    isBowler ? `${m.wickets}W` : `${m.runs}R`
  );

  const streak = (() => {
    if (!matchData.length) return null;
    const last = [...matchData].reverse();
    if (isBowler) {
      let count = 0;
      for (const m of last) {
        if (m.wickets >= 2) count++;
        else break;
      }
      return count >= 2 ? `${count} consecutive multi-wicket hauls` : null;
    } else {
      let fiftyStreak = 0, duckStreak = 0;
      for (const m of last) {
        if (m.runs >= 50) fiftyStreak++;
        else break;
      }
      for (const m of last) {
        if (m.runs < 20) duckStreak++;
        else break;
      }
      if (fiftyStreak >= 2) return `${fiftyStreak} consecutive 50+ scores`;
      if (duckStreak >= 2) return `${duckStreak} consecutive low scores (under 20)`;
      return null;
    }
  })();

  const lastMatchDays = matchData.length
    ? Math.floor((Date.now() - new Date(matchData[matchData.length - 1].date).getTime()) / 86400000)
    : null;

  if (!matchData.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="text-4xl">🏏</div>
        <p className="text-muted-foreground">No match-by-match data available for {format} format.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Form Status Banner */}
      <Card className="border-border/50 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/40" />
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <span className={`font-heading text-5xl font-bold ${formColor}`}>
                  {currentFormScore}
                </span>
                <div>
                  <p className={`font-heading text-lg font-semibold ${formColor}`}>{formLabel}</p>
                  <p className="text-xs text-muted-foreground">out of 10</p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full max-w-xs rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${((currentFormScore ?? 0) / 10) * 100}%`,
                    background: currentFormScore! >= 7
                      ? "hsl(var(--success))"
                      : currentFormScore! >= 5
                      ? "hsl(var(--warning))"
                      : "hsl(var(--destructive))",
                  }}
                />
              </div>
              {recentScores.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Last 3 matches:{" "}
                  <span className="text-foreground font-medium">{recentScores.join(", ")}</span>
                </p>
              )}
              {streak && (
                <p className="text-sm font-medium text-primary">🔥 {streak}</p>
              )}
              {lastMatchDays !== null && (
                <p className="text-xs text-muted-foreground">
                  Last {format} match:{" "}
                  <span className="text-foreground">{lastMatchDays === 0 ? "today" : `${lastMatchDays} days ago`}</span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Timeline Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Form Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                yAxisId="runs"
                orientation="left"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                label={{ value: isBowler ? "Wickets" : "Runs", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }}
              />
              <YAxis
                yAxisId="form"
                orientation="right"
                domain={[0, 10]}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                label={{ value: "Form", angle: 90, position: "insideRight", style: { fontSize: 10, fill: "hsl(var(--muted-foreground))" } }}
              />
              {/* Reference bands */}
              {!isBowler && (
                <>
                  <ReferenceArea yAxisId="runs" y1={50} y2={300} fill="hsl(var(--success))" fillOpacity={0.05} />
                  <ReferenceArea yAxisId="runs" y1={0} y2={20} fill="hsl(var(--destructive))" fillOpacity={0.08} />
                  <ReferenceLine yAxisId="runs" y={50} stroke="hsl(var(--success))" strokeDasharray="4 4" strokeOpacity={0.4} />
                  <ReferenceLine yAxisId="runs" y={20} stroke="hsl(var(--destructive))" strokeDasharray="4 4" strokeOpacity={0.4} />
                </>
              )}
              <Tooltip content={<CustomTooltip />} />
              <Line
                yAxisId="runs"
                type="monotone"
                dataKey={isBowler ? "wickets" : "runs"}
                stroke="hsl(210,70%,60%)"
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(210,70%,60%)" }}
                name={isBowler ? "Wickets" : "Runs"}
              />
              <Line
                yAxisId="form"
                type="monotone"
                dataKey="formScore"
                stroke="hsl(174,72%,40%)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "hsl(174,72%,40%)" }}
                name="Form Score"
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400 inline-block" />
              {isBowler ? "Wickets" : "Runs"}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-500 inline-block" />
              Form Score
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Match by Match Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Match by Match</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Opponent</th>
                  <th className="text-left py-3 px-4 font-medium hidden sm:table-cell">Venue</th>
                  {isBowler ? (
                    <>
                      <th className="text-right py-3 px-4 font-medium">Wickets</th>
                      <th className="text-right py-3 px-4 font-medium">Economy</th>
                    </>
                  ) : (
                    <>
                      <th className="text-right py-3 px-4 font-medium">Runs</th>
                      <th className="text-right py-3 px-4 font-medium">SR</th>
                      <th className="text-right py-3 px-4 font-medium hidden sm:table-cell">Dismissal</th>
                    </>
                  )}
                  <th className="text-right py-3 px-4 font-medium">Form</th>
                </tr>
              </thead>
              <tbody>
                {[...matchData].reverse().map((m, i) => (
                  <tr
                    key={i}
                    className={`border-b border-border/30 transition-colors hover:bg-muted/30 ${
                      isBowler ? getRowBg(0, m.wickets) : getRowBg(m.runs)
                    }`}
                  >
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                      {m.date ? dateFmt(new Date(m.date), "d MMM yy") : "-"}
                    </td>
                    <td className="py-3 px-4 font-medium">{m.opponent}</td>
                    <td className="py-3 px-4 text-muted-foreground hidden sm:table-cell truncate max-w-[160px]">{m.venue}</td>
                    {isBowler ? (
                      <>
                        <td className="py-3 px-4 text-right font-bold">{m.wickets}W</td>
                        <td className="py-3 px-4 text-right">{m.economy}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 px-4 text-right font-bold">{m.runs}</td>
                        <td className="py-3 px-4 text-right">{m.sr}</td>
                        <td className="py-3 px-4 text-right text-muted-foreground capitalize hidden sm:table-cell">
                          {m.dismissalType?.replace(/-/g, " ") || "not out"}
                        </td>
                      </>
                    )}
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-bold ${
                          m.formScore >= 7
                            ? "text-success"
                            : m.formScore >= 5
                            ? "text-warning"
                            : "text-destructive"
                        }`}
                      >
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
