

## Plan: Cricsheet ETL Pipeline + Data Model Overhaul

### Scope Assessment

This is a **major data layer rewrite**. The current schema uses UUID primary keys and ball-by-ball `deliveries` with Supabase views for aggregation. The request asks for text-based PKs (Cricsheet registry IDs), new aggregation tables, and a local ETL script.

**Key constraint**: Lovable runs frontend-only. The ETL script (`scripts/import-cricsheet.ts`) will be created in the repo but must be run locally by the user via `ts-node` or `tsx`. Lovable cannot execute it.

---

### Phase 1: Database Schema Migration

**Drop existing tables** (they use UUIDs, incompatible with Cricsheet text IDs) and recreate:

| Table | PK | Purpose |
|---|---|---|
| `players` | `id` (text) — Cricsheet registry ID | Player master data |
| `matches` | `id` (text) — filename or match_type_number | Match metadata |
| `match_player_stats` | (`match_id`, `player_id`) | Per-match batting/bowling aggregates |
| `player_stats_summary` | (`player_id`, `format`) | Career/format aggregates |
| `player_phase_stats` | (`player_id`, `format`, `phase`) | Phase-level splits (future) |
| `player_vs_bowling_type` | (`player_id`, `format`, `bowling_type`) | Pace/spin splits (future) |

A Supabase view `player_recent_matches_view` joining `match_player_stats` + `matches` for form/history queries.

RLS: All tables get public SELECT (same as current). No INSERT/UPDATE/DELETE from client — ETL uses service role key.

**This will delete all existing data.** The user must re-import via the ETL script.

---

### Phase 2: Cricsheet Types + ETL Script

**`src/lib/cricsheet.ts`** — TypeScript interfaces for the Cricsheet JSON format (`CricsheetMatch`, `CricsheetInnings`, `CricsheetDelivery`, etc.) plus a `mapMatchTypeToFormat()` helper.

**`scripts/import-cricsheet.ts`** — Node script that:
1. Reads `.json` files recursively from `data/odi`, `data/test`, `data/t20i`, `data/ipl`
2. For each file: parses match info → upserts `matches` row, extracts players from registry → upserts `players`, aggregates deliveries per batter/bowler → upserts `match_player_stats`
3. After all files: computes career aggregates → upserts `player_stats_summary`
4. Uses `@supabase/supabase-js` with `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` env vars

Add `tsx` as a dev dependency and a `"import:cricsheet"` npm script.

---

### Phase 3: Frontend Hooks Update

**`src/lib/hooks/usePlayers.ts`** — Rewrite to query new tables:
- `usePlayerSearch` → queries `players` table
- `usePlayer` → single player by text ID
- `usePlayerSummary` → queries `player_stats_summary` for a player
- `usePlayerRecentMatches` → queries `player_recent_matches_view`
- `useFeaturedPlayers` → top players by runs from `player_stats_summary`

Remove old hooks (`useBattingAnalytics`, `useDeliveries`, `useBowlingDeliveries`, `useBowlingAnalytics`) — replace with new ones.

---

### Phase 4: Frontend Component Updates

All components currently receive raw deliveries arrays and do client-side aggregation. They'll be refactored to accept pre-aggregated data from new tables.

| Page/Component | Changes |
|---|---|
| **`PlayerProfile.tsx`** | Use `usePlayerSummary` + `usePlayerRecentMatches` instead of deliveries. Pass summary objects to child components. |
| **`PlayerProfileCard`** | Accept `PlayerSummary` for KPI boxes (matches, runs, avg, SR) |
| **`PlayerOverview`** | Accept `PlayerSummary[]` instead of batting/bowling analytics |
| **`BattingDashboard`** | Accept `PlayerSummary` + `PlayerMatchRow[]` instead of raw deliveries. Simplify — some visualizations (wagon wheel, ball length matrix) need delivery-level data which won't exist in the new schema; show summary stats and recent match trend instead. |
| **`BowlingTab`** | Same — use summary stats, show recent match bowling figures |
| **`FormTab/FormTracker`** | Use `PlayerMatchRow[]` from recent matches view |
| **`WeaknessesTab`** | Generate insights from `PlayerSummary` (phase/bowling-type splits when available) |
| **`Index.tsx`** | Show top batters/bowlers from `player_stats_summary`, keep search working |
| **`Compare.tsx`** | Use `usePlayerSummary` for both players |
| **`MatchHistory.tsx`** | Use `usePlayerRecentMatches` instead of raw deliveries |

**Tradeoff**: The current app has ball-by-ball visualizations (wagon wheel scatter, pitch heatmap, ball length matrix). The new schema removes `deliveries` — these will degrade to summary-only views unless we keep the deliveries table alongside the new tables. I'll keep a simplified version with the data available from `match_player_stats`.

---

### Phase 5: Cleanup

- Update `README.md` with ETL instructions
- Remove references to old enum types (`ball_length_type`, `shot_type`, etc.) that won't exist in new schema
- Update routing (player IDs change from UUID to text — URLs become `/player/c4487b84`)

---

### Technical Details

**Migration SQL** (single migration):
- DROP existing tables/views (`deliveries`, `matches`, `players`, `batting_analytics`, `bowling_analytics`)
- DROP existing enums
- CREATE new tables with text PKs and appropriate columns
- CREATE `player_recent_matches_view`
- Enable RLS with public SELECT policies

**ETL batching**: Upsert in chunks of 100 rows to avoid hitting Supabase request limits.

**Types**: The `src/integrations/supabase/types.ts` file is auto-generated and will update after migration. Components will use manually defined interfaces until types regenerate.

