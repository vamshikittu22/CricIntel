import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Wind } from "lucide-react";

interface BowlingTypeStats {
  bowling_type: string;
  bat_runs: number;
  bat_balls: number;
  bat_dismissals: number;
}

interface PaceVsSpinProps {
  stats?: BowlingTypeStats[] | null;
}

export function PaceVsSpin({ stats }: PaceVsSpinProps) {
  const pace = useMemo(() => stats?.find(s => s.bowling_type === "pace") || null, [stats]);
  const spin = useMemo(() => stats?.find(s => s.bowling_type === "spin") || null, [stats]);

  const calcDerived = (s: BowlingTypeStats | null) => {
    if (!s || s.bat_balls === 0) return { avg: "—", sr: "—" };
    const avg = s.bat_dismissals > 0 ? (s.bat_runs / s.bat_dismissals).toFixed(1) : s.bat_runs.toString() + "*";
    const sr = ((s.bat_runs / s.bat_balls) * 100).toFixed(1);
    return { avg, sr };
  };

  const paceDerived = calcDerived(pace);
  const spinDerived = calcDerived(spin);

  const renderCard = (title: string, icon: React.ReactNode, data: BowlingTypeStats | null, derived: any) => (
    <Card className="border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-4 bg-muted/20 border-b border-border/20">
        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
          {icon} vs {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-6">
        {!data || data.bat_balls === 0 ? (
          <div className="flex flex-col items-center justify-center py-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Insufficient Data</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Runs</p>
              <p className="font-black text-2xl tracking-tight">{data.bat_runs}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Balls</p>
              <p className="font-black text-2xl tracking-tight text-muted-foreground/60">{data.bat_balls}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Average</p>
              <p className="font-black text-xl text-primary">{derived.avg}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Strike Rate</p>
              <p className="font-black text-xl">{derived.sr}</p>
            </div>
            <div className="col-span-2 pt-2 border-t border-border/20">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Wickets Lost</span>
                <span className={`text-sm font-black ${data.bat_dismissals > 3 ? "text-destructive" : "text-foreground"}`}>
                  {data.bat_dismissals}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {renderCard("Pace", <Zap className="h-3 w-3 text-amber-500" />, pace, paceDerived)}
      {renderCard("Spin", <Wind className="h-3 w-3 text-blue-500" />, spin, spinDerived)}
    </div>
  );
}
