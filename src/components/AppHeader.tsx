import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeftRight, History, Users, Trophy } from "lucide-react";

export function AppHeader() {
  const location = useLocation();
  
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <motion.div
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-heading font-bold text-lg"
            whileHover={{ scale: 1.05 }}
          >
            C
          </motion.div>
          <span className="font-heading text-xl font-bold tracking-tight">
            Cric<span className="text-primary">Intel</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/teams"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              location.pathname === "/teams" 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Users className="h-4 w-4" />
            Teams
          </Link>
          <Link
            to="/matches"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              location.pathname === "/matches" 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Trophy className="h-4 w-4" />
            Matches
          </Link>
          <Link
            to="/compare"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              location.pathname === "/compare" 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">Compare</span>
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
