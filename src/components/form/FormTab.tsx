import { FormTracker } from "@/components/form/FormTracker";
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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <FormTracker recentMatches={recentMatches} format={format} />
    </motion.div>
  );
}
