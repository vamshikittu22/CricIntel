# Requirements: CricIntel - Cricket Analytics Platform

**Defined:** 2025-03-10
**Core Value:** Enable cricket enthusiasts to analyze player performance across formats using real match data from Cricsheet.

## v1 Requirements

### Data Import

- [ ] **DATA-01**: ETL script reads Cricsheet JSON files from configurable local folder
- [ ] **DATA-02**: ETL script parses Cricsheet format (meta, info, innings, overs, deliveries)
- [ ] **DATA-03**: ETL maps player names to Cricsheet registry IDs for canonical identification
- [ ] **DATA-04**: ETL upserts players into players table (avoid duplicates)
- [ ] **DATA-05**: ETL inserts/upserts matches into matches table with format, date, venue, teams, result
- [ ] **DATA-06**: ETL aggregates ball-by-ball data into per-match batting and bowling stats
- [ ] **DATA-07**: ETL computes and upserts career/format summaries for each player after import
- [ ] **DATA-08**: ETL handles extras (wides, no-balls, byes, leg-byes) correctly in calculations

### Database Schema

- [ ] **SCHM-01**: players table with Cricsheet registry ID as primary key
- [ ] **SCHM-02**: matches table with format, date, venue, teams, result columns
- [ ] **SCHM-03**: match_player_stats table for per-match batting and bowling stats per player
- [ ] **SCHM-04**: player_stats_summary table for career/format aggregated stats
- [ ] **SCHM-05**: player_phase_stats table for powerplay/middle/death overs stats
- [ ] **SCHM-06**: TypeScript types reflect all database tables

### Home Page

- [ ] **HOME-01**: Home page displays real players from Supabase (not mock data)
- [ ] **HOME-02**: Home page displays recent matches from Supabase
- [ ] **HOME-03**: Player search works with fuzzy matching

### Player Profile Page

- [ ] **PROF-01**: Player profile loads player info from players table
- [ ] **PROF-02**: Player profile loads career statistics from player_stats_summary
- [ ] **PROF-03**: Player profile loads recent matches from match_player_stats
- [ ] **PROF-04**: BattingDashboard component receives real data
- [ ] **PROF-05**: BowlingDashboard component receives real data
- [ ] **PROF-06**: Form tab shows recent match performance with real data
- [ ] **PROF-07**: Weaknesses tab shows player weaknesses with real data
- [ ] **PROF-08**: Format filtering (Test/ODI/T20) works on profile page

### Compare Page

- [ ] **COMP-01**: User can select two players for comparison
- [ ] **COMP-02**: Compare page shows side-by-side batting stats
- [ ] **COMP-03**: Compare page shows side-by-side bowling stats
- [ ] **COMP-04**: Comparison works with format filtering

### Match History Page

- [ ] **MATCH-01**: Match history page lists matches from matches table
- [ ] **MATCH-02**: Matches are filterable by format
- [ ] **MATCH-03**: Match details page shows scorecard using match_player_stats

### Developer Experience

- [ ] **DEV-01**: npm script "import:cricsheet" runs ETL with configurable folder path
- [ ] **DEV-02**: Environment variables for Supabase URL and service role key
- [ ] **DEV-03**: Old mock data removed or clearly separated from real data
- [ ] **DEV-04**: Clear setup instructions (commands to run, order of operations)

## v2 Requirements

### Advanced Features

- **ADV-01**: Phase-of-match stats (powerplay, middle, death) displayed on profile
- **ADV-02**: Venue-specific statistics
- **ADV-03**: Opposition analysis (player vs specific teams)
- **ADV-04**: Partnership analysis
- **ADV-05**: Head-to-head player records

### Visualizations

- **VIZ-01**: Wagon wheel visualization for batting
- **VIZ-02**: Pitch map visualization for bowling

### Query Features

- **QUERY-01**: Custom query builder for advanced filtering

## Out of Scope

| Feature | Reason |
|---------|--------|
| Live streaming/video | Requires rights, not in Cricsheet scope |
| Real-time data feeds | Cricsheet is static post-match data |
| Fantasy team management | Crowded market, focus on stats instead |
| Betting integration | Legal/ethical complexity |
| User authentication | Not required for viewing stats |
| Predictive ML models | Requires more data depth first |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Pending |
| DATA-04 | Phase 1 | Pending |
| DATA-05 | Phase 1 | Pending |
| DATA-06 | Phase 1 | Pending |
| DATA-07 | Phase 1 | Pending |
| DATA-08 | Phase 1 | Pending |
| SCHM-01 | Phase 1 | Pending |
| SCHM-02 | Phase 1 | Pending |
| SCHM-03 | Phase 1 | Pending |
| SCHM-04 | Phase 1 | Pending |
| SCHM-05 | Phase 1 | Pending |
| SCHM-06 | Phase 1 | Pending |
| HOME-01 | Phase 2 | Pending |
| HOME-02 | Phase 2 | Pending |
| HOME-03 | Phase 2 | Pending |
| PROF-01 | Phase 2 | Pending |
| PROF-02 | Phase 2 | Pending |
| PROF-03 | Phase 2 | Pending |
| PROF-04 | Phase 2 | Pending |
| PROF-05 | Phase 2 | Pending |
| PROF-06 | Phase 2 | Pending |
| PROF-07 | Phase 2 | Pending |
| PROF-08 | Phase 2 | Pending |
| COMP-01 | Phase 3 | Pending |
| COMP-02 | Phase 3 | Pending |
| COMP-03 | Phase 3 | Pending |
| COMP-04 | Phase 3 | Pending |
| MATCH-01 | Phase 2 | Pending |
| MATCH-02 | Phase 2 | Pending |
| MATCH-03 | Phase 2 | Pending |
| DEV-01 | Phase 1 | Pending |
| DEV-02 | Phase 1 | Pending |
| DEV-03 | Phase 1 | Pending |
| DEV-04 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0 ✓

---
*Requirements defined: 2025-03-10*
*Last updated: 2025-03-10 after initial definition*
