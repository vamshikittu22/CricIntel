import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";
import { AlertTriangle, Shield, TrendingDown, TrendingUp, Copy, Check, Crosshair } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { PlayerSummary } from "@/lib/hooks/usePlayers";

interface WeaknessesTabProps {
  stats: PlayerSummary | null;
  format: string;
  isLoading?: boolean;
}

interface InsightRule {
  type: "weakness" | "strength";
  title: string;
  description: string;
  confidence: number;
  howToBowl?: string;
  fieldSetup?: string;
}

function analyzeFromSummary(stats: PlayerSummary | null): InsightRule[] {
  const rules: InsightRule[] = [];
  if (!stats) return rules;

  // SR-based insights
  if ((stats.strike_rate || 0) > 140) {
    rules.push({
      type: "strength",
      title: "Aggressive batting",
      description: `Strike rate of ${stats.strike_rate?.toFixed(1)} indicates strong attacking intent.`,
      confidence: 80,
    });
  } else if ((stats.strike_rate || 0) < 100 && stats.innings_bat > 5) {
    rules.push({
      type: "weakness",
      title: "Low strike rate",
      description: `Strike rate of ${stats.strike_rate?.toFixed(1)} may indicate difficulty rotating strike.`,
      confidence: 65,
      howToBowl: "Build dot ball pressure. Bowl tight lines and vary pace.",
      fieldSetup: "Standard catching field with sweeper options.",
    });
  }

  // Boundary analysis
  if (stats.balls > 0) {
    const boundaryRate = ((stats.fours + stats.sixes) / stats.balls) * 100;
    if (boundaryRate > 15) {
      rules.push({
        type: "strength",
        title: "Boundary hitter",
        description: `${boundaryRate.toFixed(1)}% boundary rate shows ability to find the fence.`,
        confidence: 75,
      });
    }
  }

  // Bowling analysis
  if (stats.wickets > 0 && (stats.econ || 0) > 0) {
    if ((stats.econ || 0) < 7) {
      rules.push({
        type: "strength",
        title: "Economical bowling",
        description: `Economy of ${stats.econ?.toFixed(2)} restricts run flow.`,
        confidence: 75,
      });
    }
  }

  if (rules.length === 0) {
    rules.push({
      type: "strength",
      title: "Balanced profile",
      description: "No extreme patterns detected from summary data.",
      confidence: 50,
    });
  }

  return rules;
}

function generateBriefing(rules: InsightRule[]): string {
  const weaknesses = rules.filter((r) => r.type === "weakness");
  if (weaknesses.length === 0) return "No significant weaknesses identified. Standard bowling plans recommended.";
  const setup = weaknesses[0]?.howToBowl || "Standard pace and length to build pressure.";
  const pressure = weaknesses.length > 1
    ? `Then exploit: ${weaknesses[1].title.toLowerCase()}. ${weaknesses[1].howToBowl || ""}`
    : "Maintain dot ball pressure and wait for the mistake.";
  return `PHASE 1 — SETUP\n${setup}\n\nPHASE 2 — BUILD PRESSURE\n${pressure}\n\nFIELD: ${weaknesses[0]?.fieldSetup || "Standard catching field."}`;
}

export function WeaknessesTab({ stats, format, isLoading }: WeaknessesTabProps) {
  const [copied, setCopied] = useState(false);
  const rules = useMemo(() => analyzeFromSummary(stats), [stats]);
  const briefing = useMemo(() => generateBriefing(rules), [rules]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return <EmptyState message={`Not enough data for ${format}.`} />;
  }

  const weaknesses = rules.filter((r) => r.type === "weakness");
  const strengths = rules.filter((r) => r.type === "strength");

  const handleCopy = () => {
    navigator.clipboard.writeText(briefing);
    setCopied(true);
    toast({ title: "Copied!", description: "Tactical briefing copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const renderCard = (rule: InsightRule, i: number) => {
    const isWeak = rule.type === "weakness";
    return (
      <Card key={i} className={`border-l-4 ${isWeak ? "border-l-destructive bg-destructive/5" : "border-l-success bg-success/5"}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {isWeak ? <TrendingDown className="h-4 w-4 text-destructive shrink-0" /> : <TrendingUp className="h-4 w-4 text-success shrink-0" />}
              <span className="font-semibold text-sm">{rule.title}</span>
            </div>
            <Badge variant="outline" className={isWeak ? "border-destructive/40 text-destructive" : "border-success/40 text-success"}>
              {rule.confidence}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{rule.description}</p>
          <Progress value={rule.confidence} className="h-1.5" />
          {rule.howToBowl && (
            <div className="pt-1">
              <p className="text-xs font-medium text-primary mb-0.5">How to bowl</p>
              <p className="text-xs text-muted-foreground">{rule.howToBowl}</p>
            </div>
          )}
          {rule.fieldSetup && (
            <div>
              <p className="text-xs font-medium text-primary mb-0.5">Field setup</p>
              <p className="text-xs text-muted-foreground">{rule.fieldSetup}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {weaknesses.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Weaknesses
            </h4>
            {weaknesses.map((r, i) => renderCard(r, i))}
          </div>
        )}
        {strengths.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2 text-success">
              <Shield className="h-4 w-4" /> Strengths
            </h4>
            {strengths.map((r, i) => renderCard(r, i))}
          </div>
        )}
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crosshair className="h-5 w-5 text-primary" /> Tactical Briefing
            </CardTitle>
            <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{briefing}</pre>
        </CardContent>
      </Card>
    </motion.div>
  );
}
