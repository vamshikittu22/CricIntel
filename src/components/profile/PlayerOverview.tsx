import { Card, CardContent } from "@/components/ui/card";
import { Zap, Target, AlertTriangle, ShieldCheck, TrendingUp } from "lucide-react";

interface OverviewProps {
  battingStats?: {
    matches?: number | null;
    total_runs?: number | null;
    average?: number | null;
    strike_rate?: number | null;
    fours?: number | null;
    sixes?: number | null;
    dots?: number | null;
    balls_faced?: number | null;
    dismissals?: number | null;
  } | null;
  bowlingStats?: {
    wickets?: number | null;
    economy?: number | null;
    average?: number | null;
    strike_rate?: number | null;
    dots?: number | null;
    balls_bowled?: number | null;
  } | null;
  format: string;
}

interface InsightCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  borderColor: string;
}

export function PlayerOverview({ battingStats, bowlingStats, format }: OverviewProps) {
  const bs = battingStats;
  const bw = bowlingStats;

  const balls = bs?.balls_faced || 0;
  const dotPct = balls > 0 ? ((bs?.dots || 0) / balls * 100).toFixed(1) : "—";
  const boundaryPct = balls > 0 ? (((bs?.fours || 0) + (bs?.sixes || 0)) / balls * 100).toFixed(1) : "—";

  const quickStats = [
    { label: "Balls Faced", value: balls || "—" },
    { label: "Fours", value: bs?.fours ?? "—" },
    { label: "Sixes", value: bs?.sixes ?? "—" },
    { label: "Dot %", value: dotPct !== "—" ? `${dotPct}%` : "—" },
    { label: "Boundary %", value: boundaryPct !== "—" ? `${boundaryPct}%` : "—" },
  ];

  // Generate insights
  const insights: InsightCard[] = [];

  if (bs && (bs.strike_rate || 0) > 130) {
    insights.push({
      icon: <Zap className="h-5 w-5 text-success" />,
      title: "Aggressive Intent",
      description: `Strike rate of ${bs.strike_rate?.toFixed(1)} shows dominant attacking play in ${format}.`,
      borderColor: "border-l-success",
    });
  }

  if (bs && balls > 0 && (((bs.fours || 0) + (bs.sixes || 0)) / balls) > 0.15) {
    insights.push({
      icon: <Target className="h-5 w-5 text-primary" />,
      title: "Boundary Hitter",
      description: `${boundaryPct}% boundary rate — finds the fence consistently.`,
      borderColor: "border-l-primary",
    });
  }

  if (bs && balls > 0 && ((bs.dots || 0) / balls) > 0.45) {
    insights.push({
      icon: <AlertTriangle className="h-5 w-5 text-warning" />,
      title: "Dot Ball Pressure",
      description: `${dotPct}% dots — could face pressure in limited-overs games.`,
      borderColor: "border-l-warning",
    });
  }

  if (bw && (bw.economy || 0) > 0 && (bw.economy || 0) < 7) {
    insights.push({
      icon: <ShieldCheck className="h-5 w-5 text-success" />,
      title: "Economical Control",
      description: `Economy of ${bw.economy?.toFixed(2)} — restricts run flow effectively.`,
      borderColor: "border-l-success",
    });
  }

  if (bw && (bw.strike_rate || 0) > 0 && (bw.strike_rate || 0) < 25) {
    insights.push({
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      title: "Strike Bowler",
      description: `Bowling SR of ${bw.strike_rate?.toFixed(1)} — takes wickets at regular intervals.`,
      borderColor: "border-l-primary",
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: <Target className="h-5 w-5 text-muted-foreground" />,
      title: "Balanced Profile",
      description: `Steady performance in ${format} — no extreme strengths or weaknesses identified.`,
      borderColor: "border-l-muted-foreground",
    });
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {quickStats.map((s) => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insight Cards */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tactical Insights</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight, i) => (
            <Card key={i} className={`border-l-4 ${insight.borderColor}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{insight.icon}</div>
                  <div>
                    <p className="font-semibold text-sm">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
