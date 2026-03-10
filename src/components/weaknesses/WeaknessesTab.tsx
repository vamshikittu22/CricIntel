import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { motion } from "framer-motion";
import { AlertTriangle, Shield, TrendingDown, TrendingUp, Copy, Check, Crosshair } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface WeaknessesTabProps {
  deliveries: any[];
  analytics: any;
  format: string;
  isLoading?: boolean;
}

interface InsightRule {
  type: "weakness" | "strength";
  title: string;
  description: string;
  confidence: number; // 0-100
  howToBowl?: string;
  fieldSetup?: string;
}

function analyzePatterns(deliveries: any[], analytics: any): InsightRule[] {
  const rules: InsightRule[] = [];
  if (!deliveries?.length) return rules;

  const pace = deliveries.filter((d) => d.bowler_type === "pace");
  const spin = deliveries.filter((d) => d.bowler_type === "spin");

  if (pace.length >= 10 && spin.length >= 10) {
    const paceSR = (pace.reduce((s, d) => s + d.runs_batter, 0) / pace.length) * 100;
    const spinSR = (spin.reduce((s, d) => s + d.runs_batter, 0) / spin.length) * 100;
    const paceWk = pace.filter((d) => d.is_wicket).length;
    const spinWk = spin.filter((d) => d.is_wicket).length;
    const paceDR = paceWk / pace.length;
    const spinDR = spinWk / spin.length;

    if (spinDR > paceDR * 1.5 && spinSR < paceSR * 0.8) {
      rules.push({
        type: "weakness",
        title: "Vulnerable to spin",
        description: `SR of ${spinSR.toFixed(0)} vs spin compared to ${paceSR.toFixed(0)} vs pace. Dismissed ${spinWk} times in ${spin.length} balls.`,
        confidence: spinDR > paceDR * 2 ? 85 : 65,
        howToBowl: "Open with spin early. Use off-cutters and slower variations to exploit lack of foot movement.",
        fieldSetup: "Slip, short leg, silly point for catches off bat-pad. Deep midwicket for the slog.",
      });
    } else if (paceDR > spinDR * 1.5 && paceSR < spinSR * 0.8) {
      rules.push({
        type: "weakness",
        title: "Struggles against pace",
        description: `SR of ${paceSR.toFixed(0)} vs pace compared to ${spinSR.toFixed(0)} vs spin. ${paceWk} dismissals.`,
        confidence: paceDR > spinDR * 2 ? 85 : 65,
        howToBowl: "Bowl short-of-length on off stump corridor. Mix in bouncers to test technique.",
        fieldSetup: "Third slip, gully, short leg. Deep fine leg for the top-edge hook.",
      });
    }

    if (paceSR > 140) {
      rules.push({
        type: "strength",
        title: "Dominant against pace",
        description: `Exceptional SR of ${paceSR.toFixed(0)} against pace bowling.`,
        confidence: paceSR > 160 ? 90 : 70,
      });
    }
    if (spinSR > 140) {
      rules.push({
        type: "strength",
        title: "Strong against spin",
        description: `Impressive SR of ${spinSR.toFixed(0)} against spin.`,
        confidence: spinSR > 160 ? 90 : 70,
      });
    }
  }

  const lengths = ["yorker", "full", "good", "short", "bouncer"] as const;
  for (const len of lengths) {
    const balls = deliveries.filter((d) => d.ball_length === len);
    if (balls.length < 5) continue;
    const sr = (balls.reduce((s, d) => s + d.runs_batter, 0) / balls.length) * 100;
    const wickets = balls.filter((d) => d.is_wicket).length;
    const dismissRate = (wickets / balls.length) * 100;

    if (dismissRate > 8) {
      rules.push({
        type: "weakness",
        title: `Weak on ${len} length`,
        description: `${dismissRate.toFixed(1)}% dismissal rate on ${len} length (${wickets}/${balls.length}).`,
        confidence: dismissRate > 12 ? 85 : 60,
        howToBowl: `Target ${len} length consistently. Vary pace slightly to induce false shots.`,
        fieldSetup: len === "short" ? "Fine leg, deep square leg, hook/pull catching positions." : "Standard catching field around the bat.",
      });
    }
    if (sr > 150 && dismissRate < 3) {
      rules.push({
        type: "strength",
        title: `Punishes ${len} balls`,
        description: `SR of ${sr.toFixed(0)} on ${len} length with minimal dismissal risk.`,
        confidence: sr > 180 ? 90 : 70,
      });
    }
  }

  // Phase analysis
  const pp = deliveries.filter((d) => d.over_number <= 6);
  if (pp.length >= 10) {
    const ppSR = (pp.reduce((s, d) => s + d.runs_batter, 0) / pp.length) * 100;
    if (ppSR < 100) {
      rules.push({
        type: "weakness",
        title: "Slow starter in powerplay",
        description: `SR of only ${ppSR.toFixed(0)} in overs 1-6.`,
        confidence: ppSR < 80 ? 80 : 55,
        howToBowl: "Attack early with pace and swing. Build dot ball pressure in first 3 overs.",
        fieldSetup: "Aggressive field in powerplay: 2 slips, gully, point. No protection on boundary.",
      });
    }
  }

  const death = deliveries.filter((d) => d.over_number >= 16);
  if (death.length >= 10) {
    const deathSR = (death.reduce((s, d) => s + d.runs_batter, 0) / death.length) * 100;
    if (deathSR > 160) {
      rules.push({
        type: "strength",
        title: "Lethal at the death",
        description: `Explosive SR of ${deathSR.toFixed(0)} in death overs.`,
        confidence: deathSR > 180 ? 90 : 72,
      });
    }
  }

  const confOrder = (c: number) => -c;
  rules.sort((a, b) => {
    if (a.type !== b.type) return a.type === "weakness" ? -1 : 1;
    return confOrder(a.confidence) - confOrder(b.confidence);
  });
  return rules;
}

function generateBriefing(rules: InsightRule[]): string {
  const weaknesses = rules.filter((r) => r.type === "weakness");
  if (weaknesses.length === 0) return "No significant weaknesses identified. Standard bowling plans recommended.";

  const setup = weaknesses[0]?.howToBowl || "Standard pace and length to build pressure.";
  const pressure = weaknesses.length > 1
    ? `Then exploit: ${weaknesses[1].title.toLowerCase()}. ${weaknesses[1].howToBowl || ""}`
    : "Maintain dot ball pressure and wait for the mistake.";
  const dismissal = weaknesses[0]?.howToBowl || "Variation delivery when batter is under pressure.";

  return `PHASE 1 — SETUP\n${setup}\n\nPHASE 2 — BUILD PRESSURE\n${pressure}\n\nPHASE 3 — DISMISSAL BALL\n${dismissal}\n\nFIELD: ${weaknesses[0]?.fieldSetup || "Standard catching field."}`;
}

export function WeaknessesTab({ deliveries, analytics, format, isLoading }: WeaknessesTabProps) {
  const [copied, setCopied] = useState(false);
  const rules = useMemo(() => analyzePatterns(deliveries, analytics), [deliveries, analytics]);
  const briefing = useMemo(() => generateBriefing(rules), [rules]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  if (rules.length === 0) {
    return <EmptyState message={`Not enough data to generate tactical insights for ${format}.`} />;
  }

  const weaknesses = rules.filter((r) => r.type === "weakness");
  const strengths = rules.filter((r) => r.type === "strength");

  const handleCopy = () => {
    navigator.clipboard.writeText(briefing);
    setCopied(true);
    toast({ title: "Copied!", description: "Tactical briefing copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const getConfColor = (c: number) => {
    if (c >= 80) return "text-foreground";
    if (c >= 60) return "text-warning";
    return "text-muted-foreground";
  };

  const renderCard = (rule: InsightRule, i: number) => {
    const isWeak = rule.type === "weakness";
    return (
      <Card
        key={i}
        className={`border-l-4 ${isWeak ? "border-l-destructive bg-destructive/5" : "border-l-success bg-success/5"}`}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {isWeak ? (
                <TrendingDown className="h-4 w-4 text-destructive shrink-0" />
              ) : (
                <TrendingUp className="h-4 w-4 text-success shrink-0" />
              )}
              <span className="font-semibold text-sm">{rule.title}</span>
            </div>
            <Badge
              variant="outline"
              className={isWeak ? "border-destructive/40 text-destructive" : "border-success/40 text-success"}
            >
              {rule.confidence}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{rule.description}</p>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Confidence</p>
            <Progress value={rule.confidence} className="h-1.5" />
          </div>
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
      {/* Two columns: weaknesses + strengths */}
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

      {/* Tactical Briefing Panel */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Crosshair className="h-5 w-5 text-primary" /> Tactical Briefing
            </CardTitle>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
            {briefing}
          </pre>
        </CardContent>
      </Card>
    </motion.div>
  );
}
