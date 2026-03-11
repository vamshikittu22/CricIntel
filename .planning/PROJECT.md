# CricIntel - Cricket Analytics Platform

## What This Is

A cricket analytics web application that imports ball-by-ball match data from Cricsheet JSON files and presents player statistics, comparisons, and insights. Users can explore player careers, compare players side-by-side, and view match details.

## Core Value

Enable cricket enthusiasts to analyze player performance across formats using real match data from Cricsheet.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Database schema supports players (Cricsheet registry IDs), matches, per-match player stats, career/format summaries, phase stats, and insights
- [ ] ETL script imports Cricsheet JSON files and populates all tables
- [ ] Home page displays real players and recent matches from Supabase
- [ ] Player profile page shows career stats, recent matches, batting/bowling dashboards
- [ ] Compare page shows side-by-side stats for two players
- [ ] Match history page lists real matches from database
- [ ] Easy-to-run import command (npm run import:cricsheet)

### Out of Scope

- Real-time data updates (manual import sufficient)
- Advanced analytics/ML predictions
- User authentication/personalization
- Mobile app

## Context

**Existing codebase:**
- React 18 + TypeScript + Vite frontend
- Supabase (PostgreSQL) backend
- Tailwind CSS with shadcn/ui components
- React Query for server state
- Partial schema and ETL script already exist
- Components: BattingDashboard, BowlingDashboard, Form tab, Weaknesses tab

**Data source:**
- Cricsheet JSON files (ball-by-ball international and IPL matches)
- Registry IDs for player identification
- Format types: T20, ODI, Test

## Constraints

- **Tech Stack**: React, TypeScript, Supabase/PostgreSQL, Tailwind — No changes
- **Data Source**: Cricsheet JSON format only — must parse existing structure
- **Deployment**: Local development with Supabase local/remote — not cloud-native

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Cricsheet registry IDs as player IDs | Stable identifier across datasets | — Pending |
| Aggregate stats on import | Faster queries, simpler frontend | — Pending |
| Upsert on import | Support re-running with new data | — Pending |

---
*Last updated: 2025-03-10 after initialization*
