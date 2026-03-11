# Supabase Schema Mapping & Integration Analysis

**Analysis Date:** 2026-03-10

---

## 1. New Supabase Schema Overview

### Tables Defined in `src/integrations/supabase/types.ts`:

| Table | PK | Key Columns |
|-------|-----|-------------|
| `players` | `id` (text) | name, country, gender, created_at |
| `matches` | `id` (text) | format, match_date, venue, team1, team2, result, winner, etc. |
| `match_player_stats` | composite | match_id, player_id, team, bat_*, bowl_* |
| `player_stats_summary` | composite | player_id, format, batting/bowling aggregates |
| `player_phase_stats` | composite | player_id, format, phase, per-phase stats |
| `player_vs_bowling_type` | composite | player_id, format, bowling_type, stats |

### Views:
- `player_recent_matches_view` - pre-joined view for player match history

---

## 2. Frontend Supabase Usage

### Hooks in `src/lib/hooks/usePlayers.ts`:

| Hook | Queries | Schema Match |
|------|---------|--------------|
| `usePlayerSearch` | `players` | ✅ Exact match |
| `usePlayer` | `players` | ✅ Exact match |
| `usePlayerSummary` | `player_stats_summary` | ✅ Exact match |
| `usePlayerRecentMatches` | `match_player_stats` + join to `matches` | ✅ Exact match |
| `useFeaturedPlayers` | `players` | ✅ Exact match |
| `useCountries` | `players` (distinct country) | ✅ Exact match |
| `useTopPlayers` | `player_stats_summary` + join to `players` | ✅ Exact match |
| `useRecentMatches` | `matches` | ✅ Exact match |

### Pages Using These Hooks:

- **`src/pages/Index.tsx`** - Uses `useFeaturedPlayers`, `useCountries`
- **`src/pages/PlayerProfile.tsx`** - Uses `usePlayer`, `usePlayerSummary`, `usePlayerRecentMatches`
- **`src/pages/MatchHistory.tsx`** - Uses `usePlayer`, `usePlayerRecentMatches`
- **`src/pages/Compare.tsx`** - Uses `useFeaturedPlayers`, `usePlayerSummary`

### Components Using Data:

- **`src/components/profile/PlayerProfileCard.tsx`** - Receives player + stats
- **`src/components/profile/PlayerOverview.tsx`** - Uses PlayerSummary
- **`src/components/batting/BattingDashboard.tsx`** - Uses PlayerSummary + PlayerMatchRow
- **`src/components/bowling/BowlingTab.tsx`** - Uses PlayerSummary + PlayerMatchRow
- **`src/components/weaknesses/WeaknessesTab.tsx`** - Uses PlayerSummary (derived analysis only)
- **`src/components/form/FormTab.tsx`** - Uses PlayerMatchRow
- **`src/components/fielding/FieldingTab.tsx`** - Currently stub (no data)

---

## 3. Hook-to-Schema Alignment

### ✅ Working Correctly:

```typescript
// usePlayer - matches players table exactly
const { data, error } = await supabase
  .from("players")
  .select("*")
  .eq("id", id!)
  .single();

// usePlayerSummary - matches player_stats_summary exactly
const { data, error } = await supabase
  .from("player_stats_summary")
  .select("*")
  .eq("player_id", playerId!);

// usePlayerRecentMatches - joins match_player_stats -> matches
const { data, error } = await supabase
  .from("match_player_stats")
  .select("*, matches!match_player_stats_match_id_fkey(...)")
  .eq("player_id", playerId!);
```

### Type Definitions Match Schema:

All TypeScript interfaces in `src/lib/hooks/usePlayers.ts` align with the schema in `src/integrations/supabase/types.ts`:

- `Player` → `players` table
- `PlayerSummary` → `player_stats_summary` table  
- `PlayerMatchRow` → `match_player_stats` + joined `matches` fields

---

## 4. Gaps: What Exists in DB But Not Used by UI

### A. `player_phase_stats` Table (NEW)

**Schema:**
- `player_id`, `format`, `phase` (composite PK)
- Batting: `bat_balls`, `bat_runs`, `bat_fours`, `bat_sixes`, `bat_dismissals`, `bat_sr`
- Bowling: `bowl_balls`, `bowl_runs`, `bowl_wickets`, `bowl_econ`

**Current Usage:** ❌ Not queried by any hook

**Potential Use:**
- Powerplay/death overs analysis in BattingDashboard
- Phase-specific weaknesses in WeaknessesTab

**Gap:** No hook exists to query this table.

### B. `player_vs_bowling_type` Table (NEW)

**Schema:**
- `player_id`, `format`, `bowling_type` (composite PK)
- Stats: `bat_balls`, `bat_runs`, `bat_fours`, `bat_sixes`, `bat_avg`, `bat_sr`, etc.

**Current Usage:** ❌ Not queried by any hook

**Potential Use:**
- Pace vs Spin analysis in BattingDashboard
- Enhanced WeaknessesTab with bowling-type specific insights

**Gap:** No hook exists to query this table.

### C. `player_recent_matches_view` (NEW)

**Schema:** Pre-joined view combining match_player_stats + matches

**Current Usage:** ❌ Not used - currently using manual join in `usePlayerRecentMatches`

**Potential Use:** Replace manual join with this view for simpler query

**Gap:** Could simplify `usePlayerRecentMatches` query.

---

## 5. ETL Script Status: `scripts/import-cricsheet.ts`

### ✅ What's Working:

| Table | Populated By ETL? | Status |
|-------|-------------------|--------|
| `players` | ✅ Yes | Working |
| `matches` | ✅ Yes | Working |
| `match_player_stats` | ✅ Yes | Working |
| `player_stats_summary` | ✅ Yes | Computed in script |

### ❌ What's NOT Populated:

| Table | ETL Status | Notes |
|-------|-----------|-------|
| `player_phase_stats` | ❌ Not implemented | Would require per-over/phase parsing |
| `player_vs_bowling_type` | ❌ Not implemented | Would require classifying bowling types |

### ETL Flow:

```
Cricsheet JSON → processMatch() → 
  ├── players (upserted)
  ├── matches (upserted)
  ├── match_player_stats (upserted)
  └── collect allStatsWithFormat

After all files → computeSummaries() →
  └── player_stats_summary (upserted)
```

### ETL Compatibility with New Schema:

**Fully Compatible** - The ETL script writes to:
- `players` → matches schema ✅
- `matches` → matches schema ✅  
- `match_player_stats` → matches schema ✅
- `player_stats_summary` → matches schema ✅

The script does NOT need modification to work with the new schema - it already outputs the correct columns.

---

## 6. Components Needing Updates

### Low Priority (Data Already Available):

1. **`src/components/fielding/FieldingTab.tsx`** - Currently stub with no Supabase queries
   - Could add fielding stats if available in match_player_stats

### Medium Priority (New Data Sources):

2. **Need new hooks for enhanced features:**
   - `usePlayerPhaseStats(playerId, format)` → queries `player_phase_stats`
   - `usePlayerVsBowlingType(playerId, format)` → queries `player_vs_bowling_type`

3. **`src/components/batting/BattingDashboard.tsx`** - Could use `player_vs_bowling_type` for PaceVsSpin chart (currently may be stub)

4. **`src/components/weaknesses/WeaknessesTab.tsx`** - Could enhance with phase-specific and bowling-type-specific analysis

---

## 7. Summary

| Area | Status |
|------|--------|
| Core hooks (player, summary, matches) | ✅ Working with new schema |
| Type definitions | ✅ Aligned with schema |
| Pages (Index, Profile, MatchHistory, Compare) | ✅ Working |
| ETL script | ✅ Compatible, populates core tables |
| New aggregate tables (phase, vs_bowling_type) | ❌ Not yet utilized |
| View (player_recent_matches_view) | ❌ Not yet utilized |

**Recommendation:** The core application is fully functional with the new schema. The new tables (`player_phase_stats`, `player_vs_bowling_type`) represent enhancement opportunities for richer analytics but are not blocking the current UI.

---

*Analysis: 2026-03-10*
