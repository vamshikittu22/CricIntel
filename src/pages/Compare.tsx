import { useState, useEffect, useMemo } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { getFlag } from "@/lib/countryFlags";
import { 
  ArrowLeftRight, 
  Search, 
  Sword, 
  Shield, 
  TrendingUp, 
  Zap, 
  User,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  CartesianGrid,
  Cell
} from "recharts";
import { 
  useCompareBatters, 
  useCompareBowlers, 
  useCompareAllrounders,
  useH2H, 
  usePlayerBattingCareer,
  usePlayerBowlingCareer,
  BattingCareer,
  BowlingCareer
} from "@/hooks/useAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// ── Shared Internal Components ───────────────────────────────────────

/**
 * StatRow: Displays a comparison between two values with a winner highlight.
 */
function StatRow({ 
  label, 
  value1, 
  value2, 
  higherIsBetter = true,
  isPercent = false 
}: { 
  label: string; 
  value1: number | string | null; 
  value2: number | string | null; 
  higherIsBetter?: boolean;
  isPercent?: boolean;
}) {
  const v1 = typeof value1 === 'number' ? value1 : parseFloat(String(value1 || '0'));
  const v2 = typeof value2 === 'number' ? value2 : parseFloat(String(value2 || '0'));
  
  const isWinner1 = higherIsBetter ? v1 > v2 : v1 < v2;
  const isWinner2 = higherIsBetter ? v2 > v1 : v2 < v1;
  const isTie = v1 === v2 && v1 !== 0;

  const displayVal = (v: any) => {
    if (v === null || v === undefined || isNaN(v)) return '—';
    if (isPercent) return `${v}%`;
    return v;
  };

  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
      }}
      className="grid grid-cols-[1fr_auto_1fr] items-center py-3 border-b border-black/5 dark:border-white/5 last:border-0"
    >
      <div className={cn(
        "text-right px-4 font-black transition-all",
        isWinner1 ? "text-primary scale-110" : "text-muted-foreground/60"
      )}>
        {displayVal(value1)}
        {isWinner1 && <span className="ml-1 text-[8px]">▲</span>}
      </div>
      
      <div className="w-32 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 bg-slate-100/50 dark:bg-white/5 py-1 rounded-full px-2">
        {label}
      </div>

      <div className={cn(
        "text-left px-4 font-black transition-all",
        isWinner2 ? "text-primary scale-110" : "text-muted-foreground/60"
      )}>
        {isWinner2 && <span className="mr-1 text-[8px]">▲</span>}
        {displayVal(value2)}
      </div>
    </motion.div>
  );
}

/**
 * PlayerSearchBox: Custom search component using raw Supabase for players.
 */
function PlayerSearchBox({ 
  label, 
  selectedPlayer, 
  onSelect, 
  placeholder,
  excludeId 
}: { 
  label: string; 
  selectedPlayer: { id: string; name: string; country: string } | null; 
  onSelect: (p: { id: string; name: string; country: string } | null) => void; 
  placeholder: string;
  excludeId?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('players')
        .select('id, name, country')
        .ilike('name', `%${query}%`)
        .neq('id', excludeId || '')
        .limit(8);
      
      if (!error && data) setResults(data);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, excludeId]);

  return (
    <div className="relative w-full group">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 block px-1">
        {label}
      </label>
      <div className="relative">
        {selectedPlayer ? (
          <div className="flex items-center justify-between w-full h-14 px-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-xl shadow-black/5 group-hover:border-primary/50 transition-all">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getFlag(selectedPlayer.country)}</span>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tight">{selectedPlayer.name}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{selectedPlayer.country}</span>
              </div>
            </div>
            <button 
              onClick={() => { onSelect(null); setQuery(""); }}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-xl transition-colors"
            >
              <Zap className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <input 
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-inner focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-sm font-bold"
            />
            {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary/40" />}
          </div>
        )}

        {isOpen && results.length > 0 && !selectedPlayer && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl bg-white/95 dark:bg-[#1a1a1f]/95 backdrop-blur-3xl border border-black/5 dark:border-white/10 shadow-2xl z-[60]"
          >
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => { onSelect(p); setIsOpen(false); }}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-left"
              >
                <span className="text-xl">{getFlag(p.country)}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-black">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">{p.country}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/**
 * FormatPills: Selector for match formats.
 */
function FormatPills({ selected, onChange }: { selected: string; onChange: (f: string) => void }) {
  const formats = ['T20I', 'ODI', 'Test', 'IPL', 'T20'];
  return (
    <div className="flex flex-wrap gap-2">
      {formats.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={cn(
            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            selected === f 
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
              : "bg-slate-100 dark:bg-white/5 text-muted-foreground hover:bg-slate-200 dark:hover:bg-white/10"
          )}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

/**
 * CompareSkeletons: Loading state for comparison results.
 */
function CompareSkeletons() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
      <Skeleton className="h-[500px] rounded-[2.5rem]" />
      <Skeleton className="h-[500px] rounded-[2.5rem]" />
    </div>
  );
}

// ── Main Compare Page Component ──────────────────────────────────────

export default function Compare() {
  const [mode, setMode] = useState<'bat' | 'bowl' | 'allround' | 'h2h'>('bat');
  const [player1, setPlayer1] = useState<{ id: string; name: string; country: string } | null>(null);
  const [player2, setPlayer2] = useState<{ id: string; name: string; country: string } | null>(null);
  const [format, setFormat] = useState<string>('T20I');

  // Handle mode change -> Reset selections
  const handleModeChange = (m: 'bat' | 'bowl' | 'allround' | 'h2h') => {
    setMode(m);
    setPlayer1(null);
    setPlayer2(null);
  };

  // ── Data Fetching ──────────────────────────────────────────────────

  const { data: batters, isLoading: loadingBat } = useCompareBatters(
    player1?.id || "", 
    player2?.id || "", 
    format
  );
  const { data: bowlers, isLoading: loadingBowl } = useCompareBowlers(
    player1?.id || "", 
    player2?.id || "", 
    format
  );
  const { data: allrounders, isLoading: loadingAll } = useCompareAllrounders(
    player1?.id || "", 
    player2?.id || "", 
    format
  );
  const { data: h2hData, isLoading: loadingH2H } = useH2H(
    player1?.id || "", // Batter
    player2?.id || "", // Bowler
    format
  );

  const { data: p1BatCareer } = usePlayerBattingCareer(player1?.id || "");
  const { data: p2BowlCareer } = usePlayerBowlingCareer(player2?.id || "");

  const isLoading = (mode === 'bat' && loadingBat) || 
                    (mode === 'bowl' && loadingBowl) || 
                    (mode === 'allround' && loadingAll) || 
                    (mode === 'h2h' && (loadingH2H));

  // ── Helpers for Charts ─────────────────────────────────────────────

  const radarBatData = useMemo(() => {
    if (!batters || batters.length < 2) return [];
    const p1Data = batters.find(b => b.player_id === player1?.id);
    const p2Data = batters.find(b => b.player_id === player2?.id);
    if (!p1Data || !p2Data) return [];

    // Normalization multipliers (rough heuristic)
    return [
      { subject: 'AVG', A: (p1Data.batting_avg || 0), B: (p2Data.batting_avg || 0), fullMark: 60 },
      { subject: 'SR', A: (p1Data.strike_rate || 0) / 3, B: (p2Data.strike_rate || 0) / 3, fullMark: 60 },
      { subject: '100s', A: (p1Data.hundreds || 0) * 2, B: (p2Data.hundreds || 0) * 2, fullMark: 60 },
      { subject: '50s', A: (p1Data.fifties || 0), B: (p2Data.fifties || 0), fullMark: 60 },
      { subject: 'BND %', A: (p1Data.boundary_pct || 0) * 2.5, B: (p2Data.boundary_pct || 0) * 2.5, fullMark: 60 },
    ];
  }, [batters, player1, player2]);

  const radarBowlData = useMemo(() => {
    if (!bowlers || bowlers.length < 2) return [];
    const p1Data = bowlers.find(b => b.player_id === player1?.id);
    const p2Data = bowlers.find(b => b.player_id === player2?.id);
    if (!p1Data || !p2Data) return [];

    return [
      { subject: 'Wkts', A: (p1Data.wickets || 0) / 10, B: (p2Data.wickets || 0) / 10, fullMark: 50 },
      { subject: 'ECON', A: 12 - (p1Data.economy || 0), B: 12 - (p2Data.economy || 0), fullMark: 12 },
      { subject: 'AVG', A: 50 - (p1Data.bowling_avg || 0), B: 50 - (p2Data.bowling_avg || 0), fullMark: 50 },
      { subject: 'DOT %', A: (p1Data.dot_pct || 0), B: (p2Data.dot_pct || 0), fullMark: 60 },
      { subject: '5W', A: (p1Data.five_wicket_hauls || 0) * 10, B: (p2Data.five_wicket_hauls || 0) * 10, fullMark: 50 },
    ];
  }, [bowlers, player1, player2]);

  // ── Render Header ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0c] text-foreground">
      <AppHeader />
      
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <div className="flex flex-col items-center mb-16 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <h1 className="text-5xl font-black tracking-tighter text-center leading-none">
              COMPARE <span className="text-primary italic">INTEL</span>
            </h1>
            <p className="text-sm font-bold text-muted-foreground/60 uppercase tracking-[0.4em] mt-3">
              Head-to-head analytics across formats
            </p>
          </motion.div>

          <div className="relative flex p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 mt-8 shadow-inner overflow-hidden">
            {[
              { id: 'bat', label: 'Bat vs Bat', icon: Sword },
              { id: 'bowl', label: 'Bowl vs Bowl', icon: Shield },
              { id: 'allround', label: 'Allrounder', icon: Zap },
              { id: 'h2h', label: 'H2H', icon: TrendingUp },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id as any)}
                className={cn(
                  "relative z-10 flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  mode === m.id ? "text-primary-foreground shadow-2xl shadow-primary/40" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <m.icon className="h-4 w-4" />
                <span>{m.label}</span>
                {mode === m.id && (
                  <motion.div 
                    layoutId="compare-mode-indicator"
                    className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-xl shadow-primary/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Selector Panel ─────────────────────────────────────────── */}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 items-end bg-white dark:bg-white/5 p-10 rounded-[3rem] border border-black/5 dark:border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[120px] rounded-full -z-10" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 blur-[120px] rounded-full -z-10" />

          <PlayerSearchBox 
            label={mode === 'h2h' ? "Batter" : "Player 1"}
            selectedPlayer={player1}
            onSelect={setPlayer1}
            placeholder="Search for a player..."
            excludeId={player2?.id}
          />

          <div className="flex flex-col items-center gap-8 py-4">
             <div className="h-10 w-10 rounded-full border border-black/5 dark:border-white/10 flex items-center justify-center bg-slate-50 dark:bg-[#0f0f13] shadow-inner">
               <ArrowLeftRight className="h-4 w-4 text-muted-foreground/30" />
             </div>
             <FormatPills selected={format} onChange={setFormat} />
          </div>

          <PlayerSearchBox 
            label={mode === 'h2h' ? "Bowler" : "Player 2"}
            selectedPlayer={player2}
            onSelect={setPlayer2}
            placeholder="Select opponent..."
            excludeId={player1?.id}
          />
        </div>

        {/* ── Results Container ──────────────────────────────────────── */}

        <AnimatePresence mode="wait">
          {!player1 || !player2 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="mt-16"
            >
              <EmptyState message="Select two players to begin the comparison" />
              <div className="mt-12 flex justify-center gap-12 opacity-20 filter grayscale">
                <div className="w-48 h-64 border-2 border-dashed border-muted-foreground/50 rounded-[2rem] flex items-center justify-center">
                  <User className="h-12 w-12" />
                </div>
                <div className="w-48 h-64 border-2 border-dashed border-muted-foreground/50 rounded-[2rem] flex items-center justify-center">
                  <User className="h-12 w-12" />
                </div>
              </div>
            </motion.div>
          ) : isLoading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CompareSkeletons />
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-16 space-y-12"
            >
              {/* --- MODE 1: BAT VS BAT --- */}
              {mode === 'bat' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                   <div className="bg-white dark:bg-white/5 rounded-[3rem] p-10 border border-black/5 dark:border-white/5 shadow-2xl">
                     <div className="flex items-center gap-3 mb-10 pb-6 border-b border-black/5 dark:border-white/5">
                        <Sword className="h-6 w-6 text-primary" />
                        <h3 className="text-lg font-black tracking-tight uppercase">Statistical Breakdown</h3>
                     </div>
                     <motion.div 
                        initial="hidden" 
                        animate="show"
                        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                        className="space-y-1"
                      >
                       <StatRow label="Matches" value1={batters?.find(b => b.player_id === player1.id)?.matches} value2={batters?.find(b => b.player_id === player2.id)?.matches} />
                       <StatRow label="Innings" value1={batters?.find(b => b.player_id === player1.id)?.innings} value2={batters?.find(b => b.player_id === player2.id)?.innings} />
                       <StatRow label="Total Runs" value1={batters?.find(b => b.player_id === player1.id)?.total_runs} value2={batters?.find(b => b.player_id === player2.id)?.total_runs} />
                       <StatRow label="Average" value1={batters?.find(b => b.player_id === player1.id)?.batting_avg} value2={batters?.find(b => b.player_id === player2.id)?.batting_avg} />
                       <StatRow label="Strike Rate" value1={batters?.find(b => b.player_id === player1.id)?.strike_rate} value2={batters?.find(b => b.player_id === player2.id)?.strike_rate} />
                       <StatRow label="High Score" value1={batters?.find(b => b.player_id === player1.id)?.high_score} value2={batters?.find(b => b.player_id === player2.id)?.high_score} />
                       <StatRow label="Centuries" value1={batters?.find(b => b.player_id === player1.id)?.hundreds} value2={batters?.find(b => b.player_id === player2.id)?.hundreds} />
                       <StatRow label="Fifties" value1={batters?.find(b => b.player_id === player1.id)?.fifties} value2={batters?.find(b => b.player_id === player2.id)?.fifties} />
                       <StatRow label="Ducks" value1={batters?.find(b => b.player_id === player1.id)?.ducks} value2={batters?.find(b => b.player_id === player2.id)?.ducks} higherIsBetter={false} />
                       <StatRow label="Boundary %" value1={batters?.find(b => b.player_id === player1.id)?.boundary_pct} value2={batters?.find(b => b.player_id === player2.id)?.boundary_pct} isPercent />
                       <StatRow label="Balls Faced" value1={batters?.find(b => b.player_id === player1.id)?.balls_faced} value2={batters?.find(b => b.player_id === player2.id)?.balls_faced} />
                       <StatRow label="Not Outs" value1={batters?.find(b => b.player_id === player1.id)?.not_outs} value2={batters?.find(b => b.player_id === player2.id)?.not_outs} />
                       <StatRow label="Fours" value1={batters?.find(b => b.player_id === player1.id)?.fours} value2={batters?.find(b => b.player_id === player2.id)?.fours} />
                       <StatRow label="Sixes" value1={batters?.find(b => b.player_id === player1.id)?.sixes} value2={batters?.find(b => b.player_id === player2.id)?.sixes} />
                     </motion.div>
                   </div>
                   <div className="bg-white dark:bg-white/5 rounded-[3rem] p-10 border border-black/5 dark:border-white/5 shadow-2xl flex flex-col items-center">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 mb-12">Performance Dimension Radar</h3>
                     <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarBatData}>
                            <PolarGrid stroke="currentColor" className="opacity-10" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 900, fill: 'currentColor', opacity: 0.5 }} />
                            <Radar
                              name={player1.name}
                              dataKey="A"
                              stroke="hsl(174, 72%, 40%)"
                              fill="hsl(174, 72%, 40%)"
                              fillOpacity={0.6}
                            />
                            <Radar
                              name={player2.name}
                              dataKey="B"
                              stroke="hsl(38, 92%, 50%)"
                              fill="hsl(38, 92%, 50%)"
                              fillOpacity={0.6}
                            />
                            <Tooltip wrapperClassName="dark:!bg-[#1a1a1f] dark:!border-white/10 !rounded-2xl !p-4 !shadow-2xl" />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
                          </RadarChart>
                        </ResponsiveContainer>
                     </div>
                   </div>
                </div>
              )}

              {/* --- MODE 2: BOWL VS BOWL --- */}
              {mode === 'bowl' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                   <div className="bg-white dark:bg-white/5 rounded-[3rem] p-10 border border-black/5 dark:border-white/5 shadow-2xl">
                     <div className="flex items-center gap-3 mb-10 pb-6 border-b border-black/5 dark:border-white/5">
                        <Shield className="h-6 w-6 text-primary" />
                        <h3 className="text-lg font-black tracking-tight uppercase">Defensive Analysis</h3>
                     </div>
                     <motion.div 
                        initial="hidden" 
                        animate="show"
                        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                        className="space-y-1"
                      >
                       <StatRow label="Matches" value1={bowlers?.find(b => b.player_id === player1.id)?.matches} value2={bowlers?.find(b => b.player_id === player2.id)?.matches} />
                       <StatRow label="Innings" value1={bowlers?.find(b => b.player_id === player1.id)?.innings_bowled} value2={bowlers?.find(b => b.player_id === player2.id)?.innings_bowled} />
                       <StatRow label="Wickets" value1={bowlers?.find(b => b.player_id === player1.id)?.wickets} value2={bowlers?.find(b => b.player_id === player2.id)?.wickets} />
                       <StatRow label="Bowling Avg" value1={bowlers?.find(b => b.player_id === player1.id)?.bowling_avg} value2={bowlers?.find(b => b.player_id === player2.id)?.bowling_avg} higherIsBetter={false} />
                       <StatRow label="Economy" value1={bowlers?.find(b => b.player_id === player1.id)?.economy} value2={bowlers?.find(b => b.player_id === player2.id)?.economy} higherIsBetter={false} />
                       <StatRow label="Strike Rate" value1={bowlers?.find(b => b.player_id === player1.id)?.bowling_sr} value2={bowlers?.find(b => b.player_id === player2.id)?.bowling_sr} higherIsBetter={false} />
                       <StatRow label="Best Figures" value1={`${bowlers?.find(b => b.player_id === player1.id)?.best_figures_w}/${bowlers?.find(b => b.player_id === player1.id)?.best_figures_r}`} value2={`${bowlers?.find(b => b.player_id === player2.id)?.best_figures_w}/${bowlers?.find(b => b.player_id === player2.id)?.best_figures_r}`} />
                       <StatRow label="5W Hauls" value1={bowlers?.find(b => b.player_id === player1.id)?.five_wicket_hauls} value2={bowlers?.find(b => b.player_id === player2.id)?.five_wicket_hauls} />
                       <StatRow label="4W Hauls" value1={bowlers?.find(b => b.player_id === player1.id)?.four_wicket_hauls} value2={bowlers?.find(b => b.player_id === player2.id)?.four_wicket_hauls} />
                       <StatRow label="Maidens" value1={bowlers?.find(b => b.player_id === player1.id)?.maidens} value2={bowlers?.find(b => b.player_id === player2.id)?.maidens} />
                       <StatRow label="Dot %" value1={bowlers?.find(b => b.player_id === player1.id)?.dot_pct} value2={bowlers?.find(b => b.player_id === player2.id)?.dot_pct} isPercent />
                       <StatRow label="Balls Bowled" value1={bowlers?.find(b => b.player_id === player1.id)?.balls_bowled} value2={bowlers?.find(b => b.player_id === player2.id)?.balls_bowled} />
                     </motion.div>
                   </div>
                   <div className="bg-white dark:bg-white/5 rounded-[3rem] p-10 border border-black/5 dark:border-white/5 shadow-2xl flex flex-col items-center">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 mb-12">Bowler Impact Dimensions</h3>
                     <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarBowlData}>
                            <PolarGrid stroke="currentColor" className="opacity-10" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 900, fill: 'currentColor', opacity: 0.5 }} />
                            <Radar name={player1.name} dataKey="A" stroke="hsl(174, 72%, 40%)" fill="hsl(174, 72%, 40%)" fillOpacity={0.6} />
                            <Radar name={player2.name} dataKey="B" stroke="hsl(38, 92%, 50%)" fill="hsl(38, 92%, 50%)" fillOpacity={0.6} />
                            <Tooltip wrapperClassName="dark:!bg-[#1a1a1f] dark:!border-white/10 !rounded-2xl !p-4 !shadow-2xl" />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
                          </RadarChart>
                        </ResponsiveContainer>
                     </div>
                   </div>
                </div>
              )}

              {/* --- MODE 3: ALLROUNDER --- */}
              {mode === 'allround' && (
                <div className="space-y-12">
                   <div className="flex justify-center">
                      <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 flex flex-col items-center gap-3 shadow-2xl relative">
                        <div className="absolute -top-4 -right-4 h-12 w-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-xl">
                          <Zap className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Combined Hybrid Score</span>
                        <div className="flex items-center gap-12">
                           <div className="flex flex-col items-end">
                              <span className="text-sm font-black text-muted-foreground">{player1.name}</span>
                              <span className={cn("text-5xl font-black tracking-tighter", (allrounders?.[0]?.allround_index || 0) > (allrounders?.[1]?.allround_index || 0) ? "text-primary" : "text-muted-foreground/40")}>
                                {allrounders?.[0]?.allround_index || 0}
                              </span>
                           </div>
                           <div className="text-xl font-black text-muted-foreground/20 italic">VS</div>
                           <div className="flex flex-col items-start">
                              <span className="text-sm font-black text-muted-foreground">{player2.name}</span>
                              <span className={cn("text-5xl font-black tracking-tighter", (allrounders?.[1]?.allround_index || 0) > (allrounders?.[0]?.allround_index || 0) ? "text-primary" : "text-muted-foreground/40")}>
                                {allrounders?.[1]?.allround_index || 0}
                              </span>
                           </div>
                        </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {[0, 1].map((idx) => {
                       const p = [player1, player2][idx];
                       const stats = allrounders?.[idx];
                       return (
                        <div key={idx} className="bg-white dark:bg-white/5 rounded-[3rem] p-10 border border-black/5 dark:border-white/5 shadow-2xl">
                           <div className="flex items-center gap-4 mb-10 pb-6 border-b border-black/5 dark:border-white/5">
                              <span className="text-3xl">{getFlag(p.country)}</span>
                              <h4 className="text-xl font-black tracking-tight">{p.name}</h4>
                           </div>
                           <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-4">
                                 <h5 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                   <Sword className="h-3 w-3" /> Batting
                                 </h5>
                                 <div className="space-y-2">
                                   <div className="flex justify-between text-xs font-black"><span className="text-muted-foreground/40 uppercase">AVG</span> <span>{stats?.batting?.batting_avg || '—'}</span></div>
                                   <div className="flex justify-between text-xs font-black"><span className="text-muted-foreground/40 uppercase">SR</span> <span>{stats?.batting?.strike_rate || '—'}</span></div>
                                   <div className="flex justify-between text-xs font-black"><span className="text-muted-foreground/40 uppercase">Runs</span> <span>{stats?.batting?.total_runs || 0}</span></div>
                                 </div>
                              </div>
                              <div className="space-y-4">
                                 <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                   <Shield className="h-3 w-3" /> Bowling
                                 </h5>
                                 <div className="space-y-2">
                                   <div className="flex justify-between text-xs font-black"><span className="text-muted-foreground/40 uppercase">AVG</span> <span>{stats?.bowling?.bowling_avg || '—'}</span></div>
                                   <div className="flex justify-between text-xs font-black"><span className="text-muted-foreground/40 uppercase">ECON</span> <span>{stats?.bowling?.economy || '—'}</span></div>
                                   <div className="flex justify-between text-xs font-black"><span className="text-muted-foreground/40 uppercase">Wkts</span> <span>{stats?.bowling?.wickets || 0}</span></div>
                                 </div>
                              </div>
                           </div>
                        </div>
                       );
                     })}
                   </div>

                   <div className="bg-white dark:bg-white/5 rounded-[3rem] p-10 border border-black/5 dark:border-white/5 shadow-2xl overflow-hidden">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50 mb-12 text-center">Global Balanced Comparison</h3>
                      <div className="w-full h-[400px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                              data={[
                                { name: 'Bat Avg', [player1.name]: allrounders?.[0]?.batting?.batting_avg || 0, [player2.name]: allrounders?.[1]?.batting?.batting_avg || 0 },
                                { name: 'Bat SR / 2', [player1.name]: (allrounders?.[0]?.batting?.strike_rate || 0) / 2, [player2.name]: (allrounders?.[1]?.batting?.strike_rate || 0) / 2 },
                                { name: 'Bowl Avg (Inverted)', [player1.name]: Math.max(0, 50 - (allrounders?.[0]?.bowling?.bowling_avg || 50)), [player2.name]: Math.max(0, 50 - (allrounders?.[1]?.bowling?.bowling_avg || 50)) },
                                { name: 'Econ (Inverted)', [player1.name]: Math.max(0, 12 - (allrounders?.[0]?.bowling?.economy || 12)) * 4, [player2.name]: Math.max(0, 12 - (allrounders?.[1]?.bowling?.economy || 12)) * 4 },
                              ]}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-5" />
                              <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 900, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} dy={10} />
                              <YAxis hide />
                              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '1rem', padding: '12px' }} />
                              <Legend wrapperStyle={{ paddingTop: '30px' }} />
                              <Bar dataKey={player1.name} fill="hsl(174, 72%, 40%)" radius={[8, 8, 0, 0]} />
                              <Bar dataKey={player2.name} fill="hsl(38, 92%, 50%)" radius={[8, 8, 0, 0]} />
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </div>
              )}

              {/* --- MODE 4: H2H (BATTER VS BOWLER) --- */}
              {mode === 'h2h' && (
                <div className="space-y-12">
                   <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_1fr] gap-8">
                      {/* Panel A: Batter Card */}
                      <motion.div whileHover={{ scale: 1.02 }} className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 border border-black/5 dark:border-white/5 shadow-2xl flex flex-col items-center text-center">
                         <div className="h-20 w-20 rounded-2.5xl bg-primary/10 flex items-center justify-center text-4xl mb-6 shadow-inner">
                           {getFlag(player1.country)}
                         </div>
                         <h4 className="text-xl font-black tracking-tight mb-2">{player1.name}</h4>
                         <span className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest mb-8">{player1.country}</span>
                         <div className="w-full space-y-4 pt-6 border-t border-black/5 dark:border-white/5">
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">Career Avg</span>
                               <span className="text-2xl font-black tracking-tighter">
                                 {p1BatCareer?.find(c => c.format === format)?.batting_avg || '—'}
                               </span>
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">Career SR</span>
                               <span className="text-2xl font-black tracking-tighter">
                                 {p1BatCareer?.find(c => c.format === format)?.strike_rate || '—'}
                               </span>
                            </div>
                         </div>
                      </motion.div>

                      {/* Panel B: Battle Stats */}
                      <div className="flex flex-col gap-6">
                        <div className="flex-1 bg-white dark:bg-white/5 rounded-[3rem] p-10 border border-black/5 dark:border-white/5 shadow-2xl flex flex-col relative overflow-hidden">
                           <div className="flex items-center justify-between mb-12">
                              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Engagement Intel</span>
                              <div className="h-1px flex-1 mx-6 bg-black/5 dark:bg-white/5" />
                              {h2hData && h2hData.balls < 30 && (
                                <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/20">
                                  Small Sample: {h2hData.balls} Balls
                                </span>
                              )}
                           </div>

                           <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                              <div className="flex flex-col items-center text-center">
                                 <span className="text-[10px] font-black text-muted-foreground/40 uppercase mb-2">Balls</span>
                                 <span className="text-4xl font-black tracking-tighter">{h2hData?.balls || 0}</span>
                              </div>
                              <div className="flex flex-col items-center text-center">
                                 <span className="text-[10px] font-black text-muted-foreground/40 uppercase mb-2">Runs</span>
                                 <span className="text-4xl font-black tracking-tighter text-primary">{h2hData?.runs || 0}</span>
                              </div>
                              <div className="flex flex-col items-center text-center">
                                 <span className="text-[10px] font-black text-muted-foreground/40 uppercase mb-2">Dismissed</span>
                                 <span className="text-4xl font-black tracking-tighter text-red-500">{h2hData?.dismissals || 0}</span>
                              </div>
                              <div className="flex flex-col items-center text-center">
                                 <span className="text-[10px] font-black text-muted-foreground/40 uppercase mb-2">SR</span>
                                 <span className="text-4xl font-black tracking-tighter">{h2hData?.strike_rate || 0}</span>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-4 mb-12">
                              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-[#0f0f13] flex items-center justify-between shadow-inner">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Dot %</span>
                                <span className="text-sm font-black">{h2hData?.dot_pct || 0}%</span>
                              </div>
                              <div className="p-4 rounded-3xl bg-slate-50 dark:bg-[#0f0f13] flex items-center justify-between shadow-inner">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">4s / 6s</span>
                                <span className="text-sm font-black">{h2hData?.fours || 0} / {h2hData?.sixes || 0}</span>
                              </div>
                           </div>

                           <div className="mt-auto space-y-6">
                              <div className="flex items-center gap-4">
                                 {h2hData?.last_dismissal_kind && (
                                   <div className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                      Last: {h2hData.last_dismissal_kind}
                                   </div>
                                 )}
                                 <div className="flex-1 h-px bg-black/5 dark:bg-white/5" />
                                 <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">
                                   Since {h2hData?.last_encounter ? new Date(h2hData.last_encounter).toLocaleDateString() : '—'}
                                 </span>
                              </div>

                              {h2hData && (
                                <div className={cn(
                                  "w-full py-4 rounded-3xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.3em] border shadow-2xl",
                                  h2hData.strike_rate > (p1BatCareer?.find(c => c.format === format)?.strike_rate || 0) 
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                    : (h2hData.dismissals / (h2hData.balls || 1) > 0.1)
                                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                )}>
                                  <Zap className="h-4 w-4" />
                                  {h2hData.strike_rate > (p1BatCareer?.find(c => c.format === format)?.strike_rate || 0) 
                                    ? "Batter Dominates" 
                                    : (h2hData.dismissals / (h2hData.balls || 1) > 0.1)
                                      ? "Bowler Dominates"
                                      : "Evenly Matched"}
                                </div>
                              )}
                           </div>
                        </div>
                      </div>

                      {/* Panel C: Bowler Card */}
                      <motion.div whileHover={{ scale: 1.02 }} className="bg-white dark:bg-white/5 rounded-[2.5rem] p-8 border border-black/5 dark:border-white/5 shadow-2xl flex flex-col items-center text-center">
                         <div className="h-20 w-20 rounded-2.5xl bg-emerald-500/10 flex items-center justify-center text-4xl mb-6 shadow-inner">
                           {getFlag(player2.country)}
                         </div>
                         <h4 className="text-xl font-black tracking-tight mb-2">{player2.name}</h4>
                         <span className="text-[10px] font-black uppercase text-muted-foreground/40 tracking-widest mb-8">{player2.country}</span>
                         <div className="w-full space-y-4 pt-6 border-t border-black/5 dark:border-white/5">
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Career Avg</span>
                               <span className="text-2xl font-black tracking-tighter">
                                 {p2BowlCareer?.find(c => c.format === format)?.bowling_avg || '—'}
                               </span>
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Career Econ</span>
                               <span className="text-2xl font-black tracking-tighter">
                                 {p2BowlCareer?.find(c => c.format === format)?.economy || '—'}
                               </span>
                            </div>
                         </div>
                      </motion.div>
                   </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .shadow-inner {
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
        }
        .dark .shadow-inner {
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </div>
  );
}
