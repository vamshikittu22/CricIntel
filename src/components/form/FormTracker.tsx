import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea,
} from "recharts";
import { format as dateFmt } from "date-fns";
import type { PlayerMatchRow } from "@/lib/hooks/usePlayers";

interface FormTrackerProps {
  recentMatches: PlayerMatchRow[];
  format: string;
}

function calcFormScore(runs: number, sr: number, wickets?: number, economy?: number) {
  if (wickets !== undefined && economy !== undefined && wickets > 0) {
    const wScore = Math.min(10, wickets * 2.5);
    const eScore = economy < 6 ? 10 : economy < 8 ? 7 : economy < 10 ? 4 : 2;
    return +((wScore * 0.6 + eScore * 0.4)).toFixed(1);
  }
  return +Math.min(10, Math.max(1, (sr / 20 + runs / 15))).toFixed(1);
}

function getFormLabel(score: number) {
  if (score >= 7) return { label: "Good Form", color: "text-success" };
  if (score >= 5) return { label: "Average Form", color: "text-warning" };
  return { label: "Poor Form", color: "text-destructive" };
}

function getRowBg(runs: number) {
  if (runs >= 50) return "border-l-2 border-l-success bg-success/5";
  if (runs < 20) return "border-l-2 border-l-destructive bg-destructive/5";
  return "";
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl space-y-1">
      <p className="font-semibold text-foreground">{d?.opponent}</p>
      <p className="text-muted-foreground">{d?.venue}</p>
      <p className="text-primary">Runs: <span className="font-bold text-foreground">{d?.bat_runs}</span></p>
      <p className="text-teal-400">Form: <span className="font-bold">{d?.formScore}</span>/10</p>
    </div>
  );
};

export function FormTracker({ recentMatches, format }: FormTrackerProps) {
  const matchData = useMemo(() => {
    return [...recentMatches]
      .filter((m) => m.is_batter)
      .reverse()
      .slice(-10)
      .map((m) => {
        const sr = m.bat_balls > 0 ? +((m.bat_runs / m.bat_balls) * 100).toFixed(1) : 0;
        const formScore = calcFormScore(m.bat_runs, sr);
        return {
          ...m,
          sr,
          formScore,
          opponent: `${m.team1} vs ${m.team2}`,
          dateFormatted: m.match_date ? dateFmt(new Date(m.match_date), "d MMM") : "-",
        };
      });
  }, [recentMatches]);

  const currentFormScore = matchData.length ? matchData[matchData.length - 1].formScore : null;
  const { label: formLabel, color: formColor } = currentFormScore
    ? getFormLabel(currentFormScore)
    : { label: "No Data", color: "text-muted-foreground" };

  if (!matchData.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <div className="text-4xl">🏏</div>
        <p className="text-muted-foreground">No match-by-match data available for {format}.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Form Status Banner */}
      <Card className="border-border/50 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/40" />
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className={`text-5xl font-bold ${formColor}`}>{currentFormScore}</span>
                <div>
                  <p className={`text-lg font-semibold ${formColor}`}>{formLabel}</p>
                  <p className="text-xs text-muted-foreground">out of 10</p>
                </div>
              </div>
              <div className="h-2 w-48 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${((currentFormScore ?? 0) / 10) * 100}%`,
                    background: currentFormScore! >= 7 ? "hsl(var(--success))" : currentFormScore! >= 5 ? "hsl(var(--warning))" : "hsl(var(--destructive))",
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Form Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={matchData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dateFormatted" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="runs" orientation="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis yAxisId="form" orientation="right" domain={[0, 10]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <ReferenceArea yAxisId="runs" y1={50} y2={300} fill="hsl(var(--success))" fillOpacity={0.05} />
              <ReferenceArea yAxisId="runs" y1={0} y2={20} fill="hsl(var(--destructive))" fillOpacity={0.08} />
              <ReferenceLine yAxisId="runs" y={50} stroke="hsl(var(--success))" strokeDasharray="4 4" strokeOpacity={0.4} />
              <Tooltip content={<CustomTooltip />} />
              <Line yAxisId="runs" type="monotone" dataKey="bat_runs" stroke="hsl(210,70%,60%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(210,70%,60%)" }} name="Runs" />
              <Line yAxisId="form" type="monotone" dataKey="formScore" stroke="hsl(174,72%,40%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(174,72%,40%)" }} name="Form Score" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Match Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Match by Match</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Match</th>
                  <th className="text-right py-3 px-4 font-medium">Runs</th>
                  <th className="text-right py-3 px-4 font-medium">SR</th>
                  <th className="text-right py-3 px-4 font-medium">Form</th>
                </tr>
              </thead>
              <tbody>
                {[...matchData].reverse().map((m, i) => (
                  <tr key={i} className={`border-b border-border/30 transition-colors hover:bg-muted/30 ${getRowBg(m.bat_runs)}`}>
                    <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{m.dateFormatted}</td>
                    <td className="py-3 px-4 font-medium">{m.opponent}</td>
                    <td className="py-3 px-4 text-right font-bold">
                      {m.bat_runs >= 50 ? <span className="text-primary">{m.bat_runs}{m.bat_not_out && "*"}</span> : <span>{m.bat_runs}{m.bat_not_out && "*"}</span>}
                    </td>
                    <td className="py-3 px-4 text-right">{m.sr}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={m.formScore >= 7 ? "text-success font-bold" : m.formScore >= 5 ? "text-warning font-bold" : "text-destructive font-bold"}>
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
