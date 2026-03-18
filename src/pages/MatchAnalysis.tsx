import { AppHeader } from "@/components/AppHeader";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo, useEffect } from "react";
import { 
  ArrowLeft, Calendar, MapPin, Trophy, Shield, Zap, Target, 
  Activity, History, TrendingUp, BarChart3, Users, ChevronRight,
  Info, Search, Filter, Loader2, Download, Share2, Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMatchDetail, useMatchDeliveries } from "@/hooks/useAnalytics";
import { getFlag } from "@/lib/countryFlags";

import MatchHeroCard from "@/components/match/MatchHeroCard";
import MatchScorecard from "@/components/match/MatchScorecard";
import MatchCharts from "@/components/match/MatchCharts";
import MatchBallByBall from "@/components/match/MatchBallByBall";
import MatchPartnerships from "@/components/match/MatchPartnerships";
import MatchPhaseAnalysis from "@/components/match/MatchPhaseAnalysis";

export default function MatchAnalysis() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  const { data: matchData, isLoading: matchLoading } = useMatchDetail(matchId);
  const { data: deliveries, isLoading: deliveriesLoading } = useMatchDeliveries(matchId);

  useEffect(() => {
    if (matchData?.match) {
      document.title = `${matchData.match.team1} vs ${matchData.match.team2} | Match Analysis | CricIntel`;
    }
  }, [matchData]);

  if (matchLoading || deliveriesLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Loading Match Data...</p>
      </div>
    );
  }

  if (!matchData?.match) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AppHeader />
        <div className="text-center max-w-md">
          <div className="h-20 w-20 bg-destructive/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-destructive/20">
            <Info className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic mb-2">Match Not Found</h2>
          <p className="text-muted-foreground font-medium mb-8">The requested match could not be found in our database. It may have been removed or the ID is incorrect.</p>
          <Button variant="outline" className="rounded-xl border-border/50 font-black uppercase tracking-widest text-[10px]" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Matches
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 selection:bg-primary/20">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
           <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="rounded-full bg-secondary/50 hover:bg-secondary border border-border/50 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Back to Matches</span>
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 border border-border/50 hover:bg-secondary">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 border border-border/50 hover:bg-secondary">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <MatchHeroCard match={matchData.match} stats={matchData.stats} />

        {/* Sticky Navigation */}
        <div className="sticky top-20 z-50 mb-12 py-2">
            <div className="glass p-1.5 rounded-2xl border-border/50 backdrop-blur-2xl bg-background/60 shadow-xl inline-flex items-center w-full overflow-x-auto overflow-y-hidden lg:justify-between scrollbar-none">
                <div className="flex items-center">
                    {["overview", "scorecard", "charts", "ball-by-ball", "partnerships", "phases"].map((section) => (
                        <button
                            key={section}
                            onClick={() => setActiveSection(section)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                activeSection === section 
                                ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]" 
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                            }`}
                        >
                            {section.replace("-", " ")}
                        </button>
                    ))}
                </div>
                <div className="hidden lg:flex items-center gap-4 px-4 h-9 border-l border-border/50 ml-4">
                    <Badge variant="outline" className="text-[9px] font-black border-emerald-500/20 text-emerald-500 bg-emerald-500/5 px-3">
                        Data Accuracy: 100%
                    </Badge>
                </div>
            </div>
        </div>

        {/* Section Content Rendering */}
        <div className="min-h-[600px]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    {activeSection === "overview" && (
                        <div className="space-y-12">
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <Card className="glass border-border/50 p-8 rounded-[2.5rem] bg-card/40 flex flex-col justify-between h-48 group hover:border-primary/30 transition-all">
                                    <div className="flex justify-between items-start">
                                         <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                            <Trophy className="h-5 w-5" />
                                        </div>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase text-muted-foreground border-border/50">Result</Badge>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-3xl font-black italic tracking-tighter uppercase leading-none">{matchData.match.winner || "No Result"}</span>
                                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-2">{matchData.match.winner ? 'Match Winner' : 'Final Status'}</span>
                                    </div>
                                </Card>
                                <Card className="glass border-border/50 p-8 rounded-[2.5rem] bg-card/40 flex flex-col justify-between h-48 group hover:border-accent/30 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 rounded-2xl bg-accent/10 border border-accent/20 group-hover:bg-accent group-hover:text-accent-foreground transition-all">
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase text-muted-foreground border-border/50">Toss</Badge>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-3xl font-black italic tracking-tighter uppercase leading-none">{matchData.match.toss_decision || "N/A"}</span>
                                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-2">Won by {matchData.match.toss_winner}</span>
                                    </div>
                                </Card>
                                 <Card className="glass border-border/50 p-8 rounded-[2.5rem] bg-card/40 flex flex-col justify-between h-48 group hover:border-emerald-500/30 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                            <Zap className="h-5 w-5" />
                                        </div>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase text-muted-foreground border-border/50">Match Volume</Badge>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-3xl font-black italic tracking-tighter uppercase leading-none">{deliveries?.length || 0}</span>
                                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-2">Total Balls Bowled</span>
                                    </div>
                                </Card>
                                <Card className="glass border-border/50 p-8 rounded-[2.5rem] bg-card/40 flex flex-col justify-between h-48 group hover:border-purple-500/30 transition-all">
                                    <div className="flex justify-between items-start">
                                        <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-all">
                                            <Target className="h-5 w-5" />
                                        </div>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase text-muted-foreground border-border/50">Status</Badge>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-3xl font-black italic tracking-tighter uppercase leading-none">Complete</span>
                                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mt-2">Match Recorded</span>
                                    </div>
                                </Card>
                             </div>
                             
                             <div className="p-12 glass rounded-[3rem] border-border/50 bg-secondary/5 text-center">
                                <Activity className="h-10 w-10 mx-auto mb-6 opacity-20" />
                                <h2 className="text-xl font-black italic tracking-tighter uppercase mb-4">Match Summary</h2>
                                <p className="text-sm text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed mb-8">
                                    A comprehensive breakdown of the match, featuring run progression, over-by-over analysis, and key player performances across all sessions.
                                </p>
                             </div>

                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <Card className="glass rounded-[3rem] border-border/50 overflow-hidden bg-card/40 shadow-xl">
                                    <div className="p-8 border-b border-border/50 bg-primary/5 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Top Batters</span>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter">Batting</Badge>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        {matchData.stats
                                            .filter(s => s.is_batter)
                                            .sort((a,b) => b.bat_runs - a.bat_runs)
                                            .slice(0, 3)
                                            .map((s, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-secondary/20 transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-lg font-black italic text-foreground/20 group-hover:text-primary transition-colors">0{idx+1}</span>
                                                        <span className="text-sm font-black uppercase italic tracking-tight">{s.player_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xl font-black italic tracking-tighter text-primary">{s.bat_runs}</span>
                                                        <span className="text-[10px] font-black text-muted-foreground opacity-40">({s.bat_balls})</span>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </Card>
                                <Card className="glass rounded-[3rem] border-border/50 overflow-hidden bg-card/40 shadow-xl">
                                    <div className="p-8 border-b border-border/50 bg-accent/5 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-accent">Top Bowlers</span>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter">Bowling</Badge>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        {matchData.stats
                                            .filter(s => s.is_bowler && s.bowl_overs !== "0")
                                            .sort((a,b) => b.bowl_wickets - a.bowl_wickets || parseFloat(a.bowl_econ) - parseFloat(b.bowl_econ))
                                            .slice(0, 3)
                                            .map((s, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-secondary/20 transition-all group">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-lg font-black italic text-foreground/20 group-hover:text-accent transition-colors">0{idx+1}</span>
                                                        <span className="text-sm font-black uppercase italic tracking-tight">{s.player_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xl font-black italic tracking-tighter text-accent">{s.bowl_wickets}<span className="text-xs text-muted-foreground/30 not-italic ml-1">/</span>{s.bowl_runs}</span>
                                                        <span className="text-[10px] font-black text-muted-foreground opacity-40">({s.bowl_overs})</span>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </Card>
                             </div>
                        </div>
                    )}
                    {activeSection === "scorecard" && <MatchScorecard stats={matchData.stats} match={matchData.match} />}
                    {activeSection === "charts" && <MatchCharts deliveries={deliveries || []} match={matchData.match} />}
                    {activeSection === "ball-by-ball" && <MatchBallByBall deliveries={deliveries || []} />}
                    {activeSection === "partnerships" && <MatchPartnerships deliveries={deliveries || []} />}
                    {activeSection === "phases" && <MatchPhaseAnalysis deliveries={deliveries || []} />}
                </motion.div>
            </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

