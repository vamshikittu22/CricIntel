/**
 * Cricsheet JSON → Supabase ETL script
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/import-cricsheet.ts [dataDir]
 *
 * Default dataDir: ./data
 * Expects subfolders like data/odi, data/t20i, data/test, data/ipl with .json files.
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import type {
  CricsheetMatch,
  CricsheetDelivery,
  CricsheetOver,
} from "../src/lib/cricsheet";
import { mapMatchTypeToFormat } from "../src/lib/cricsheet";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Helpers ─────────────────────────────────────────

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
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: table === "players" ? "id" : undefined });
    if (error) {
      console.error(`  Error upserting ${table} chunk ${i}:`, error.message);
    }
  }
}

// ── Per-match aggregation ───────────────────────────

interface BatAgg {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  dismissalKind: string | null;
  notOut: boolean;
}

interface BowlAgg {
  ballsBowled: number;
  runsConceded: number;
  wickets: number;
  overSet: Set<number>;
  maidenOvers: Map<number, number>; // over -> runs in that over
}

function processMatch(match: CricsheetMatch, matchId: string) {
  const info = match.info;
  const format = mapMatchTypeToFormat(info.match_type, info.event?.name);
  const registry = info.registry.people;

  // Build name → id map
  const nameToId: Record<string, string> = {};
  for (const [name, id] of Object.entries(registry)) {
    nameToId[name] = id;
  }

  // Build player rows
  const playerRows: { id: string; name: string; country: string; gender: string }[] = [];
  for (const [team, names] of Object.entries(info.players)) {
    for (const name of names) {
      const pid = nameToId[name];
      if (pid) {
        playerRows.push({ id: pid, name, country: team, gender: info.gender || "male" });
      }
    }
  }

  // Match row
  const outcome = info.outcome || {};
  const matchRow = {
    id: matchId,
    format,
    match_type_number: info.match_type_number ?? null,
    season: info.season != null ? String(info.season) : null,
    match_date: info.dates[0],
    city: info.city ?? null,
    venue: info.venue ?? "",
    event_name: info.event?.name ?? null,
    match_number: info.event?.match_number ?? null,
    team_type: info.team_type ?? null,
    team1: info.teams[0],
    team2: info.teams[1],
    toss_winner: info.toss?.winner ?? null,
    toss_decision: info.toss?.decision ?? null,
    result: outcome.result ?? (outcome.winner ? `${outcome.winner} won` : null),
    winner: outcome.winner ?? null,
    winner_margin_runs: outcome.by?.runs ?? null,
    winner_margin_wickets: outcome.by?.wickets ?? null,
    balls_per_over: info.balls_per_over,
    overs: info.overs,
    gender: info.gender || "male",
  };

  // Aggregate deliveries
  const batting = new Map<string, BatAgg>();
  const bowling = new Map<string, BowlAgg>();
  const playerTeam = new Map<string, string>();

  for (const [team, names] of Object.entries(info.players)) {
    for (const name of names) {
      const pid = nameToId[name];
      if (pid) playerTeam.set(pid, team);
    }
  }

  for (const innings of match.innings) {
    for (const over of innings.overs) {
      for (const del of over.deliveries) {
        const batterId = nameToId[del.batter];
        const bowlerId = nameToId[del.bowler];
        if (!batterId || !bowlerId) continue;

        const isWide = !!del.extras?.wides;
        const isNoBall = !!del.extras?.noballs;

        // Batting
        if (!batting.has(batterId)) {
          batting.set(batterId, { runs: 0, balls: 0, fours: 0, sixes: 0, dismissalKind: null, notOut: true });
        }
        const bat = batting.get(batterId)!;
        bat.runs += del.runs.batter;
        if (!isWide) bat.balls++; // wides don't count as balls faced
        if (del.runs.batter === 4) bat.fours++;
        if (del.runs.batter === 6) bat.sixes++;

        // Bowling
        if (!bowling.has(bowlerId)) {
          bowling.set(bowlerId, { ballsBowled: 0, runsConceded: 0, wickets: 0, overSet: new Set(), maidenOvers: new Map() });
        }
        const bowl = bowling.get(bowlerId)!;
        bowl.runsConceded += del.runs.total;
        if (!isWide && !isNoBall) {
          bowl.ballsBowled++;
          bowl.overSet.add(over.over);
        }
        // Track runs per over for maidens
        const overRuns = bowl.maidenOvers.get(over.over) ?? 0;
        bowl.maidenOvers.set(over.over, overRuns + del.runs.total);

        // Wickets
        if (del.wickets) {
          for (const w of del.wickets) {
            const outId = nameToId[w.player_out];
            if (outId && batting.has(outId)) {
              batting.get(outId)!.dismissalKind = w.kind;
              batting.get(outId)!.notOut = false;
            }
            // Credit bowler for non-run-out wickets
            if (w.kind !== "run out" && w.kind !== "retired hurt" && w.kind !== "retired not out" && w.kind !== "obstructing the field") {
              bowl.wickets++;
            }
          }
        }
      }
    }
  }

  // Build match_player_stats rows
  const statsRows: any[] = [];
  const allPlayerIds = new Set([...batting.keys(), ...bowling.keys()]);

  for (const pid of allPlayerIds) {
    const bat = batting.get(pid);
    const bowl = bowling.get(pid);
    const bowlOvers = bowl ? bowl.ballsBowled / 6 : 0;
    const bowlMaidens = bowl ? [...bowl.maidenOvers.values()].filter(r => r === 0).length : 0;
    const bowlEcon = bowl && bowlOvers > 0 ? +(bowl.runsConceded / bowlOvers).toFixed(2) : 0;

    statsRows.push({
      match_id: matchId,
      player_id: pid,
      team: playerTeam.get(pid) || "",
      is_batter: !!bat && bat.balls > 0,
      is_bowler: !!bowl && bowl.ballsBowled > 0,
      bat_runs: bat?.runs ?? 0,
      bat_balls: bat?.balls ?? 0,
      bat_fours: bat?.fours ?? 0,
      bat_sixes: bat?.sixes ?? 0,
      bat_dismissal_kind: bat?.dismissalKind ?? null,
      bat_not_out: bat?.notOut ?? true,
      bowl_overs: +bowlOvers.toFixed(1),
      bowl_maidens: bowlMaidens,
      bowl_runs: bowl?.runsConceded ?? 0,
      bowl_wickets: bowl?.wickets ?? 0,
      bowl_econ: bowlEcon,
    });
  }

  return { matchRow, playerRows, statsRows, format };
}

// ── Career summary aggregation ──────────────────────

interface CareerAcc {
  matches: Set<string>;
  inningsBat: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  notOuts: number;
  inningsBowl: number;
  bowlOvers: number;
  bowlRuns: number;
  wickets: number;
}

function computeSummaries(allStats: any[]): any[] {
  const career = new Map<string, CareerAcc>(); // key: playerId_format

  for (const s of allStats) {
    const key = `${s.player_id}_${s.format}`;
    if (!career.has(key)) {
      career.set(key, {
        matches: new Set(),
        inningsBat: 0, runs: 0, balls: 0, fours: 0, sixes: 0, notOuts: 0,
        inningsBowl: 0, bowlOvers: 0, bowlRuns: 0, wickets: 0,
      });
    }
    const c = career.get(key)!;
    c.matches.add(s.match_id);
    if (s.is_batter) {
      c.inningsBat++;
      c.runs += s.bat_runs;
      c.balls += s.bat_balls;
      c.fours += s.bat_fours;
      c.sixes += s.bat_sixes;
      if (s.bat_not_out) c.notOuts++;
    }
    if (s.is_bowler) {
      c.inningsBowl++;
      c.bowlOvers += s.bowl_overs;
      c.bowlRuns += s.bowl_runs;
      c.wickets += s.bowl_wickets;
    }
  }

  const rows: any[] = [];
  for (const [key, c] of career) {
    const [playerId, format] = key.split("_");
    const dismissals = c.inningsBat - c.notOuts;
    const avg = dismissals > 0 ? +(c.runs / dismissals).toFixed(2) : null;
    const sr = c.balls > 0 ? +(c.runs / c.balls * 100).toFixed(2) : null;
    const econ = c.bowlOvers > 0 ? +(c.bowlRuns / c.bowlOvers).toFixed(2) : null;
    const bowlAvg = c.wickets > 0 ? +(c.bowlRuns / c.wickets).toFixed(2) : null;
    const bowlSR = c.wickets > 0 ? +((c.bowlOvers * 6) / c.wickets).toFixed(2) : null;

    rows.push({
      player_id: playerId,
      format,
      matches: c.matches.size,
      innings_bat: c.inningsBat,
      runs: c.runs,
      balls: c.balls,
      fours: c.fours,
      sixes: c.sixes,
      not_outs: c.notOuts,
      average: avg,
      strike_rate: sr,
      innings_bowl: c.inningsBowl,
      overs: +c.bowlOvers.toFixed(1),
      bowl_runs: c.bowlRuns,
      wickets: c.wickets,
      econ,
      bowl_average: bowlAvg,
      bowl_strike_rate: bowlSR,
    });
  }
  return rows;
}

// ── Main ────────────────────────────────────────────

async function main() {
  const dataDir = process.argv[2] || "./data";
  console.log(`Scanning for JSON files in: ${dataDir}`);

  const files = readJsonFiles(dataDir);
  console.log(`Found ${files.length} files`);

  if (files.length === 0) {
    console.log("No JSON files found. Exiting.");
    return;
  }

  const allStatsWithFormat: any[] = [];
  let processed = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const raw = fs.readFileSync(file, "utf-8");
      const match: CricsheetMatch = JSON.parse(raw);
      const matchId = path.basename(file, ".json");

      const { matchRow, playerRows, statsRows, format } = processMatch(match, matchId);

      // Upsert players
      await upsertBatch("players", playerRows);

      // Upsert match
      const { error: mErr } = await supabase.from("matches").upsert([matchRow]);
      if (mErr) console.error(`  Match upsert error (${matchId}):`, mErr.message);

      // Upsert match_player_stats
      await upsertBatch("match_player_stats", statsRows);

      // Collect for career summary
      for (const s of statsRows) {
        allStatsWithFormat.push({ ...s, format });
      }

      processed++;
      if (processed % 50 === 0) console.log(`  Processed ${processed}/${files.length} files...`);
    } catch (err: any) {
      errors++;
      console.error(`  Error processing ${file}:`, err.message);
    }
  }

  console.log(`\nProcessed ${processed} matches (${errors} errors)`);

  // Compute and upsert career summaries
  console.log("Computing career summaries...");
  const summaries = computeSummaries(allStatsWithFormat);
  console.log(`Upserting ${summaries.length} summary rows...`);
  await upsertBatch("player_stats_summary", summaries);

  console.log("Done!");
}

main().catch(console.error);
