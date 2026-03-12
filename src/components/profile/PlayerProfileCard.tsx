import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getFlag } from "@/lib/countryFlags";
import { motion } from "framer-motion";
import type { Player, PlayerSummary } from "@/lib/hooks/usePlayers";

interface PlayerProfileCardProps {
  player: Player | null;
  stats?: PlayerSummary | null;
  format: string;
  onFormatChange: (f: string) => void;
  isLoading?: boolean;
}

const formats = ["T20I", "T20", "ODI", "Test", "IPL"] as const;

export function PlayerProfileCard({ player, stats, format, onFormatChange, isLoading }: PlayerProfileCardProps) {
  if (isLoading || !player) {
    return (
      <div className="glass rounded-3xl p-8 animate-pulse border border-border">
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-3xl" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>
      </div>
    );
  }

  const calculateForm = () => {
    if (!stats) return 0;
    if (player.role === "bowl") {
      const econScore = Math.max(0, (9 - (stats.econ || 9)) * 1.2);
      const srScore = stats.bowl_strike_rate ? Math.max(0, (35 - stats.bowl_strike_rate) / 3) : 0;
      const fiveW = (stats.bowl_five_wickets || 0) * 2.5;
      return Math.min(10, Math.max(1, econScore + srScore + fiveW));
    }
    const batScore = (stats.strike_rate || 0) / 25 + (stats.average || 0) / 12 + (stats.hundreds || 0) * 2;
    if (player.role === "allrounder") {
      const bowlScore = Math.max(0, (9 - (stats.econ || 9)) * 1.0) + (stats.bowl_strike_rate ? Math.max(0, (40 - stats.bowl_strike_rate) / 5) : 0);
      return Math.min(10, Math.max(1, (batScore * 0.6) + (bowlScore * 0.4)));
    }
    return Math.min(10, Math.max(1, batScore));
  };

  const formScore = calculateForm();
  const formStatus = formScore >= 8 ? "Elite" : formScore >= 6.5 ? "Strong" : formScore >= 4 ? "Stable" : "Poor";
  const formColor = formScore >= 8 ? "bg-success" : formScore >= 5 ? "bg-warning" : "bg-destructive";

  const kpis = [
    { label: "Matches", value: stats?.matches ?? "—" },
    { label: "Runs", value: stats?.runs ?? "—" },
    { label: "Average", value: stats?.average ?? "—" },
    { label: "Strike Rate", value: stats?.strike_rate ?? "—" },
  ];

  const roleLabel = player.role === "allrounder" ? "All-Rounder" : player.role === "bowl" ? "Bowler" : "Batter";

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div className="glass rounded-[2rem] p-8 md:p-10 relative overflow-hidden shadow-2xl shadow-primary/10">
        {/* Background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-secondary/20 blur-[80px] rounded-full" />

        <div className="relative flex flex-col lg:flex-row items-center lg:items-end justify-between gap-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 flex-1">
            <div className="relative">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-[2.5rem] bg-gradient-to-br from-primary via-secondary to-accent p-1 shadow-2xl">
                <div className="w-full h-full rounded-[2.25rem] bg-card flex items-center justify-center text-6xl shadow-inner">
                  {getFlag(player.country)}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-success text-success-foreground p-1.5 rounded-full border-4 border-background shadow-lg">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              </div>
            </div>

            <div className="text-center md:text-left space-y-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase whitespace-nowrap">
                    {player.name}
                  </h1>
                  <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black tracking-widest uppercase border border-primary/20">
                    {roleLabel}
                  </span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 text-muted-foreground font-bold text-sm tracking-tight uppercase">
                  <span>{player.country}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-border" />
                  <span>{player.debut_year} — PRESENT</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {player.formats_played?.map((f) => (
                  <button
                    key={f}
                    onClick={() => onFormatChange(f)}
                    className={`px-6 py-2 rounded-2xl text-xs font-black transition-all uppercase tracking-tighter border ${
                      format === f
                        ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/20 scale-105"
                        : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    {f === "T20" ? "T20 (Dom)" : f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-end gap-6 w-full lg:w-auto">
             <div className="w-full lg:w-64 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Active Form</span>
                  <span className="text-xs font-black mono text-primary uppercase">{formStatus}</span>
                </div>
                <div className="h-3 bg-secondary/50 rounded-full overflow-hidden p-0.5 border border-border">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${formScore * 10}%` }}
                    className={`h-full rounded-full ${formColor} shadow-lg shadow-current/20`}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-end">
                  <span className="text-[10px] font-black mono text-muted-foreground">{formScore.toFixed(1)} / 10.0</span>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 bg-white/5 rounded-[1.5rem] p-4 border border-white/10">
          {kpis.map((kpi, i) => (
            <div key={kpi.label} className="flex flex-col items-center justify-center p-4">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{kpi.label}</span>
              <span className="text-3xl font-black mono tracking-tighter text-foreground">{kpi.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

