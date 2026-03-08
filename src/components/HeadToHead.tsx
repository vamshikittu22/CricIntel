import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/batting/StatCard";
import { usePlayerOpponents, useHeadToHead } from "@/lib/hooks/usePlayers";
import { getFlag } from "@/lib/countryFlags";
import { Swords } from "lucide-react";
import { motion } from "framer-motion";

interface HeadToHeadProps {
  playerId: string;
  playerRole: string;
  format: string;
}

export function HeadToHead({ playerId, playerRole, format }: HeadToHeadProps) {
  const role = playerRole === "bowler" ? "bowler" : "batter";
  const { data: opponents, isLoading } = usePlayerOpponents(playerId, role);
  const [selectedOpponent, setSelectedOpponent] = useState<string>("");

  const batterId = role === "batter" ? playerId : selectedOpponent;
  const bowlerId = role === "batter" ? selectedOpponent : playerId;

  const { data: h2hData, isLoading: h2hLoading } = useHeadToHead(
    batterId || undefined,
    bowlerId || undefined,
    format
  );

  const stats = h2hData?.[0];
  const opponent = opponents?.find((o) => o.id === selectedOpponent);

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <Swords className="h-5 w-5 text-primary" />
            Head-to-Head Matchup
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Select {role === "batter" ? "bowler" : "batter"}
            </label>
            <Select value={selectedOpponent} onValueChange={setSelectedOpponent}>
              <SelectTrigger>
                <SelectValue placeholder={`Choose a ${role === "batter" ? "bowler" : "batter"}...`} />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  opponents?.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {getFlag(o.country)} {o.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedOpponent && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {h2hLoading ? (
            <p className="text-center text-muted-foreground py-4">Loading matchup data...</p>
          ) : stats ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {role === "batter" ? "Batting" : "Bowling"} vs{" "}
                  <span className="font-semibold text-foreground">
                    {opponent ? `${getFlag(opponent.country)} ${opponent.name}` : "Opponent"}
                  </span>{" "}
                  in {format}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Balls" value={stats.balls_faced ?? 0} />
                <StatCard label="Runs" value={stats.runs_scored ?? 0} highlight />
                <StatCard label="Dismissals" value={stats.dismissals ?? 0} />
                <StatCard label="Strike Rate" value={stats.strike_rate ?? "-"} />
                <StatCard label="Average" value={stats.average ?? "N/A"} />
                <StatCard label="Dots" value={stats.dots ?? 0} />
                <StatCard label="Fours" value={stats.fours ?? 0} />
                <StatCard label="Sixes" value={stats.sixes ?? 0} />
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No {format} matchup data found between these players.
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}
