import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Swords } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface HeadToHeadProps {
  playerId: string;
  playerRole?: string;
  format: string;
}

export function HeadToHead({ playerId, format }: HeadToHeadProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          Head-to-Head Matchup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyState message="Head-to-head data requires ball-by-ball delivery data. Import Cricsheet data to enable this feature." />
      </CardContent>
    </Card>
  );
}
