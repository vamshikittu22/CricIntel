import { useState } from "react";
import { FormTracker as BattingFormTracker } from "@/components/form/FormTracker";
import { BowlingFormTracker } from "@/components/form/BowlingFormTracker";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";
import type { PlayerMatchRow } from "@/lib/hooks/usePlayers";
import { Activity, Target } from "lucide-react";
import { cn } from "@/lib/utils";

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
          <div className="flex glass p-2 rounded-2xl border border-black/5 dark:border-white/5 shadow-2xl bg-muted/20">
            <button
              onClick={() => setFormType("batting")}
              className={cn(
                "flex items-center gap-3 py-3 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                displayType === "batting" 
                  ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Activity className="h-4 w-4" />
              Batting Form
            </button>
            <button
              onClick={() => setFormType("bowling")}
              className={cn(
                "flex items-center gap-3 py-3 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                displayType === "bowling" 
                  ? "bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-105" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
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
