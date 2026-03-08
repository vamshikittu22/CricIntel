import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/batting/StatCard";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface BowlingDashboardProps {
  analytics: any;
  deliveries: any[];
  format: string;
}

const COLORS = ["hsl(174,72%,40%)", "hsl(0,72%,51%)", "hsl(38,92%,50%)", "hsl(142,71%,45%)", "hsl(210,40%,60%)"];

export function BowlingDashboard({ analytics, deliveries, format }: BowlingDashboardProps) {
  if (!analytics) {
    return (
      <p className="text-center text-muted-foreground py-4">
        No {format} bowling data available
      </p>
    );
  }

  // Wicket type breakdown
  const wicketDeliveries = deliveries.filter((d) => d.is_wicket && d.wicket_type !== "run-out");
  const wicketTypes: Record<string, number> = {};
  wicketDeliveries.forEach((d) => {
    const t = d.wicket_type || "other";
    wicketTypes[t] = (wicketTypes[t] || 0) + 1;
  });
  const wicketPieData = Object.entries(wicketTypes).map(([name, value]) => ({ name, value }));

  // Economy by phase
  const phases = [
    { label: "Powerplay (1-6)", min: 1, max: 6 },
    { label: "Middle (7-15)", min: 7, max: 15 },
    { label: "Death (16-20)", min: 16, max: 20 },
  ];
  const phaseData = phases.map((p) => {
    const balls = deliveries.filter((d) => d.over_number >= p.min && d.over_number <= p.max);
    const runs = balls.reduce((s, d) => s + d.runs_batter + d.runs_extras, 0);
    const wickets = balls.filter((d) => d.is_wicket && d.wicket_type !== "run-out").length;
    const economy = balls.length > 0 ? (runs / balls.length) * 6 : 0;
    return { phase: p.label, economy: +economy.toFixed(2), wickets, balls: balls.length };
  });

  // Length distribution
  const lengthMap: Record<string, { balls: number; runs: number; wickets: number }> = {};
  deliveries.forEach((d) => {
    const l = d.ball_length || "unknown";
    if (!lengthMap[l]) lengthMap[l] = { balls: 0, runs: 0, wickets: 0 };
    lengthMap[l].balls++;
    lengthMap[l].runs += d.runs_batter;
    if (d.is_wicket) lengthMap[l].wickets++;
  });
  const lengthData = Object.entries(lengthMap)
    .filter(([k]) => k !== "unknown")
    .map(([name, v]) => ({
      name,
      economy: +((v.runs / v.balls) * 6).toFixed(2),
      wickets: v.wickets,
      balls: v.balls,
    }));

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="Matches" value={analytics.matches ?? 0} />
        <StatCard label="Wickets" value={analytics.wickets ?? 0} highlight />
        <StatCard label="Economy" value={analytics.economy ?? "-"} />
        <StatCard label="Average" value={analytics.average ?? "-"} />
        <StatCard label="Strike Rate" value={analytics.strike_rate ?? "-"} />
        <StatCard label="Dots" value={analytics.dots ?? 0} />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Wicket types pie */}
        {wicketPieData.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Wicket Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={wicketPieData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                    {wicketPieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Economy by phase */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Economy by Phase</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={phaseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="phase" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="economy" fill="hsl(174,72%,40%)" radius={[4, 4, 0, 0]} />
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

      {/* Length effectiveness */}
      {lengthData.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Length Effectiveness</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={lengthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="economy" fill="hsl(38,92%,50%)" radius={[4, 4, 0, 0]} name="Economy" />
                <Bar dataKey="wickets" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} name="Wickets" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
