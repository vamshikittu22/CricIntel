import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Target, TrendingDown, TrendingUp } from "lucide-react";

interface WeaknessEngineProps {
  deliveries: any[];
  analytics: any;
  format: string;
}

interface TacticalRule {
  type: "weakness" | "strength";
  title: string;
  description: string;
  confidence: "high" | "medium" | "low";
  stat: string;
}

function analyzePatterns(deliveries: any[], analytics: any): TacticalRule[] {
  const rules: TacticalRule[] = [];
  if (!deliveries?.length) return rules;

  // Pace vs Spin analysis
  const pace = deliveries.filter((d) => d.bowler_type === "pace");
  const spin = deliveries.filter((d) => d.bowler_type === "spin");

  if (pace.length >= 10 && spin.length >= 10) {
    const paceSR = (pace.reduce((s, d) => s + d.runs_batter, 0) / pace.length) * 100;
    const spinSR = (spin.reduce((s, d) => s + d.runs_batter, 0) / spin.length) * 100;
    const paceWickets = pace.filter((d) => d.is_wicket).length;
    const spinWickets = spin.filter((d) => d.is_wicket).length;
    const paceDismRate = paceWickets / pace.length;
    const spinDismRate = spinWickets / spin.length;

    if (spinDismRate > paceDismRate * 1.5 && spinSR < paceSR * 0.8) {
      rules.push({
        type: "weakness",
        title: "Vulnerable to spin",
        description: `Gets dismissed more frequently against spin with a lower strike rate (${spinSR.toFixed(0)} vs ${paceSR.toFixed(0)} against pace).`,
        confidence: spinDismRate > paceDismRate * 2 ? "high" : "medium",
        stat: `SR ${spinSR.toFixed(0)} vs spin`,
      });
    } else if (paceDismRate > spinDismRate * 1.5 && paceSR < spinSR * 0.8) {
      rules.push({
        type: "weakness",
        title: "Struggles against pace",
        description: `Higher dismissal rate against pace with SR of ${paceSR.toFixed(0)} compared to ${spinSR.toFixed(0)} against spin.`,
        confidence: paceDismRate > spinDismRate * 2 ? "high" : "medium",
        stat: `SR ${paceSR.toFixed(0)} vs pace`,
      });
    }

    if (paceSR > 140) {
      rules.push({
        type: "strength",
        title: "Dominant against pace",
        description: `Exceptional strike rate of ${paceSR.toFixed(0)} against pace bowling.`,
        confidence: paceSR > 160 ? "high" : "medium",
        stat: `SR ${paceSR.toFixed(0)}`,
      });
    }
    if (spinSR > 140) {
      rules.push({
        type: "strength",
        title: "Strong against spin",
        description: `Impressive strike rate of ${spinSR.toFixed(0)} against spin bowling.`,
        confidence: spinSR > 160 ? "high" : "medium",
        stat: `SR ${spinSR.toFixed(0)}`,
      });
    }
  }

  // Ball length analysis
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
        description: `Dismissed ${dismissRate.toFixed(1)}% of deliveries on ${len} length (${wickets} dismissals in ${balls.length} balls).`,
        confidence: dismissRate > 12 ? "high" : "medium",
        stat: `${dismissRate.toFixed(1)}% dismiss rate`,
      });
    }
    if (sr > 150 && dismissRate < 3) {
      rules.push({
        type: "strength",
        title: `Punishes ${len} balls`,
        description: `Strike rate of ${sr.toFixed(0)} on ${len} length with very low dismissal risk.`,
        confidence: sr > 180 ? "high" : "medium",
        stat: `SR ${sr.toFixed(0)}`,
      });
    }
  }

  // Phase analysis (T20 specific)
  const powerplay = deliveries.filter((d) => d.over_number <= 6);
  const death = deliveries.filter((d) => d.over_number >= 16);

  if (powerplay.length >= 10) {
    const ppSR = (powerplay.reduce((s, d) => s + d.runs_batter, 0) / powerplay.length) * 100;
    if (ppSR < 100) {
      rules.push({
        type: "weakness",
        title: "Slow starter in powerplay",
        description: `Strike rate of only ${ppSR.toFixed(0)} in overs 1-6, suggesting difficulty accelerating early.`,
        confidence: ppSR < 80 ? "high" : "medium",
        stat: `PP SR ${ppSR.toFixed(0)}`,
      });
    }
  }

  if (death.length >= 10) {
    const deathSR = (death.reduce((s, d) => s + d.runs_batter, 0) / death.length) * 100;
    const deathWickets = death.filter((d) => d.is_wicket).length;
    if (deathSR > 160) {
      rules.push({
        type: "strength",
        title: "Lethal at the death",
        description: `Explosive SR of ${deathSR.toFixed(0)} in death overs (16-20).`,
        confidence: deathSR > 180 ? "high" : "medium",
        stat: `Death SR ${deathSR.toFixed(0)}`,
      });
    }
    if (deathWickets / death.length > 0.1) {
      rules.push({
        type: "weakness",
        title: "Gets out at the death",
        description: `High dismissal rate of ${((deathWickets / death.length) * 100).toFixed(1)}% in death overs.`,
        confidence: "medium",
        stat: `${deathWickets} wickets in death`,
      });
    }
  }

  // Sort: high confidence first, weaknesses first
  const confOrder = { high: 0, medium: 1, low: 2 };
  rules.sort((a, b) => {
    if (a.type !== b.type) return a.type === "weakness" ? -1 : 1;
    return confOrder[a.confidence] - confOrder[b.confidence];
  });

  return rules;
}

export function WeaknessEngine({ deliveries, analytics, format }: WeaknessEngineProps) {
  const rules = analyzePatterns(deliveries, analytics);

  if (rules.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Target className="mx-auto h-10 w-10 mb-3 opacity-40" />
          <p>Not enough data to generate tactical insights for {format}.</p>
        </CardContent>
      </Card>
    );
  }

  const weaknesses = rules.filter((r) => r.type === "weakness");
  const strengths = rules.filter((r) => r.type === "strength");

  return (
    <div className="space-y-6">
      {/* Weaknesses */}
      {weaknesses.length > 0 && (
        <div>
          <h4 className="font-heading text-base font-semibold flex items-center gap-2 mb-3 text-destructive">
            <AlertTriangle className="h-4 w-4" /> Weaknesses & Vulnerabilities
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {weaknesses.map((rule, i) => (
              <Card key={i} className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingDown className="h-4 w-4 shrink-0 text-destructive" />
                        <span className="font-heading text-sm font-semibold">{rule.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{rule.description}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge
                        variant="outline"
                        className={
                          rule.confidence === "high"
                            ? "border-destructive/40 text-destructive"
                            : "border-warning/40 text-warning"
                        }
                      >
                        {rule.confidence}
                      </Badge>
                      <p className="text-xs font-mono mt-1 text-muted-foreground">{rule.stat}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <div>
          <h4 className="font-heading text-base font-semibold flex items-center gap-2 mb-3 text-success">
            <Shield className="h-4 w-4" /> Strengths
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {strengths.map((rule, i) => (
              <Card key={i} className="border-success/20 bg-success/5">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="h-4 w-4 shrink-0 text-success" />
                        <span className="font-heading text-sm font-semibold">{rule.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{rule.description}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <Badge variant="outline" className="border-success/40 text-success">
                        {rule.confidence}
                      </Badge>
                      <p className="text-xs font-mono mt-1 text-muted-foreground">{rule.stat}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
