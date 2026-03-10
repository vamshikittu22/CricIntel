import { FormTracker } from "@/components/form/FormTracker";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";

interface FormTabProps {
  deliveries: any[];
  playerRole: string;
  format: string;
  isLoading?: boolean;
}

export function FormTab({ deliveries, playerRole, format, isLoading }: FormTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-60 rounded-lg" />
      </div>
    );
  }

  if (!deliveries?.length) {
    return <EmptyState message={`No match data available for ${format} format.`} />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <FormTracker deliveries={deliveries} playerRole={playerRole} format={format} />
    </motion.div>
  );
}
