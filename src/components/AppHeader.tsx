import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeftRight, History, Users, Trophy } from "lucide-react";

export function AppHeader() {
  const location = useLocation();
  
  return (
    <header className="sticky top-0 z-50 glass">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <motion.div
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground font-bold text-xl shadow-lg shadow-primary/20"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            C
          </motion.div>
          <span className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
            Cric<span className="text-primary italic">Intel</span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-medium">
          {[
            { to: "/players", icon: Users, label: "Players" },
            { to: "/teams", icon: Users, label: "Teams" },
            { to: "/matches", icon: Trophy, label: "Matches" },
            { to: "/compare", icon: ArrowLeftRight, label: "Compare" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full transition-all duration-300 ${
                location.pathname === item.to 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
          <div className="h-6 w-px bg-border mx-2" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

