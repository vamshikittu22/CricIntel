import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Delivery {
  ball_length: string | null;
  runs_batter: number;
  is_wicket: boolean;
}

interface BallLengthMatrixProps {
  deliveries: Delivery[];
}

const lengths = ["yorker", "full", "good", "short", "bouncer"];

export function BallLengthMatrix({ deliveries }: BallLengthMatrixProps) {
  const matrix = useMemo(() => {
    return lengths.map((len) => {
      const balls = deliveries.filter((d) => d.ball_length === len);
      const totalBalls = balls.length;
      const runs = balls.reduce((s, d) => s + d.runs_batter, 0);
      const dismissals = balls.filter((d) => d.is_wicket).length;
      const sr = totalBalls > 0 ? ((runs / totalBalls) * 100).toFixed(1) : "-";
      return { length: len, balls: totalBalls, runs, sr, dismissals };
    });
  }, [deliveries]);

  const getSrClass = (sr: string, dismissals: number, balls: number) => {
    if (balls === 0) return "";
    const srNum = parseFloat(sr);
    if (dismissals > 0 && srNum < 100) return "bg-destructive/15 text-destructive";
    if (srNum >= 150) return "bg-success/15 text-success";
    if (srNum >= 100) return "bg-primary/10 text-primary";
    return "bg-warning/10 text-warning";
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-heading">Length</TableHead>
            <TableHead className="text-right">Balls</TableHead>
            <TableHead className="text-right">Runs</TableHead>
            <TableHead className="text-right">SR</TableHead>
            <TableHead className="text-right">Dismissals</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matrix.map((row) => (
            <TableRow key={row.length}>
              <TableCell className="font-medium capitalize">{row.length}</TableCell>
              <TableCell className="text-right">{row.balls}</TableCell>
              <TableCell className="text-right font-semibold">{row.runs}</TableCell>
              <TableCell className={`text-right font-mono rounded ${getSrClass(String(row.sr), row.dismissals, row.balls)}`}>
                {row.sr}
              </TableCell>
              <TableCell className="text-right">
                {row.dismissals > 0 ? (
                  <span className="text-destructive font-semibold">{row.dismissals}</span>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
