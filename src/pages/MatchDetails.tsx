import { AppHeader } from "@/components/AppHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getFlag } from "@/lib/countryFlags";
import { useParams } from "react-router-dom";
import { Calendar, MapPin, Trophy, ArrowLeft, Loader2, Info, Users, Shield, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface MatchInfo {
  id: string;
  format: string;
  match_date: string;
  venue: string;
  team1: string;
  team2: string;
  result: string | null;
  winner: string | null;
  event_name: string | null;
}

interface PlayerMatchRow {
  player_id: string;
  player_name: string;
  team: string;
  inning: number;
  is_batter: boolean;
  is_bowler: boolean;
  bat_runs: number;
  bat_balls: number;
  bat_fours: number;
  bat_sixes: number;
  bat_dismissal_kind: string | null;
  bat_not_out: boolean;
  bowl_overs: number;
  bowl_maidens: number;
  bowl_runs: number;
  bowl_wickets: number;
  bowl_econ: number;
}

const MatchDetails = () => {
  const { id } = useParams<{ id: string }>();

  // Fetch match info
  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ["match", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as MatchInfo;
    },
    enabled: !!id,
  });

  // Fetch all player stats for this match
  const { data: playerStats, isLoading: statsLoading } = useQuery({
    queryKey: ["match-player-stats", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_player_stats")
        .select("*, players!match_player_stats_player_id_fkey(name)")
        .eq("match_id", id!);
      if (error) throw error;
      
      // Flatten the join
      return (data as any[]).map((row) => ({
        player_id: row.player_id,
        player_name: row.players?.name ?? "Unknown",
        inning: row.inning || 1,
        team: row.team,
        is_batter: row.is_batter,
        is_bowler: row.is_bowler,
        bat_runs: row.bat_runs ?? 0,
        bat_balls: row.bat_balls ?? 0,
        bat_fours: row.bat_fours ?? 0,
        bat_sixes: row.bat_sixes ?? 0,
        bat_dismissal_kind: row.bat_dismissal_kind,
        bat_not_out: row.bat_not_out ?? false,
        bowl_overs: row.bowl_overs ?? 0,
        bowl_maidens: row.bowl_maidens ?? 0,
        bowl_runs: row.bowl_runs ?? 0,
        bowl_wickets: row.bowl_wickets ?? 0,
        bowl_econ: row.bowl_econ ?? 0,
      })) as PlayerMatchRow[];
    },
    enabled: !!id,
  });

  const isLoading = matchLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-12 text-center">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Match not found</h2>
          <p className="text-muted-foreground">The match you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const sortBatting = (a: PlayerMatchRow, b: PlayerMatchRow) => b.bat_runs - a.bat_runs;
  const sortBowling = (a: PlayerMatchRow, b: PlayerMatchRow) => {
    if (b.bowl_wickets !== a.bowl_wickets) return b.bowl_wickets - a.bowl_wickets;
    return a.bowl_econ - b.bowl_econ;
  };

  // Group by inning
  const inningsMap = new Map<number, PlayerMatchRow[]>();
  playerStats?.forEach(p => {
    if (!inningsMap.has(p.inning)) inningsMap.set(p.inning, []);
    inningsMap.get(p.inning)!.push(p);
  });

  const matchInnings = Array.from(inningsMap.keys()).sort((a, b) => a - b);

  const formatDismissal = (player: PlayerMatchRow) => {
    if (player.bat_not_out) return <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-none px-2 py-0 h-5">not out</Badge>;
    if (!player.bat_dismissal_kind) return <span className="text-muted-foreground italic">-</span>;
    return <span className="text-[10px] sm:text-xs text-muted-foreground block max-w-[100px] truncate sm:max-w-none">{player.bat_dismissal_kind}</span>;
  };

  const calculateStrikeRate = (runs: number, balls: number) => {
    if (balls === 0) return "-";
    return ((runs / balls) * 100).toFixed(1);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <AppHeader />

      <main className="container mx-auto px-4 py-8 animate-in fade-in duration-700">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="group hover:bg-secondary">
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Matches
          </Button>
          {match.event_name && (
            <Badge variant="outline" className="text-xs font-semibold px-3 py-1 bg-primary/5 border-primary/20">
              {match.event_name}
            </Badge>
          )}
        </div>

        {/* Match Header Hero */}
        <div className="mb-8">
          <Card className="overflow-hidden border-none shadow-2xl bg-gradient-to-br from-card to-secondary/30 relative">
            <div className="absolute top-0 right-0 p-4">
              <Badge variant="secondary" className="font-bold uppercase tracking-wider px-3 py-1 bg-background/50 backdrop-blur-sm">
                {match.format}
              </Badge>
            </div>
            
            <CardContent className="pt-12 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8">
                {/* Team 1 */}
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-background flex items-center justify-center text-3xl sm:text-4xl font-black shadow-inner border-2 border-border/50">
                    {getFlag(match.team1)}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase">{match.team1}</h2>
                </div>

                {/* VS / Result */}
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full" />
                    <span className="relative text-3xl sm:text-4xl font-black italic text-muted-foreground/30 select-none tracking-tighter">VS</span>
                  </div>
                  {match.result && (
                    <div className="mt-2 px-4 sm:px-6 py-2 bg-primary/10 border border-primary/20 rounded-full shadow-lg">
                      <p className="text-xs sm:text-sm font-bold text-primary flex items-center gap-2">
                        <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                        {match.result}
                      </p>
                    </div>
                  )}
                </div>

                {/* Team 2 */}
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-background flex items-center justify-center text-3xl sm:text-4xl font-black shadow-inner border-2 border-border/50">
                    {getFlag(match.team2)}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black italic tracking-tighter uppercase">{match.team2}</h2>
                </div>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground border-t border-border/50 pt-6">
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-background/50 whitespace-nowrap">
                  <Calendar className="h-4 w-4 text-primary" />
                  {match.match_date ? new Date(match.match_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Date TBC"}
                </span>
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-background/50 text-center">
                  <MapPin className="h-4 w-4 text-primary" />
                  {match.venue || "Venue TBC"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scorecard Tabs */}
        {matchInnings.length > 0 ? (
          <Tabs defaultValue={matchInnings[0].toString()} className="w-full space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Detailed Scorecard
              </h3>
              <TabsList className="bg-secondary/50 p-1 rounded-xl overflow-x-auto">
                {matchInnings.map((inning) => {
                  const inningPlayers = inningsMap.get(inning) ?? [];
                  const battingPlayer = inningPlayers.find(p => p.is_batter && p.bat_balls > 0);
                  const battingTeamId = battingPlayer?.team;
                  const battingTeamShort = battingTeamId ? (battingTeamId === match.team1 ? match.team1 : match.team2) : "I" + inning;
                  
                  return (
                    <TabsTrigger 
                      key={inning} 
                      value={inning.toString()}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-bold px-4 sm:px-6 rounded-lg transition-all text-xs sm:text-sm"
                    >
                      {matchInnings.length > 2 ? `Inning ${inning} (${getFlag(battingTeamShort)})` : `Inning ${inning}`}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {matchInnings.map((inning) => {
              const inningPlayers = inningsMap.get(inning) ?? [];
              
              // Correctly identify Batting and Bowling teams for this specific inning
              const battingPlayersInInning = inningPlayers.filter(p => p.is_batter && p.bat_balls > 0);
              const bowlingPlayersInInning = inningPlayers.filter(p => p.is_bowler && p.bowl_overs > 0);
              
              // Batting team is the team of any player who batted in THIS inning
              const battingTeam = battingPlayersInInning[0]?.team || (inning % 2 === 1 ? match.team1 : match.team2);
              
              // Bowling team is the team of any player who bowled in THIS inning
              const bowlingTeam = bowlingPlayersInInning[0]?.team || (battingTeam === match.team1 ? match.team2 : match.team1);

              const battingStats = [...battingPlayersInInning].sort(sortBatting);
              const bowlingStats = [...bowlingPlayersInInning].sort(sortBowling);

              const totalFromBat = battingStats.reduce((sum, p) => sum + p.bat_runs, 0);
              const totalWickets = bowlingStats.reduce((sum, p) => sum + p.bowl_wickets, 0);

              return (
                <TabsContent key={inning} value={inning.toString()} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Batting Card */}
                    <Card className="lg:col-span-12 xl:col-span-8 border-none shadow-xl overflow-hidden bg-card/50 backdrop-blur-md">
                      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-border/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <span className="text-3xl sm:text-4xl font-black bg-background w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shadow-lg border border-border/50">
                              {getFlag(battingTeam)}
                            </span>
                            <div>
                              <CardTitle className="text-xl sm:text-2xl font-black tracking-tight uppercase italic">{battingTeam}</CardTitle>
                              <CardDescription className="font-medium text-xs sm:text-sm">Inning {inning} - Batting</CardDescription>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="text-2xl sm:text-4xl font-black text-primary tracking-tighter">{totalFromBat}/{totalWickets}</div>
                             <div className="text-[8px] sm:text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-none mt-1">Runs from Bat</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0 overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-secondary/30">
                            <TableRow className="hover:bg-transparent border-none">
                              <TableHead className="w-[150px] sm:w-[200px] py-3 sm:py-4 pl-4 sm:pl-6 text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground whitespace-nowrap">Batsman</TableHead>
                              <TableHead className="text-right text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground">Runs</TableHead>
                              <TableHead className="text-right text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground">Balls</TableHead>
                              <TableHead className="text-right text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground hidden sm:table-cell">4s</TableHead>
                              <TableHead className="text-right text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground hidden sm:table-cell">6s</TableHead>
                              <TableHead className="text-right text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground">SR</TableHead>
                              <TableHead className="text-right pr-4 sm:pr-6 text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground">Dismissal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {battingStats.length > 0 ? battingStats.map((player) => (
                              <TableRow key={player.player_id} className="group hover:bg-primary/5 transition-colors border-border/20">
                                <TableCell className="font-bold py-3 sm:py-4 pl-4 sm:pl-6 group-hover:text-primary transition-colors cursor-pointer text-xs sm:text-sm" onClick={() => window.location.href = `/player/${player.player_id}`}>
                                  {player.player_name}
                                </TableCell>
                                <TableCell className="text-right font-black text-base sm:text-xl">{player.bat_runs}</TableCell>
                                <TableCell className="text-right text-muted-foreground font-medium text-xs sm:text-sm">{player.bat_balls}</TableCell>
                                <TableCell className="text-right hidden sm:table-cell font-medium text-xs sm:text-sm">{player.bat_fours}</TableCell>
                                <TableCell className="text-right hidden sm:table-cell font-medium text-xs sm:text-sm">{player.bat_sixes}</TableCell>
                                <TableCell className="text-right text-primary/80 font-mono text-[10px] sm:text-xs font-bold">{calculateStrikeRate(player.bat_runs, player.bat_balls)}</TableCell>
                                <TableCell className="text-right pr-4 sm:pr-6">
                                  {formatDismissal(player)}
                                </TableCell>
                              </TableRow>
                            )) : (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground italic">
                                  <div className="flex flex-col items-center gap-2">
                                    <Info className="h-6 w-6 sm:h-8 sm:w-8 opacity-20" />
                                    <span className="text-xs sm:text-sm">No batting data available for this inning</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>

                    {/* Bowling Card */}
                    <Card className="lg:col-span-12 xl:col-span-4 border-none shadow-xl bg-card/40 backdrop-blur-md overflow-hidden flex flex-col">
                      <CardHeader className="bg-gradient-to-r from-secondary/50 to-transparent border-b border-border/50">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <span className="text-2xl sm:text-3xl font-black bg-background w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-lg border border-border/50">
                            {getFlag(bowlingTeam)}
                          </span>
                          <div>
                            <CardTitle className="text-lg sm:text-xl font-black tracking-tight uppercase italic">{bowlingTeam}</CardTitle>
                            <CardDescription className="font-medium text-xs sm:text-sm">Bowling Stats</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0 flex-1 overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-secondary/20">
                            <TableRow className="hover:bg-transparent border-none">
                              <TableHead className="py-3 sm:py-4 pl-4 sm:pl-5 text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground whitespace-nowrap">Bowler</TableHead>
                              <TableHead className="text-right text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground">O</TableHead>
                              <TableHead className="text-right text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground">W</TableHead>
                              <TableHead className="text-right pr-4 sm:pr-5 text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground">Econ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bowlingStats.length > 0 ? bowlingStats.map((player) => (
                              <TableRow key={player.player_id} className="group hover:bg-secondary/40 transition-colors border-border/20">
                                <TableCell className="font-bold py-3 sm:py-4 pl-4 sm:pl-5 group-hover:text-primary transition-colors cursor-pointer text-xs sm:text-sm" onClick={() => window.location.href = `/player/${player.player_id}`}>
                                  <div className="flex flex-col">
                                    <span className="truncate max-w-[100px] sm:max-w-none">{player.player_name}</span>
                                    {player.bowl_maidens > 0 && (
                                      <Badge variant="outline" className="w-fit text-[7px] sm:text-[8px] h-3 sm:h-4 px-1 mt-0.5 sm:mt-1 bg-green-500/10 text-green-500 border-green-500/20">
                                        {player.bowl_maidens} MAIDEN{player.bowl_maidens > 1 ? 'S' : ''}
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground font-black text-xs sm:text-sm">{player.bowl_overs}</TableCell>
                                <TableCell className="text-right font-black text-xl sm:text-2xl text-primary">{player.bowl_wickets}</TableCell>
                                <TableCell className="text-right pr-4 sm:pr-5 font-mono text-[10px] sm:text-xs font-bold text-muted-foreground">{player.bowl_econ.toFixed(2)}</TableCell>
                              </TableRow>
                            )) : (
                              <TableRow>
                                <TableCell colSpan={4} className="text-center py-16 text-muted-foreground italic">
                                  <div className="flex flex-col items-center gap-2">
                                    <Shield className="h-6 w-6 sm:h-8 sm:w-8 opacity-20" />
                                    <span className="text-xs sm:text-sm">No bowling data</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                      <div className="p-3 sm:p-4 bg-secondary/20 border-t border-border/20 text-[8px] sm:text-[10px] flex items-center justify-between font-black text-muted-foreground/60 uppercase tracking-widest">
                        <span className="flex items-center gap-1 sm:gap-1.5"><Users className="h-3 w-3" /> Field Support</span>
                        <span className="flex items-center gap-1 sm:gap-1.5"><Shield className="h-3 w-3" /> Strike Power</span>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        ) : (
          <Card className="border-dashed border-2 py-24 sm:py-32 text-center bg-transparent">
            <CardContent>
              <Info className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/20 mx-auto mb-6" />
              <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter">No scorecard data</h3>
              <p className="text-sm sm:text-muted-foreground max-w-md mx-auto mt-2 px-4">
                Detailed ball-by-ball performance stats haven't been processed for this match yet.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center px-6">
                <Button variant="outline" className="font-bold w-full sm:w-auto">
                  Refresh Data
                </Button>
                <Button className="font-bold w-full sm:w-auto">
                  Import Ball-by-Ball
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default MatchDetails;
