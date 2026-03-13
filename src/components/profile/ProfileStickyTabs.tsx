import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Swords,
  Target,
  ShieldAlert,
  Hand,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ProfileTab = "overview" | "batting" | "bowling" | "weaknesses" | "fielding" | "form";

interface ProfileStickyTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

const tabs: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "batting", label: "Batting", icon: <Swords className="h-4 w-4" /> },
  { id: "bowling", label: "Bowling", icon: <Target className="h-4 w-4" /> },
  { id: "weaknesses", label: "Weaknesses", icon: <ShieldAlert className="h-4 w-4" /> },
  { id: "fielding", label: "Fielding", icon: <Hand className="h-4 w-4" /> },
  { id: "form", label: "Form Index", icon: <TrendingUp className="h-4 w-4" /> },
];

export function ProfileStickyTabs({ activeTab, onTabChange }: ProfileStickyTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(tabs.findIndex((t) => t.id === activeTab));
  }, [activeTab]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const activeEl = scrollRef.current.children[activeIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeIndex]);

  return (
    <div className="sticky top-16 z-30 border-b border-black/5 dark:border-white/5 bg-white/90 dark:bg-background/80 backdrop-blur-3xl shadow-xl ring-1 ring-black/5">
      <div className="container mx-auto px-4">
        <div
          ref={scrollRef}
          className="flex gap-2 p-1 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "relative flex items-center gap-3 px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 rounded-2xl",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-muted/50"
                )}
              >
                <span className={cn(
                   "transition-all duration-300",
                   isActive ? "text-primary scale-125 drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]" : "opacity-40"
                )}>{tab.icon}</span>
                <span className="relative z-10">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-nav-glow"
                    className="absolute inset-x-4 bottom-0 h-[3px] bg-primary rounded-t-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-primary/10 dark:bg-primary/5 rounded-2xl -z-10 shadow-inner"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
