# Architecture Patterns

**Domain:** Cricket Analytics Platform
**Researched:** 2025-03-10
**Confidence:** HIGH

## Recommended Architecture

Cricket analytics platforms follow a data-intensive application pattern with three core phases: **ingestion** (ETL from match data), **storage** (relational modeling), and **presentation** (analytics dashboards). The architecture centers on a normalized ball-by-ball database that enables flexible aggregation queries.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Data Source   │────▶│   ETL Pipeline  │────▶│   Database      │
│  (Cricsheet)    │     │  (Transform)    │     │  (PostgreSQL)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │◀────│   API Layer     │◀────│  Query Layer    │
│  (React/UI)     │     │ (React Query)   │     │ (Supabase)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Data Source** | Provides raw match data in JSON format | ETL Pipeline |
| **ETL Script** | Parses, validates, transforms Cricsheet JSON to relational tables | Database |
| **Database** | Stores normalized match/player/ball data; computes aggregations | API Layer |
| **API Layer** | Type-safe queries, caching, background refetch | Database, Frontend |
| **Frontend** | Renders visualizations, handles user interactions | API Layer |

### Data Flow

**Primary Flow:**
1. **Ingestion**: Cricsheet JSON → ETL script → PostgreSQL (matches, innings, overs, balls tables)
2. **Query**: Frontend → React Query → Supabase client → Database queries
3. **Aggregation**: Database views/functions compute career stats from ball-level data
4. **Presentation**: React components render stats + charts

**Query Patterns:**
- **Career Stats**: Aggregate on `balls` table filtered by player_id
- **Match Analysis**: JOIN across matches → innings → overs → balls
- **Venue Stats**: GROUP BY venue with date ranges
- **Partnerships**: Window functions for running totals

## Patterns to Follow

### Pattern 1: Star Schema for Analytics

**What:** Dimension tables (players, teams, venues) + fact tables (deliveries, matches)

**When:** Building analytics dashboards with aggregations

**Example:**
```sql
-- Fact table (ball-level)
CREATE TABLE balls (
  id SERIAL PRIMARY KEY,
  match_id UUID REFERENCES matches,
  over_id UUID REFERENCES overs,
  bowler_id UUID REFERENCES players,
  striker_id UUID REFERENCES players,
  runs_batter INT,
  runs_extras INT,
  wicket BOOLEAN,
  wicket_type TEXT
);

-- Dimension table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT,
  batting_hand TEXT,
  bowling_style TEXT
);
```

### Pattern 2: Materialized Views for Career Stats

**What:** Pre-computed aggregations updated on import

**When:** Player profile loads require instant career summaries

**Example:**
```sql
CREATE MATERIALIZED VIEW player_career_summary AS
SELECT 
  p.id as player_id,
  p.name,
  COUNT(DISTINCT m.id) as matches,
  SUM(b.runs_batter) as total_runs,
  AVG(b.runs_batter) as average,
  COUNT(*) as balls_faced
FROM players p
JOIN balls b ON b.striker_id = p.id
JOIN matches m ON m.id = b.match_id
GROUP BY p.id, p.name;
```

### Pattern 3: React Query for Server State

**What:** Centralized caching with background refetch

**When:** Any data that comes from the database

**Example:**
```typescript
const usePlayerSummary = (playerId: string) => {
  return useQuery({
    queryKey: ['player', playerId, 'summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('player_stats_summary')
        .select('*')
        .eq('player_id', playerId)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### Pattern 4: Incremental ETL

**What:** Upsert only new/changed records on each import

**When:** Re-importing data without duplicates

**Example:**
```typescript
// Upsert players - matches on unique identifier
await supabase.from('players').upsert(
  players.map(p => ({ 
    identifier: p.identifier, // Cricsheet ID
    name: p.name,
    country: p.country 
  })),
  { onConflict: 'identifier' }
);
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Aggregated Stats Only

**What:** Computing all stats during import and storing only totals

**Why bad:** Cannot answer new questions (e.g., "stats vs left-handers") without reimport

**Instead:** Store ball-by-ball data, compute aggregations on query time or via views

### Anti-Pattern 2: Client-Side Aggregation

**What:** Fetching raw ball data and computing stats in React components

**Why bad:** Large data transfers, slow renders, battery drain on mobile

**Instead:** Let PostgreSQL do aggregations; fetch only computed results

### Anti-Pattern 3: No Indexing Strategy

**What:** Relying only on primary keys

**Why bad:** Career stat queries scan millions of rows

**Instead:** Create composite indexes for common query patterns
```sql
CREATE INDEX idx_balls_bowler ON balls(bowler_id, match_id);
CREATE INDEX idx_balls_striker ON balls(striker_id, match_id);
```

### Anti-Pattern 4: Tight Coupling Between Components

**What:** ETL script directly manipulating React state

**Why bad:** Hard to test, debug, or swap components

**Instead:** Clear boundaries - ETL writes to DB, React Query reads from API

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **Database** | Single Supabase instance | Consider connection pooling | Read replicas |
| **ETL** | Run on-demand | Scheduled daily | Incremental streaming |
| **Caching** | React Query default | Add CDN for static assets | Edge caching |
| **Visualization** | Client-side Recharts | Server-rendered charts | Pre-computed chart images |

## Build Order Recommendations

For a cricket analytics platform, this dependency order works:

```
1. Database Schema (foundation)
   └─> Matches, innings, overs, balls, players, teams
   
2. ETL Script (data pipeline)
   └─> Parse Cricsheet → populate schema
   
3. Basic API Queries
   └─> Fetch player, fetch matches
   
4. Player Search & Navigation
   └─> SearchBar, routing to player pages
   
5. Career Stats Display
   └─> PlayerProfile with batting/bowling summaries
   
6. Match Scorecards
   └─> Innings breakdown, fall of wickets
   
7. Player Comparison
   └─> Side-by-side stats
   
8. Advanced Filters
   └─> Venue, opposition, format, date range
   
9. Visualizations
   └─> Charts, heatmaps (deferred - requires all basics)
```

### Rationale

- **Database first**: Schema defines what queries are possible
- **ETL second**: Without data, nothing else matters
- **Basic queries third**: All features depend on fetching data
- **Search/navigation fourth**: Entry points to the app
- **Stats display fifth**: Core value proposition
- **Comparisons sixth**: Requires career stats to exist
- **Filters seventh**: Need data to filter
- **Visualizations last**: Nice-to-have, complex, deferrable

## Sources

- **Cricsheet JSON format**: https://cricsheet.org/format/json/ (HIGH - Data source)
- **Cricket Analytics Pipeline (Airflow)**: https://medium.com/@tusharsharma_60127/unlocking-cricket-data-building-a-scalable-sports-analytics-pipeline (MEDIUM - Architecture patterns)
- **Snowflake Cricket Pipeline**: https://github.com/husskhosravi/cricket-analytics-snowflake-pipeline (MEDIUM - Star schema pattern)
- **ESPNcricinfo Architecture**: https://www.technologywithvivek.com/2025/02/Top%20Programming%20languages%20and%20technology%20used%20in%20ESPNcricinfo.html (MEDIUM - Industry reference)
- **System Design - Sports Score**: https://medium.com/@narengowda/cricinfo-cricbuzz-system-design (MEDIUM - Architecture reference)
