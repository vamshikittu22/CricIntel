import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Delivery {
  scoring_zone: number | null;
  runs_batter: number;
  is_boundary: boolean;
  is_six: boolean;
  shot_type: string | null;
}

interface WagonWheelProps {
  deliveries: Delivery[];
}

// Map scoring zones (1-8) to polar coords on a cricket field
// Zone 1: Third man, 2: Point, 3: Cover, 4: Mid-off, 5: Mid-on, 6: Midwicket, 7: Square leg, 8: Fine leg
const zonePositions: Record<number, { x: number; y: number }> = {
  1: { x: 65, y: -75 },
  2: { x: 85, y: -30 },
  3: { x: 80, y: 20 },
  4: { x: 45, y: 60 },
  5: { x: -45, y: 60 },
  6: { x: -80, y: 20 },
  7: { x: -85, y: -30 },
  8: { x: -65, y: -75 },
};

export function WagonWheel({ deliveries }: WagonWheelProps) {
  const data = useMemo(() => {
    return deliveries
      .filter((d) => d.scoring_zone && d.runs_batter > 0)
      .map((d) => {
        const base = zonePositions[d.scoring_zone!] || { x: 0, y: 0 };
        // Add jitter for visual spread
        const jx = (Math.random() - 0.5) * 20;
        const jy = (Math.random() - 0.5) * 20;
        return {
          x: base.x + jx,
          y: base.y + jy,
          runs: d.runs_batter,
          isBoundary: d.is_boundary,
          isSix: d.is_six,
          shot: d.shot_type,
          zone: d.scoring_zone,
        };
      });
  }, [deliveries]);

  const getColor = (entry: (typeof data)[0]) => {
    if (entry.isSix) return "hsl(var(--destructive))";
    if (entry.isBoundary) return "hsl(var(--primary))";
    return "hsl(var(--muted-foreground))";
  };

  return (
    <div className="relative">
      {/* Cricket field background */}
      <svg
        viewBox="-120 -120 240 240"
        className="absolute inset-0 w-full h-full opacity-10"
      >
        <circle cx="0" cy="0" r="100" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="0" cy="0" r="60" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
        <circle cx="0" cy="0" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" />
        {/* Pitch */}
        <rect x="-3" y="-12" width="6" height="24" fill="currentColor" opacity="0.3" rx="1" />
      </svg>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <XAxis type="number" dataKey="x" domain={[-110, 110]} hide />
          <YAxis type="number" dataKey="y" domain={[-110, 110]} hide />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
                  <p className="font-medium">{d.runs} runs · {d.shot || "N/A"}</p>
                  <p className="text-muted-foreground">
                    {d.isSix ? "SIX 🔥" : d.isBoundary ? "FOUR" : "Running"}
                  </p>
                </div>
              );
            }}
          />
          <Scatter data={data} isAnimationActive={false}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={getColor(entry)}
                r={entry.isSix ? 6 : entry.isBoundary ? 5 : 3}
                opacity={0.8}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      {/* Zone labels */}
      <div className="absolute inset-0 pointer-events-none text-[10px] text-muted-foreground font-medium">
        <span className="absolute top-1 right-[20%]">Third Man</span>
        <span className="absolute top-[25%] right-0">Point</span>
        <span className="absolute top-[50%] right-0">Cover</span>
        <span className="absolute bottom-[15%] right-[25%]">Mid-off</span>
        <span className="absolute bottom-[15%] left-[25%]">Mid-on</span>
        <span className="absolute top-[50%] left-0">Midwicket</span>
        <span className="absolute top-[25%] left-0">Sq Leg</span>
        <span className="absolute top-1 left-[20%]">Fine Leg</span>
      </div>
    </div>
  );
}
