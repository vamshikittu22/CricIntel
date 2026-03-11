# Feature Landscape

**Domain:** Cricket Analytics Platform
**Researched:** 2025-03-10

## Executive Summary

Cricket analytics platforms exist on a spectrum from simple stat displays (table stakes) to sophisticated AI-powered analysis tools (differentiators). Cricinfo's Statsguru represents the gold standard for searchable cricket databases, while CricViz and professional tools offer advanced predictive analytics. For a Cricsheet-based platform, the key is matching core expectations (accurate stats, clear visualizations) while differentiating through better UX, advanced comparisons, and contextual insights that casual fans and fantasy players value.

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Cricsheet JSON import | Core data source - stated requirement | Medium | Parse version 1.1.0 format; validate on import |
| Player batting stats | Basic expectation - avg, runs, SR, 50s, 100s | Low | Aggregate from ball data; career + format-specific |
| Player bowling stats | Basic expectation - wickets, avg, economy, SR | Low | Must handle pace vs spin distinctions |
| Match scorecard | Standard match view - innings totals, fall of wickets | Low | Key entry point to any match |
| Career summary view | Quick player overview at a glance | Low | Aggregate career totals across formats |
| Basic player search | Find players by name | Low | Fuzzy matching for misspellings |
| Format filtering | Test / ODI / T20 separation | Low | Stats differ significantly across formats |
| Season/year filtering | View stats by season | Low | Cricsheet includes date data |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Advanced player comparison | Side-by-side stats with context (venue, opposition, phase) | High | Requires rich filter UI; big value for fantasy |
| Custom query builder | Statsguru-like filtering without writing SQL | High | Filter by 10+ dimensions; build your own records |
| Interactive visualizations | Wagon wheels, pitch maps, shot distribution | High | Apache ECharts recommended per STACK.md |
| Head-to-head records | Player vs player (battles) | Medium | Virat vs Smith, Bumrah vs batsmen |
| Team vs team analysis | Historical records between nations/clubs | Medium | Important for match predictions |
| Venue-specific stats | Performance at specific grounds | Medium | Some players have strong venue records |
| Partnership analysis | Identify best batting partnerships | Medium | Window functions for running totals |
| Phase-of-match stats | Powerplay vs middle overs vs death | Medium | T20-specific but valuable |
| Opposition analysis | Performance vs specific teams | Medium | Batsman vs Australia, vs India, etc. |
| Seasonal trends | Year-over-year performance | Low | Track improvement over time |
| Downloadable reports | Export stats to CSV/PDF | Low | Users want to share/share offline |
| AI-powered insights | "Did you know" contextual facts | Medium | Requires rule engine or ML |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Live streaming/video | Requires rights, huge infrastructure | Focus on ball-by-ball text commentary from Cricsheet |
| Real-time data feeds | Cricsheet is static, not live | Position as "post-match analysis" platform |
| Fantasy team management | Crowded market (Dream11, etc.) | Build stats tools that help fantasy players instead |
| Betting integration | Legal/ethical complexity | Stick to pure analytics |
| Social features/comments | Additional moderation burden | Keep focused on data |
| User accounts/auth | Adds complexity, not core need | Optional future enhancement |
| Multiple data source import | Cricsheet is comprehensive | Focus on making one source shine |
| Predictive ML models | Complex, needs historical data | Start with descriptive, add predictive later |

## Feature Dependencies

```
Cricsheet Import → Player Search → Career Summaries → Match Scorecards
                            ↓
                    Player Comparisons (requires Career Summaries)
                            ↓
              Advanced Query Builder (requires Comparisons)
                            ↓
              Interactive Visualizations (requires all above)
```

## MVP Recommendation

Prioritize in order:

1. **Cricsheet JSON import** — Foundation for everything
2. **Basic player search & career summaries** — Entry point, establishes core data model
3. **Match scorecards** — Primary viewing experience
4. **Format filtering** — Essential for meaningful stats
5. **Basic player comparison** — First differentiator; simpler than advanced filters
6. **Season/year filtering** — Enables trend analysis

Defer:
- **Interactive visualizations (wagon wheel, pitch maps)**: Complexity high, requires all basics first
- **AI insights**: Needs sufficient data depth first
- **Custom query builder**: Statsguru-lite is a v2 feature

## Sources

- **Cricinfo Statsguru**: https://stats.espncricinfo.com/ci/engine/stats/index.html (HIGH - Gold standard)
- **Cricsheet JSON format**: https://cricsheet.org/format/json/ (HIGH - Data source documentation)
- **CricViz Centurion**: https://cricviz.com/cricviz-updates-centurion-tool-with-industry-leading-features/ (MEDIUM - Professional analytics)
- **Sportbex Cricket APIs**: https://sportbex.com/blog/cricket-player-stats-sportbex-sport-provides/ (MEDIUM - API features)
- **CricMetric player comparison**: https://www.cricmetric.com/comparison.py (MEDIUM - Example comparison tool)
- **Fantasy cricket apps 2025**: https://www.dinoustech.com/blog/discover-the-best-fantasy-cricket-apps-in-2025.html (LOW - Market context)
