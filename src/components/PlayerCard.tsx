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
  batter: "bg-primary/10 text-primary border-primary/20",
  bowler: "bg-destructive/10 text-destructive border-destructive/20",
  "all-rounder": "bg-warning/10 text-warning border-warning/20",
  "wicket-keeper": "bg-success/10 text-success border-success/20",
};

export function PlayerCard({ player }: PlayerCardProps) {
  return (
    <Link to={`/player/${player.id}`}>
      <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
        <Card className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-lg hover:shadow-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-2xl">
                {getFlag(player.country)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-heading font-semibold text-card-foreground truncate group-hover:text-primary transition-colors">
                  {player.name}
                </h3>
                <p className="text-sm text-muted-foreground">{player.country}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={roleColors[player.role] || ""}>
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
