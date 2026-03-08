import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { usePlayerSearch } from "@/lib/hooks/usePlayers";
import { getFlag } from "@/lib/countryFlags";
import { motion, AnimatePresence } from "framer-motion";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
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

  const { data: players } = usePlayerSearch(debouncedQuery);
  const filtered = debouncedQuery.trim()
    ? players?.slice(0, 8)
    : [];

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
                <div>
                  <p className="font-medium text-card-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.country} · {p.role}
                  </p>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
