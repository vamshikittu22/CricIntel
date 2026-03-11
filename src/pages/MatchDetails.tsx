import { AppHeader } from "@/components/AppHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getFlag } from "@/lib/countryFlags";
import { useParams } from "react-router-dom";
import { Calendar, MapPin, Trophy, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
          <h2 className="text-xl font-bold">Match not found</h2>
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
    if (player.bat_not_out) return "not out";
    if (!player.bat_dismissal_kind) return "-";
    return player.bat_dismissal_kind;
  };

  const calculateStrikeRate = (runs: number, balls: number) => {
    if (balls === 0) return "-";
    return ((runs / balls) * 100).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container mx-auto px-4 py-6">
        {/* Match Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Matches
          </Button>

          <Card className="border-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-secondary">
                    {match.format}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {match.match_date ? new Date(match.match_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Unknown Date"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {match.venue || "Unknown Venue"}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getFlag(match.team1)}</span>
                  <span className="text-xl font-bold">{match.team1 || "TBC"}</span>
                </div>
                <span className="text-lg text-muted-foreground">vs</span>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold">{match.team2 || "TBC"}</span>
                  <span className="text-4xl">{getFlag(match.team2)}</span>
                </div>
              </div>
              {match.result && (
                <div className="text-center mt-2">
                  <span className="text-sm font-medium text-primary">{match.result}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Scorecard */}
        <div className="grid gap-6">
          {matchInnings.map((inning) => {
            const inningPlayers = inningsMap.get(inning) ?? [];
            const battingTeam = inningPlayers.find(p => p.is_batter)?.team || match.team1;
            const bowlingTeam = inningPlayers.find(p => p.is_bowler)?.team || match.team2;

            const battingStats = [...inningPlayers].filter(p => p.is_batter && p.bat_balls > 0).sort(sortBatting);
            const bowlingStats = [...inningPlayers].filter(p => p.is_bowler && p.bowl_overs > 0).sort(sortBowling);

            return (
              <div key={inning} className="space-y-6">
                <h3 className="text-xl font-bold border-b border-border pb-2 mt-4">
                  Innings {inning} - {battingTeam} Batting
                </h3>
                
                {battingStats.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>{getFlag(battingTeam)}</span>
                        {battingTeam} - Batting
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Batsman</TableHead>
                            <TableHead className="text-right">R</TableHead>
                            <TableHead className="text-right">B</TableHead>
                            <TableHead className="text-right">4s</TableHead>
                            <TableHead className="text-right">6s</TableHead>
                            <TableHead className="text-right">SR</TableHead>
                            <TableHead className="text-right">Dismissal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {battingStats.map((player) => (
                            <TableRow key={player.player_id}>
                              <TableCell className="font-medium">{player.player_name}</TableCell>
                              <TableCell className="text-right font-bold">{player.bat_runs}</TableCell>
                              <TableCell className="text-right">{player.bat_balls}</TableCell>
                              <TableCell className="text-right">{player.bat_fours}</TableCell>
                              <TableCell className="text-right">{player.bat_sixes}</TableCell>
                              <TableCell className="text-right">{calculateStrikeRate(player.bat_runs, player.bat_balls)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{formatDismissal(player)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {bowlingStats.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span>{getFlag(bowlingTeam)}</span>
                        {bowlingTeam} - Bowling
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Bowler</TableHead>
                            <TableHead className="text-right">O</TableHead>
                            <TableHead className="text-right">M</TableHead>
                            <TableHead className="text-right">R</TableHead>
                            <TableHead className="text-right">W</TableHead>
                            <TableHead className="text-right">Econ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bowlingStats.map((player) => (
                            <TableRow key={player.player_id}>
                              <TableCell className="font-medium">{player.player_name}</TableCell>
                              <TableCell className="text-right">{player.bowl_overs}</TableCell>
                              <TableCell className="text-right">{player.bowl_maidens}</TableCell>
                              <TableCell className="text-right">{player.bowl_runs}</TableCell>
                              <TableCell className="text-right font-bold">{player.bowl_wickets}</TableCell>
                              <TableCell className="text-right">{player.bowl_econ.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default MatchDetails;
