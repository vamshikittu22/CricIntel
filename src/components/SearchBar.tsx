import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, User, UserCheck } from "lucide-react";
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
    <div ref={ref} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search cricket players..."
          className="h-14 pl-12 pr-4 text-lg rounded-xl border-2 border-border bg-card shadow-sm transition-all focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-4"
        />
      </div>
      
      {/* Gender Filter */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <button
          onClick={() => setGenderFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            genderFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setGenderFilter("male")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
            genderFilter === "male" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <User className="h-3 w-3" /> Men
        </button>
        <button
          onClick={() => setGenderFilter("female")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
            genderFilter === "female" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UserCheck className="h-3 w-3" /> Women
        </button>
      </div>

      <AnimatePresence>
        {isOpen && filtered && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden"
          >
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  navigate(`/player/${p.id}`);
                  setIsOpen(false);
                  setQuery("");
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
              >
                <span className="text-xl">{getFlag(p.country)}</span>
                <div className="flex-1">
                  <p className="font-medium text-card-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.country}</p>
                </div>
                {p.gender === "female" && <UserCheck className="h-4 w-4 text-pink-500" />}
                {p.gender === "male" && <User className="h-4 w-4 text-blue-500" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
