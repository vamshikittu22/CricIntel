import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getFlag } from "@/lib/countryFlags";
import { motion } from "framer-motion";
import type { Player, PlayerSummary } from "@/lib/hooks/usePlayers";
import { cn } from "@/lib/utils";

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
      <div className="glass rounded-[2rem] p-10 animate-pulse border border-border shadow-2xl">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <Skeleton className="h-32 w-32 rounded-[2.5rem]" />
          <div className="space-y-4 flex-1">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
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
  const formColor = formScore >= 8 ? "bg-emerald-500" : formScore >= 5 ? "bg-amber-500" : "bg-rose-500";
  const formTextColor = formScore >= 8 ? "text-emerald-600 dark:text-emerald-500" : formScore >= 5 ? "text-amber-600 dark:text-amber-500" : "text-rose-600 dark:text-rose-500";

  const kpis = [
    { label: "Matches", value: stats?.matches ?? "—" },
    { label: "Runs", value: stats?.runs ?? "—" },
    { label: "Average", value: stats?.average ?? "—" },
    { label: "Strike Rate", value: stats?.strike_rate ?? "—" },
  ];

  const roleLabel = player.role === "allrounder" ? "All-Rounder" : player.role === "bowl" ? "Bowler" : "Batter";

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <div className="glass rounded-[2rem] p-8 md:p-10 relative overflow-hidden shadow-2xl shadow-primary/10 border border-border/50 bg-white/5 dark:bg-white/1">
        {/* Background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-secondary/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row items-center lg:items-end justify-between gap-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-10 flex-1">
            <div className="relative">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-[2.5rem] bg-gradient-to-br from-primary via-blue-500 to-accent p-1.5 shadow-2xl">
                <div className="w-full h-full rounded-[2rem] bg-popover flex items-center justify-center text-6xl shadow-inner border border-white/10 select-none">
                  {getFlag(player.country)}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-4 border-background shadow-lg">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              </div>
            </div>

            <div className="text-center md:text-left space-y-6 flex-1">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase whitespace-nowrap text-foreground leading-none">
                    {player.name}
                  </h1>
                  <span className="px-5 py-2 rounded-full bg-primary/10 text-primary text-[10px] font-black tracking-[0.2em] uppercase border border-primary/20 shadow-sm">
                    {roleLabel}
                  </span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-4 text-muted-foreground font-black text-[12px] tracking-[0.2em] uppercase opacity-70">
                  <span className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-primary/40" />
                     {player.country}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-border/40" />
                  <span>DEBUT {player.debut_year}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                {["All", "ODI", "Test", "T20I", "T20", "IPL"].map((f) => {
                  const normalizedFormats = (player.formats_played || []).map(pf => pf.toUpperCase());
                  const isPlayed = normalizedFormats.includes(f.toUpperCase()) || f === "All";
                  return (
                    <button
                      key={f}
                      onClick={() => onFormatChange(f)}
                      disabled={!isPlayed}
                      className={cn(
                        "px-6 py-2.5 rounded-2xl text-[11px] font-black transition-all uppercase tracking-[0.15em] border shadow-sm",
                        format.toUpperCase() === f.toUpperCase()
                          ? "bg-primary text-primary-foreground border-primary shadow-xl shadow-primary/30 scale-105 active:scale-95"
                          : isPlayed
                          ? "bg-slate-50 dark:bg-secondary/40 text-muted-foreground border-black/5 dark:border-border/50 hover:border-primary/50 hover:text-foreground hover:bg-slate-100 dark:hover:bg-secondary transition-all active:scale-95"
                          : "opacity-20 cursor-not-allowed grayscale bg-muted/20 text-muted-foreground/50 border-transparent shadow-none"
                      )}
                    >
                      {f === "T20" ? "T20" : f}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center lg:items-end gap-4 w-full lg:w-72">
             <div className="w-full space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] opacity-60">Active Power Index</span>
                  <span className={cn("text-xs font-black uppercase tracking-widest", formTextColor)}>{formStatus}</span>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5 shadow-inner p-0.5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${formScore * 10}%` }}
                    className={cn("h-full rounded-full shadow-lg", formColor)}
                    transition={{ duration: 1.2, ease: "circOut" }}
                  />
                </div>
                <div className="flex justify-end px-1">
                  <span className="text-[11px] font-black text-muted-foreground/60 tracking-widest">{formScore.toFixed(1)} / 10.0</span>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 bg-slate-50/50 dark:bg-white/5 rounded-[2rem] p-6 border border-black/5 dark:border-white/10 shadow-inner">
          {kpis.map((kpi, i) => (
            <div key={kpi.label} className="flex flex-col items-center justify-center p-4 border-r last:border-r-0 border-black/5 dark:border-white/10 last:border-none">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 opacity-60">{kpi.label}</span>
              <span className="text-4xl font-black tracking-tighter text-foreground leading-none">{kpi.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
