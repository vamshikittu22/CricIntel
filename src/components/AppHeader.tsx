import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeftRight, Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const location = useLocation();
  
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-3xl border-b border-black/5 dark:border-white/5 shadow-2xl ring-1 ring-black/5">
      <div className="container mx-auto flex h-20 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-4 group">
          <motion.div
            className="flex h-12 w-12 items-center justify-center rounded-[1.2rem] bg-gradient-to-br from-primary to-accent text-primary-foreground font-black text-2xl shadow-xl shadow-primary/30 border border-white/20"
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.95 }}
          >
            C
          </motion.div>
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-foreground group-hover:text-primary transition-all leading-none">
              Cric<span className="text-primary">Intel</span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 leading-none mt-1">Advanced Analytics</span>
          </div>
        </Link>
        <nav className="flex items-center gap-3">
          {[
            { to: "/players", icon: Users, label: "Players" },
            { to: "/teams", icon: Users, label: "Teams" },
            { to: "/matches", icon: Trophy, label: "Matches" },
            { to: "/compare", icon: ArrowLeftRight, label: "Compare" },
          ].map((item) => {
            const isActive = location.pathname === item.to || (item.to === "/players" && location.pathname.startsWith("/player/"));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 relative group/nav",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/30 scale-105 active:scale-95" 
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5 active:scale-95"
                )}
              >
                <item.icon className={cn("h-4 w-4 transition-transform group-hover/nav:scale-110", isActive ? "animate-pulse" : "opacity-40")} />
                <span className="hidden lg:inline">{item.label}</span>
                {isActive && (
                   <motion.div 
                     layoutId="nav-pill"
                     className="absolute inset-0 border border-primary/20 rounded-2xl -z-10 bg-white/10"
                   />
                )}
              </Link>
            );
          })}
          <div className="h-8 w-px bg-black/5 dark:bg-white/5 mx-4 hidden sm:block" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
