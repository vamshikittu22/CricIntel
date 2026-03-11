# ROADMAP: CricIntel - Cricket Analytics Platform

## Overview

CricIntel imports ball-by-ball cricket match data from Cricsheet JSON files and presents player statistics, comparisons, and insights through a React + Supabase web application. The roadmap delivers a complete analytics platform in 3 phases, prioritizing data foundation first.

**Depth:** Quick (3 phases)
**Total v1 Requirements:** 36

---

## Phase 1: Data Foundation

**Goal:** Establish database schema and ETL pipeline to import and store Cricsheet data reliably.

### Requirements (18 total)
- **Data Import:** DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, DATA-07, DATA-08
- **Database Schema:** SCHM-01, SCHM-02, SCHM-03, SCHM-04, SCHM-05, SCHM-06
- **Developer Experience:** DEV-01, DEV-02, DEV-03, DEV-04

### Dependencies
- None (foundation phase)

### Success Criteria

1. **ETL script imports Cricsheet JSON files** — Running `npm run import:cricsheet` parses JSON from a configurable folder and populates the database
2. **Players are uniquely identified** — Player names map to Cricsheet registry IDs, preventing duplicates
3. **Match data is stored completely** — Each match includes format, date, venue, teams, and result
4. **Stats are aggregated correctly** — Batting and bowling stats computed per match and per career, with extras (wides, no-balls, byes, leg-byes) handled properly
5. **TypeScript types match schema** — All database tables have corresponding TypeScript interfaces

---

## Phase 2: Core Stats Display

**Goal:** Enable users to explore players, view profiles with statistics, and browse match history.

### Requirements (14 total)
- **Home Page:** HOME-01, HOME-02, HOME-03
- **Player Profile:** PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, PROF-06, PROF-07, PROF-08
- **Match History:** MATCH-01, MATCH-02, MATCH-03

### Dependencies
- Phase 1 complete (requires database schema and data)

### Success Criteria

1. **Home page shows real data** — Featured players and recent matches load from Supabase, not mock data
2. **Player search works** — Fuzzy search finds players by name
3. **Player profile displays career stats** — Batting and bowling summaries show real aggregated data
4. **Format filtering works** — Users can filter stats by Test/ODI/T20
5. **Match history lists real matches** — Matches display from database with format filtering
6. **Match scorecard shows player stats** — Clicking a match shows batting and bowling figures for each player

---

## Phase 3: Player Comparison

**Goal:** Enable users to compare two players side-by-side with filtered statistics.

### Requirements (4 total)
- **Compare Page:** COMP-01, COMP-02, COMP-03, COMP-04

### Dependencies
- Phase 2 complete (requires player profiles and stats data)

### Success Criteria

1. **User can select two players** — Search and select interface for choosing comparison pair
2. **Batting stats display side-by-side** — Runs, average, strike rate, centuries, fifties shown for both players
3. **Bowling stats display side-by-side** — Wickets, economy, average, strike rate, five-wicket hauls shown for both players
4. **Comparison is filterable** — Format filter (Test/ODI/T20) applies to both players' stats

---

## Coverage

| Phase | Goal | Requirements |
|-------|------|--------------|
| 1 - Data Foundation | Database schema and ETL pipeline | 18 (DATA, SCHM, DEV) |
| 2 - Core Stats Display | Player exploration and match browsing | 14 (HOME, PROF, MATCH) |
| 3 - Player Comparison | Side-by-side player stats | 4 (COMP) |

**Mapped:** 36/36 v1 requirements ✓

---

## Progress

| Phase | Status | Requirements |
|-------|--------|--------------|
| Phase 1: Data Foundation | Not Started | 18 |
| Phase 2: Core Stats Display | Not Started | 14 |
| Phase 3: Player Comparison | Not Started | 4 |

---

*Generated: 2026-03-10*
