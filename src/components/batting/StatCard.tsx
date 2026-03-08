import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  highlight?: boolean;
}

export function StatCard({ label, value, subtitle, highlight }: StatCardProps) {
  return (
    <Card className={`border-border/50 ${highlight ? "ring-1 ring-primary/30 bg-accent/30" : ""}`}>
      <CardContent className="p-4 text-center">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="mt-1 font-heading text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
