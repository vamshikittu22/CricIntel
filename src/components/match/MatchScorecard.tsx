import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getFlag } from "@/lib/countryFlags";
import { MatchPlayerStat, MatchDetail } from "@/hooks/useAnalytics";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Target } from "lucide-react";

interface MatchScorecardProps {
  stats: MatchPlayerStat[];
  match: MatchDetail;
}

export default function MatchScorecard({ stats, match }: MatchScorecardProps) {
  const inningsMap = useMemo(() => {
    const map = new Map<number, MatchPlayerStat[]>();
    stats.forEach(s => {
      if (!map.has(s.inning)) map.set(s.inning, []);
      map.get(s.inning)!.push(s);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [stats]);

  if (inningsMap.length === 0) return (
    <div className="py-20 text-center glass rounded-[3rem] border-dashed border-border/50">
        <Shield className="h-10 w-10 mx-auto mb-4 opacity-20" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Historical records not found for this identifier.</p>
    </div>
  );

  return (
    <div className="space-y-12">
      <Tabs defaultValue={inningsMap[0][0].toString()} className="w-full">
        <div className="flex justify-center mb-10 overflow-x-auto pb-2">
          <TabsList className="bg-secondary/20 p-1 rounded-2xl border border-border/50 h-11">
            {inningsMap.map(([inning, players]) => (
              <TabsTrigger 
                key={inning} 
                value={inning.toString()}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg font-black px-6 py-2 rounded-xl transition-all text-[11px] uppercase tracking-tighter h-9"
              >
                {getFlag(players[0]?.team)} Inning {inning}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <AnimatePresence mode="wait">
          {inningsMap.map(([inning, players]) => {
            const battingStats = players.filter(p => p.is_batter && p.bat_balls > 0).sort((a, b) => b.bat_runs - a.bat_runs);
            const bowlingStats = players.filter(p => p.is_bowler && p.bowl_overs !== "0").sort((a, b) => b.bowl_wickets - a.bowl_wickets || parseFloat(a.bowl_econ) - parseFloat(b.bowl_econ));
            const team = players[0]?.team || "Unknown";

            return (
              <TabsContent key={inning} value={inning.toString()} className="space-y-10 focus:outline-none">
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: -20 }} 
                    className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                >
                  <Card className="lg:col-span-8 border-none shadow-2xl bg-card/60 backdrop-blur-3xl rounded-[3rem] border border-border/50 overflow-hidden">
                    <div className="p-8 border-b border-border/50 bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-x font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <Zap className="h-4 w-4" /> Batting Inning {inning}
                        </span>
                        <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none">{team}</h4>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-secondary/10">
                          <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="py-4 pl-10 text-[9px] uppercase font-black tracking-widest">Batter</TableHead>
                            <TableHead className="text-right text-[9px] uppercase font-black tracking-widest">Runs</TableHead>
                            <TableHead className="text-right text-[9px] uppercase font-black tracking-widest">Balls</TableHead>
                            <TableHead className="text-right text-[9px] uppercase font-black tracking-widest hidden sm:table-cell">4s/6s</TableHead>
                            <TableHead className="text-right text-[9px] uppercase font-black tracking-widest">SR</TableHead>
                            <TableHead className="pr-10 text-right text-[9px] uppercase font-black tracking-widest">Outcome</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {battingStats.map((p) => (
                            <TableRow key={p.player_id} className="group hover:bg-secondary/10 transition-colors border-border/10">
                              <TableCell className="py-5 pl-10">
                                <Link to={`/player/${p.player_id}`} className="font-black text-sm uppercase italic tracking-tight group-hover:text-primary transition-colors">
                                  {p.player_name}
                                </Link>
                              </TableCell>
                              <TableCell className="text-right font-black text-lg italic tracking-tighter text-foreground">{p.bat_runs}</TableCell>
                              <TableCell className="text-right text-muted-foreground text-xs font-black opacity-60">{p.bat_balls}</TableCell>
                              <TableCell className="text-right hidden sm:table-cell">
                                <span className="text-[10px] font-black">{p.bat_fours} / <span className="text-primary">{p.bat_sixes}</span></span>
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs font-black text-primary/80">
                                {p.bat_balls > 0 ? (p.bat_runs / p.bat_balls * 100).toFixed(1) : "0.0"}
                              </TableCell>
                              <TableCell className="pr-10 text-right">
                                {p.bat_not_out ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 px-3 py-0.5 h-6 text-[9px] font-black uppercase tracking-widest border-none">Not Out</Badge>
                                ) : (
                                  <span className="text-[9px] font-black text-muted-foreground uppercase opacity-40">{p.bat_dismissal_kind || "Out"}</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>

                  <Card className="lg:col-span-4 border-none shadow-2xl bg-card/60 backdrop-blur-3xl rounded-[3rem] border border-border/50 overflow-hidden flex flex-col h-full">
                    <div className="p-8 border-b border-border/50 bg-gradient-to-r from-accent/10 to-transparent">
                      <span className="text-[9px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                        <Target className="h-4 w-4" /> Suppression Analytics
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-secondary/10">
                          <TableRow className="hover:bg-transparent border-none">
                            <TableHead className="py-4 pl-8 text-[9px] uppercase font-black tracking-widest">Bowler</TableHead>
                            <TableHead className="text-right text-[9px] uppercase font-black tracking-widest">O</TableHead>
                            <TableHead className="text-right text-[9px] uppercase font-black tracking-widest text-accent">W</TableHead>
                            <TableHead className="text-right pr-8 text-[9px] uppercase font-black tracking-widest">Eco</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bowlingStats.map((p) => (
                            <TableRow key={p.player_id} className="group hover:bg-secondary/10 transition-colors border-border/10">
                              <TableCell className="py-4 pl-8">
                                <Link to={`/player/${p.player_id}`} className="font-black text-xs uppercase tracking-tight group-hover:text-accent transition-colors">
                                  {p.player_name}
                                </Link>
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground text-xs font-black opacity-60">{p.bowl_overs}</TableCell>
                              <TableCell className="text-right font-black text-xl italic text-accent">{p.bowl_wickets}</TableCell>
                              <TableCell className="text-right pr-8 font-mono text-xs font-black text-foreground/80">{p.bowl_econ}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </motion.div>
              </TabsContent>
            );
          })}
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
