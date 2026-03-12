export type CricsheetPersonRegistry = Record<string, string>;

export interface CricsheetMatchInfo {
  balls_per_over: number;
  city?: string;
  dates: string[];
  event?: {
    name?: string;
    match_number?: number;
  };
  gender: string;
  match_type: string;
  match_type_number?: number;
  officials?: any;
  outcome?: {
    result?: string;
    winner?: string;
    by?: {
      runs?: number;
      wickets?: number;
    };
  };
  overs: number;
  players: Record<string, string[]>;
  registry: {
    people: CricsheetPersonRegistry;
  };
  season?: string | number;
  team_type?: string;
  teams: string[];
  toss?: {
    decision: string;
    winner: string;
  };
  venue?: string;
}

export interface CricsheetDelivery {
  batter: string;
  bowler: string;
  non_striker: string;
  runs: {
    batter: number;
    extras: number;
    total: number;
  };
  extras?: {
    wides?: number;
    noballs?: number;
    legbyes?: number;
    byes?: number;
    penalty?: number;
  };
  wickets?: Array<{
    player_out: string;
    kind: string;
    fielders?: Array<{ name: string }> | string[];
  }>;
}

export interface CricsheetOver {
  over: number;
  deliveries: CricsheetDelivery[];
}

export interface CricsheetInnings {
  team: string;
  overs: CricsheetOver[];
  powerplays?: Array<{
    from: number;
    to: number;
    type: string;
  }>;
}

export interface CricsheetMatch {
  meta: {
    data_version: string;
    created: string;
    revision: number;
  };
  info: CricsheetMatchInfo;
  innings: CricsheetInnings[];
}

export function mapMatchTypeToFormat(matchType: string, eventName?: string): string {
  const lower = matchType.toLowerCase();
  const lowerEvent = (eventName || "").toLowerCase();
  
  if (lowerEvent.includes("indian premier league")) return "IPL";
  if (lowerEvent.includes("ipl")) return "IPL";
  if (lower.includes("test")) return "Test";
  if (lower.includes("odi")) return "ODI";
  
  if (lower.includes("t20")) {
    // If it's a T20 and not explicitly 'International', we check for domestic markers
    // or known leagues. For now, common pattern: 'T20' is domestic, 'T20I' is international.
    if (lower.includes("t20i") || lower.includes("international")) return "T20I";
    return "T20";
  }
  
  return matchType;
}
