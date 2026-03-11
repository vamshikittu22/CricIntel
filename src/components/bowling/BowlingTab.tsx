import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/batting/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useMemo } from "react";
import type { PlayerSummary, PlayerMatchRow } from "@/lib/hooks/usePlayers";

interface BowlingTabProps {
  stats: PlayerSummary | null;
  recentMatches: PlayerMatchRow[];
  format: string;
  isLoading?: boolean;
}

export function BowlingTab({ stats, recentMatches, format, isLoading }: BowlingTabProps) {
  const processedBowling = useMemo(() => {
    return [...recentMatches]
      .filter((m) => m.is_bowler)
      .sort((a, b) => a.match_date.localeCompare(b.match_date))
      .map((m, i) => ({
        inning: i + 1,
        wickets: m.bowl_wickets,
        runs: m.bowl_runs,
        overs: m.bowl_overs,
        econ: +m.bowl_econ,
        date: m.match_date,
        year: m.match_date?.substring(0, 4) || "—",
        opponent: `${m.team1} vs ${m.team2}`,
      }));
  }, [recentMatches]);

  const yearStats = useMemo(() => {
    const map = new Map<string, { wickets: number; innings: number; runsTotal: number; econTotal: number }>();
    for (const m of processedBowling) {
      const y = m.year;
      if (!map.has(y)) map.set(y, { wickets: 0, innings: 0, runsTotal: 0, econTotal: 0 });
      const s = map.get(y)!;
      s.wickets += m.wickets;
      s.innings++;
      s.runsTotal += m.runs;
      s.econTotal += m.econ;
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, s]) => ({
        year,
        wickets: s.wickets,
        avgWickets: +(s.wickets / s.innings).toFixed(1),
        econ: +(s.econTotal / s.innings).toFixed(2),
      }));
  }, [processedBowling]);

  const recentTrend = useMemo(() => processedBowling.slice(-30), [processedBowling]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  const hasData = (stats && stats.innings_bowl > 0) || processedBowling.length > 0;

  if (!hasData) {
    return <EmptyState message={`No ${format} bowling data available`} />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Innings" value={stats?.innings_bowl ?? processedBowling.length} />
        <StatCard label="Wickets" value={stats?.wickets ?? processedBowling.reduce((a,b) => a+b.wickets, 0)} highlight />
        <StatCard label="Economy" value={stats?.econ ?? "—"} />
        <StatCard label="Average" value={stats?.bowl_average ?? "—"} />
        <StatCard label="Strike Rate" value={stats?.bowl_strike_rate ?? "—"} />
        <StatCard label="Overs" value={stats?.overs ?? processedBowling.reduce((a,b) => a+b.overs, 0)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Year-by-Year Wickets */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Year-by-Year Wickets
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={yearStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  itemStyle={{ fontSize: "12px" }}
                />
                <Bar dataKey="wickets" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Wickets Taken" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Bowling figures Trend */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Wicket Progression (Last 30)
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={recentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="inning" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis interval={1} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg space-y-1">
                        <p className="font-semibold">{d.opponent}</p>
                        <p className="text-destructive font-bold">{d.wickets} Wickets</p>
                        <p className="text-muted-foreground">{d.date}</p>
                        <p className="text-[10px]">Econ: {d.econ} · Overs: {d.overs}</p>
                      </div>
                    );
                  }}
                />
                <Line type="stepAfter" dataKey="wickets" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--destructive))" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stats Table */}
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Annual Bowling Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left">Year</th>
                  <th className="px-4 py-2.5 text-right">Wickets</th>
                  <th className="px-4 py-2.5 text-right">Wkts/Inn</th>
                  <th className="px-4 py-2.5 text-right">Avg Econ</th>
                </tr>
              </thead>
              <tbody>
                {yearStats.map((y) => (
                  <tr key={y.year} className="border-b border-border/30 hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium">{y.year}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-foreground">{y.wickets}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-destructive">{y.avgWickets}</td>
                    <td className="px-4 py-2.5 text-right">{y.econ}</td>
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
