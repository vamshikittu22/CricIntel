import { usePlayerVsOpposition } from "@/hooks/useAnalytics";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { getFlag } from "@/lib/countryFlags";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";

interface OppositionTabProps {
  playerId: string;
  format: string;
  isLoading?: boolean;
}

export function OppositionTab({ playerId, format, isLoading: parentLoading }: OppositionTabProps) {
  const { data: oppositionStats, isLoading } = usePlayerVsOpposition(playerId, format === "All" ? "T20I" : format);

  if (isLoading || parentLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    );
  }

  if (!oppositionStats || oppositionStats.length === 0) {
    return (
      <Card className="border-none shadow-none bg-slate-50/50 dark:bg-white/5 rounded-[2rem]">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Globe className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest">
            No opposition data found for this format
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 px-1">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight uppercase">Vs Opposition</h2>
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
            Detailed performance breakdown against every nation
          </p>
        </div>
      </div>

      <Card className="border-none shadow-2xl bg-white dark:bg-white/5 rounded-[2.5rem] overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="w-[250px] font-black uppercase tracking-widest text-[10px] py-6 pl-8">Opposition</TableHead>
              <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Inns</TableHead>
              <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Runs</TableHead>
              <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Avg</TableHead>
              <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">SR</TableHead>
              <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Wkts</TableHead>
              <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Econ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {oppositionStats.map((stat, index) => {
              const sr = stat.bat_balls > 0 ? (stat.bat_runs / stat.bat_balls) * 100 : 0;
              const econ = stat.bowl_balls > 0 ? (stat.bowl_runs / stat.bowl_balls) * 6 : 0;
              
              return (
                <motion.tr 
                  key={stat.opposition}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group hover:bg-slate-50 dark:hover:bg-white/5 border-b border-black/5 dark:border-white/5 last:border-0 transition-colors"
                >
                  <TableCell className="py-5 pl-8">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl filter drop-shadow-sm">{getFlag(stat.opposition)}</span>
                      <span className="font-black tracking-tight">{stat.opposition}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-bold text-muted-foreground/80">{stat.bat_innings || stat.bowl_innings}</TableCell>
                  <TableCell className="text-center font-black text-primary">{stat.bat_runs || '—'}</TableCell>
                  <TableCell className="text-center font-black">{stat.batting_avg || '—'}</TableCell>
                  <TableCell className="text-center font-bold text-muted-foreground/60">{sr > 0 ? sr.toFixed(2) : '—'}</TableCell>
                  <TableCell className="text-center font-black text-emerald-500">{stat.bowl_wickets || '—'}</TableCell>
                  <TableCell className="text-center font-bold text-muted-foreground/60">{econ > 0 ? econ.toFixed(2) : '—'}</TableCell>
                </motion.tr>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
