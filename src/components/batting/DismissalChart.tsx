import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DismissalChartProps {
  analytics: {
    caught: number | null;
    bowled_out: number | null;
    lbw: number | null;
    run_out: number | null;
    stumped: number | null;
  };
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--muted-foreground))",
];

export function DismissalChart({ analytics }: DismissalChartProps) {
  const data = [
    { name: "Caught", value: analytics.caught || 0 },
    { name: "Bowled", value: analytics.bowled_out || 0 },
    { name: "LBW", value: analytics.lbw || 0 },
    { name: "Run Out", value: analytics.run_out || 0 },
    { name: "Stumped", value: analytics.stumped || 0 },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-8">No dismissal data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          dataKey="value"
          stroke="hsl(var(--card))"
          strokeWidth={3}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          content={({ payload }) => {
            if (!payload?.length) return null;
            const d = payload[0];
            return (
              <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
                <p className="font-medium">{d.name}: {d.value}</p>
              </div>
            );
          }}
        />
        <Legend
          formatter={(value) => (
            <span className="text-xs text-card-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
