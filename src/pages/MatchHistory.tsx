import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { usePlayer, usePlayerRecentMatches } from "@/lib/hooks/usePlayers";
import { getFlag } from "@/lib/countryFlags";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const formats = ["T20I", "ODI", "Test"] as const;

export default function MatchHistory() {
  const { id } = useParams<{ id: string }>();
  const [format, setFormat] = useState("T20I");
  const { data: player, isLoading: playerLoading } = usePlayer(id);
  const { data: recentMatches } = usePlayerRecentMatches(id, format, 50);

  const innings = useMemo(() => {
    if (!recentMatches) return [];
    return recentMatches
      .filter((m) => m.is_batter)
      .map((m) => ({
        matchId: m.match_id,
        date: m.match_date,
        opponent: `${m.team1} vs ${m.team2}`,
        venue: m.venue,
        runs: m.bat_runs,
        balls: m.bat_balls,
        fours: m.bat_fours,
        sixes: m.bat_sixes,
        sr: m.bat_balls > 0 ? +((m.bat_runs / m.bat_balls) * 100).toFixed(1) : 0,
        isOut: !m.bat_not_out,
        dismissal: m.bat_dismissal_kind,
      }));
  }, [recentMatches]);

  const trendData = useMemo(() => {
    return [...innings].reverse().map((inn, i) => ({
      inning: i + 1,
      runs: inn.runs,
      sr: inn.sr,
      label: inn.date,
    }));
  }, [innings]);

  if (playerLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8"><Skeleton className="h-48 rounded-xl" /></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Player not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted text-3xl">
            {getFlag(player.country)}
          </div>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{player.name}</h1>
            <p className="text-muted-foreground">Match History & Innings Log</p>
          </div>
        </motion.div>

        <Tabs value={format} onValueChange={setFormat}>
          <TabsList>
            {formats.map((f) => <TabsTrigger key={f} value={f} className="text-xs">{f}</TabsTrigger>)}
          </TabsList>
        </Tabs>

        {innings.length > 0 ? (
          <>
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-lg">Run Scoring Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="inning" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} />
                      <Line type="monotone" dataKey="runs" stroke="hsl(174, 72%, 40%)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-lg">Innings Log</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Match</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead className="text-right">Runs</TableHead>
                      <TableHead className="text-right">Balls</TableHead>
                      <TableHead className="text-right">4s</TableHead>
                      <TableHead className="text-right">6s</TableHead>
                      <TableHead className="text-right">SR</TableHead>
                      <TableHead>Dismissal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {innings.map((inn, i) => (
                      <TableRow key={`${inn.matchId}-${i}`}>
                        <TableCell className="text-xs whitespace-nowrap">{inn.date}</TableCell>
                        <TableCell className="text-xs">{inn.opponent}</TableCell>
                        <TableCell className="text-xs truncate max-w-[120px]">{inn.venue}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {inn.runs >= 50 ? <span className="text-primary font-bold">{inn.runs}{!inn.isOut && "*"}</span> : <span>{inn.runs}{!inn.isOut && "*"}</span>}
                        </TableCell>
                        <TableCell className="text-right text-xs">{inn.balls}</TableCell>
                        <TableCell className="text-right text-xs">{inn.fours}</TableCell>
                        <TableCell className="text-right text-xs">{inn.sixes}</TableCell>
                        <TableCell className="text-right text-xs">{inn.sr}</TableCell>
                        <TableCell>
                          {inn.dismissal ? (
                            <Badge variant="outline" className="text-xs">{inn.dismissal}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">not out</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-8">No {format} innings data available.</p>
        )}
      </div>
    </div>
  );
}
