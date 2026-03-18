import { useBatterVsAllBowlers, useBowlerVsAllBatters } from "@/hooks/useAnalytics";
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
import { Swords, Target, Crosshair } from "lucide-react";
import { getFlag } from "@/lib/countryFlags";

interface H2HTabProps {
  playerId: string;
  format: string;
  isLoading?: boolean;
}

export function H2HTab({ playerId, format, isLoading: parentLoading }: H2HTabProps) {
  const isAll = format === "All";
  const activeFormat = isAll ? "T20I" : format;

  const { data: vsBowlers, isLoading: loadingBatter } = useBatterVsAllBowlers(playerId, activeFormat);
  const { data: vsBatters, isLoading: loadingBowler } = useBowlerVsAllBatters(playerId, activeFormat);

  const isLoading = loadingBatter || loadingBowler || parentLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-[400px] w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* ── Nemesis Section (Vs Bowlers) ─────────────────────── */}
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-1">
          <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight uppercase italic">Toughest Matchups</h2>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              Performance against individual bowlers (Nemesis analysis)
            </p>
          </div>
        </div>

        {vsBowlers && vsBowlers.length > 0 ? (
          <Card className="border-none shadow-2xl bg-white dark:bg-white/5 rounded-[2.5rem] overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="w-[280px] font-black uppercase tracking-widest text-[10px] py-6 pl-8">Bowler</TableHead>
                  <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Balls</TableHead>
                  <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Runs</TableHead>
                  <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">SR</TableHead>
                  <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">OUTS</TableHead>
                  <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">AVG</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(vsBowlers as any[]).slice(0, 10).map((record, index) => (
                  <motion.tr 
                    key={index}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-slate-50 dark:hover:bg-white/5 border-b border-black/5 dark:border-white/5 last:border-0 transition-all font-medium"
                  >
                    <TableCell className="py-5 pl-8">
                       <div className="flex items-center gap-3">
                         <span className="text-2xl filter drop-shadow-sm">{getFlag(record.players?.country || '')}</span>
                         <div className="flex flex-col">
                           <span className="font-black tracking-tight group-hover:text-primary transition-colors">{record.players?.name}</span>
                           <span className="text-[9px] font-bold text-muted-foreground uppercase">{record.players?.country}</span>
                         </div>
                       </div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-muted-foreground/80">{record.balls}</TableCell>
                    <TableCell className="text-center font-black text-primary">{record.runs}</TableCell>
                    <TableCell className="text-center font-bold text-muted-foreground/60">{record.strike_rate || '—'}</TableCell>
                    <TableCell className="text-center font-black text-red-500">{record.dismissals}</TableCell>
                    <TableCell className="text-center font-black text-foreground/90">{record.batting_avg || '—'}</TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <p className="text-center py-10 text-muted-foreground/40 font-bold uppercase tracking-widest text-xs">No matchup data available</p>
        )}
      </div>

      {/* ── Victim Section (Vs Batters) ──────────────────────── */}
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-1">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Crosshair className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight uppercase italic text-emerald-600">Top Victims</h2>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              The batters this player has dismissed most
            </p>
          </div>
        </div>

        {vsBatters && vsBatters.length > 0 ? (
          <Card className="border-none shadow-2xl bg-white dark:bg-white/5 rounded-[2.5rem] overflow-hidden border-t-4 border-emerald-500/20">
            <Table>
              <TableHeader className="bg-emerald-50/50 dark:bg-emerald-500/5 border-b border-black/5 dark:border-white/5">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="w-[280px] font-black uppercase tracking-widest text-[10px] py-6 pl-8">Batter</TableHead>
                  <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Balls</TableHead>
                  <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">Runs</TableHead>
                  <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">OUTS</TableHead>
                  <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">ECON</TableHead>
                  <TableHead className="text-center font-black uppercase tracking-widest text-[10px]">AVG</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(vsBatters as any[]).slice(0, 10).map((record, index) => (
                  <motion.tr 
                    key={index}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-emerald-50 dark:hover:bg-emerald-500/5 border-b border-black/5 dark:border-white/5 last:border-0 transition-all font-medium"
                  >
                    <TableCell className="py-5 pl-8">
                       <div className="flex items-center gap-3">
                         <span className="text-2xl filter drop-shadow-sm">{getFlag(record.players?.country || '')}</span>
                         <div className="flex flex-col">
                           <span className="font-black tracking-tight group-hover:text-emerald-600 transition-colors">{record.players?.name}</span>
                           <span className="text-[9px] font-bold text-muted-foreground uppercase">{record.players?.country}</span>
                         </div>
                       </div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-muted-foreground/80">{record.balls}</TableCell>
                    <TableCell className="text-center font-black text-muted-foreground">{record.runs}</TableCell>
                    <TableCell className="text-center font-black text-emerald-600">{record.dismissals}</TableCell>
                    <TableCell className="text-center font-bold text-muted-foreground/60">{(record.runs / (record.balls / 6)).toFixed(2)}</TableCell>
                    <TableCell className="text-center font-black text-foreground/90">{(record.runs / record.dismissals).toFixed(2)}</TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <p className="text-center py-10 text-muted-foreground/40 font-bold uppercase tracking-widest text-xs">No wicket data available</p>
        )}
      </div>
    </div>
  );
}
