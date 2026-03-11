import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/batting/StatCard";
import { useFeaturedPlayers, usePlayerSummary } from "@/lib/hooks/usePlayers";
import { getFlag } from "@/lib/countryFlags";
import { ArrowLeftRight } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const formats = ["T20I", "ODI", "Test"] as const;

export default function Compare() {
  const { data: players } = useFeaturedPlayers();
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [format, setFormat] = useState("T20I");

  const { data: sum1 } = usePlayerSummary(player1Id || undefined);
  const { data: sum2 } = usePlayerSummary(player2Id || undefined);

  const p1 = players?.find((p) => p.id === player1Id);
  const p2 = players?.find((p) => p.id === player2Id);
  const b1 = sum1?.find((s) => s.format === format);
  const b2 = sum2?.find((s) => s.format === format);

  const battingChart = b1 || b2 ? [
    { stat: "Runs", [p1?.name || "Player 1"]: b1?.runs ?? 0, [p2?.name || "Player 2"]: b2?.runs ?? 0 },
    { stat: "Average", [p1?.name || "Player 1"]: b1?.average ?? 0, [p2?.name || "Player 2"]: b2?.average ?? 0 },
    { stat: "SR", [p1?.name || "Player 1"]: b1?.strike_rate ?? 0, [p2?.name || "Player 2"]: b2?.strike_rate ?? 0 },
    { stat: "4s", [p1?.name || "Player 1"]: b1?.fours ?? 0, [p2?.name || "Player 2"]: b2?.fours ?? 0 },
    { stat: "6s", [p1?.name || "Player 1"]: b1?.sixes ?? 0, [p2?.name || "Player 2"]: b2?.sixes ?? 0 },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold md:text-4xl">
            Player <span className="text-primary">Comparison</span>
          </h1>
          <p className="text-muted-foreground mt-2">Compare two players side by side.</p>
        </motion.div>

        <Tabs value={format} onValueChange={setFormat}>
          <TabsList>
            {formats.map((f) => <TabsTrigger key={f} value={f} className="text-xs">{f}</TabsTrigger>)}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Player 1</label>
            <Select value={player1Id} onValueChange={setPlayer1Id}>
              <SelectTrigger><SelectValue placeholder="Select player..." /></SelectTrigger>
              <SelectContent>
                {players?.filter((p) => p.id !== player2Id).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{getFlag(p.country)} {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-center">
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Player 2</label>
            <Select value={player2Id} onValueChange={setPlayer2Id}>
              <SelectTrigger><SelectValue placeholder="Select player..." /></SelectTrigger>
              <SelectContent>
                {players?.filter((p) => p.id !== player1Id).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{getFlag(p.country)} {p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {player1Id && player2Id && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <Card className="border-border/50">
              <CardHeader><CardTitle className="text-lg">Batting Comparison</CardTitle></CardHeader>
              <CardContent>
                {b1 || b2 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <p className="font-semibold text-center">{getFlag(p1?.country || "")} {p1?.name}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <StatCard label="Matches" value={b1?.matches ?? 0} />
                          <StatCard label="Runs" value={b1?.runs ?? 0} highlight />
                          <StatCard label="Average" value={b1?.average ?? "-"} />
                          <StatCard label="SR" value={b1?.strike_rate ?? "-"} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <p className="font-semibold text-center">{getFlag(p2?.country || "")} {p2?.name}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <StatCard label="Matches" value={b2?.matches ?? 0} />
                          <StatCard label="Runs" value={b2?.runs ?? 0} highlight />
                          <StatCard label="Average" value={b2?.average ?? "-"} />
                          <StatCard label="SR" value={b2?.strike_rate ?? "-"} />
                        </div>
                      </div>
                    </div>
                    {battingChart.length > 0 && (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={battingChart}>
                            <XAxis dataKey="stat" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey={p1?.name || "Player 1"} fill="hsl(174, 72%, 40%)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey={p2?.name || "Player 2"} fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">No {format} data for these players</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
