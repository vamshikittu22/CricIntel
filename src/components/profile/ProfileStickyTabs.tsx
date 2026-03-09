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
  { id: "form", label: "Form", icon: <TrendingUp className="h-4 w-4" /> },
];

export function ProfileStickyTabs({ activeTab, onTabChange }: ProfileStickyTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(tabs.findIndex((t) => t.id === activeTab));
  }, [activeTab]);

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (!scrollRef.current) return;
    const activeEl = scrollRef.current.children[activeIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeIndex]);

  return (
    <div className="sticky top-16 z-30 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div
          ref={scrollRef}
          className="flex gap-0 overflow-x-auto no-scrollbar"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className={isActive ? "text-primary" : ""}>{tab.icon}</span>
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
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
