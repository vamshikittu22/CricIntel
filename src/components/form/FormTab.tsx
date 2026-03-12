import { useState } from "react";
import { FormTracker as BattingFormTracker } from "@/components/form/FormTracker";
import { BowlingFormTracker } from "@/components/form/BowlingFormTracker";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";
import type { PlayerMatchRow } from "@/lib/hooks/usePlayers";
import { Activity, Target } from "lucide-react";

interface FormTabProps {
  recentMatches: PlayerMatchRow[];
  format: string;
  isLoading?: boolean;
}

export function FormTab({ recentMatches, format, isLoading }: FormTabProps) {
  const [formType, setFormType] = useState<"batting" | "bowling">("batting");

  if (isLoading) {
    return (
      <div className="space-y-8 pb-20">
        <div className="flex justify-center mb-8">
           <Skeleton className="h-12 w-64 rounded-2xl" />
        </div>
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }

  if (!recentMatches?.length) {
    return <EmptyState message={`No match data available for ${format} format.`} />;
  }

  const hasBatting = recentMatches.some(m => m.is_batter);
  const hasBowling = recentMatches.some(m => m.is_bowler);
  
  const displayType = (formType === "batting" && hasBatting) ? "batting" 
    : (formType === "bowling" && hasBowling) ? "bowling" 
    : hasBatting ? "batting" 
    : "bowling";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pb-24">
      {(hasBatting && hasBowling) && (
        <div className="flex justify-center">
          <div className="flex glass p-1.5 rounded-2xl border-white/5 shadow-2xl">
            <button
              onClick={() => setFormType("batting")}
              className={`flex items-center gap-3 py-3 px-8 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                displayType === "batting" 
                  ? "bg-primary text-white shadow-[0_0_30px_-10px_rgba(var(--primary-rgb),0.5)]" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              <Activity className="h-4 w-4" />
              Batting Form
            </button>
            <button
              onClick={() => setFormType("bowling")}
              className={`flex items-center gap-3 py-3 px-8 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                displayType === "bowling" 
                  ? "bg-primary text-white shadow-[0_0_30px_-10px_rgba(var(--primary-rgb),0.5)]" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            >
              <Target className="h-4 w-4" />
              Bowling Form
            </button>
          </div>
        </div>
      )}

      <div className="space-y-12">
        {displayType === "batting" ? (
          <BattingFormTracker recentMatches={recentMatches} format={format} />
        ) : (
          <BowlingFormTracker recentMatches={recentMatches} format={format} />
        )}
      </div>
    </motion.div>
  );
}
