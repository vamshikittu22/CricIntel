import { useParams } from "react-router-dom";
import { AppHeader } from "@/components/AppHeader";
import { usePlayer, usePlayerSummary, usePlayerRecentMatches, type PlayerSummary } from "@/lib/hooks/usePlayers";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayerProfileCard } from "@/components/profile/PlayerProfileCard";
import { ProfileStickyTabs, ProfileTab } from "@/components/profile/ProfileStickyTabs";
import { PlayerOverview } from "@/components/profile/PlayerOverview";
import { BattingDashboard } from "@/components/batting/BattingDashboard";
import { BowlingTab } from "@/components/bowling/BowlingTab";
import { WeaknessesTab } from "@/components/weaknesses/WeaknessesTab";
import { FieldingTab } from "@/components/fielding/FieldingTab";
import { FormTab } from "@/components/form/FormTab";
import OppositionTab from "@/components/opposition/OppositionTab";
import BattingPositionTab from "@/components/position/BattingPositionTab";
import PartnershipTab from "@/components/partnerships/PartnershipTab";
import H2HDashboard from "@/components/profile/H2HDashboard";
import { EmptyState } from "@/components/ui/empty-state";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { usePlayerTotals } from "@/lib/hooks/usePlayers";

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const [format, setFormat] = useState<string>("All");
  const [section, setSection] = useState<ProfileTab>("overview");
  const { data: player, isLoading: playerLoading } = usePlayer(id);
  const { data: summaries, isLoading: summaryLoading } = usePlayerSummary(id);
  const { data: totals, isLoading: totalsLoading } = usePlayerTotals(id);

  // Derive formats played from the actual data summary if missing or incomplete
  const formatsPlayed = useMemo(() => {
    if (!summaries || summaries.length === 0) return (player?.formats_played || ["All"]).map(f => f.toUpperCase());
    const found = summaries.map(s => s.format.toUpperCase());
    return Array.from(new Set(["ALL", ...found, ...(player?.formats_played || []).map(f => f.toUpperCase())]));
  }, [summaries, player]);
  
  const { data: recentMatches, isLoading: matchesLoading } = usePlayerRecentMatches(id, format === "All" ? undefined : format);

  const stats = format === "All" 
    ? (totals as unknown as PlayerSummary) 
    : (summaries?.find((s) => s.format.toUpperCase() === format.toUpperCase()) ?? null);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const setRef = useCallback((key: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[key] = el;
  }, []);

  const defaultFormat = useMemo(() => {
    const played = formatsPlayed.filter(f => f !== "ALL");
    return played.length > 0 ? played[0] : "T20I";
  }, [formatsPlayed]);

  const handleTabChange = (tab: ProfileTab) => {
    setSection(tab);
    // Intersection of state update and scroll
    setTimeout(() => {
      const el = sectionRefs.current[tab];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  useEffect(() => {
    const el = sectionRefs.current[section];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [section]);

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
        <PlayerProfileCard 
          player={player ? { ...player, formats_played: formatsPlayed } : null} 
          stats={stats} 
          format={format} 
          onFormatChange={setFormat} 
        />
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
                <FieldingTab format={format} stats={stats} isLoading={dataLoading} />
              </div>
            )}

            {((section as string) === "opposition" || section === "batting-opposition" || section === "bowling-opposition") && (
              <div ref={setRef(section)}>
                <OppositionTab 
                  playerId={id!} 
                  playerName={player.name} 
                  initialFormat={(format === "All" || format === "ALL") ? defaultFormat : format}
                />
              </div>
            )}

            {section === "batting-position" && (
              <div ref={setRef("batting-position")}>
                <BattingPositionTab 
                  playerId={id!} 
                  playerName={player.name} 
                  initialFormat={(format === "All" || format === "ALL") ? defaultFormat : format}
                />
              </div>
            )}

            {section === "batting-partnerships" && (
              <div ref={setRef("batting-partnerships")}>
                <PartnershipTab 
                  playerId={id!} 
                  playerName={player.name} 
                  initialFormat={(format === "All" || format === "ALL") ? defaultFormat : format}
                />
              </div>
            )}

            {(section === "h2h" || section === "batting-h2h" || section === "bowling-h2h") && (
              <div ref={setRef(section)}>
                <H2HDashboard 
                  playerId={id!} 
                  playerName={player.name} 
                  initialFormat={(format === "All" || format === "ALL") ? defaultFormat : format}
                  initialView={section === "bowling-h2h" ? 'victims' : 'nemesis'}
                  onViewChange={(v) => {
                    // Update section WITHOUT scrolling to avoid jumping
                    setSection(v === 'victims' ? 'bowling-h2h' : 'batting-h2h');
                  }}
                />
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
