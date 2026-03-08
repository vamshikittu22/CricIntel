import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Delivery {
  bowler_type: string | null;
  runs_batter: number;
  is_wicket: boolean;
  is_boundary: boolean;
  is_six: boolean;
}

interface PaceVsSpinProps {
  deliveries: Delivery[];
}

function calcStats(balls: Delivery[]) {
  const total = balls.length;
  const runs = balls.reduce((s, d) => s + d.runs_batter, 0);
  const dismissals = balls.filter((d) => d.is_wicket).length;
  const boundaries = balls.filter((d) => d.is_boundary || d.is_six).length;
  return {
    balls: total,
    runs,
    avg: dismissals > 0 ? (runs / dismissals).toFixed(1) : total > 0 ? runs.toString() + "*" : "-",
    sr: total > 0 ? ((runs / total) * 100).toFixed(1) : "-",
    boundaries,
    dismissals,
  };
}

export function PaceVsSpin({ deliveries }: PaceVsSpinProps) {
  const { pace, spin } = useMemo(() => {
    const paceD = deliveries.filter((d) => d.bowler_type === "pace");
    const spinD = deliveries.filter((d) => d.bowler_type === "spin");
    return { pace: calcStats(paceD), spin: calcStats(spinD) };
  }, [deliveries]);

  const renderCard = (title: string, emoji: string, stats: ReturnType<typeof calcStats>) => (
    <Card className="border-border/50">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-heading flex items-center gap-2">
          <span>{emoji}</span> vs {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {stats.balls === 0 ? (
          <p className="text-xs text-muted-foreground">No data</p>
        ) : (
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Runs</p>
              <p className="font-semibold text-lg">{stats.runs}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Balls</p>
              <p className="font-semibold text-lg">{stats.balls}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Average</p>
              <p className="font-mono">{stats.avg}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Strike Rate</p>
              <p className="font-mono">{stats.sr}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Boundaries</p>
              <p>{stats.boundaries}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Dismissals</p>
              <p className={stats.dismissals > 0 ? "text-destructive font-semibold" : ""}>
                {stats.dismissals}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {renderCard("Pace", "⚡", pace)}
      {renderCard("Spin", "🌀", spin)}
    </div>
  );
}
