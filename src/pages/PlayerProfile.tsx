import { useParams, Link } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { usePlayer, useBattingAnalytics, useDeliveries, useBowlingAnalytics, useBowlingDeliveries } from "@/lib/hooks/usePlayers";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/batting/StatCard";
import { WagonWheel } from "@/components/batting/WagonWheel";
import { DismissalChart } from "@/components/batting/DismissalChart";
import { BallLengthMatrix } from "@/components/batting/BallLengthMatrix";
import { PhaseStats } from "@/components/batting/PhaseStats";
import { PaceVsSpin } from "@/components/batting/PaceVsSpin";
import { WeaknessEngine } from "@/components/batting/WeaknessEngine";
import { BowlingDashboard } from "@/components/bowling/BowlingDashboard";
import { HeadToHead } from "@/components/HeadToHead";
import { FormTracker } from "@/components/form/FormTracker";
import { PlayerProfileCard } from "@/components/profile/PlayerProfileCard";
import { ProfileStickyTabs, ProfileTab } from "@/components/profile/ProfileStickyTabs";
import { PlayerOverview } from "@/components/profile/PlayerOverview";
import { motion } from "framer-motion";
import { useState, useRef, useCallback } from "react";

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const [format, setFormat] = useState<string>("T20");
  const [section, setSection] = useState<ProfileTab>("overview");
  const { data: player, isLoading: playerLoading } = usePlayer(id);
  const { data: analytics } = useBattingAnalytics(id, format);
  const { data: deliveries } = useDeliveries(id, format);
  const { data: bowlingAnalytics } = useBowlingAnalytics(id, format);
  const { data: bowlingDeliveries } = useBowlingDeliveries(id, format);

  const stats = analytics?.[0];
  const bowlStats = bowlingAnalytics?.[0];

  // Section refs for smooth scrolling
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const setRef = useCallback((key: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[key] = el;
  }, []);

  const handleTabChange = (tab: ProfileTab) => {
    setSection(tab);
    const el = sectionRefs.current[tab];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
          <h1 className="text-2xl font-bold">Player not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Player Profile Card */}
      <div className="container mx-auto px-4 py-6">
        <PlayerProfileCard
          player={player}
          stats={stats}
          format={format}
          onFormatChange={setFormat}
        />
      </div>

      {/* Sticky Tab Bar */}
      <ProfileStickyTabs activeTab={section} onTabChange={handleTabChange} />

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-8 space-y-12">

        {/* OVERVIEW */}
        <div ref={setRef("overview")}>
          {section === "overview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <PlayerOverview
                battingStats={stats}
                bowlingStats={bowlStats}
                format={format}
              />
            </motion.div>
          )}
        </div>

        {/* BATTING */}
        <div ref={setRef("batting")}>
          {section === "batting" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {stats ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                  <StatCard label="Matches" value={stats.matches ?? 0} />
                  <StatCard label="Runs" value={stats.total_runs ?? 0} highlight />
                  <StatCard label="Average" value={stats.average ?? "—"} />
                  <StatCard label="Strike Rate" value={stats.strike_rate ?? "—"} />
                  <StatCard label="4s" value={stats.fours ?? 0} />
                  <StatCard label="6s" value={stats.sixes ?? 0} />
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No {format} batting data</p>
              )}

              {deliveries && deliveries.length > 0 && (
                <>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="border-border">
                      <CardHeader><CardTitle className="text-lg">Scoring Zones</CardTitle></CardHeader>
                      <CardContent>
                        <WagonWheel deliveries={deliveries} />
                        <div className="flex justify-center gap-4 mt-3 text-xs">
                          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" /> Singles</span>
                          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Fours</span>
                          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-destructive" /> Sixes</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-border">
                      <CardHeader><CardTitle className="text-lg">Dismissal Breakdown</CardTitle></CardHeader>
                      <CardContent>
                        {stats ? <DismissalChart analytics={stats} /> : <p className="text-sm text-muted-foreground text-center py-8">No data</p>}
                      </CardContent>
                    </Card>
                  </div>
                  <Card className="border-border">
                    <CardHeader><CardTitle className="text-lg">Ball Length Response</CardTitle></CardHeader>
                    <CardContent><BallLengthMatrix deliveries={deliveries} /></CardContent>
                  </Card>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Phase-wise Performance</h3>
                    <PhaseStats deliveries={deliveries} format={format} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Pace vs Spin</h3>
                    <PaceVsSpin deliveries={deliveries} />
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>

        {/* BOWLING */}
        <div ref={setRef("bowling")}>
          {section === "bowling" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <BowlingDashboard
                analytics={bowlStats}
                deliveries={bowlingDeliveries || []}
                format={format}
              />
            </motion.div>
          )}
        </div>

        {/* WEAKNESSES */}
        <div ref={setRef("weaknesses")}>
          {section === "weaknesses" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <WeaknessEngine
                deliveries={deliveries || []}
                analytics={stats}
                format={format}
              />
            </motion.div>
          )}
        </div>

        {/* FIELDING */}
        <div ref={setRef("fielding")}>
          {section === "fielding" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-medium">Fielding analytics coming soon</p>
                <p className="text-sm mt-1">Catches, run-outs, and fielding positions will be tracked here.</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* FORM */}
        <div ref={setRef("form")}>
          {section === "form" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <FormTracker
                deliveries={
                  player.role === "bowler"
                    ? bowlingDeliveries || []
                    : deliveries || []
                }
                playerRole={player.role}
                format={format}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
