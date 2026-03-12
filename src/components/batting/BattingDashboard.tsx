import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/batting/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { DismissalChart } from "@/components/batting/DismissalChart";
import { PaceVsSpin } from "@/components/batting/PaceVsSpin";
import { WagonWheel } from "@/components/batting/WagonWheel";
import { BallLengthMatrix } from "@/components/batting/BallLengthMatrix";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useMemo } from "react";
import { usePlayerVsBowling } from "@/lib/hooks/usePlayers";
import type { PlayerSummary, PlayerMatchRow } from "@/lib/hooks/usePlayers";

interface BattingDashboardProps {
  stats: PlayerSummary | null;
  recentMatches: PlayerMatchRow[];
  format: string;
  isLoading?: boolean;
}

export function BattingDashboard({ stats, recentMatches, format, isLoading: parentLoading }: BattingDashboardProps) {
  const { data: vsBowlingStats, isLoading: vsBowlingLoading } = usePlayerVsBowling(
    stats?.player_id, 
    format
  );

  const isLoading = parentLoading || vsBowlingLoading;

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
        <div className="grid gap-6 lg:grid-cols-2">
           <Skeleton className="h-80 rounded-lg" />
           <Skeleton className="h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!stats && processedMatches.length === 0) {
    return <EmptyState message={`No ${format} batting data available`} />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Matches" value={stats?.matches ?? processedMatches.length} />
        <StatCard label="Runs" value={stats?.runs ?? processedMatches.reduce((a,b) => a+b.runs, 0)} highlight />
        <StatCard label="Average" value={stats?.average ?? "—"} />
        <StatCard label="SR" value={stats?.strike_rate ?? "—"} />
        <StatCard label="4s" value={stats?.fours ?? "—"} />
        <StatCard label="6s" value={stats?.sixes ?? "—"} />
      </div>

      {/* Advanced Analysis Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dismissal Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <DismissalChart breakdown={stats?.dismissals_breakdown} />
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 px-1">Tactical Splits</h3>
          <PaceVsSpin stats={vsBowlingStats as any} />
        </div>
      </div>

      {/* Wagon Wheel & Matrix Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Wagon Wheel</CardTitle>
          </CardHeader>
          <CardContent>
            <WagonWheel deliveries={[]} />
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ball Length Response</CardTitle>
          </CardHeader>
          <CardContent>
            <BallLengthMatrix deliveries={[]} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Year-by-Year View */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Year-by-Year Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={yearStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                  itemStyle={{ fontSize: "12px" }}
                />
                <Bar dataKey="runs" fill="hsl(174, 72%, 40%)" radius={[4, 4, 0, 0]} name="Runs Scored" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Form Trend */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Innings Progression (Last 30)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={recentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="inning" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(val) => val === 100 ? "100" : val} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md px-3 py-2 text-xs shadow-xl ring-1 ring-white/10 space-y-1">
                        <p className="font-bold text-foreground">{d.opponent}</p>
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-primary font-black text-base">{d.runs}{d.isNotOut ? "*" : ""}</p>
                          <p className="text-[10px] text-muted-foreground">{d.date}</p>
                        </div>
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="runs" stroke="hsl(174, 72%, 40%)" strokeWidth={4} dot={{ r: 4, fill: "hsl(174, 72%, 40%)", strokeWidth: 2, stroke: "hsl(var(--card))" }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
