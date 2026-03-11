import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getFlag } from "@/lib/countryFlags";
import { motion } from "framer-motion";
import type { PlayerSummary } from "@/lib/hooks/usePlayers";

interface PlayerProfileCardProps {
  player: {
    name: string;
    country: string;
  };
  stats?: PlayerSummary | null;
  format: string;
  onFormatChange: (f: string) => void;
}

const formats = ["T20I", "ODI", "Test", "IPL"] as const;

export function PlayerProfileCard({ player, stats, format, onFormatChange }: PlayerProfileCardProps) {
  const formScore = stats
    ? Math.min(10, Math.max(1, ((stats.strike_rate || 0) / 20 + (stats.average || 0) / 15)))
    : 0;
  const formLabel = formScore >= 7 ? "Excellent" : formScore >= 5 ? "Good" : formScore > 0 ? "Poor" : "N/A";
  const formBadgeColor = formScore >= 7 ? "bg-success/20 text-success" : formScore >= 5 ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive";

  const kpis = [
    { label: "Matches", value: stats?.matches ?? "—" },
    { label: "Runs", value: stats?.runs ?? "—" },
    { label: "Average", value: stats?.average ?? "—" },
    { label: "SR", value: stats?.strike_rate ?? "—" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden border-border">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-muted text-4xl ring-2 ring-primary/20">
                {getFlag(player.country)}
              </div>
              <div>
                <h1 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
                  {player.name}
                  <span className="text-2xl">{getFlag(player.country)}</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{player.country}</p>
              </div>
            </div>

            <div className="flex rounded-full border border-border bg-secondary p-0.5">
              {formats.map((f) => (
                <button
                  key={f}
                  onClick={() => onFormatChange(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    format === f
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-5">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-lg bg-secondary/50 border border-border p-3 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <p className="mt-1 text-xl font-bold">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Form Score</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${formBadgeColor}`}>{formLabel}</span>
            </div>
            <Progress value={formScore * 10} className="h-2" />
            <p className="text-right text-xs text-muted-foreground mt-1">{formScore > 0 ? formScore.toFixed(1) : "—"}/10</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
