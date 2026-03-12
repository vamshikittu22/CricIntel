import { Card, CardContent } from "@/components/ui/card";
import { Zap, Target, ShieldCheck, TrendingUp, Trophy, Star, History, Info } from "lucide-react";
import type { PlayerSummary } from "@/lib/hooks/usePlayers";
import { useMemo } from "react";

interface OverviewProps {
  battingStats?: PlayerSummary | null;
  bowlingStats?: PlayerSummary | null;
  format: string;
  totals?: any; // Career totals across all formats
  recentMatches?: any[];
}

interface InsightCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  borderColor: string;
}

export function PlayerOverview({ battingStats, bowlingStats, format, totals, recentMatches }: OverviewProps) {
  const bs = battingStats;
  const bw = bowlingStats || bs;

  const innings = bs?.innings_bat || 0;
  const isInsufficientData = innings < 10;

  const peakSeason = useMemo(() => {
    if (!recentMatches || recentMatches.length === 0) return null;
    
    const yearStats = new Map<number, { runs: number; wickets: number }>();
    recentMatches.forEach(m => {
      const year = new Date(m.match_date).getFullYear();
      const current = yearStats.get(year) || { runs: 0, wickets: 0 };
      yearStats.set(year, {
        runs: current.runs + (m.bat_runs || 0),
        wickets: current.wickets + (m.bowl_wickets || 0)
      });
    });

    let peakYear = -1;
    let maxVal = -1;
    let type = "Runs";

    // Determine if we focus on runs or wickets based on role (or higher count)
    const isBowler = (bw?.wickets || 0) > (bs?.runs || 0) / 20;

    for (const [year, stats] of yearStats.entries()) {
      const val = isBowler ? stats.wickets : stats.runs;
      if (val > maxVal) {
        maxVal = val;
        peakYear = year;
        type = isBowler ? "Wickets" : "Runs";
      }
    }

    return peakYear !== -1 ? { year: peakYear, value: maxVal, type } : null;
  }, [recentMatches, bs, bw]);

  const balls = bs?.balls || 0;
  const boundaryBalls = (bs?.fours || 0) + (bs?.sixes || 0);
  const boundaryPct = balls > 0 ? ((boundaryBalls / balls) * 100).toFixed(1) : "—";

  const milestones = [
    { label: "100s", value: bs?.hundreds ?? 0, icon: <Trophy className="h-4 w-4 text-amber-500" /> },
    { label: "50s", value: bs?.fifties ?? 0, icon: <Star className="h-4 w-4 text-slate-400" /> },
    { label: "Best", value: bs?.best_score ?? 0, icon: <Target className="h-4 w-4 text-primary" /> },
    { label: "5W", value: bw?.bowl_five_wickets ?? 0, icon: <ShieldCheck className="h-4 w-4 text-emerald-500" /> },
    { label: "BBI", value: bw?.bowl_best_figures ?? "—", icon: <TrendingUp className="h-4 w-4 text-blue-500" /> },
    { label: "Catches", value: bs?.catches ?? 0, icon: <Zap className="h-4 w-4 text-amber-400" /> },
  ];

  const insights: InsightCard[] = [];

  if (isInsufficientData) {
    insights.push({
      icon: <Info className="h-5 w-5 text-muted-foreground" />,
      title: "Building Profile",
      description: `We need more match data (${innings}/10 innings) to generate high-confidence tactical insights.`,
      borderColor: "border-l-muted",
    });
  } else {
    // Batting Insights
    if (bs) {
      if ((bs.strike_rate || 0) > 130) {
        insights.push({
          icon: <Zap className="h-5 w-5 text-success" />,
          title: "Aggressive Intent",
          description: `Strike rate of ${bs.strike_rate?.toFixed(1)} shows dominant attacking play in ${format}.`,
          borderColor: "border-l-success",
        });
      } else if ((bs.average || 0) > 40) {
          insights.push({
            icon: <ShieldCheck className="h-5 w-5 text-indigo-400" />,
            title: "Reliable Anchor",
            description: `Average of ${bs.average?.toFixed(1)} makes them a vital stabilizer for the team.`,
            borderColor: "border-l-indigo-400",
          });
      }

      if (balls > 0 && boundaryBalls / balls > 0.15) {
        insights.push({
          icon: <Target className="h-5 w-5 text-primary" />,
          title: "Boundary Hitter",
          description: `${boundaryPct}% boundary frequency — high efficiency in finding gaps.`,
          borderColor: "border-l-primary",
        });
      }
    }

    // Bowling Insights
    if (bw && bw.innings_bowl > 0) {
      if ((bw.econ || 0) > 0 && (bw.econ || 0) < 7.5) {
        insights.push({
          icon: <ShieldCheck className="h-5 w-5 text-success" />,
          title: "Economical Control",
          description: `Economy of ${bw.econ?.toFixed(2)} — applies consistent pressure on batters.`,
          borderColor: "border-l-success",
        });
      }

      if ((bw.bowl_strike_rate || 0) > 0 && (bw.bowl_strike_rate || 0) < 30) {
        insights.push({
          icon: <TrendingUp className="h-5 w-5 text-primary" />,
          title: "Strike Bowler",
          description: `Bowling SR of ${bw.bowl_strike_rate?.toFixed(1)} — highly effective at taking wickets.`,
          borderColor: "border-l-primary",
        });
      }
    }
    
    // Fielding/All-rounder
    if (bs && bs.catches > 10) {
        insights.push({
          icon: <Zap className="h-5 w-5 text-amber-500" />,
          title: "Safe Hands",
          description: `${bs.catches} career catches — exceptional reliability in the field.`,
          borderColor: "border-l-amber-500",
        });
    }
  }

  // Fallback if no specific insights match
  if (insights.length === 0 && !isInsufficientData) {
      insights.push({
        icon: <Info className="h-5 w-5 text-primary" />,
        title: "Standard Performer",
        description: "Consistent stats across all metrics without extreme outliers.",
        borderColor: "border-l-primary",
      });
  }

  const isAllRounder = totals && totals.innings_bat >= 5 && totals.innings_bowl >= 5;

  return (
    <div className="space-y-8">
      {/* Milestone Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {milestones.map((s) => (
          <Card key={s.label} className="border-border bg-card/40 shadow-sm overflow-hidden group">
            <CardContent className="p-4 text-center relative">
              <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-40 transition-opacity">
                {s.icon}
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
              <p className="mt-1 text-2xl font-black">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Insights Section */}
        <section>
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Zap className="h-3 w-3" /> Tactical Insights
          </h3>
          <div className="grid gap-3">
            {insights.map((insight, i) => (
              <Card key={i} className={`border-l-4 ${insight.borderColor} bg-card/60 shadow-sm`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-background/50 border border-border/50">
                      {insight.icon}
                    </div>
                    <div>
                      <p className="font-bold text-sm tracking-tight">{insight.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{insight.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Highlights Section */}
        <section className="space-y-6">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <Star className="h-3 w-3" /> Career Highlights
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {peakSeason && (
              <Card className="bg-primary/5 border-primary/20 shadow-none relative overflow-hidden">
                <div className="absolute -right-2 -bottom-2 opacity-10">
                  <History className="h-16 w-16" />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-primary mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Peak Season</span>
                  </div>
                  <p className="text-2xl font-black">{peakSeason.year}</p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {peakSeason.value} {peakSeason.type}
                  </p>
                </CardContent>
              </Card>
            )}

            {isAllRounder && (
              <Card className="bg-indigo-500/5 border-indigo-500/20 shadow-none relative overflow-hidden">
                <div className="absolute -right-2 -bottom-2 opacity-10">
                  <Zap className="h-16 w-16" />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-indigo-500 mb-1">
                    <Star className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Versatility</span>
                  </div>
                  <p className="text-xl font-black">All-Rounder</p>
                  <p className="text-xs text-muted-foreground font-medium line-clamp-1">
                    Proven with bat & ball
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>

      {/* Career Summary */}
      {totals && (
        <section>
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
            <History className="h-3 w-3" /> Aggregate Totals
          </h3>
          <Card className="border-border/60 bg-muted/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-6">
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Matches</p>
                  <p className="text-2xl font-black tabular-nums">{totals.matches}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Career Runs</p>
                  <p className="text-2xl font-black tabular-nums">{totals.runs}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Wickets</p>
                  <p className="text-2xl font-black tabular-nums">{totals.wickets}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Innings (Bat)</p>
                  <p className="text-2xl font-black tabular-nums">{totals.innings_bat}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
