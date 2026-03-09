import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getFlag } from "@/lib/countryFlags";
import { motion } from "framer-motion";
import { useState } from "react";

interface PlayerProfileCardProps {
  player: {
    name: string;
    country: string;
    role: string;
    batting_style: string;
    bowling_style: string;
    photo_url?: string | null;
  };
  stats?: {
    matches?: number | null;
    total_runs?: number | null;
    average?: number | null;
    strike_rate?: number | null;
  } | null;
  format: string;
  onFormatChange: (f: string) => void;
}

const roleColors: Record<string, string> = {
  batter: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  bowler: "bg-destructive/15 text-destructive border-destructive/30",
  "all-rounder": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "wicket-keeper": "bg-success/15 text-success border-success/30",
};

const formats = ["T20", "ODI", "Test"] as const;

export function PlayerProfileCard({ player, stats, format, onFormatChange }: PlayerProfileCardProps) {
  const formScore = stats
    ? Math.min(10, Math.max(1, ((stats.strike_rate || 0) / 20 + (stats.average || 0) / 15)))
    : 0;
  const formLabel = formScore >= 7 ? "Excellent" : formScore >= 5 ? "Good" : formScore > 0 ? "Poor" : "N/A";
  const formBadgeColor = formScore >= 7 ? "bg-success/20 text-success" : formScore >= 5 ? "bg-warning/20 text-warning" : "bg-destructive/20 text-destructive";

  const kpis = [
    { label: "Matches", value: stats?.matches ?? "—" },
    { label: "Runs", value: stats?.total_runs ?? "—" },
    { label: "Average", value: stats?.average ?? "—" },
    { label: "SR", value: stats?.strike_rate ?? "—" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden border-border">
        <CardContent className="p-6">
          {/* Top Row: Player info + Format toggle */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Photo / Flag */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-muted text-4xl ring-2 ring-primary/20">
                {player.photo_url ? (
                  <img src={player.photo_url} alt={player.name} className="h-full w-full object-cover rounded-2xl" />
                ) : (
                  getFlag(player.country)
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
                  {player.name}
                  <span className="text-2xl">{getFlag(player.country)}</span>
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <Badge variant="outline" className={`capitalize ${roleColors[player.role] || ""}`}>
                    {player.role}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{player.batting_style} bat</span>
                  {player.bowling_style !== "none" && (
                    <span className="text-sm text-muted-foreground">· {player.bowling_style}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Format Toggle Pill */}
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

          {/* KPI Boxes */}
          <div className="grid grid-cols-4 gap-3 mt-5">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-lg bg-secondary/50 border border-border p-3 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <p className="mt-1 text-xl font-bold">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Form Score Progress Bar */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Form Score</span>
              <Badge variant="outline" className={`text-xs ${formBadgeColor}`}>
                {formLabel}
              </Badge>
            </div>
            <Progress value={formScore * 10} className="h-2" />
            <p className="text-right text-xs text-muted-foreground mt-1">{formScore > 0 ? formScore.toFixed(1) : "—"}/10</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
