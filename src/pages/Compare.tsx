import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/batting/StatCard";
import { PlayerCompareSearch } from "@/components/compare/PlayerCompareSearch";
import { getFlag } from "@/lib/countryFlags";
import { ArrowLeftRight, Sword, Shield, Zap, TrendingUp, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from "recharts";
import { 
  useCompareBatters, 
  useCompareBowlers, 
  useH2H, 
  usePlayerFullCareer 
} from "@/hooks/useAnalytics";
import { usePlayer } from "@/lib/hooks/usePlayers";

const formats = ["T20", "ODI", "Test"] as const;

export default function Compare() {
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [format, setFormat] = useState<string>("T20");
  const [activeTab, setActiveTab] = useState("batting");

  // Fetch basic player info
  const { data: p1 } = usePlayer(player1Id || undefined);
  const { data: p2 } = usePlayer(player2Id || undefined);

  // Fetch Career Stats
  const { data: b1Data } = usePlayerFullCareer(player1Id, format);
  const { data: b2Data } = usePlayerFullCareer(player2Id, format);

  // Fetch H2H specifically
  const { data: h2h_1v2 } = useH2H(player1Id, player2Id, format);
  const { data: h2h_2v1 } = useH2H(player2Id, player1Id, format);

  const stats1 = b1Data;
  const stats2 = b2Data;

  const getBattingChart = () => {
    if (!stats1?.batting && !stats2?.batting) return [];
    return [
      { stat: "Average", [p1?.name || "Player 1"]: stats1?.batting?.batting_avg ?? 0, [p2?.name || "Player 2"]: stats2?.batting?.batting_avg ?? 0 },
      { stat: "SR / 2", [p1?.name || "Player 1"]: (stats1?.batting?.strike_rate || 0) / 2, [p2?.name || "Player 2"]: (stats2?.batting?.strike_rate || 0) / 2 },
      { stat: "Century", [p1?.name || "Player 1"]: stats1?.batting?.hundreds ?? 0, [p2?.name || "Player 2"]: stats2?.batting?.hundreds ?? 0 },
      { stat: "Runs / 100", [p1?.name || "Player 1"]: (stats1?.batting?.total_runs || 0) / 100, [p2?.name || "Player 2"]: (stats2?.batting?.total_runs || 0) / 100 },
    ];
  };

  const getRadarData = () => {
    if (!stats1?.batting && !stats2?.batting) return [];
    const maxAvg = Math.max(stats1?.batting?.batting_avg || 0, stats2?.batting?.batting_avg || 0, 50);
    const maxSR = Math.max(stats1?.batting?.strike_rate || 0, stats2?.batting?.strike_rate || 0, 140);
    const maxRuns = Math.max(stats1?.batting?.total_runs || 0, stats2?.batting?.total_runs || 0, 5000);
    const maxBound = Math.max(stats1?.batting?.boundary_pct || 0, stats2?.batting?.boundary_pct || 0, 20);

    return [
      { subject: 'Consistency (Avg)', A: ((stats1?.batting?.batting_avg || 0) / maxAvg) * 100, B: ((stats2?.batting?.batting_avg || 0) / maxAvg) * 100 },
      { subject: 'Power (Boundaries)', A: ((stats1?.batting?.boundary_pct || 0) / maxBound) * 100, B: ((stats2?.batting?.boundary_pct || 0) / maxBound) * 100 },
      { subject: 'Volume (Runs)', A: ((stats1?.batting?.total_runs || 0) / maxRuns) * 100, B: ((stats2?.batting?.total_runs || 0) / maxRuns) * 100 },
      { subject: 'Speed (SR)', A: ((stats1?.batting?.strike_rate || 0) / maxSR) * 100, B: ((stats2?.batting?.strike_rate || 0) / maxSR) * 100 },
      { subject: 'Conversion', A: stats1?.batting?.hundreds ? (stats1.batting.hundreds / (stats1.batting.innings || 1) * 500) : 0, B: stats2?.batting?.hundreds ? (stats2.batting.hundreds / (stats2.batting.innings || 1) * 500) : 0 },
    ];
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-10 text-center space-y-2">
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="text-4xl md:text-5xl font-heading font-black tracking-tighter"
          >
            H2H <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">COMPARE</span>
          </motion.h1>
          <p className="text-slate-400 font-medium">Production-grade analytics layer comparisons.</p>
        </div>

        {/* Global Selectors */}
        <div className="glass-card p-6 mb-8 rounded-2xl border border-white/5 ring-1 ring-white/10 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <PlayerCompareSearch 
              onSelect={setPlayer1Id} 
              selectedPlayerId={player1Id} 
              placeholder="First Player"
              excludeId={player2Id}
            />
            
            <div className="flex flex-col items-center gap-4">
               <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                 <ArrowLeftRight className="h-6 w-6 text-primary animate-pulse" />
               </div>
               <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/5">
                 {formats.map(f => (
                   <button 
                    key={f}
                    onClick={() => setFormat(f)}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                      format === f ? "bg-primary text-primary-foreground shadow-lg" : "text-slate-400 hover:text-white"
                    )}
                   >
                     {f}
                   </button>
                 ))}
               </div>
            </div>

            <PlayerCompareSearch 
              onSelect={setPlayer2Id} 
              selectedPlayerId={player2Id} 
              placeholder="Second Player"
              excludeId={player1Id}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
        {!player1Id || !player2Id ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4"
          >
             <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center border border-white/5">
               <Zap className="h-8 w-8" />
             </div>
             <p className="text-lg font-medium">Select two players to unlock advanced analytics</p>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-center mb-8">
                <TabsList className="bg-slate-900/80 border border-white/5 p-1 h-12">
                  <TabsTrigger value="batting" className="px-8 flex gap-2">
                    <Sword className="h-4 w-4" /> Batting
                  </TabsTrigger>
                  <TabsTrigger value="bowling" className="px-8 flex gap-2">
                    <Shield className="h-4 w-4" /> Bowling
                  </TabsTrigger>
                  <TabsTrigger value="h2h" className="px-8 flex gap-2">
                    <TrendingUp className="h-4 w-4" /> Head-to-Head
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Batting Tab Content */}
              <TabsContent value="batting" className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px_1fr] gap-8">
                  {/* Player 1 Stats */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{getFlag(p1?.country || "")}</span>
                      <h3 className="text-xl font-bold font-heading truncate">{p1?.name}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard label="Innings" value={stats1?.batting?.innings ?? 0} />
                      <StatCard label="Total Runs" value={stats1?.batting?.total_runs ?? 0} highlight />
                      <StatCard label="Average" value={stats1?.batting?.batting_avg ?? "N/A"} />
                      <StatCard label="Strike Rate" value={stats1?.batting?.strike_rate ?? "N/A"} />
                      <StatCard label="Boundaries %" value={(stats1?.batting?.boundary_pct || 0) + "%"} />
                      <StatCard label="High Score" value={stats1?.batting?.high_score ?? 0} subtitle={stats1?.batting?.high_score_notout ? "Not Out" : ""} />
                    </div>
                  </div>

                  {/* Comparison Visualization */}
                  <div className="glass-card rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-900/30">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-6">Relative Performance Index</h4>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                          <PolarGrid stroke="#334155" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <Radar name={p1?.name} dataKey="A" stroke="hsl(174, 72%, 40%)" fill="hsl(174, 72%, 40%)" fillOpacity={0.5} />
                          <Radar name={p2?.name} dataKey="B" stroke="hsl(38, 92%, 50%)" fill="hsl(38, 92%, 50%)" fillOpacity={0.5} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Player 2 Stats */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2 lg:flex-row-reverse">
                      <span className="text-3xl">{getFlag(p2?.country || "")}</span>
                      <h3 className="text-xl font-bold font-heading truncate">{p2?.name}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard label="Innings" value={stats2?.batting?.innings ?? 0} />
                      <StatCard label="Total Runs" value={stats2?.batting?.total_runs ?? 0} highlight />
                      <StatCard label="Average" value={stats2?.batting?.batting_avg ?? "N/A"} />
                      <StatCard label="Strike Rate" value={stats2?.batting?.strike_rate ?? "N/A"} />
                      <StatCard label="Boundaries %" value={(stats2?.batting?.boundary_pct || 0) + "%"} />
                      <StatCard label="High Score" value={stats2?.batting?.high_score ?? 0} subtitle={stats2?.batting?.high_score_notout ? "Not Out" : ""} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Bowling Tab Content */}
              <TabsContent value="bowling" className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px_1fr] gap-8">
                   {/* P1 Bowling */}
                   <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{getFlag(p1?.country || "")}</span>
                      <h3 className="text-xl font-bold font-heading truncate">{p1?.name}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard label="Innings" value={stats1?.bowling?.innings_bowled ?? 0} />
                      <StatCard label="Wickets" value={stats1?.bowling?.wickets ?? 0} highlight />
                      <StatCard label="Economy" value={stats1?.bowling?.economy ?? "N/A"} />
                      <StatCard label="Dot %" value={(stats1?.bowling?.dot_pct || 0) + "%"} />
                      <StatCard label="4w / 5w" value={`${stats1?.bowling?.four_wicket_hauls ?? 0} / ${stats1?.bowling?.five_wicket_hauls ?? 0}`} />
                      <StatCard label="Best Figures" value={stats1?.bowling?.best_figures_w ? `${stats1.bowling.best_figures_w}/${stats1.bowling.best_figures_r}` : "N/A"} />
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="p-6 rounded-full bg-slate-900 border border-white/10 shadow-xl">
                      <Shield className="h-12 w-12 text-primary opacity-50" />
                    </div>
                    <p className="text-slate-400 text-sm max-w-[250px]">Bowling analytics compare wickets, control, and strike-ability.</p>
                  </div>

                  {/* P2 Bowling */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2 lg:flex-row-reverse">
                      <span className="text-3xl">{getFlag(p2?.country || "")}</span>
                      <h3 className="text-xl font-bold font-heading truncate">{p2?.name}</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard label="Innings" value={stats2?.bowling?.innings_bowled ?? 0} />
                      <StatCard label="Wickets" value={stats2?.bowling?.wickets ?? 0} highlight />
                      <StatCard label="Economy" value={stats2?.bowling?.economy ?? "N/A"} />
                      <StatCard label="Dot %" value={(stats2?.bowling?.dot_pct || 0) + "%"} />
                      <StatCard label="4w / 5w" value={`${stats2?.bowling?.four_wicket_hauls ?? 0} / ${stats2?.bowling?.five_wicket_hauls ?? 0}`} />
                      <StatCard label="Best Figures" value={stats2?.bowling?.best_figures_w ? `${stats2.bowling.best_figures_w}/${stats2.bowling.best_figures_r}` : "N/A"} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* H2H Tab Content */}
              <TabsContent value="h2h" className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Batter 1 vs Bowler 2 */}
                  <Card className="bg-slate-900/40 border-slate-800 border overflow-hidden">
                    <div className="bg-slate-800/80 px-6 py-4 flex items-center justify-between border-b border-slate-700">
                      <div className="flex items-center gap-2">
                        <Sword className="h-4 w-4 text-emerald-400" />
                        <span className="font-bold">{p1?.name}</span>
                        <span className="text-xs text-slate-500 uppercase">as Batter</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">VS</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 uppercase">as Bowler</span>
                        <span className="font-bold">{p2?.name}</span>
                        <Shield className="h-4 w-4 text-blue-400" />
                      </div>
                    </div>
                    <CardContent className="p-6">
                      {h2h_1v2 ? (
                        <div className="grid grid-cols-3 gap-6">
                          <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase mb-1">Runs</p>
                            <p className="text-3xl font-black text-white">{h2h_1v2.runs}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase mb-1">Balls</p>
                            <p className="text-3xl font-black text-white">{h2h_1v2.balls}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase mb-1">Out</p>
                            <p className="text-3xl font-black text-red-500">{h2h_1v2.dismissals}</p>
                          </div>
                          <div className="col-span-3 pt-6 border-t border-slate-800 flex justify-between items-center">
                            <div>
                               <p className="text-[10px] text-slate-500 uppercase">Strike Rate</p>
                               <p className="text-xl font-bold text-primary">{h2h_1v2.strike_rate}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] text-slate-500 uppercase">Last Encounter</p>
                               <p className="text-sm font-medium text-slate-300">{h2h_1v2.last_encounter ? new Date(h2h_1v2.last_encounter).toLocaleDateString() : "Never"}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 opacity-50">
                          <HelpCircle className="h-8 w-8 mb-2" />
                          <p className="text-sm">No encounters recorded</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Batter 2 vs Bowler 1 */}
                  <Card className="bg-slate-900/40 border-slate-800 border overflow-hidden">
                    <div className="bg-slate-800/80 px-6 py-4 flex items-center justify-between border-b border-slate-700">
                      <div className="flex items-center gap-2">
                        <Sword className="h-4 w-4 text-emerald-400" />
                        <span className="font-bold">{p2?.name}</span>
                        <span className="text-xs text-slate-500 uppercase">as Batter</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">VS</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 uppercase">as Bowler</span>
                        <span className="font-bold">{p1?.name}</span>
                        <Shield className="h-4 w-4 text-blue-400" />
                      </div>
                    </div>
                    <CardContent className="p-6">
                      {h2h_2v1 ? (
                        <div className="grid grid-cols-3 gap-6">
                          <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase mb-1">Runs</p>
                            <p className="text-3xl font-black text-white">{h2h_2v1.runs}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase mb-1">Balls</p>
                            <p className="text-3xl font-black text-white">{h2h_2v1.balls}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-500 uppercase mb-1">Out</p>
                            <p className="text-3xl font-black text-red-500">{h2h_2v1.dismissals}</p>
                          </div>
                          <div className="col-span-3 pt-6 border-t border-slate-800 flex justify-between items-center">
                             <div>
                               <p className="text-[10px] text-slate-500 uppercase">Strike Rate</p>
                               <p className="text-xl font-bold text-primary">{h2h_2v1.strike_rate}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] text-slate-500 uppercase">Last Encounter</p>
                               <p className="text-sm font-medium text-slate-300">{h2h_2v1.last_encounter ? new Date(h2h_2v1.last_encounter).toLocaleDateString() : "Never"}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-10 opacity-50">
                          <HelpCircle className="h-8 w-8 mb-2" />
                          <p className="text-sm">No encounters recorded</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      <style>{`
        .glass-card {
          background: rgba(15, 15, 20, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
