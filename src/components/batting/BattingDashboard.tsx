import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/batting/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useMemo } from "react";
import type { PlayerSummary, PlayerMatchRow } from "@/lib/hooks/usePlayers";

interface BattingDashboardProps {
  stats: PlayerSummary | null;
  recentMatches: PlayerMatchRow[];
  format: string;
  isLoading?: boolean;
}

export function BattingDashboard({ stats, recentMatches, format, isLoading }: BattingDashboardProps) {
  const trendData = useMemo(() => {
    return [...recentMatches]
      .filter((m) => m.is_batter)
      .reverse()
      .slice(-15)
      .map((m, i) => ({
        inning: i + 1,
        runs: m.bat_runs,
        sr: m.bat_balls > 0 ? +((m.bat_runs / m.bat_balls) * 100).toFixed(1) : 0,
        date: m.match_date,
        opponent: `${m.team1} vs ${m.team2}`,
      }));
  }, [recentMatches]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  if (!stats) {
    return <EmptyState message={`No ${format} batting data available`} />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Matches" value={stats.matches} />
        <StatCard label="Runs" value={stats.runs} highlight />
        <StatCard label="Average" value={stats.average ?? "—"} />
        <StatCard label="Strike Rate" value={stats.strike_rate ?? "—"} />
        <StatCard label="4s" value={stats.fours} />
        <StatCard label="6s" value={stats.sixes} />
      </div>

      {trendData.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Recent Innings Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trendData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="inning" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg space-y-1">
                        <p className="font-semibold">{d.opponent}</p>
                        <p>Runs: {d.runs}</p>
                        <p>SR: {d.sr}</p>
                        <p className="text-muted-foreground">{d.date}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="runs" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {trendData.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Strike Rate Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="inning" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip />
                <Line type="monotone" dataKey="sr" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {trendData.length === 0 && (
        <EmptyState message={`No recent match data for ${format}`} />
      )}
    </motion.div>
  );
}
