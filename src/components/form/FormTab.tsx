import { useState } from "react";
import { FormTracker as BattingFormTracker } from "@/components/form/FormTracker";
import { BowlingFormTracker } from "@/components/form/BowlingFormTracker";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";
import type { PlayerMatchRow } from "@/lib/hooks/usePlayers";

interface FormTabProps {
  recentMatches: PlayerMatchRow[];
  format: string;
  isLoading?: boolean;
}

export function FormTab({ recentMatches, format, isLoading }: FormTabProps) {
  const [formType, setFormType] = useState<"batting" | "bowling">("batting");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    );
  }

  if (!recentMatches?.length) {
    return <EmptyState message={`No match data available for ${format} format.`} />;
  }

  const hasBatting = recentMatches.some(m => m.is_batter);
  const hasBowling = recentMatches.some(m => m.is_bowler);
  
  // Set default type if a player only has one skill
  const displayType = (formType === "batting" && hasBatting) ? "batting" 
    : (formType === "bowling" && hasBowling) ? "bowling" 
    : hasBatting ? "batting" 
    : "bowling";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {(hasBatting && hasBowling) && (
        <div className="flex bg-muted/30 p-1 rounded-xl w-full max-w-sm mx-auto border border-border">
          <button
            onClick={() => setFormType("batting")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              displayType === "batting" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            🏏 Batting Form
          </button>
          <button
            onClick={() => setFormType("bowling")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              displayType === "bowling" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            🥎 Bowling Form
          </button>
        </div>
      )}

      {displayType === "batting" ? (
        <BattingFormTracker recentMatches={recentMatches} format={format} />
      ) : (
        <BowlingFormTracker recentMatches={recentMatches} format={format} />
      )}
    </motion.div>
  );
}
