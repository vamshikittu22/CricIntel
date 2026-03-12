import { useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { usePlayer, usePlayerSummary, usePlayerRecentMatches } from "@/lib/hooks/usePlayers";
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
import { useState, useRef, useCallback } from "react";
import { usePlayerTotals } from "@/lib/hooks/usePlayers";

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const [format, setFormat] = useState<string>("ODI");
  const [section, setSection] = useState<ProfileTab>("overview");
  const { data: player, isLoading: playerLoading } = usePlayer(id);
  const { data: summaries, isLoading: summaryLoading } = usePlayerSummary(id);
  const { data: totals, isLoading: totalsLoading } = usePlayerTotals(id);
  const { data: recentMatches, isLoading: matchesLoading } = usePlayerRecentMatches(id, format);

  const stats = summaries?.find((s) => s.format === format) ?? null;

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const setRef = useCallback((key: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[key] = el;
  }, []);

  const handleTabChange = (tab: ProfileTab) => {
    setSection(tab);
    const el = sectionRefs.current[tab];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const dataLoading = summaryLoading || matchesLoading;

  if (playerLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-12 rounded-lg" />
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

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <div className="container mx-auto px-4 py-6">
        <PlayerProfileCard player={player} stats={stats} format={format} onFormatChange={setFormat} />
      </div>

      <ProfileStickyTabs activeTab={section} onTabChange={handleTabChange} />

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
                 <PlayerOverview 
                   battingStats={stats} 
                   bowlingStats={stats}
                   format={format} 
                   totals={totals} 
                   recentMatches={recentMatches || []} 
                 />
               </div>
             )}

            {section === "batting" && (
              <div ref={setRef("batting")}>
                <BattingDashboard stats={stats} recentMatches={recentMatches || []} format={format} isLoading={dataLoading} />
              </div>
            )}

            {section === "bowling" && (
              <div ref={setRef("bowling")}>
                <BowlingTab stats={stats} recentMatches={recentMatches || []} format={format} isLoading={dataLoading} />
              </div>
            )}

            {section === "weaknesses" && (
              <div ref={setRef("weaknesses")}>
                <WeaknessesTab stats={stats} format={format} isLoading={dataLoading} />
              </div>
            )}

            {section === "fielding" && (
              <div ref={setRef("fielding")}>
                <FieldingTab isLoading={dataLoading} />
              </div>
            )}

            {section === "form" && (
              <div ref={setRef("form")}>
                <FormTab recentMatches={recentMatches || []} format={format} isLoading={dataLoading} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
