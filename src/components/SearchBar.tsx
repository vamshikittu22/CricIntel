import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, User, UserCheck, Sparkles, ChevronRight } from "lucide-react";
import { usePlayerSearch } from "@/lib/hooks/usePlayers";
import { getFlag } from "@/lib/countryFlags";
import { motion, AnimatePresence } from "framer-motion";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: players } = usePlayerSearch(debouncedQuery, genderFilter);
  const filtered = debouncedQuery.trim() ? players?.slice(0, 8) : [];

  return (
    <div ref={ref} className="relative w-full max-w-2xl mx-auto space-y-4">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/0 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search Player, Country or Logic..."
            className="h-16 pl-14 pr-6 text-lg rounded-2xl border-white/5 bg-white/5 backdrop-blur-xl shadow-2xl transition-all focus-visible:ring-primary/20 focus-visible:ring-4 focus-visible:border-primary/50"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-50">
             <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
               <span className="text-xs">⌘</span>K
             </kbd>
          </div>
        </div>
      </div>
      
      {/* Gender Filter Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex glass p-1 rounded-xl border-white/5">
          {[
            { id: "all", label: "All Players", icon: Sparkles },
            { id: "male", label: "Men", icon: User },
            { id: "female", label: "Women", icon: UserCheck }
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setGenderFilter(btn.id as any)}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                genderFilter === btn.id 
                  ? "bg-primary text-white shadow-lg" 
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <btn.icon className="h-3 w-3" />
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && filtered && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute z-50 mt-2 w-full rounded-2xl border border-white/10 bg-black/80 backdrop-blur-2xl shadow-2xl overflow-hidden ring-1 ring-white/10"
          >
            <div className="p-2 space-y-1">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    navigate(`/player/${p.id}`);
                    setIsOpen(false);
                    setQuery("");
                  }}
                  className="group flex w-full items-center gap-4 px-4 py-3 text-left rounded-xl hover:bg-white/5 transition-all"
                >
                  <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center text-xl shadow-inner">
                    {getFlag(p.country)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white group-hover:text-primary transition-colors">{p.name}</p>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      {p.country} · {p.gender}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
            <div className="bg-white/5 px-4 py-2 border-t border-white/5 flex items-center justify-between">
               <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">FAANG Precision Search Enabled</span>
               <span className="text-[9px] font-black uppercase text-primary tracking-tighter">v.4.0.1</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
