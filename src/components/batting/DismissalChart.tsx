import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DismissalChartProps {
  breakdown?: Record<string, number> | null;
}

const COLORS = [
  "#22c55e", // Green - caught
  "#f43f5e", // Rose - bowled
  "#3b82f6", // Blue - lbw
  "#a855f7", // Purple - stumped
  "#eab308", // Yellow - run out
  "#6b7280", // Gray - other
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
      <div className="flex flex-col items-center justify-center py-16 text-center group">
        <div className="h-16 w-16 rounded-[1.5rem] bg-slate-100 dark:bg-secondary/30 flex items-center justify-center mb-4 border border-black/5 dark:border-white/5 transition-all group-hover:scale-110 group-hover:bg-slate-200 dark:group-hover:bg-secondary/50">
          <span className="text-2xl grayscale group-hover:grayscale-0 transition-all opacity-40 group-hover:opacity-100">🏏</span>
        </div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60">Deployment Void</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="w-full h-[320px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={65}
            outerRadius={95}
            dataKey="value"
            stroke="currentColor"
            className="text-white dark:text-black/40"
            strokeWidth={3}
            paddingAngle={6}
          >
            {data.map((_, i) => (
              <Cell 
                key={i} 
                fill={COLORS[i % COLORS.length]} 
                className="hover:opacity-80 transition-all duration-300 drop-shadow-sm" 
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-[1.5rem] border border-black/5 dark:border-white/10 bg-popover/90 backdrop-blur-3xl px-6 py-5 text-xs shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
                  >
                    <p className="font-black text-muted-foreground uppercase tracking-[0.2em] text-[9px] mb-3 opacity-60">{d.name}</p>
                    <p className="font-black text-foreground text-4xl tracking-tighter leading-none">{d.value} <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest ml-1 opacity-40">Exits</span></p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-primary mt-2">{((d.value / total) * 100).toFixed(1)}% of total</p>
                  </motion.div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            formatter={(value) => (
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2 hover:text-foreground transition-colors">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center Label */}
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
         <p className="text-[8px] font-black text-muted-foreground/30 dark:text-muted-foreground/20 uppercase tracking-[0.3em] mb-1">Total</p>
         <p className="text-2xl font-black text-foreground tracking-tighter leading-none">{total}</p>
      </div>
    </div>
  );
}
