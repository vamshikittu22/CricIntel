import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Delivery {
  over_number: number;
  runs_batter: number;
  is_boundary: boolean;
  is_six: boolean;
  is_wicket: boolean;
}

interface PhaseStatsProps {
  deliveries: Delivery[];
  format: string;
}

function getPhases(format: string) {
  if (format === "Test") {
    return [
      { name: "New Ball", label: "Overs 1-20", min: 0, max: 19 },
      { name: "Middle", label: "Overs 21-60", min: 20, max: 59 },
      { name: "Old Ball", label: "Overs 61+", min: 60, max: 999 },
    ];
  }
  if (format === "ODI") {
    return [
      { name: "Powerplay", label: "Overs 1-10", min: 0, max: 9 },
      { name: "Middle", label: "Overs 11-40", min: 10, max: 39 },
      { name: "Death", label: "Overs 41-50", min: 40, max: 49 },
    ];
  }
  return [
    { name: "Powerplay", label: "Overs 1-6", min: 0, max: 5 },
    { name: "Middle", label: "Overs 7-15", min: 6, max: 14 },
    { name: "Death", label: "Overs 16-20", min: 15, max: 19 },
  ];
}

export function PhaseStats({ deliveries, format }: PhaseStatsProps) {
  const phases = getPhases(format);

  const stats = useMemo(() => {
    return phases.map((phase) => {
      const balls = deliveries.filter(
        (d) => d.over_number >= phase.min && d.over_number <= phase.max
      );
      const totalBalls = balls.length;
      const runs = balls.reduce((s, d) => s + d.runs_batter, 0);
      const boundaries = balls.filter((d) => d.is_boundary || d.is_six).length;
      const dismissals = balls.filter((d) => d.is_wicket).length;
      const sr = totalBalls > 0 ? ((runs / totalBalls) * 100).toFixed(1) : "-";
      const avg = dismissals > 0 ? (runs / dismissals).toFixed(1) : totalBalls > 0 ? runs.toString() : "-";
      const boundaryPct = totalBalls > 0 ? ((boundaries / totalBalls) * 100).toFixed(0) : "0";

      return { ...phase, runs, balls: totalBalls, sr, avg, boundaryPct, dismissals };
    });
  }, [deliveries, phases]);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.name} className="border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-heading">{s.name}</CardTitle>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {s.balls === 0 ? (
              <p className="text-xs text-muted-foreground">No data</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Runs</p>
                  <p className="font-semibold">{s.runs}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">SR</p>
                  <p className="font-mono font-semibold">{s.sr}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Avg</p>
                  <p className="font-mono">{s.avg}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Boundary %</p>
                  <p className="font-mono">{s.boundaryPct}%</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
