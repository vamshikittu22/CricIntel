import { useRef, useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Swords,
  Target,
  ShieldAlert,
  Hand,
  TrendingUp,
  Globe,
  ListOrdered,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export type ProfileTab = 
  | "overview" 
  | "batting" 
  | "batting-opposition" 
  | "batting-position" 
  | "batting-partnerships" 
  | "batting-h2h"
  | "bowling" 
  | "bowling-opposition" 
  | "bowling-h2h" 
  | "h2h" 
  | "fielding" 
  | "form" 
  | "weaknesses" 
  | "compare";

interface ProfileStickyTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
}

const tabGroups = [
  { id: "overview", label: "Overview", icon: <BarChart3 className="h-4 w-4" /> },
  { 
    id: "batting-group", 
    label: "Batting", 
    icon: <Swords className="h-4 w-4" />,
    children: [
      { id: "batting", label: "Dashboard", icon: <Swords className="h-3.5 w-3.5" /> },
      { id: "batting-opposition", label: "Opposition", icon: <Globe className="h-3.5 w-3.5" /> },
      { id: "batting-position", label: "Positions", icon: <ListOrdered className="h-3.5 w-3.5" /> },
      { id: "batting-partnerships", label: "Partnerships", icon: <Users className="h-3.5 w-3.5" /> },
      { id: "batting-h2h", label: "H2H Records", icon: <Swords className="h-3.5 w-3.5" /> },
    ]
  },
  { 
    id: "bowling-group", 
    label: "Bowling", 
    icon: <Target className="h-4 w-4" />,
    children: [
      { id: "bowling", label: "Dashboard", icon: <Target className="h-3.5 w-3.5" /> },
      { id: "bowling-opposition", label: "Opposition", icon: <Globe className="h-3.5 w-3.5" /> },
      { id: "bowling-h2h", label: "H2H Records", icon: <Swords className="h-3.5 w-3.5" /> },
    ]
  },
  { id: "fielding", label: "Fielding", icon: <Hand className="h-4 w-4" /> },
  { id: "form", label: "Form", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "weaknesses", label: "Weakness", icon: <ShieldAlert className="h-4 w-4" /> },
];

export function ProfileStickyTabs({ activeTab, onTabChange }: ProfileStickyTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const flatTabs = useMemo(() => {
    return tabGroups.flatMap(g => g.children ? g.children : [g]);
  }, []);

  useEffect(() => {
    setActiveIndex(flatTabs.findIndex((t: any) => t.id === activeTab));
  }, [activeTab, flatTabs]);

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
          {tabGroups.map((group) => {
            const isGroupActive = group.id === activeTab || (group.children?.some(c => c.id === activeTab));
            
            if (group.children) {
              return (
                <DropdownMenu key={group.id}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "relative flex items-center gap-3 px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 rounded-2xl group",
                        isGroupActive
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-muted/50"
                      )}
                    >
                      <span className={cn(
                         "transition-all duration-300",
                         isGroupActive ? "text-primary scale-125 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" : "opacity-40"
                      )}>{group.icon}</span>
                      <span className="relative z-10">{group.label}</span>
                      <ChevronDown className={cn("h-3 w-3 opacity-30 transition-transform duration-300 group-hover:translate-y-0.5", isGroupActive && "opacity-80")} />
                      {isGroupActive && (
                        <motion.div
                          layoutId="active-nav-glow"
                          className="absolute inset-x-4 bottom-0 h-[3px] bg-primary rounded-t-full"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      {isGroupActive && (
                        <motion.div
                          layoutId="active-pill"
                          className="absolute inset-0 bg-primary/10 dark:bg-primary/5 rounded-2xl -z-10 shadow-inner"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56 bg-white/95 dark:bg-card/95 backdrop-blur-2xl rounded-2xl border border-black/5 dark:border-white/5 p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300 z-[60]">
                    {group.children.map(child => (
                      <DropdownMenuItem 
                        key={child.id}
                        onClick={() => onTabChange(child.id as ProfileTab)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200",
                          activeTab === child.id 
                            ? "bg-primary text-white font-black" 
                            : "text-muted-foreground hover:bg-primary/10 hover:text-primary font-bold"
                        )}
                      >
                         <span className={cn(activeTab === child.id ? "text-white" : "opacity-40")}>{child.icon}</span>
                         <span className="text-[10px] uppercase tracking-widest">{child.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            const isActive = activeTab === group.id;
            return (
              <button
                key={group.id}
                onClick={() => onTabChange(group.id as ProfileTab)}
                className={cn(
                  "relative flex items-center gap-3 px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 rounded-2xl",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-muted/50"
                )}
              >
                <span className={cn(
                   "transition-all duration-300",
                   isActive ? "text-primary scale-125 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]" : "opacity-40"
                )}>{group.icon}</span>
                <span className="relative z-10">{group.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-nav-glow"
                    className="absolute inset-x-4 bottom-0 h-[3px] bg-primary rounded-t-full"
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
