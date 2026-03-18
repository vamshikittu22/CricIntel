import { useBattingPosition } from "@/hooks/useAnalytics";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ListOrdered } from "lucide-react";

interface PositionsTabProps {
  playerId: string;
  format: string;
  isLoading?: boolean;
}

export function PositionsTab({ playerId, format, isLoading: parentLoading }: PositionsTabProps) {
  const { data: positionStats, isLoading } = useBattingPosition(playerId, format === "All" ? "T20I" : format);

  if (isLoading || parentLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    );
  }

  if (!positionStats || positionStats.length === 0) {
    return (
      <Card className="border-none shadow-none bg-slate-50/50 dark:bg-white/5 rounded-[2rem]">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <ListOrdered className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
            No batting position data found for this format
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 px-1">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <ListOrdered className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight uppercase">Batting Positions</h2>
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
            Detailed performance breakdown by position in the batting lineup
          </p>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-white dark:bg-white/5 rounded-[2.5rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[150px] font-black uppercase tracking-widest text-[10px] py-6 pl-8">Position</TableHead>
              <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Inns</TableHead>
              <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Total Runs</TableHead>
              <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Avg</TableHead>
              <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">SR</TableHead>
              <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">100s/50s</TableHead>
              <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">NO</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {positionStats.map((stat, index) => (
              <motion.tr 
                key={stat.position}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group hover:bg-slate-50 dark:hover:bg-white/5 border-b border-black/5 dark:border-white/5 last:border-0 transition-colors"
              >
                <TableCell className="py-5 pl-8">
                   <div className="flex items-center gap-3">
                     <span className="text-2xl font-black italic text-primary/30 tracking-tighter">#{stat.position}</span>
                     <span className="font-black tracking-tight">{stat.position === 1 ? 'Opener' : stat.position === 2 ? 'Opener' : `Position ${stat.position}`}</span>
                   </div>
                </TableCell>
                <TableCell className="text-center font-bold text-muted-foreground/80">{stat.innings}</TableCell>
                <TableCell className="text-center font-black text-primary">{stat.total_runs}</TableCell>
                <TableCell className="text-center font-black">{stat.batting_avg || '—'}</TableCell>
                <TableCell className="text-center font-bold text-muted-foreground/60">{stat.strike_rate || '—'}</TableCell>
                <TableCell className="text-center font-bold text-muted-foreground/60">{stat.hundreds} / {stat.fifties}</TableCell>
                <TableCell className="text-center font-bold text-muted-foreground/40">{stat.not_outs}</TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
