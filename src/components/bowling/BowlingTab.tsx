import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/batting/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { X, Target } from "lucide-react";

interface BowlingTabProps {
  analytics: any;
  deliveries: any[];
  format: string;
  playerRole: string;
  isLoading?: boolean;
}

// Cricket pitch SVG showing landing zones
function PitchHeatmap({ deliveries }: { deliveries: any[] }) {
  const zones = useMemo(() => {
    const lengthMap: Record<string, { count: number; wickets: number }> = {};
    deliveries.forEach((d) => {
      const l = d.ball_length || "unknown";
      if (!lengthMap[l]) lengthMap[l] = { count: 0, wickets: 0 };
      lengthMap[l].count++;
      if (d.is_wicket) lengthMap[l].wickets++;
    });
    return lengthMap;
  }, [deliveries]);

  // Map lengths to pitch Y positions
  const lengthPositions: Record<string, number> = {
    yorker: 280,
    full: 230,
    good: 170,
    short: 110,
    bouncer: 60,
  };

  const maxCount = Math.max(...Object.values(zones).map((z) => z.count), 1);

  return (
    <svg viewBox="0 0 120 340" className="w-full max-w-[200px] mx-auto">
      {/* Pitch background */}
      <rect x="20" y="20" width="80" height="300" rx="4" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="1" />
      {/* Crease lines */}
      <line x1="20" y1="290" x2="100" y2="290" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="3 2" />
      <line x1="20" y1="50" x2="100" y2="50" stroke="hsl(var(--muted-foreground))" strokeWidth="0.5" strokeDasharray="3 2" />
      {/* Stumps */}
      <rect x="50" y="290" width="20" height="4" rx="1" fill="hsl(var(--warning))" opacity="0.7" />
      <rect x="50" y="46" width="20" height="4" rx="1" fill="hsl(var(--warning))" opacity="0.7" />

      {/* Heatmap zones */}
      {Object.entries(zones)
        .filter(([k]) => k !== "unknown")
        .map(([length, data]) => {
          const y = lengthPositions[length] || 170;
          const opacity = Math.max(0.2, data.count / maxCount);
          const isHot = data.count / maxCount > 0.5;
          return (
            <g key={length}>
              <rect
                x="25"
                y={y - 20}
                width="70"
                height="40"
                rx="4"
                fill={isHot ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                opacity={opacity * 0.6}
              />
              <text x="60" y={y + 4} textAnchor="middle" fontSize="9" fill="hsl(var(--foreground))" fontWeight="600">
                {data.count}b
              </text>
              {/* Wicket crosses */}
              {data.wickets > 0 &&
                Array.from({ length: Math.min(data.wickets, 3) }).map((_, i) => (
                  <g key={i} transform={`translate(${35 + i * 18}, ${y - 12})`}>
                    <line x1="0" y1="0" x2="8" y2="8" stroke="hsl(var(--destructive))" strokeWidth="2" />
                    <line x1="8" y1="0" x2="0" y2="8" stroke="hsl(var(--destructive))" strokeWidth="2" />
                  </g>
                ))}
              <text x="60" y={y + 16} textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))" className="capitalize">
                {length}
              </text>
            </g>
          );
        })}
    </svg>
  );
}

// Wicket trigger card
function WicketCard({ delivery, index }: { delivery: any; index: number }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-destructive text-xs font-bold">
        W{index}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {delivery.players?.name || "Unknown"} — <span className="capitalize text-muted-foreground">{delivery.wicket_type?.replace(/-/g, " ")}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {delivery.ball_length || "?"} length · {delivery.ball_line?.replace(/-/g, " ") || "?"} · Over {delivery.over_number}
        </p>
      </div>
    </div>
  );
}

export function BowlingTab({ analytics, deliveries, format, playerRole, isLoading }: BowlingTabProps) {
  const isBowlerOrAllrounder = playerRole === "bowler" || playerRole === "all-rounder";

  if (!isBowlerOrAllrounder) {
    return <EmptyState message={`Bowling data is only shown for bowlers and all-rounders`} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <EmptyState message={`No ${format} bowling data available`} />;
  }

  // Economy by phase
  const phases = [
    { label: "Powerplay", min: 1, max: 6 },
    { label: "Middle", min: 7, max: 15 },
    { label: "Death", min: 16, max: 20 },
  ];
  const phaseData = phases.map((p) => {
    const balls = deliveries.filter((d) => d.over_number >= p.min && d.over_number <= p.max);
    const runs = balls.reduce((s, d) => s + d.runs_batter + d.runs_extras, 0);
    const wickets = balls.filter((d) => d.is_wicket && d.wicket_type !== "run-out").length;
    const economy = balls.length > 0 ? +(runs / balls.length * 6).toFixed(2) : 0;
    return { phase: p.label, economy, wickets, balls: balls.length };
  });

  // Last 20 wickets
  const wicketDeliveries = deliveries
    .filter((d) => d.is_wicket && d.wicket_type !== "run-out")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  const getEconColor = (econ: number) => {
    if (econ <= 6) return "hsl(var(--success))";
    if (econ <= 8) return "hsl(var(--warning))";
    return "hsl(var(--destructive))";
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Matches" value={analytics.matches ?? 0} />
        <StatCard label="Wickets" value={analytics.wickets ?? 0} highlight />
        <StatCard label="Economy" value={analytics.economy ?? "—"} />
        <StatCard label="Average" value={analytics.average ?? "—"} />
        <StatCard label="Strike Rate" value={analytics.strike_rate ?? "—"} />
        <StatCard label="Dots" value={analytics.dots ?? 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pitch Heatmap */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Delivery Landing Zones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PitchHeatmap deliveries={deliveries} />
            <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <X className="h-3 w-3 text-destructive" /> Wicket
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded bg-primary/50" /> Frequent
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Economy by Phase - Horizontal */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Economy by Phase</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={phaseData} layout="vertical" barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis type="category" dataKey="phase" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={80} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
                        <p className="font-semibold">{d.phase}</p>
                        <p>Economy: {d.economy}</p>
                        <p>Wickets: {d.wickets}</p>
                        <p>Balls: {d.balls}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="economy" radius={[0, 6, 6, 0]}>
                  {phaseData.map((entry, i) => (
                    <Cell key={i} fill={getEconColor(entry.economy)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
              {phaseData.map((p) => (
                <span key={p.phase}>{p.wickets}W in {p.balls}b</span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last 20 Wickets */}
      {wicketDeliveries.length > 0 && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Recent Wickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {wicketDeliveries.map((d, i) => (
                <WicketCard key={d.id || i} delivery={d} index={i + 1} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
