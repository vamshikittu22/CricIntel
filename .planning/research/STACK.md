# Technology Stack

**Project:** CricIntel - Cricket Analytics Platform
**Researched:** 2025-03-10

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 18.x | UI Framework | Industry standard, strong ecosystem. Your existing choice is solid. |
| TypeScript | 5.x | Type Safety | Essential for data-heavy analytics - prevents runtime errors in stat calculations. |
| Vite | 6.x | Build Tool | Fast HMR, optimized builds. Standard for React in 2025. |

### Database & Backend
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase | Latest | Backend-as-a-Service | Provides PostgreSQL + Auth + Realtime. Excellent for sports data updates. Row-Level Security protects player data. |
| PostgreSQL | 15+ (via Supabase) | Relational Database | Perfect for structured match data. Cricsheet JSON maps cleanly to relational schema. |
| Supabase Realtime | Built-in | Live Updates | Enables live match dashboards without polling. WebSocket-based. |

### Server State Management
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| TanStack Query (React Query) | 5.x | Server State | Industry standard for React data fetching. Caching, background refetch, deduping - critical for analytics dashboards. |
| @tanstack/react-query-devtools | 5.x | Debugging | Essential during development for inspecting cache. |

### UI & Styling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 3.x | Utility CSS | Your existing choice. Pairs well with shadcn/ui. |
| shadcn/ui | Latest | Component Library | Accessible, customizable components built on Radix UI. Copy-paste not npm dependency - you own the code. |
| Radix UI | Latest | Primitive Components | Headless UI primitives - foundation for shadcn/ui. |
| Lucide React | Latest | Icons | Lightweight, consistent icon set. Used by shadcn/ui. |

### Data Visualization
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Recharts | 2.x | Charts | **RECOMMENDED**. 24.8k stars, 3.6M weekly downloads. React-native composable components. SVG rendering, good performance for typical cricket stats. |
| Apache ECharts | 5.x | Advanced Charts | Use for complex cricket visualizations (wagon wheel, pitch maps). Canvas rendering handles large datasets. |
| react-apexcharts | 1.x | Chart Alternative | Good if you prefer ApexCharts ecosystem. Simpler API than ECharts. |

### Data Processing
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| zod | 3.x | Schema Validation | Validate Cricsheet JSON on import. Runtime type safety. |
| date-fns | 3.x | Date Utilities | Lightweight date formatting for match timelines. |
| lodash | 4.x | Utility Functions | `groupBy`, `sortBy`, `pick` - essential for aggregating cricket stats. |

### Routing
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React Router | 6.x | Client Routing | Standard choice. TanStack Query handles data, RR handles navigation. |

## Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query-persist-client | Latest | Query Persistence | Offline support for viewing cached matches |
| recharts-to-png | Latest | Export Charts | User wants to share/download visualizations |
| usehooks-ts | Latest | Reusable Hooks | Pre-built hooks for local storage, interval, etc. |
| clsx / tailwind-merge | Latest | Class Manipulation | Essential for shadcn/ui component variants |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Charts | Recharts | Victory | Victory has fewer downloads (272k vs 3.6M), less community support for cricket-specific viz |
| Charts | Recharts | Nivo | Nivo is heavier, less flexible for simple cricket stats. Recharts' component composition fits better |
| Backend | Supabase | Firebase | Firebase's NoSQL makes complex cricket queries (career stats aggregation) painful. PostgreSQL is purpose-built for this. |
| Backend | Supabase | Raw PostgreSQL + Express | Supabase saves auth/realtime implementation time. RLS provides security without writing custom middleware. |
| State | React Query | SWR | React Query has larger ecosystem, better TypeScript support. SWR is lighter but less feature-rich. |
| State | React Query | RTK Query | Redux overkill for analytics app. React Query is specialized for async server state. |
| UI | shadcn/ui | Material UI | MUI is heavy, hard to customize. shadcn/ui gives you copy-paste ownership. |
| UI | shadcn/ui | Chakra UI | Chakra has versioning issues. shadcn/ui is more stable, built on modern Radix primitives. |

## Installation

```bash
# Core
npm install react react-dom
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install react-router-dom

# UI
npm install tailwindcss postcss autoprefixer
npx shadcn-ui@latest init

# Add shadcn components
npx shadcn-ui@latest add button card table dialog tabs

# Visualization
npm install recharts
npm install echarts echarts-for-react  # For advanced cricket visualizations

# Utilities
npm install zod date-fns lodash clsx tailwind-merge lucide-react
npm install @tanstack/react-query-persist-client  # optional, for offline

# Dev dependencies
npm install -D typescript @types/react @types/lodash vite @vitejs/plugin-react
```

## Data Architecture Notes

### Cricsheet JSON to PostgreSQL Mapping
- Match → `matches` table (one row per match)
- Innings → `innings` table (linked to match)
- Over → `overs` table (linked to innings)
- Ball → `balls` table (the atomic unit - every delivery)
- This normalized schema enables efficient queries for career stats, head-to-head, venue analysis

### Query Patterns for Cricket Analytics
1. **Career Stats**: Aggregations on `balls` table filtered by player_id
2. **Match Analysis**: Joins across matches → innings → overs → balls
3. **Venue Stats**: Group by venue_id with date ranges
4. **Partnerships**: Window functions for running totals

### Recommended Database Indexes
```sql
-- Essential for player career queries
CREATE INDEX idx_balls_bowler ON balls(bowler_id, match_id);
CREATE INDEX idx_balls_batsman ON balls(striker_id, match_id);

-- For venue/date analysis  
CREATE INDEX idx_matches_venue_date ON matches(venue_id, start_date);
CREATE INDEX idx_balls_match_innings ON balls(match_id, innings);
```

## Sources

- **TanStack Query**: https://tanstack.com/query/latest/docs/framework/react/overview (HIGH - Official docs)
- **Supabase Realtime**: https://supabase.com/docs/guides/realtime/postgres-changes (HIGH - Official docs)
- **Recharts**: https://recharts.org/en-US/ (HIGH - Official site, 24.8k GitHub stars)
- **shadcn/ui**: https://ui.shadcn.com/ (HIGH - Official documentation)
- **React Chart Libraries 2025**: https://blog.logrocket.com/best-react-chart-libraries-2025/ (MEDIUM - Industry analysis)
- **Cricsheet Data**: https://cricsheet.org/ (HIGH - Data source documentation)
