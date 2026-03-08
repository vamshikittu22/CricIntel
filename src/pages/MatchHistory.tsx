import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { usePlayer, useDeliveries } from "@/lib/hooks/usePlayers";
import { getFlag } from "@/lib/countryFlags";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const formats = ["T20", "ODI", "Test"] as const;

interface InningsEntry {
  matchId: string;
  date: string;
  opponent: string;
  venue: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  sr: number;
  isOut: boolean;
  dismissal: string | null;
}

export default function MatchHistory() {
  const { id } = useParams<{ id: string }>();
  const [format, setFormat] = useState("T20");
  const { data: player, isLoading: playerLoading } = usePlayer(id);
  const { data: deliveries } = useDeliveries(id, format);

  const innings = useMemo(() => {
    if (!deliveries || deliveries.length === 0) return [];
    const grouped: Record<string, any[]> = {};
    for (const d of deliveries) {
      const key = `${d.match_id}_${d.innings}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(d);
    }

    const entries: InningsEntry[] = Object.values(grouped).map((balls) => {
      const match = (balls[0] as any).matches;
      const runs = balls.reduce((s: number, b: any) => s + b.runs_batter, 0);
      const totalBalls = balls.length;
      const fours = balls.filter((b: any) => b.is_boundary).length;
      const sixes = balls.filter((b: any) => b.is_six).length;
      const wicketBall = balls.find((b: any) => b.is_wicket);
      const team1 = match?.team1 || "";
      const team2 = match?.team2 || "";

      return {
        matchId: balls[0].match_id,
        date: match?.match_date || "",
        opponent: `${team1} vs ${team2}`,
        venue: match?.venue || "",
        runs,
        balls: totalBalls,
        fours,
        sixes,
        sr: totalBalls > 0 ? Math.round((runs / totalBalls) * 100 * 100) / 100 : 0,
        isOut: !!wicketBall,
        dismissal: wicketBall?.wicket_type || null,
      };
    });

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [deliveries]);

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
          <h1 className="font-heading text-2xl">Player not found</h1>
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
            <h1 className="font-heading text-2xl font-bold md:text-3xl">{player.name}</h1>
            <p className="text-muted-foreground">Match History & Innings Log</p>
          </div>
        </motion.div>

        <Tabs value={format} onValueChange={setFormat}>
          <TabsList>
            {formats.map((f) => (
              <TabsTrigger key={f} value={f} className="font-heading text-xs">{f}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {innings.length > 0 ? (
          <>
            {/* Performance Trend */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-heading text-lg">Run Scoring Trend</CardTitle></CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="inning" tick={{ fontSize: 11 }} label={{ value: "Innings", position: "insideBottom", offset: -5, fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: 12,
                        }}
                      />
                      <Line type="monotone" dataKey="runs" stroke="hsl(174, 72%, 40%)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Innings Table */}
            <Card className="border-border/50">
              <CardHeader><CardTitle className="font-heading text-lg">Innings Log</CardTitle></CardHeader>
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
                          {inn.runs >= 50 ? (
                            <span className="text-primary font-bold">{inn.runs}{!inn.isOut && "*"}</span>
                          ) : (
                            <span>{inn.runs}{!inn.isOut && "*"}</span>
                          )}
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
