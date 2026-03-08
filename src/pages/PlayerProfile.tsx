import { useParams, Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { usePlayer, useBattingAnalytics, useDeliveries, useBowlingAnalytics, useBowlingDeliveries } from "@/lib/hooks/usePlayers";
import { getFlag } from "@/lib/countryFlags";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/batting/StatCard";
import { WagonWheel } from "@/components/batting/WagonWheel";
import { DismissalChart } from "@/components/batting/DismissalChart";
import { BallLengthMatrix } from "@/components/batting/BallLengthMatrix";
import { PhaseStats } from "@/components/batting/PhaseStats";
import { PaceVsSpin } from "@/components/batting/PaceVsSpin";
import { WeaknessEngine } from "@/components/batting/WeaknessEngine";
import { BowlingDashboard } from "@/components/bowling/BowlingDashboard";
import { HeadToHead } from "@/components/HeadToHead";
import { motion } from "framer-motion";
import { useState } from "react";

const formats = ["T20", "ODI", "Test"] as const;

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const [format, setFormat] = useState<string>("T20");
  const [section, setSection] = useState<string>("batting");
  const { data: player, isLoading: playerLoading } = usePlayer(id);
  const { data: analytics } = useBattingAnalytics(id, format);
  const { data: deliveries } = useDeliveries(id, format);
  const { data: bowlingAnalytics } = useBowlingAnalytics(id, format);
  const { data: bowlingDeliveries } = useBowlingDeliveries(id, format);

  const stats = analytics?.[0];
  const bowlStats = bowlingAnalytics?.[0];

  if (playerLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-48 rounded-xl" />
        </div>
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

  const formScore = stats
    ? Math.min(10, Math.max(1, ((stats.strike_rate || 0) / 20 + (stats.average || 0) / 15))).toFixed(1)
    : "N/A";
  const formColor =
    parseFloat(formScore) >= 7
      ? "text-success"
      : parseFloat(formScore) >= 5
        ? "text-warning"
        : "text-destructive";

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Player Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start gap-6"
        >
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-muted text-5xl shadow-sm">
            {getFlag(player.country)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-3xl font-bold md:text-4xl">{player.name}</h1>
            <p className="text-lg text-muted-foreground mt-1">{player.country}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">{player.role}</Badge>
              <Badge variant="outline">{player.batting_style} bat</Badge>
              {player.bowling_style !== "none" && (
                <Badge variant="outline">{player.bowling_style}</Badge>
              )}
              <Link to={`/player/${id}/history`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent transition-colors">
                  📋 Match History
                </Badge>
              </Link>
            </div>
          </div>
          <Card className="shrink-0 border-border/50">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Form</p>
              <p className={`font-heading text-3xl font-bold ${formColor}`}>{formScore}</p>
              <p className="text-xs text-muted-foreground">/10</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Section Tabs (Batting / Bowling / Weakness / H2H) */}
        <Tabs value={section} onValueChange={setSection}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="batting" className="flex-1 sm:flex-none font-heading">Batting</TabsTrigger>
            <TabsTrigger value="bowling" className="flex-1 sm:flex-none font-heading">Bowling</TabsTrigger>
            <TabsTrigger value="weakness" className="flex-1 sm:flex-none font-heading">Tactical</TabsTrigger>
            <TabsTrigger value="h2h" className="flex-1 sm:flex-none font-heading">Head-to-Head</TabsTrigger>
          </TabsList>

          {/* Format Toggle (shared) */}
          <div className="mt-4">
            <Tabs value={format} onValueChange={setFormat}>
              <TabsList className="w-full sm:w-auto">
                {formats.map((f) => (
                  <TabsTrigger key={f} value={f} className="flex-1 sm:flex-none font-heading text-xs">
                    {f}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* BATTING */}
          <TabsContent value="batting" className="space-y-8 mt-6">
            {stats ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <StatCard label="Matches" value={stats.matches ?? 0} />
                <StatCard label="Runs" value={stats.total_runs ?? 0} highlight />
                <StatCard label="Average" value={stats.average ?? "-"} />
                <StatCard label="Strike Rate" value={stats.strike_rate ?? "-"} />
                <StatCard label="4s" value={stats.fours ?? 0} />
                <StatCard label="6s" value={stats.sixes ?? 0} />
              </motion.div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No {format} batting data</p>
            )}

            {deliveries && deliveries.length > 0 && (
              <>
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="border-border/50">
                    <CardHeader><CardTitle className="font-heading text-lg">Scoring Zones</CardTitle></CardHeader>
                    <CardContent>
                      <WagonWheel deliveries={deliveries} />
                      <div className="flex justify-center gap-4 mt-3 text-xs">
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" /> Singles</span>
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Fours</span>
                        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Sixes</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardHeader><CardTitle className="font-heading text-lg">Dismissal Breakdown</CardTitle></CardHeader>
                    <CardContent>
                      {stats ? <DismissalChart analytics={stats} /> : <p className="text-sm text-muted-foreground text-center py-8">No data</p>}
                    </CardContent>
                  </Card>
                </div>
                <Card className="border-border/50">
                  <CardHeader><CardTitle className="font-heading text-lg">Ball Length Response</CardTitle></CardHeader>
                  <CardContent><BallLengthMatrix deliveries={deliveries} /></CardContent>
                </Card>
                <div>
                  <h3 className="font-heading text-lg font-semibold mb-3">Phase-wise Performance</h3>
                  <PhaseStats deliveries={deliveries} format={format} />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold mb-3">Pace vs Spin</h3>
                  <PaceVsSpin deliveries={deliveries} />
                </div>
              </>
            )}
          </TabsContent>

          {/* BOWLING */}
          <TabsContent value="bowling" className="mt-6">
            <BowlingDashboard
              analytics={bowlStats}
              deliveries={bowlingDeliveries || []}
              format={format}
            />
          </TabsContent>

          {/* TACTICAL / WEAKNESS ENGINE */}
          <TabsContent value="weakness" className="mt-6">
            <WeaknessEngine
              deliveries={deliveries || []}
              analytics={stats}
              format={format}
            />
          </TabsContent>

          {/* HEAD-TO-HEAD */}
          <TabsContent value="h2h" className="mt-6">
            {id && (
              <HeadToHead
                playerId={id}
                playerRole={player.role}
                format={format}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
