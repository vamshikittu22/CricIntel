# Research Summary: CricIntel - Cricket Analytics Platform

**Domain:** Cricket Analytics Platform (Cricsheet data + Supabase backend)
**Researched:** 2026-03-10
**Overall confidence:** HIGH

## Executive Summary

CricIntel is a post-match cricket analytics platform built on Cricsheet ball-by-ball data with a Supabase/PostgreSQL backend. The research establishes a clear path from raw match data imports to an analytics dashboard comparable to Statsguru, with the key differentiator being better UX and interactive visualizations. The technology stack is solid: React 18 + TypeScript + TanStack Query for frontend, Supabase for backend-as-a-service (PostgreSQL + Auth + Realtime), and Recharts/ECharts for visualizations.

The critical insight is that **data quality is the primary risk**. Cricsheet data has known issues around player identity collisions (surname conflicts), wicket attribution errors, and venue name normalization that will destroy user trust if not addressed upfront. The architecture centers on a normalized ball-by-ball schema enabling flexible aggregations, not pre-computed totals. The roadmap should prioritize: (1) robust data import with validation, (2) core stats display, (3) comparison features, (4) visualizations last.

## Key Findings

### Stack
- **Frontend:** React 18.x + TypeScript 5.x + Vite 6.x + Tailwind CSS 3.x + shadcn/ui
- **Backend:** Supabase (PostgreSQL 15+) with built-in Auth and Realtime
- **State:** TanStack Query 5.x for server state management
- **Visualization:** Recharts 2.x for standard stats; Apache ECharts 5.x for advanced (wagon wheels, pitch maps)
- **Data Processing:** zod for validation, date-fns for dates, lodash for aggregation utilities

### Architecture
- **Core pattern:** Data ingestion (Cricsheet JSON → ETL) → Storage (normalized ball-by-ball schema) → Presentation (React Query + visualizations)
- **Schema:** matches → innings → overs → balls (4-table normalized design)
- **Performance:** Materialized views for pre-computed career stats; composite indexes on bowler_id/striker_id + match_id
- **Build order:** Database → ETL → API queries → Search → Stats → Scorecards → Comparison → Filters → Visualizations

### Features
- **Table stakes:** Cricsheet import, batting/bowling stats, match scorecards, career summaries, player search, format filtering
- **Differentiators:** Advanced player comparison, head-to-head records, venue-specific stats, partnership analysis, interactive visualizations
- **Anti-features to avoid:** Live streaming, real-time feeds, fantasy management, betting integration, user accounts (all add complexity without core value)

### Critical Pitfalls
1. **Player identity collision** — Same surnames mapped to wrong players (Brendon vs Nathan McCullum issue)
2. **Wicket attribution errors** — Wides/no-balls causing incorrect bowler credit
3. **Extras calculation** — Byes vs leg-byes vs wides/no-balls have different cricket semantics
4. **Venue normalization** — Same stadium with multiple names breaks historical analysis
5. **Over sequence breaks** — Wides/no-balls affecting ball count per over

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Data Foundation
- **Rationale:** Everything depends on clean data. Must address player identity and validation before building features.
- **Deliverables:** Database schema, Cricsheet ETL pipeline, player registry integration, venue normalization table, data validation layer
- **Features from FEATURES.md:** Cricsheet JSON import
- **Pitfalls avoided:** Player identity collision (use Cricsheet Register), wicket attribution errors (validation), venue fragmentation (normalization table)

### Phase 2: Core Stats Display
- **Rationale:** Establishes the core value proposition. Enables search and navigation to player/match data.
- **Deliverables:** Player search, career summaries (batting/bowling), match scorecards, format filtering
- **Features from FEATURES.md:** Player batting stats, player bowling stats, match scorecard, career summary view, basic player search, format filtering
- **Pitfalls avoided:** Match format confusion (always filter by format)

### Phase 3: Comparison & Analysis
- **Rationale:** First differentiator. Builds on career stats to enable side-by-side analysis.
- **Deliverables:** Basic player comparison, head-to-head records, team vs team, venue-specific stats, seasonal filtering
- **Features from FEATURES.md:** Basic player comparison, head-to-head records, venue-specific stats, seasonal trends
- **Pitfalls avoided:** Season boundary errors (use competition_season field)

### Phase 4: Advanced Features
- **Rationale:** Requires all foundational data to be solid. Higher complexity, lower immediate value.
- **Deliverables:** Custom query builder, partnership analysis, phase-of-match stats, downloadable reports
- **Features from FEATURES.md:** Advanced player comparison, custom query builder, partnership analysis, phase-of-match stats, downloadable reports
- **Pitfalls avoided:** All critical pitfalls should be resolved by now

### Phase 5: Visualizations
- **Rationale:** Most complex, deferred. Requires Apache ECharts for wagon wheels and pitch maps.
- **Deliverables:** Interactive wagon wheels, pitch maps, shot distribution heatmaps
- **Features from FEATURES.md:** Interactive visualizations

**Phase ordering rationale:**
- Data foundation must come first — bad data makes all features worthless
- Core stats establish the product before adding comparison complexity
- Comparisons require career stats to exist first
- Visualizations require all basics to be solid (complex, deferrable)

**Research flags for phases:**
- Phase 1 (Data Foundation): Likely needs deeper research on Cricsheet Register integration
- Phase 2 (Core Stats): Standard patterns, unlikely to need research
- Phase 3 (Comparison): May need research on specific filter UI patterns
- Phase 4 (Advanced): May need research on custom query builder UX
- Phase 5 (Visualizations): Standard Apache ECharts patterns, less research needed

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies well-documented, strong ecosystems. React/TanStack Query/Supabase is a proven combination. |
| Features | HIGH | Table stakes well-understood from Statsguru analysis. Differentiators mapped from competitor research. |
| Architecture | HIGH | Star schema, materialized views, React Query patterns are standard for analytics apps. Cricsheet schema is documented. |
| Pitfalls | HIGH | All critical pitfalls sourced from Cricsheet's own documentation (review corrections, register). Prevention strategies clear. |

## Gaps to Address

- **Cricsheet Register integration:** Research did not detail exact implementation steps for player ID canonicalization — needs phase-specific research during Phase 1 planning
- **Advanced query builder UX:** Statsguru-like interface is complex; may need user research on desired filters
- **ECharts wagon wheel implementation:** Specific visualization patterns for cricket not extensively covered; standard ECharts research may be needed

## Sources

- **Cricsheet Data:** https://cricsheet.org/format/json/ (HIGH)
- **Cricsheet Register:** https://cricsheet.org/register/ (HIGH)
- **Cricsheet Review Corrections:** https://cricsheet.org/article/review_corrections/ (HIGH)
- **TanStack Query:** https://tanstack.com/query/latest/docs/framework/react/overview (HIGH)
- **Supabase:** https://supabase.com/docs/guides/realtime/postgres-changes (HIGH)
- **Recharts:** https://recharts.org/en-US/ (HIGH)
- **shadcn/ui:** https://ui.shadcn.com/ (HIGH)
- **Cricinfo Statsguru:** https://stats.espncricinfo.com/ci/engine/stats/index.html (HIGH - Gold standard reference)
- **HowSTAT Venue Aliases:** https://www.howstat.com/Cricket/statistics/Grounds/GroundAliases.asp (MEDIUM)
