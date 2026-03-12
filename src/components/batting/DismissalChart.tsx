import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";

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
        <div className="h-16 w-16 rounded-[1.5rem] bg-secondary/30 flex items-center justify-center mb-4 border border-white/5 transition-all group-hover:scale-110 group-hover:bg-secondary/50">
          <span className="text-2xl grayscale group-hover:grayscale-0 transition-all opacity-40 group-hover:opacity-100">🏏</span>
        </div>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Deployment Void</p>
      </div>
    );
  }

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
            stroke="rgba(0,0,0,0.4)"
            strokeWidth={3}
            paddingAngle={6}
          >
            {data.map((_, i) => (
              <Cell 
                key={i} 
                fill={COLORS[i % COLORS.length]} 
                className="hover:opacity-80 transition-all duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.05)]" 
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
                    className="rounded-[1.5rem] border border-white/10 bg-black/80 backdrop-blur-3xl px-5 py-4 text-xs shadow-2xl ring-1 ring-white/10"
                  >
                    <p className="font-black text-white/40 uppercase tracking-[0.2em] text-[9px] mb-2">{d.name}</p>
                    <p className="font-black text-white text-3xl tracking-tighter">{d.value} <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest ml-1">Exits</span></p>
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
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2 group-hover:text-foreground transition-colors">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center Label */}
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
         <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.3em]">Total</p>
         <p className="text-xl font-black text-foreground tracking-tighter leading-none">{data.reduce((sum, d) => sum + d.value, 0)}</p>
      </div>
    </div>
  );
}

