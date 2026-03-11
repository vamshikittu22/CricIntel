import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/batting/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { useMemo } from "react";
import type { PlayerSummary, PlayerMatchRow } from "@/lib/hooks/usePlayers";

interface BattingDashboardProps {
  stats: PlayerSummary | null;
  recentMatches: PlayerMatchRow[];
  format: string;
  isLoading?: boolean;
}

export function BattingDashboard({ stats, recentMatches, format, isLoading }: BattingDashboardProps) {
  const processedMatches = useMemo(() => {
    return [...recentMatches]
      .filter((m) => m.is_batter)
      .sort((a, b) => a.match_date.localeCompare(b.match_date))
      .map((m, i) => ({
        inning: i + 1,
        runs: m.bat_runs,
        sr: m.bat_balls > 0 ? +((m.bat_runs / m.bat_balls) * 100).toFixed(1) : 0,
        date: m.match_date,
        year: m.match_date?.substring(0, 4) || "—",
        opponent: `${m.team1} vs ${m.team2}`,
        isNotOut: m.bat_not_out,
      }));
  }, [recentMatches]);

  const yearStats = useMemo(() => {
    const map = new Map<string, { runs: number; innings: number; avg: number; srTotal: number }>();
    for (const m of processedMatches) {
      const y = m.year;
      if (!map.has(y)) map.set(y, { runs: 0, innings: 0, avg: 0, srTotal: 0 });
      const s = map.get(y)!;
      s.runs += m.runs;
      s.innings++;
      s.srTotal += m.sr;
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, s]) => ({
        year,
        runs: s.runs,
        avg: +(s.runs / s.innings).toFixed(1),
        sr: +(s.srTotal / s.innings).toFixed(1),
      }));
  }, [processedMatches]);

  const recentTrend = useMemo(() => processedMatches.slice(-30), [processedMatches]);

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

  if (!stats && processedMatches.length === 0) {
    return <EmptyState message={`No ${format} batting data available`} />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Matches" value={stats?.matches ?? processedMatches.length} />
        <StatCard label="Runs" value={stats?.runs ?? processedMatches.reduce((a,b) => a+b.runs, 0)} highlight />
        <StatCard label="Average" value={stats?.average ?? "—"} />
        <StatCard label="SR" value={stats?.strike_rate ?? "—"} />
        <StatCard label="4s" value={stats?.fours ?? "—"} />
        <StatCard label="6s" value={stats?.sixes ?? "—"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Year-by-Year View */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Year-by-Year Runs
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
                <Bar dataKey="runs" fill="hsl(210, 70%, 60%)" radius={[4, 4, 0, 0]} name="Runs Scored" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Form Trend */}
        <Card className="border-border/50">
          <CardHeader className="pb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Innings Progression (Last 30)
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={recentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="inning" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg space-y-1">
                        <p className="font-semibold">{d.opponent}</p>
                        <p className="text-primary font-bold">{d.runs}{d.isNotOut ? "*" : ""}</p>
                        <p className="text-muted-foreground">{d.date}</p>
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="runs" stroke="hsl(174, 72%, 40%)" strokeWidth={3} dot={{ r: 4, fill: "hsl(174, 72%, 40%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stats Table */}
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Annual Performances</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left">Year</th>
                  <th className="px-4 py-2.5 text-right">Runs</th>
                  <th className="px-4 py-2.5 text-right">Avg Runs</th>
                  <th className="px-4 py-2.5 text-right">Avg SR</th>
                </tr>
              </thead>
              <tbody>
                {yearStats.map((y) => (
                  <tr key={y.year} className="border-b border-border/30 hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium">{y.year}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-foreground">{y.runs}</td>
                    <td className="px-4 py-2.5 text-right">{y.avg}</td>
                    <td className="px-4 py-2.5 text-right">{y.sr}</td>
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
