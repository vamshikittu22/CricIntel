# Architecture

**Analysis Date:** 2026-03-10

## Pattern Overview

**Overall:** Client-side React SPA with Supabase backend-as-a-service

**Key Characteristics:**
- Single Page Application (SPA) using React 18 + TypeScript
- Serverless backend via Supabase (PostgreSQL + auto-generated API)
- React Query for server state management
- Client-side routing via React Router v6

## Layers

### Presentation Layer (React + Tailwind)
- Location: `src/`
- Contains: React components, pages, UI primitives
- Depends on: React Query hooks, Supabase client
- Used by: Browser

### Data Access Layer (React Query + Supabase)
- Location: `src/lib/hooks/usePlayers.ts`
- Contains: Custom hooks wrapping `useQuery` for data fetching
- Depends on: `@tanstack/react-query`, Supabase client
- Used by: Components, pages

### API Layer (Supabase Client)
- Location: `src/integrations/supabase/client.ts`
- Contains: Auto-generated Supabase client typed with Database types
- Depends on: `@supabase/supabase-js`
- Used by: React Query hooks

### Database Layer (Supabase PostgreSQL)
- Location: `supabase/migrations/`
- Contains: Tables (players, matches, deliveries, match_player_stats, player_stats_summary), Views (player_recent_matches_view), Enums
- Tables: 6 core tables, 1 view, 11 enum types

## Data Flow

**Player Search Flow:**
1. User types in `SearchBar` component (`src/components/SearchBar.tsx`)
2. `usePlayerSearch` hook fires with debounced query
3. Hook calls Supabase `players` table with ILIKE filter
4. Results rendered as dropdown in SearchBar
5. On selection, navigate to `/player/:id`

**Player Profile Load Flow:**
1. Route matches `/player/:id`
2. `PlayerProfile` page (`src/pages/PlayerProfile.tsx`) loads
3. Three parallel queries fire:
   - `usePlayer` - fetches player details
   - `usePlayerSummary` - fetches career stats by format
   - `usePlayerRecentMatches` - fetches match-by-match data
4. Data passed to child components (BattingDashboard, BowlingTab, etc.)
5. Charts rendered with Recharts

**Data Import Flow (ETL):**
1. Cricsheet JSON files in `data/` folder
2. `npm run import:cricsheet` executes `scripts/import-cricsheet.ts`
3. Script parses JSON, aggregates per-match stats
4. Upserts to: `players`, `matches`, `match_player_stats`
5. Computes `player_stats_summary` career aggregates

## Key Abstractions

**React Query Hooks:**
- Purpose: Server state management with caching
- Examples: `usePlayers.ts` - `usePlayer`, `usePlayerSearch`, `usePlayerSummary`, `usePlayerRecentMatches`, `useFeaturedPlayers`
- Pattern: Custom hooks wrapping `useQuery` with typed query keys

**Database Types:**
- Purpose: Type-safe Supabase responses
- Location: `src/integrations/supabase/types.ts`
- Pattern: Auto-generated from Supabase schema via `createClient<Database>()`

**Component Organization:**
- Pattern: Feature-based folders under `src/components/`
- Feature folders: `batting/`, `bowling/`, `profile/`, `form/`, `weaknesses/`, `fielding/`
- UI primitives: `src/components/ui/` (shadcn/ui components)

## Entry Points

**Frontend Entry:**
- Location: `src/main.tsx`
- Triggers: Browser loads SPA
- Responsibilities: Mounts React app, wraps with QueryClientProvider, BrowserRouter, TooltipProvider

**App Router:**
- Location: `src/App.tsx`
- Triggers: URL changes
- Responsibilities: Defines routes (/, /player/:id, /player/:id/history, /compare, *)

**Data Import Script:**
- Location: `scripts/import-cricsheet.ts`
- Triggers: `npm run import:cricsheet`
- Responsibilities: ETL from Cricsheet JSON to Supabase

## Error Handling

**Data Fetching:**
- Pattern: React Query throws errors, components display `EmptyState` or skeletons
- `src/components/ui/empty-state.tsx` - reusable empty state

**Supabase Errors:**
- Pattern: `if (error) throw error;` in hooks
- No centralized error boundary currently

## Cross-Cutting Concerns

**Routing:** React Router v6 (`react-router-dom`)

**State Management:** React Query for server state, local component state for UI

**Validation:** Zod forms (`@hookform/resolvers`, `zod`)

**Authentication:** Supabase Auth (configured but not actively used - public data)

**Theming:** `next-themes` with dark/light mode toggle

**Animations:** Framer Motion (`framer-motion`)

---

*Architecture analysis: 2026-03-10*
