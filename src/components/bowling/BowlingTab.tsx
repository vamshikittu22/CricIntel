import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/batting/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";
import type { PlayerSummary, PlayerMatchRow } from "@/lib/hooks/usePlayers";

interface BowlingTabProps {
  stats: PlayerSummary | null;
  recentMatches: PlayerMatchRow[];
  format: string;
  isLoading?: boolean;
}

export function BowlingTab({ stats, recentMatches, format, isLoading }: BowlingTabProps) {
  const hasData = stats && stats.innings_bowl > 0;

  const wicketTrend = useMemo(() => {
    return [...recentMatches]
      .filter((m) => m.is_bowler)
      .reverse()
      .slice(-15)
      .map((m, i) => ({
        inning: i + 1,
        wickets: m.bowl_wickets,
        econ: +m.bowl_econ,
        opponent: `${m.team1} vs ${m.team2}`,
        date: m.match_date,
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

  if (!hasData) {
    return <EmptyState message={`No ${format} bowling data available`} />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Innings" value={stats.innings_bowl} />
        <StatCard label="Wickets" value={stats.wickets} highlight />
        <StatCard label="Economy" value={stats.econ ?? "—"} />
        <StatCard label="Average" value={stats.bowl_average ?? "—"} />
        <StatCard label="SR" value={stats.bowl_strike_rate ?? "—"} />
        <StatCard label="Overs" value={stats.overs} />
      </div>

      {wicketTrend.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Recent Bowling Figures</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={wicketTrend} barSize={32}>
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
                        <p>Wickets: {d.wickets}</p>
                        <p>Economy: {d.econ}</p>
                        <p className="text-muted-foreground">{d.date}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="wickets" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
