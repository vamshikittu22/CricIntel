/**
 * Cricsheet JSON → Supabase ETL script
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import type {
  CricsheetMatch,
  CricsheetDelivery,
} from "../src/lib/cricsheet";
import { mapMatchTypeToFormat } from "../src/lib/cricsheet";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Helpers ─────────────────────────────────────────

function getBowlerType(name: string): "pace" | "spin" {
  const nameLower = name.toLowerCase();
  
  // High-confidence classification for top-tier international/franchise spinners
  const knownSpinners = [
    "rashid khan", "ashwin", "chahal", "shamsi", "maharaj", "zampa", "kuldeep", "jadeja", 
    "narine", "shakib", "mujeeb", "santner", "ish sodhi", "hasaranga", "theekshana", 
    "bishnoi", "axar patel", "murugan ashwin", "varun chakravarthy", "adil rashid",
    "moeen ali", "livingstone", "shadab khan", "mohammad nawaz", "rehan ahmed",
    "todd murphy", "nathan lyon", "jack leach", "tom hartley", "will jacks",
    "mahedi hasan", "mehidy hasan", "taijul islam", "dunith wellalage",
    "allan donald" // Wait, Allan Donald is pace, just testing my own logic. Nathan Lyon is definitely spin.
  ];
  if (knownSpinners.some(s => nameLower.includes(s))) return "spin";

  // Keyword matching for broader coverage of domestic and newer players
  const spinKeywords = [
    "spin", "slow", "offbreak", "legbreak", "off-break", "leg-break", "break", 
    "orthodox", "unorthodox", "arm-ball", "tweaker", "googly", "carrom", "doosra"
  ];
  if (spinKeywords.some(k => nameLower.includes(k))) return "spin";
  
  // Default to pace (seam, swing, fast, medium-fast, etc.)
  return "pace";
}

function getPhase(format: string, over: number): "powerplay" | "middle" | "death" {
  if (format === "T20I" || format === "IPL" || format === "T20") {
    if (over < 6) return "powerplay";
    if (over < 15) return "middle";
    return "death";
  } else {
    if (over < 10) return "powerplay";
    if (over < 40) return "middle";
    return "death";
  }
}

function readJsonFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...readJsonFiles(full));
    } else if (entry.name.endsWith(".json")) {
      results.push(full);
    }
  }
  return results;
}

async function upsertBatch(table: string, rows: any[], chunkSize = 100) {
  if (rows.length === 0) return;
  const onConflict = 
    table === "players" ? "id" : 
    table === "player_stats_summary" ? "player_id,format" :
    table === "player_phase_stats" ? "player_id,format,phase" :
    table === "player_vs_bowling_type" ? "player_id,format,bowler_type" :
    undefined;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });
    if (error) console.error(`  Error upserting ${table} chunk ${i}:`, error.message);
  }
}

interface BatAgg { runs: number; balls: number; fours: number; sixes: number; dismissalKind: string | null; notOut: boolean; }
interface BowlAgg { ballsBowled: number; runsConceded: number; wickets: number; overSet: Set<number>; maidenOvers: Map<number, number>; }
interface PhaseAgg { bat_runs: number; bat_balls: number; bat_fours: number; bat_sixes: number; bat_dismissals: number; bowl_balls: number; bowl_runs: number; bowl_wickets: number; catches: number; run_outs: number; }
interface VsTypeAgg { bat_runs: number; bat_balls: number; bat_dismissals: number; }
interface FielderAgg { catches: number; stumpings: number; run_outs: number; }

function processMatch(match: CricsheetMatch, matchId: string) {
  const info = match.info;
  const format = mapMatchTypeToFormat(info.match_type, info.event?.name);
  const registry = info.registry.people;
  const nameToId: Record<string, string> = {};
  for (const [name, id] of Object.entries(registry)) nameToId[name] = id;

  const playerRows: any[] = [];
  const playerTeam = new Map<string, string>();
  
  // Ensure all players in registry are included to avoid FK issues
  for (const [name, pid] of Object.entries(nameToId)) {
    playerRows.push({ 
      id: pid, 
      name, 
      gender: info.gender || "male" 
    });
  }

  for (const [team, names] of Object.entries(info.players)) {
    for (const name of names) {
      const pid = nameToId[name];
      if (pid) {
        playerTeam.set(pid, team);
      }
    }
  }

  const batting = new Map<string, BatAgg>(); 
  const bowling = new Map<string, BowlAgg>();
  const phaseStats = new Map<string, PhaseAgg>(); 
  const vsTypeStats = new Map<string, VsTypeAgg>();
  const fielding = new Map<string, FielderAgg>();

  const deliveryRows: any[] = [];

  match.innings.forEach((innings, inningIdx) => {
    const inningNum = inningIdx + 1;
    const battingTeam = innings.team;
    const bowlingTeam = info.teams.find(t => t !== battingTeam) || "";

    innings.overs.forEach(over => {
      const overNum = over.over + 1;
      // Infer phase: over 1-6 = powerplay, 7-15 = middle, 16+ = death
      let phase = "middle";
      if (overNum <= 6) phase = "powerplay";
      else if (overNum >= 16) phase = "death";

      over.deliveries.forEach((del, deliveryIdx) => {
        const batterId = nameToId[del.batter];
        const bowlerId = nameToId[del.bowler];
        if (!batterId || !bowlerId) return;

        const isWide = !!del.extras?.wides;
        const isNoBall = !!del.extras?.noballs;
        const bowlerType = getBowlerType(del.bowler);

        const batKey = `${batterId}_${inningNum}`;
        const bowlKey = `${bowlerId}_${inningNum}`;
        const phaseKey = `${batterId}_${format}_${phase}`;
        const bowlPhaseKey = `${bowlerId}_${format}_${phase}`;
        const vsTypeKey = `${batterId}_${format}_${bowlerType}`;

        if (!batting.has(batKey)) batting.set(batKey, { runs: 0, balls: 0, fours: 0, sixes: 0, dismissalKind: null, notOut: true });
        if (!bowling.has(bowlKey)) bowling.set(bowlKey, { ballsBowled: 0, runsConceded: 0, wickets: 0, overSet: new Set(), maidenOvers: new Map() });
        if (!phaseStats.has(phaseKey)) phaseStats.set(phaseKey, { bat_runs: 0, bat_balls: 0, bat_fours: 0, bat_sixes: 0, bat_dismissals: 0, bowl_balls: 0, bowl_runs: 0, bowl_wickets: 0, catches: 0, run_outs: 0 });
        if (!phaseStats.has(bowlPhaseKey)) phaseStats.set(bowlPhaseKey, { bat_runs: 0, bat_balls: 0, bat_fours: 0, bat_sixes: 0, bat_dismissals: 0, bowl_balls: 0, bowl_runs: 0, bowl_wickets: 0, catches: 0, run_outs: 0 });
        if (!vsTypeStats.has(vsTypeKey)) vsTypeStats.set(vsTypeKey, { bat_runs: 0, bat_balls: 0, bat_dismissals: 0 });

        const bat = batting.get(batKey)!;
        const bowl = bowling.get(bowlKey)!;
        const pStat = phaseStats.get(phaseKey)!;
        const bpStat = phaseStats.get(bowlPhaseKey)!;
        const vStat = vsTypeStats.get(vsTypeKey)!;

        bat.runs += del.runs.batter;
        if (!isWide) {
          bat.balls++;
          pStat.bat_runs += del.runs.batter; pStat.bat_balls++;
          vStat.bat_runs += del.runs.batter; vStat.bat_balls++;
          if (del.runs.batter === 4) { bat.fours++; pStat.bat_fours++; }
          if (del.runs.batter === 6) { bat.sixes++; pStat.bat_sixes++; }
        }

        bowl.runsConceded += del.runs.total;
        bpStat.bowl_runs += del.runs.total;
        if (!isWide && !isNoBall) { bowl.ballsBowled++; bpStat.bowl_balls++; }

        const wicket = del.wickets?.[0];
        if (wicket) {
          const outId = nameToId[wicket.player_out];
          if (outId) {
            const outKey = `${outId}_${inningNum}`;
            if (batting.has(outKey)) {
              batting.get(outKey)!.dismissalKind = wicket.kind;
              batting.get(outKey)!.notOut = false;
              const outPhaseKey = `${outId}_${format}_${phase}`;
              if (phaseStats.has(outPhaseKey)) phaseStats.get(outPhaseKey)!.bat_dismissals++;
              vStat.bat_dismissals++;
            }
          }
          if (wicket.kind !== "run out" && wicket.kind !== "retired" && wicket.kind !== "absent hurt") {
            bowl.wickets++; bpStat.bowl_wickets++;
          }
          // Fielding stats
          if (wicket.fielders) {
            const fielders = typeof wicket.fielders === "string" ? [{ name: wicket.fielders }] : wicket.fielders;
            fielders.forEach(f => {
              const fId = nameToId[f.name];
              if (fId) {
                if (!fielding.has(fId)) fielding.set(fId, { catches: 0, stumpings: 0, run_outs: 0 });
                const fst = fielding.get(fId)!;
                if (wicket.kind === "caught") fst.catches++;
                if (wicket.kind === "stumped") fst.stumpings++;
                if (wicket.kind === "run out") fst.run_outs++;
                
                const fPhaseKey = `${fId}_${format}_${phase}`;
                if (!phaseStats.has(fPhaseKey)) phaseStats.set(fPhaseKey, { bat_runs: 0, bat_balls: 0, bat_fours: 0, bat_sixes: 0, bat_dismissals: 0, bowl_balls: 0, bowl_runs: 0, bowl_wickets: 0, catches: 0, run_outs: 0 });
                if (wicket.kind === "caught") phaseStats.get(fPhaseKey)!.catches++;
                if (wicket.kind === "run out") phaseStats.get(fPhaseKey)!.run_outs++;
              }
            });
          }
        }

        // Add to deliveryRows
        deliveryRows.push({
          match_id: matchId,
          innings: inningNum,
          over_number: overNum,
          ball_number: deliveryIdx + 1,
          striker: del.batter,
          non_striker: del.non_striker,
          bowler: del.bowler,
          batting_team: battingTeam,
          bowling_team: bowlingTeam,
          runs_off_bat: del.runs.batter,
          extras: del.runs.extras,
          is_wicket: !!wicket,
          player_dismissed: wicket?.player_out || null,
          dismissal_kind: wicket?.kind || null,
          fielder: wicket?.fielders ? (typeof wicket.fielders === 'string' ? wicket.fielders : wicket.fielders[0]?.name) : null,
          phase,
          wagon_x: null, // Estimate from fielder is null as no coordinates in JSON
          wagon_y: null
        });
      });
    });
  });

  const statsRows = Array.from(new Set([...batting.keys(), ...bowling.keys()])).map(key => {
    const [pid, inn] = key.split("_");
    const bat = batting.get(key);
    const bowl = bowling.get(key);
    return {
      match_id: matchId, player_id: pid, inning: parseInt(inn),
      team: playerTeam.get(pid) || "",
      is_batter: !!bat && bat.balls > 0, is_bowler: !!bowl && bowl.ballsBowled > 0,
      bat_runs: bat?.runs ?? 0, bat_balls: bat?.balls ?? 0,
      bat_fours: bat?.fours ?? 0, bat_sixes: bat?.sixes ?? 0,
      bat_dismissal_kind: bat?.dismissalKind ?? null, bat_not_out: bat?.notOut ?? true,
      bowl_overs: bowl ? +(bowl.ballsBowled / 6).toFixed(1) : 0,
      bowl_runs: bowl?.runsConceded ?? 0, bowl_wickets: bowl?.wickets ?? 0,
      bowl_econ: bowl ? +(bowl.runsConceded / (bowl.ballsBowled / 6)).toFixed(2) : 0,
    };
  });

  return { 
    matchRow: { 
      id: matchId, 
      format, 
      match_date: info.dates[0], 
      venue: info.venue, 
      team1: info.teams[0], 
      team2: info.teams[1], 
      result: info.outcome?.result ?? null, 
      gender: info.gender || "male" 
    }, 
    playerRows, 
    statsRows, 
    deliveryRows,
    phaseStats, 
    vsTypeStats, 
    fielding, 
    format 
  };
}

async function main() {
  const dir = process.argv[2] || "./data";
  const files = readJsonFiles(dir);
  if (files.length === 0) return;

  const allStats: any[] = [];
  const globalPhase = new Map<string, PhaseAgg>();
  const globalVsType = new Map<string, VsTypeAgg>();
  const globalFielding = new Map<string, FielderAgg>(); // pid_format
  const playerMeta = new Map<string, any>();

  const allDeliveries: any[] = [];

  let count = 0;
  let totalDeliveriesProcessed = 0;

  for (const file of files) {
    try {
      count++;
      if (count % 50 === 0) console.log(`Processing file ${count}/${files.length}...`);
      const match: CricsheetMatch = JSON.parse(fs.readFileSync(file, "utf-8"));
      const { matchRow, playerRows, statsRows, deliveryRows, phaseStats, vsTypeStats, fielding, format } = processMatch(match, path.basename(file, ".json"));

      await upsertBatch("players", playerRows);
      await supabase.from("matches").upsert([matchRow]);
      await upsertBatch("match_player_stats", statsRows);
      
      // Batch deliveries upsert (1000 rows)
      allDeliveries.push(...deliveryRows);
      if (allDeliveries.length >= 1000) {
        await upsertBatch("deliveries", allDeliveries.splice(0, 1000), 1000);
        totalDeliveriesProcessed += 1000;
        if (totalDeliveriesProcessed % 10000 === 0) {
          console.log(`  Progress: ${totalDeliveriesProcessed} deliveries imported...`);
        }
      }

      statsRows.forEach(s => allStats.push({ ...s, format }));
      
      // Global merging
      phaseStats.forEach((v, k) => {
        if (!globalPhase.has(k)) globalPhase.set(k, { bat_runs: 0, bat_balls: 0, bat_fours: 0, bat_sixes: 0, bat_dismissals: 0, bowl_balls: 0, bowl_runs: 0, bowl_wickets: 0, catches: 0, run_outs: 0 });
        const g = globalPhase.get(k)!;
        Object.keys(v).forEach(key => (g as any)[key] += (v as any)[key]);
      });

      vsTypeStats.forEach((v, k) => {
        if (!globalVsType.has(k)) globalVsType.set(k, { bat_runs: 0, bat_balls: 0, bat_dismissals: 0 });
        const g = globalVsType.get(k)!;
        g.bat_runs += v.bat_runs;
        g.bat_balls += v.bat_balls;
        g.bat_dismissals += v.bat_dismissals;
      });

      fielding.forEach((v, pid) => {
        const key = `${pid}_${format}`;
        if (!globalFielding.has(key)) globalFielding.set(key, { catches: 0, stumpings: 0, run_outs: 0 });
        const g = globalFielding.get(key)!;
        g.catches += v.catches; g.stumpings += v.stumpings; g.run_outs += v.run_outs;
      });

    } catch (e: any) { console.error(`Error ${file}:`, e.message); }
  }

  // Final delivery batch
  if (allDeliveries.length > 0) {
    await upsertBatch("deliveries", allDeliveries, 1000);
    totalDeliveriesProcessed += allDeliveries.length;
    console.log(`  Final Progress: ${totalDeliveriesProcessed} deliveries imported total.`);
  }

  // Career Summaries with Fielding
  const career = new Map<string, any>();
  allStats.forEach(s => {
    const key = `${s.player_id}_${s.format}`;
    if (!career.has(key)) career.set(key, { matches: new Set(), runs: 0, balls: 0, not_outs: 0, hundreds: 0, fifties: 0, best_score: 0, bowl_runs: 0, bowl_wickets: 0, bowl_overs: 0, five_wickets: 0, innings_bat: 0, innings_bowl: 0 });
    const c = career.get(key)!;
    c.matches.add(s.match_id);
    if (s.is_batter) {
      c.innings_bat++; c.runs += s.bat_runs; c.balls += s.bat_balls;
      if (s.bat_not_out) c.not_outs++;
      if (s.bat_runs >= 100) c.hundreds++; else if (s.bat_runs >= 50) c.fifties++;
      c.best_score = Math.max(c.best_score, s.bat_runs);
    }
    if (s.is_bowler) {
      c.innings_bowl++; c.bowl_wickets += s.bowl_wickets; c.bowl_runs += s.bowl_runs; c.bowl_overs += s.bowl_overs;
      if (s.bowl_wickets >= 5) c.five_wickets++;
    }
  });

  const summaryRows = Array.from(career.entries()).map(([key, c]) => {
    const [pid, format] = key.split("_");
    const fld = globalFielding.get(key) || { catches: 0, stumpings: 0, run_outs: 0 };
    return {
      player_id: pid, format, matches: c.matches.size, innings_bat: c.innings_bat, runs: c.runs, balls: c.balls, not_outs: c.not_outs,
      hundreds: c.hundreds, fifties: c.fifties, best_score: c.best_score,
      innings_bowl: c.innings_bowl, bowl_runs: c.bowl_runs, wickets: c.bowl_wickets, overs: +c.bowl_overs.toFixed(1), bowl_five_wickets: c.five_wickets,
      average: c.innings_bat > c.not_outs ? +(c.runs / (c.innings_bat - c.not_outs)).toFixed(2) : null,
      strike_rate: c.balls > 0 ? +(c.runs * 100 / c.balls).toFixed(2) : null,
      econ: c.bowl_overs > 0 ? +(c.bowl_runs / c.bowl_overs).toFixed(2) : null,
      ...fld
    };
  });
  await upsertBatch("player_stats_summary", summaryRows);

  const pRows = Array.from(globalPhase.entries()).map(([key, val]) => {
    const [pid, format, phase] = key.split("_");
    return { player_id: pid, format, phase, ...val };
  });
  await upsertBatch("player_phase_stats", pRows);

  const vsRows = Array.from(globalVsType.entries()).map(([key, val]) => {
    const [pid, format, bType] = key.split("_");
    return { player_id: pid, format, bowler_type: bType, ...val };
  });
  await upsertBatch("player_vs_bowling_type", vsRows);

  console.log("ETL Complete.");
}

main().catch(console.error);
