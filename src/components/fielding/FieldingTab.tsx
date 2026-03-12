import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Users, Crosshair, Trophy, Hand } from "lucide-react";
import { usePlayerSummary } from "@/lib/hooks/usePlayers";
import { useParams } from "react-router-dom";

interface FieldingTabProps {
  isLoading?: boolean;
}

// Fielding positions on oval field
const defaultPositions = [
  { id: "wk", label: "WK", x: 50, y: 72, color: "hsl(var(--warning))" },
  { id: "slip1", label: "1st Slip", x: 58, y: 70, color: "hsl(var(--muted-foreground))" },
  { id: "slip2", label: "2nd Slip", x: 63, y: 67, color: "hsl(var(--muted-foreground))" },
  { id: "gully", label: "Gully", x: 70, y: 60, color: "hsl(var(--muted-foreground))" },
  { id: "point", label: "Point", x: 80, y: 48, color: "hsl(var(--primary))" },
  { id: "cover", label: "Cover", x: 78, y: 35, color: "hsl(var(--primary))" },
  { id: "midoff", label: "Mid-off", x: 60, y: 22, color: "hsl(var(--success))" },
  { id: "midon", label: "Mid-on", x: 40, y: 22, color: "hsl(var(--success))" },
  { id: "midwicket", label: "Midwicket", x: 22, y: 35, color: "hsl(var(--primary))" },
  { id: "sqleg", label: "Sq Leg", x: 20, y: 48, color: "hsl(var(--primary))" },
  { id: "fineleg", label: "Fine Leg", x: 30, y: 75, color: "hsl(var(--muted-foreground))" },
];

const fieldConfigs: Record<string, typeof defaultPositions> = {
  "pace-powerplay": [
    { id: "wk", label: "WK", x: 50, y: 72, color: "hsl(var(--warning))" },
    { id: "slip1", label: "1st Slip", x: 58, y: 70, color: "hsl(var(--destructive))" },
    { id: "slip2", label: "2nd Slip", x: 64, y: 67, color: "hsl(var(--destructive))" },
    { id: "gully", label: "Gully", x: 72, y: 60, color: "hsl(var(--destructive))" },
    { id: "point", label: "Point", x: 82, y: 48, color: "hsl(var(--primary))" },
    { id: "cover", label: "Cover", x: 75, y: 32, color: "hsl(var(--primary))" },
    { id: "midoff", label: "Mid-off", x: 58, y: 22, color: "hsl(var(--success))" },
    { id: "midon", label: "Mid-on", x: 42, y: 22, color: "hsl(var(--success))" },
    { id: "midwicket", label: "Midwicket", x: 25, y: 38, color: "hsl(var(--primary))" },
    { id: "fineleg", label: "Fine Leg", x: 28, y: 78, color: "hsl(var(--muted-foreground))" },
  ],
  "pace-death": [
    { id: "wk", label: "WK", x: 50, y: 72, color: "hsl(var(--warning))" },
    { id: "thirdman", label: "Third Man", x: 75, y: 82, color: "hsl(var(--primary))" },
    { id: "point", label: "Deep Pt", x: 88, y: 48, color: "hsl(var(--primary))" },
    { id: "cover", label: "Deep Cov", x: 82, y: 28, color: "hsl(var(--primary))" },
    { id: "longoff", label: "Long Off", x: 60, y: 12, color: "hsl(var(--success))" },
    { id: "longon", label: "Long On", x: 40, y: 12, color: "hsl(var(--success))" },
    { id: "midwicket", label: "Deep MW", x: 18, y: 28, color: "hsl(var(--primary))" },
    { id: "sqleg", label: "Deep SL", x: 12, y: 48, color: "hsl(var(--primary))" },
    { id: "fineleg", label: "Fine Leg", x: 25, y: 82, color: "hsl(var(--muted-foreground))" },
    { id: "bowler", label: "Bowler", x: 50, y: 42, color: "hsl(var(--muted-foreground))" },
  ],
  "spin-middle": [
    { id: "wk", label: "WK", x: 50, y: 72, color: "hsl(var(--warning))" },
    { id: "slip", label: "Slip", x: 60, y: 68, color: "hsl(var(--destructive))" },
    { id: "shortleg", label: "Short Leg", x: 40, y: 60, color: "hsl(var(--destructive))" },
    { id: "sillypoint", label: "Silly Pt", x: 60, y: 56, color: "hsl(var(--destructive))" },
    { id: "point", label: "Point", x: 80, y: 48, color: "hsl(var(--primary))" },
    { id: "cover", label: "Cover", x: 75, y: 32, color: "hsl(var(--primary))" },
    { id: "midoff", label: "Mid-off", x: 58, y: 22, color: "hsl(var(--success))" },
    { id: "midon", label: "Mid-on", x: 42, y: 22, color: "hsl(var(--success))" },
    { id: "midwicket", label: "Deep MW", x: 15, y: 32, color: "hsl(var(--primary))" },
    { id: "longon", label: "Long On", x: 38, y: 12, color: "hsl(var(--success))" },
  ],
};

function CricketField({ positions }: { positions: typeof defaultPositions }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full max-w-md mx-auto">
      {/* Field oval */}
      <ellipse cx="50" cy="50" rx="46" ry="44" fill="hsl(var(--secondary))" stroke="hsl(var(--border))" strokeWidth="0.5" />
      {/* Inner circle */}
      <ellipse cx="50" cy="50" rx="22" ry="20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.3" strokeDasharray="2 1" />
      {/* Pitch */}
      <rect x="48" y="42" width="4" height="18" rx="0.5" fill="hsl(var(--muted))" />
      {/* Fielder dots */}
      {positions.map((pos) => (
        <g key={pos.id}>
          <circle cx={pos.x} cy={pos.y} r="2.5" fill={pos.color} opacity="0.85" />
          <text x={pos.x} y={pos.y - 4} textAnchor="middle" fontSize="2.5" fill="hsl(var(--foreground))" fontWeight="500">
            {pos.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function FieldingTab({ isLoading: parentLoading }: FieldingTabProps) {
  const { id } = useParams<{ id: string }>();
  const [bowlerType, setBowlerType] = useState("pace");
  const [matchPhase, setMatchPhase] = useState("powerplay");
  const [activeField, setActiveField] = useState<typeof defaultPositions>(defaultPositions);
  
  const { data: summaries, isLoading: summaryLoading } = usePlayerSummary(id);
  
  const isLoading = parentLoading || summaryLoading;

  const metrics = useMemo(() => {
    if (!summaries || summaries.length === 0) return null;
    
    // Aggregate fielding stats across all formats
    const totalCatches = summaries.reduce((sum, s) => sum + (s.catches || 0), 0);
    const totalStumpings = summaries.reduce((sum, s) => sum + (s.stumpings || 0), 0);
    const totalRunOuts = summaries.reduce((sum, s) => sum + (s.run_outs || 0), 0);
    const totalMatches = summaries.reduce((sum, s) => sum + (s.matches || 0), 0);

    return [
      { metric: "Catches", value: totalCatches, avg: (totalCatches / Math.max(1, totalMatches)).toFixed(2) },
      { metric: "Stumpings", value: totalStumpings, avg: (totalStumpings / Math.max(1, totalMatches)).toFixed(2) },
      { metric: "Run Outs", value: totalRunOuts, avg: (totalRunOuts / Math.max(1, totalMatches)).toFixed(2) },
    ];
  }, [summaries]);

  const handleSuggest = () => {
    const key = `${bowlerType}-${matchPhase}`;
    const config = fieldConfigs[key] || defaultPositions;
    setActiveField(config);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {metrics?.map((m) => (
          <Card key={m.metric} className="bg-muted/30 border-border/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{m.metric}</p>
                <p className="text-2xl font-black mt-1">{m.value}</p>
              </div>
              <div className="p-2 rounded-lg bg-black/10">
                {m.metric === "Catches" ? <Hand className="h-5 w-5 text-amber-500" /> : <Trophy className="h-5 w-5 text-primary" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
          {/* Field visualization */}
          <Card className="border-border lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tight">
                <Users className="h-4 w-4 text-primary" /> Visual Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CricketField positions={activeField} />
            </CardContent>
          </Card>

          {/* Optimal field suggestion */}
          <Card className="border-primary/20 bg-primary/5 shadow-none overflow-hidden relative lg:col-span-2">
            <CardHeader className="pb-3 text-[10px] font-black uppercase tracking-widest text-primary">
                Placement Strategy Engine
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-muted-foreground">Bowler Profile</label>
                  <Select value={bowlerType} onValueChange={setBowlerType}>
                    <SelectTrigger className="bg-background border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pace">Pace / Fast</SelectItem>
                      <SelectItem value="spin">Spin / Slow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-muted-foreground">Match Scenario</label>
                  <Select value={matchPhase} onValueChange={setMatchPhase}>
                    <SelectTrigger className="bg-background border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="powerplay">Powerplay (Aggressive)</SelectItem>
                      <SelectItem value="middle">Middle (Containment)</SelectItem>
                      <SelectItem value="death">Death (Defensive)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSuggest} className="w-full font-bold bg-primary hover:bg-primary/90 text-white shadow-lg">
                Calculate & Plot Optimal Placement
              </Button>

              <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/10 p-4">
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                   <Users className="h-3 w-3" /> Strategic Insight
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Based on available player data, {bowlerType === "pace" ? "pace" : "spin"} bowlers should target {matchPhase === "powerplay" ? "early dismissals via slips" : matchPhase === "middle" ? "control through building dot pressure" : "containing runs via boundary-riding sweepers"}. 
                </p>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Fielding metrics table */}
      <Card className="border-border shadow-none bg-muted/10">
        <CardHeader className="pb-2 border-b border-border/50">
          <CardTitle className="text-sm font-bold uppercase tracking-tight">Career Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border">
                <TableHead className="text-[10px] font-black uppercase tracking-widest">Metric Class</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Aggregated Total</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest">Efficiency (Per Innings)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics ? metrics.map((m) => (
                <TableRow key={m.metric} className="border-border hover:bg-muted/30 transition-colors">
                  <TableCell className="font-bold py-4">{m.metric}</TableCell>
                  <TableCell className="text-right font-black text-primary py-4">{m.value}</TableCell>
                  <TableCell className="text-right text-muted-foreground font-mono py-4">{m.avg}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                   <TableCell colSpan={3} className="text-center py-12 text-muted-foreground italic">Insufficient fielding data in selected format registry.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}
