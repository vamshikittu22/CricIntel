import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFlag } from "@/lib/countryFlags";
import { motion } from "framer-motion";

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    country: string;
    role: string;
    batting_style: string;
    bowling_style: string;
  };
}

const roleColors: Record<string, string> = {
  batter: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  bowler: "bg-destructive/15 text-destructive border-destructive/30",
  "all-rounder": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "wicket-keeper": "bg-success/15 text-success border-success/30",
};

export function PlayerCard({ player }: PlayerCardProps) {
  return (
    <Link to={`/player/${player.id}`}>
      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
        <Card className="group cursor-pointer overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-2xl ring-1 ring-border">
                {getFlag(player.country)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-card-foreground truncate group-hover:text-primary transition-colors">
                  {player.name}
                </h3>
                <p className="text-sm text-muted-foreground">{player.country}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={`capitalize ${roleColors[player.role] || ""}`}>
                    {player.role}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {player.batting_style}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
