import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Users, Crosshair } from "lucide-react";

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

const metricsData = [
  { metric: "Catches", value: "—", avg: "—" },
  { metric: "Drop Rate", value: "—", avg: "—" },
  { metric: "Run Outs", value: "—", avg: "—" },
  { metric: "Misfields", value: "—", avg: "—" },
  { metric: "Runs Saved", value: "—", avg: "—" },
];

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

export function FieldingTab({ isLoading }: FieldingTabProps) {
  const [bowlerType, setBowlerType] = useState("pace");
  const [matchPhase, setMatchPhase] = useState("powerplay");
  const [activeField, setActiveField] = useState<typeof defaultPositions>(defaultPositions);

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
      {/* Field visualization */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Field Placement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CricketField positions={activeField} />
        </CardContent>
      </Card>

      {/* Optimal field suggestion */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-primary" /> Suggest Optimal Field
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground">Bowler Type</label>
              <Select value={bowlerType} onValueChange={setBowlerType}>
                <SelectTrigger className="bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pace">Pace</SelectItem>
                  <SelectItem value="spin">Spin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground">Match Phase</label>
              <Select value={matchPhase} onValueChange={setMatchPhase}>
                <SelectTrigger className="bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="powerplay">Powerplay</SelectItem>
                  <SelectItem value="middle">Middle Overs</SelectItem>
                  <SelectItem value="death">Death Overs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSuggest} className="shrink-0">
              Place Fielders
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fielding metrics table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Fielding Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">vs Average</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricsData.map((m) => (
                <TableRow key={m.metric}>
                  <TableCell className="font-medium">{m.metric}</TableCell>
                  <TableCell className="text-right">{m.value}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{m.avg}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground text-center mt-3">Fielding stats will be populated when data is available.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
