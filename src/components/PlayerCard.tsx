import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { getFlag } from "@/lib/countryFlags";
import { motion } from "framer-motion";

interface PlayerCardProps {
  player: {
    id: string;
    name: string;
    country: string;
  };
}

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
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
