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
      <Card className="overflow-hidden border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-8 w-32 rounded-full" />
          </div>
          <div className="grid grid-cols-4 gap-3 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-12 w-full mt-6 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const calculateForm = () => {
    if (!stats) return 0;
    
    // Bowler specialized scoring
    if (player.role === "bowl") {
      const econScore = Math.max(0, (9 - (stats.econ || 9)) * 1.2); // Better than 9 econ is good
      const srScore = stats.bowl_strike_rate ? Math.max(0, (35 - stats.bowl_strike_rate) / 3) : 0;
      const fiveW = (stats.bowl_five_wickets || 0) * 2.5;
      return Math.min(10, Math.max(1, econScore + srScore + fiveW));
    }
    
    // All-rounder or Batter scoring
    const batScore = (stats.strike_rate || 0) / 25 + (stats.average || 0) / 12 + (stats.hundreds || 0) * 2;
    
    if (player.role === "allrounder") {
      const bowlScore = Math.max(0, (9 - (stats.econ || 9)) * 1.0) + (stats.bowl_strike_rate ? Math.max(0, (40 - stats.bowl_strike_rate) / 5) : 0);
      return Math.min(10, Math.max(1, (batScore * 0.6) + (bowlScore * 0.4)));
    }
    
    return Math.min(10, Math.max(1, batScore));
  };

  const formScore = calculateForm();
  
  const formStatus = formScore >= 8 ? "Elite" : formScore >= 6.5 ? "Strong" : formScore >= 4 ? "Stable" : "Poor";
  const formBadgeColor = formScore >= 8 
    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
    : formScore >= 6.5 
      ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
      : "bg-rose-500/10 text-rose-500 border-rose-500/20";

  const kpis = [
    { label: "Matches", value: stats?.matches ?? "—" },
    { label: "Runs", value: stats?.runs ?? "—" },
    { label: "Average", value: stats?.average ?? "—" },
    { label: "SR", value: stats?.strike_rate ?? "—" },
  ];

  const roleLabel = player.role === "allrounder" ? "All-Rounder" : player.role === "bowl" ? "Bowler" : "Batter";
  const roleColor = player.role === "allrounder" ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" : player.role === "bowl" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden border-border bg-card/50 backdrop-blur-sm shadow-sm ring-1 ring-white/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="group relative">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-muted text-4xl ring-4 ring-primary/5 shadow-inner transition-transform group-hover:scale-105">
                  {getFlag(player.country)}
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border text-[10px] font-bold shadow-sm">
                  ✓
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold md:text-3xl tracking-tight text-foreground">
                    {player.name}
                  </h1>
                  <Badge variant="outline" className={`${roleColor} px-2.5 py-0.5 rounded-full font-semibold border`}>
                    {roleLabel}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                    <span className="text-base">{getFlag(player.country)}</span>
                    {player.country}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span className="font-medium">
                    {player.debut_year && player.last_played_year 
                      ? `${player.debut_year} — ${player.last_played_year}` 
                      : player.debut_year || "Career N/A"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {player.formats_played?.map((f) => (
                    <Badge key={f} variant="secondary" className="px-2 py-0 h-5 text-[10px] font-bold uppercase tracking-wider bg-primary/5 hover:bg-primary/10 transition-colors">
                      {f}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 rounded-full border border-border/50 bg-muted/50 p-1 shadow-inner self-center md:self-start">
              {formats.map((f) => (
                <button
                  key={f}
                  onClick={() => onFormatChange(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    format === f
                      ? "bg-primary text-primary-foreground shadow-lg ring-1 ring-primary/20 scale-105"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {f === "T20" ? "T20 (Dom)" : f}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="group flex flex-col items-center justify-center rounded-xl bg-muted/30 border border-border/40 p-3 text-center transition-all hover:bg-muted/50 hover:border-primary/20">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{kpi.label}</p>
                <p className="mt-1 text-2xl font-black tabular-nums">{kpi.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-border/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Form</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${formBadgeColor}`}>
                  {stats ? formStatus : "N/A"}
                </span>
              </div>
              <span className="text-xs font-black tabular-nums">{formScore > 0 ? formScore.toFixed(1) : "—"}/10</span>
            </div>
            <Progress 
              value={formScore * 10} 
              className="h-2 bg-muted/50" 
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
