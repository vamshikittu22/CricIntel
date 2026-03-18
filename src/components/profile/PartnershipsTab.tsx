import { usePlayerPartnerships } from "@/hooks/useAnalytics";
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
import { Users, TrendingUp } from "lucide-react";
import { getFlag } from "@/lib/countryFlags";

interface PartnershipsTabProps {
  playerId: string;
  format: string;
  isLoading?: boolean;
}

export function PartnershipsTab({ playerId, format, isLoading: parentLoading }: PartnershipsTabProps) {
  const { data: partnerships, isLoading } = usePlayerPartnerships(playerId, format === "All" ? "T20I" : format);

  if (isLoading || parentLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    );
  }

  if (!partnerships || partnerships.length === 0) {
    return (
      <Card className="border-none shadow-none bg-slate-50/50 dark:bg-white/5 rounded-[2rem]">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Users className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
            No partnership data found for this format
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 px-1">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight uppercase">Top Partnerships</h2>
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
            Detailed performance breakdown with batting partners
          </p>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-white dark:bg-white/5 rounded-[2.5rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[280px] font-black uppercase tracking-widest text-[10px] py-6 pl-8">Partner</TableHead>
              <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Inns</TableHead>
              <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Runs</TableHead>
              <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Highest</TableHead>
              <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">RR</TableHead>
              <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">100s / 50s</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(partnerships as any[]).map((p: any, index: number) => {
              const partner = p.batter1_id === playerId ? p.b2 : p.b1;
              return (
                <motion.tr 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group hover:bg-slate-50 dark:hover:bg-white/5 border-b border-black/5 dark:border-white/5 last:border-0 transition-colors"
                >
                  <TableCell className="py-5 pl-8">
                     <div className="flex items-center gap-3">
                       <span className="text-2xl filter drop-shadow-sm">{getFlag(partner?.country || '')}</span>
                       <div className="flex flex-col">
                         <span className="font-black tracking-tight">{partner?.name || 'Unknown'}</span>
                         <span className="text-[9px] font-bold text-muted-foreground uppercase">{partner?.country}</span>
                       </div>
                     </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-muted-foreground/80">{p.innings_together}</TableCell>
                  <TableCell className="text-center font-black text-primary">{p.total_runs}</TableCell>
                  <TableCell className="text-center font-black">{p.highest_stand}</TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-black">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      {p.run_rate || '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-muted-foreground/60">
                    <span className="text-primary font-black">{p.hundred_stands}</span> / <span className="font-black text-foreground">{p.fifty_stands}</span>
                  </TableCell>
                </motion.tr>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
