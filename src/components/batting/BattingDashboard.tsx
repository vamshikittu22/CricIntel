import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/batting/StatCard";
import { WagonWheel } from "@/components/batting/WagonWheel";
import { DismissalChart } from "@/components/batting/DismissalChart";
import { BallLengthMatrix } from "@/components/batting/BallLengthMatrix";
import { PaceVsSpin } from "@/components/batting/PaceVsSpin";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useMemo } from "react";

interface BattingDashboardProps {
  stats: any;
  deliveries: any[];
  format: string;
  isLoading?: boolean;
}

function getPhases(format: string) {
  if (format === "Test") {
    return [
      { name: "New Ball", min: 1, max: 20 },
      { name: "Middle", min: 21, max: 60 },
      { name: "Old Ball", min: 61, max: 999 },
    ];
  }
  if (format === "ODI") {
    return [
      { name: "Powerplay", min: 1, max: 10 },
      { name: "Middle", min: 11, max: 40 },
      { name: "Death", min: 41, max: 50 },
    ];
  }
  return [
    { name: "Powerplay", min: 1, max: 6 },
    { name: "Middle", min: 7, max: 15 },
    { name: "Death", min: 16, max: 20 },
  ];
}

export function BattingDashboard({ stats, deliveries, format, isLoading }: BattingDashboardProps) {
  const phaseData = useMemo(() => {
    if (!deliveries?.length) return [];
    const phases = getPhases(format);
    return phases.map((p) => {
      const balls = deliveries.filter((d) => d.over_number >= p.min && d.over_number <= p.max);
      const runs = balls.reduce((s, d) => s + d.runs_batter, 0);
      const totalBalls = balls.length;
      const sr = totalBalls > 0 ? +((runs / totalBalls) * 100).toFixed(1) : 0;
      const dismissals = balls.filter((d) => d.is_wicket).length;
      return { phase: p.name, runs, balls: totalBalls, sr, dismissals };
    });
  }, [deliveries, format]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-lg" />
          <Skeleton className="h-80 rounded-lg" />
        </div>
        <Skeleton className="h-60 rounded-lg" />
        <Skeleton className="h-60 rounded-lg" />
      </div>
    );
  }

  if (!stats) {
    return <EmptyState message={`No ${format} batting data available`} />;
  }

  const getPhaseBarColor = (sr: number) => {
    if (sr >= 150) return "hsl(var(--success))";
    if (sr >= 100) return "hsl(var(--primary))";
    return "hsl(var(--warning))";
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Matches" value={stats.matches ?? 0} />
        <StatCard label="Runs" value={stats.total_runs ?? 0} highlight />
        <StatCard label="Average" value={stats.average ?? "—"} />
        <StatCard label="Strike Rate" value={stats.strike_rate ?? "—"} />
        <StatCard label="4s" value={stats.fours ?? 0} />
        <StatCard label="6s" value={stats.sixes ?? 0} />
      </div>

      {deliveries && deliveries.length > 0 ? (
        <>
          {/* Wagon Wheel + Dismissal */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Scoring Zones</CardTitle>
              </CardHeader>
              <CardContent>
                <WagonWheel deliveries={deliveries} />
                <div className="flex justify-center gap-4 mt-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" /> Singles
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Fours
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Sixes
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Dismissal Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <DismissalChart analytics={stats} />
              </CardContent>
            </Card>
          </div>

          {/* Ball Length Matrix */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg">Ball Length Response</CardTitle>
            </CardHeader>
            <CardContent>
              <BallLengthMatrix deliveries={deliveries} />
            </CardContent>
          </Card>

          {/* Phase Performance Bar Chart */}
          {phaseData.length > 0 && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-lg">Phase Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={phaseData} barSize={48}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="phase" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg space-y-1">
                            <p className="font-semibold">{d.phase}</p>
                            <p>Runs: {d.runs} ({d.balls} balls)</p>
                            <p>SR: {d.sr}</p>
                            <p>Dismissals: {d.dismissals}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="sr" name="Strike Rate" radius={[6, 6, 0, 0]}>
                      {phaseData.map((entry, i) => (
                        <Cell key={i} fill={getPhaseBarColor(entry.sr)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
                  {phaseData.map((p) => (
                    <span key={p.phase}>
                      {p.runs}R in {p.balls}b ({p.dismissals}W)
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pace vs Spin */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Pace vs Spin</h3>
            <PaceVsSpin deliveries={deliveries} />
          </div>
        </>
      ) : (
        <EmptyState message={`No ball-by-ball data available for ${format}`} />
      )}
    </motion.div>
  );
}
