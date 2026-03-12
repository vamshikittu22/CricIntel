import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/batting/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { useMemo } from "react";
import { usePlayerPhaseStats } from "@/lib/hooks/usePlayers";
import type { PlayerSummary, PlayerMatchRow } from "@/lib/hooks/usePlayers";
import { Zap, Shield, Target } from "lucide-react";

interface BowlingTabProps {
  stats: PlayerSummary | null;
  recentMatches: PlayerMatchRow[];
  format: string;
  isLoading: boolean;
}

export function BowlingTab({ stats, recentMatches, format, isLoading: parentLoading }: BowlingTabProps) {
  const { data: phaseStats, isLoading: phaseLoading } = usePlayerPhaseStats(stats?.player_id, format);
  
  const isLoading = parentLoading || phaseLoading;

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
        <Skeleton className="h-80 rounded-lg" />
      </div>
    );
  }

  const hasData = (stats && stats.innings_bowl > 0) || processedBowling.length > 0;
  if (!hasData) {
    return <EmptyState message={`No ${format} bowling data available`} />;
  }

  const ppStats = phaseStats?.find(p => p.phase === "powerplay");
  const midStats = phaseStats?.find(p => p.phase === "middle");
  const deathStats = phaseStats?.find(p => p.phase === "death");

  const calcEcon = (runs: number, balls: number) => {
    if (balls === 0) return "—";
    return ((runs / balls) * 6).toFixed(2);
  };

  const phaseData = [
    { name: "Powerplay", econ: ppStats ? calcEcon(ppStats.bowl_runs, ppStats.bowl_balls) : "—", wickets: ppStats?.bowl_wickets ?? 0, icon: <Zap className="h-4 w-4 text-amber-500" /> },
    { name: "Middle", econ: midStats ? calcEcon(midStats.bowl_runs, midStats.bowl_balls) : "—", wickets: midStats?.bowl_wickets ?? 0, icon: <Shield className="h-4 w-4 text-blue-500" /> },
    { name: "Death", econ: deathStats ? calcEcon(deathStats.bowl_runs, deathStats.bowl_balls) : "—", wickets: deathStats?.bowl_wickets ?? 0, icon: <Target className="h-4 w-4 text-rose-500" /> },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
        <StatCard label="Wickets" value={stats?.wickets ?? 0} highlight />
        <StatCard label="Economy" value={stats?.econ ?? "—"} />
        <StatCard label="Best Figures" value={stats?.bowl_best_figures ?? "—"} />
        <StatCard label="5W Hauls" value={stats?.bowl_five_wickets ?? 0} />
        <StatCard label="Average" value={stats?.bowl_average ?? "—"} />
        <StatCard label="Strike Rate" value={stats?.bowl_strike_rate ?? "—"} />
        <StatCard label="Innings" value={stats?.innings_bowl ?? 0} />
        <StatCard label="Overs" value={stats?.overs ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Phase Breakdown */}
        <Card className="border-border/50 bg-card/50 lg:col-span-1">
          <CardHeader className="pb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Phase Breakdown
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {phaseData.map((p) => (
              <div key={p.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-background/50">{p.icon}</div>
                  <div>
                    <p className="text-xs font-bold">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Econ: {p.econ}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-foreground">{p.wickets}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Wkts</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Year-by-Year Wickets */}
        <Card className="border-border/50 bg-card/50 lg:col-span-2">
          <CardHeader className="pb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Year-by-Year Wickets
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
                <Bar dataKey="wickets" fill="hsl(339, 81%, 55%)" radius={[4, 4, 0, 0]} name="Wickets Taken" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Bowling figures Trend */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
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
                      <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md px-3 py-2 text-xs shadow-xl ring-1 ring-white/10 space-y-1">
                        <p className="font-bold text-foreground">{d.opponent}</p>
                        <div className="flex items-center justify-between">
                           <p className="text-destructive font-black text-base">{d.wickets} Wkts</p>
                           <p className="text-[10px] text-muted-foreground">{d.date}</p>
                        </div>
                        <div className="flex gap-3 text-[10px] font-bold text-muted-foreground pt-1 border-t border-border/20">
                          <span>EC: {d.econ}</span>
                          <span>OV: {d.overs}</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Line type="stepAfter" dataKey="wickets" stroke="hsl(339, 81%, 55%)" strokeWidth={4} dot={{ r: 4, fill: "hsl(339, 81%, 55%)", strokeWidth: 2, stroke: "hsl(var(--card))" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stats Table */}
        <Card className="border-border/50 bg-card/50 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Annual Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Year</th>
                    <th className="px-4 py-3 text-right">Wickets</th>
                    <th className="px-4 py-3 text-right">Wkts/Inn</th>
                    <th className="px-4 py-3 text-right">Avg Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {yearStats.map((y) => (
                    <tr key={y.year} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-bold">{y.year}</td>
                      <td className="px-4 py-3 text-right font-black text-destructive">{y.wickets}</td>
                      <td className="px-4 py-3 text-right font-medium">{y.avgWickets}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{y.econ}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
