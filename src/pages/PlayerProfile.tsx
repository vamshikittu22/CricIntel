import { useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { usePlayer, useBattingAnalytics, useDeliveries, useBowlingAnalytics, useBowlingDeliveries } from "@/lib/hooks/usePlayers";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayerProfileCard } from "@/components/profile/PlayerProfileCard";
import { ProfileStickyTabs, ProfileTab } from "@/components/profile/ProfileStickyTabs";
import { PlayerOverview } from "@/components/profile/PlayerOverview";
import { BattingDashboard } from "@/components/batting/BattingDashboard";
import { BowlingTab } from "@/components/bowling/BowlingTab";
import { WeaknessesTab } from "@/components/weaknesses/WeaknessesTab";
import { FieldingTab } from "@/components/fielding/FieldingTab";
import { FormTab } from "@/components/form/FormTab";
import { EmptyState } from "@/components/ui/empty-state";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const [format, setFormat] = useState<string>("T20");
  const [section, setSection] = useState<ProfileTab>("overview");
  const { data: player, isLoading: playerLoading } = usePlayer(id);
  const { data: analytics, isLoading: battingLoading, isSuccess: battingSuccess, isError: battingError } = useBattingAnalytics(id, format);
  const { data: deliveries, isLoading: deliveriesLoading } = useDeliveries(id, format);
  const { data: bowlingAnalytics, isLoading: bowlingLoading } = useBowlingAnalytics(id, format);
  const { data: bowlingDeliveries, isLoading: bowlDelLoading } = useBowlingDeliveries(id, format);

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

  // Toast on data load
  useEffect(() => {
    if (battingSuccess && stats) {
      toast({ title: "Data loaded", description: `${format} stats loaded successfully.` });
    }
  }, [battingSuccess, format]);

  useEffect(() => {
    if (battingError) {
      toast({ title: "Error", description: "Failed to load player data.", variant: "destructive" });
    }
  }, [battingError]);

  if (playerLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-12 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-16">
          <EmptyState message="Player not found. Please check the URL and try again." />
        </div>
      </div>
    );
  }

  const dataLoading = battingLoading || deliveriesLoading || bowlingLoading || bowlDelLoading;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Player Profile Card */}
      <div className="container mx-auto px-4 py-6">
        <PlayerProfileCard player={player} stats={stats} format={format} onFormatChange={setFormat} />
      </div>

      {/* Sticky Tab Bar */}
      <ProfileStickyTabs activeTab={section} onTabChange={handleTabChange} />

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {section === "overview" && (
              <div ref={setRef("overview")}>
                <PlayerOverview battingStats={stats} bowlingStats={bowlStats} format={format} />
              </div>
            )}

            {section === "batting" && (
              <div ref={setRef("batting")}>
                <BattingDashboard stats={stats} deliveries={deliveries || []} format={format} isLoading={dataLoading} />
              </div>
            )}

            {section === "bowling" && (
              <div ref={setRef("bowling")}>
                <BowlingTab
                  analytics={bowlStats}
                  deliveries={bowlingDeliveries || []}
                  format={format}
                  playerRole={player.role}
                  isLoading={dataLoading}
                />
              </div>
            )}

            {section === "weaknesses" && (
              <div ref={setRef("weaknesses")}>
                <WeaknessesTab
                  deliveries={deliveries || []}
                  analytics={stats}
                  format={format}
                  isLoading={dataLoading}
                />
              </div>
            )}

            {section === "fielding" && (
              <div ref={setRef("fielding")}>
                <FieldingTab isLoading={dataLoading} />
              </div>
            )}

            {section === "form" && (
              <div ref={setRef("form")}>
                <FormTab
                  deliveries={player.role === "bowler" ? bowlingDeliveries || [] : deliveries || []}
                  playerRole={player.role}
                  format={format}
                  isLoading={dataLoading}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
