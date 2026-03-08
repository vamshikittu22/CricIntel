import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeftRight, History } from "lucide-react";

export function AppHeader() {
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
        <nav className="flex items-center gap-3 text-sm">
          <Link
            to="/compare"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Compare
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
