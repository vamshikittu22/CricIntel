import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Trophy, Shield } from "lucide-react";
import { getFlag } from "@/lib/countryFlags";
import { MatchDetail, MatchPlayerStat } from "@/hooks/useAnalytics";

interface MatchHeroCardProps {
  match: MatchDetail;
  stats: MatchPlayerStat[];
}

export default function MatchHeroCard({ match, stats }: MatchHeroCardProps) {
  // Aggregate team totals (rough estimation from stats)
  const getTeamTotal = (team: string, inning: number) => {
    const inningStats = stats.filter(s => s.team === team && s.inning === inning);
    const runs = inningStats.reduce((sum, s) => sum + s.bat_runs, 0);
    const wickets = stats.filter(s => s.team !== team && s.inning === inning).reduce((sum, s) => sum + s.bowl_wickets, 0);
    return { runs, wickets };
  };

  const t1Inning1 = getTeamTotal(match.team1, 1);
  const t2Inning2 = getTeamTotal(match.team2, 2);
  const t1Inning3 = match.format === 'Test' ? getTeamTotal(match.team1, 3) : null;
  const t2Inning4 = match.format === 'Test' ? getTeamTotal(match.team2, 4) : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="mb-12"
    >
      <div className="relative p-1 rounded-[3rem] bg-gradient-to-br from-primary/30 via-border to-transparent shadow-2xl overflow-hidden group">
        <div className="absolute inset-0 bg-grid-primary/[0.02] -z-1" />
        
        <div className="relative glass rounded-[2.8rem] border border-border/50 overflow-hidden bg-card/40 backdrop-blur-3xl">
          <div className="absolute top-8 right-10">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mb-1">Standard</span>
              <Badge variant="outline" className="text-xl font-black italic bg-primary/10 border-primary/20 px-6 py-2 tracking-tighter rounded-xl text-primary">
                {match.format}
              </Badge>
            </div>
          </div>

          <div className="pt-20 pb-12 px-10">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-16">
              {/* Team 1 */}
              <div className="flex flex-col items-center gap-6">
                <div className="relative group/flag">
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover/flag:opacity-100 transition-opacity" />
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-secondary/40 backdrop-blur-3xl flex items-center justify-center text-5xl sm:text-7xl font-black shadow-2xl border-4 border-border/5 transition-transform group-hover/flag:scale-110 duration-500">
                    {getFlag(match.team1)}
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase leading-none text-foreground">{match.team1}</h2>
                  <div className="mt-4 flex flex-col items-center gap-1">
                    <span className="text-2xl font-black text-primary">
                      {t1Inning1.runs}/{t1Inning1.wickets}
                      {t1Inning3 && t1Inning3.runs > 0 && <span className="text-muted-foreground text-sm ml-2">& {t1Inning3.runs}/{t1Inning3.wickets}</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Match Result Overlay */}
              <div className="flex flex-col items-center justify-center gap-8">
                <div className="relative">
                  <div className="absolute inset-0 blur-3xl bg-secondary/20 rounded-full" />
                  <span className="relative text-5xl sm:text-7xl font-black italic text-foreground/10 select-none tracking-tighter lg:text-8xl uppercase">VS</span>
                </div>
                
                {match.result && (
                  <div className="px-8 py-4 bg-gradient-to-r from-primary/20 to-secondary/20 border border-border/10 rounded-[2rem] shadow-2xl backdrop-blur-3xl border border-white/5">
                    <div className="flex flex-col items-center text-center">
                      <span className="text-[9px] font-black text-primary uppercase tracking-[0.4em] mb-2 flex items-center gap-2">
                        <Trophy className="h-3 w-3 text-amber-500" /> Match Outcome
                      </span>
                      <p className="text-sm sm:text-base font-black italic text-foreground leading-tight uppercase tracking-tight max-w-[200px]">
                        {match.result}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Team 2 */}
              <div className="flex flex-col items-center gap-6">
                <div className="relative group/flag">
                  <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full opacity-0 group-hover/flag:opacity-100 transition-opacity" />
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-secondary/40 backdrop-blur-3xl flex items-center justify-center text-5xl sm:text-7xl font-black shadow-2xl border-4 border-border/5 transition-transform group-hover/flag:scale-110 duration-500">
                    {getFlag(match.team2)}
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-3xl sm:text-5xl font-black italic tracking-tighter uppercase leading-none text-foreground">{match.team2}</h2>
                  <div className="mt-4 flex flex-col items-center gap-1">
                    <span className="text-2xl font-black text-accent">
                      {t2Inning2.runs}/{t2Inning2.wickets}
                      {t2Inning4 && t2Inning4.runs > 0 && <span className="text-muted-foreground text-sm ml-2">& {t2Inning4.runs}/{t2Inning4.wickets}</span>}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-20 flex flex-wrap items-center justify-center gap-8 text-[11px] font-black text-muted-foreground border-t border-border/50 pt-10 uppercase tracking-[0.2em]">
              <span className="flex items-center gap-3 px-6 py-2 rounded-full bg-secondary/30 border border-border/50">
                <Calendar className="h-4 w-4 text-primary" />
                {new Date(match.match_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              <span className="flex items-center gap-3 px-6 py-2 rounded-full bg-secondary/30 border border-border/50 max-w-xs truncate">
                <MapPin className="h-4 w-4 text-primary" />
                {match.venue}
              </span>
              {match.event_name && (
                <span className="flex items-center gap-3 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary">
                  <Shield className="h-4 w-4" />
                  {match.event_name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
