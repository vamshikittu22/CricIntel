import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DismissalChartProps {
  breakdown?: Record<string, number> | null;
}

const COLORS = [
  "hsl(174, 72%, 40%)", // primary-ish
  "hsl(339, 81%, 55%)", // destructive-ish
  "hsl(48, 96%, 53%)",  // warning-ish
  "hsl(142, 71%, 45%)", // success-ish
  "hsl(215, 25%, 27%)", // muted
  "hsl(210, 40%, 96%)", // background/other
];

export function DismissalChart({ breakdown }: DismissalChartProps) {
  const data = breakdown 
    ? Object.entries(breakdown)
        .map(([name, value]) => ({ 
          name: name.charAt(0).toUpperCase() + name.slice(1), 
          value 
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <span className="text-xl">📊</span>
        </div>
        <p className="text-sm font-medium text-muted-foreground">No dismissal data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={85}
          dataKey="value"
          stroke="hsl(var(--card))"
          strokeWidth={4}
          paddingAngle={4}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} className="hover:opacity-80 transition-opacity" />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const d = payload[0].payload;
              return (
                <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md px-3 py-2 text-xs shadow-xl ring-1 ring-white/10">
                  <p className="font-bold text-foreground mb-1">{d.name}</p>
                  <p className="font-black text-primary text-base">{d.value} <span className="text-[10px] text-muted-foreground font-normal">dismissals</span></p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
