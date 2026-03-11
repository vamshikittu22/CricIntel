# CricIntel Architecture

This document describes the high-level architecture of the CricIntel application. It covers everything from the database schema and ingestion pipeline to the frontend folder structure and component hierarchy.

---

## 1. High-Level Architecture

```text
          +-------------------------------------------------------+
          |             React Node App (Vite)                     |
          |  [ State Management via Zustand / Hooks ]             |
          |  [ UI driven by Shadcn UI & Framer Motion ]           |
          +-------------------------------------------------------+
                     |                             |
    [React Query for fetching]             [Authentication] 
                     |                             |
                     v                             v
+-----------------------------------------------------------------+
|                    Supabase PostgreSQL Instance                 |
|  (Authenticated Views) ----------- (Anonymous RLS Policies)     |
+-----------------------------------------------------------------+
                               ^
                   [ Node Import Script ]
                               |
                   +-----------------------+
                   | Cricsheet JSON Data   |
                   +-----------------------+
```

### Components:
- **Client Application**: Hosted statically or via a Node process (Vite + React). Displays profiles and performs filtering. Uses `@tanstack/react-query` to cache dynamic responses.
- **Supabase Backend**: Handles the PostgreSQL database layer, provides an API (PostgREST), and enables fast joins between aggregated summaries and raw match data.
- **Ingestion Script**: A bespoke Node/TypeScript automation script that processes JSON files from Cricsheet and upserts heavily aggregated match structures.

---

## 2. Database Schema

The core relational data operates entirely within **Supabase PostgreSQL**.

### Primary Tables:
1. **`players`**:
   - `id` (UUID)
   - `name` (Text), `gender` (Text), `country` (Text)
   - Represents the core identity of a player.
2. **`matches`**:
   - `id` (UUID), `format` (Text), `match_date` (Date)
   - `team1` (Text), `team2` (Text), `venue` (Text), `result` (Text)
   - Stores metadata for a given fixture.
3. **`match_player_stats`**:
   - Junction table linking a `player` to a `match`.
   - Stores granular performance metrics *per innings*:
     - Batting metrics: `bat_runs`, `bat_balls`, `bat_fours`, `bat_sixes`, `bat_not_out`
     - Bowling metrics: `bowl_overs`, `bowl_runs`, `bowl_wickets`, `bowl_maidens`
4. **`player_stats_summary`**:
   - High-level, format-specific aggregates to dramatically speed up frontend dashboard load times.
   - Calculates total runs, overall averages, overall strike rates, and overall economy on insertion.
   - Enables blazing-fast "Top Batters" and "Top Bowlers" queries across genders and formats.

---

## 3. Data Ingestion Pipeline

Data is loaded via a built-in script located at `scripts/import-cricsheet.ts`.

### Workflow:
1. **Extraction**: The script crawls directories of `Cricsheet` JSON fixtures natively exported via their schema.
2. **Transformation**:
   - Isolates individual innings and deliveries.
   - Maps player registries to unique IDs.
   - Summarizes ball-by-ball events into an aggregate object per player for that match (e.g., how many total runs scored, overs bowled, wickets taken).
3. **Upsertion** (Loading):
   - Flushes processed data payload into Supabase `players`.
   - Inserts the `matches` data.
   - Ingests the `match_player_stats` with constraint fallback (`ON CONFLICT DO UPDATE`).
   - Finishes with heavily optimized `player_stats_summary` calculations.

---

## 4. Frontend Component Ecosystem

### Directory Map:
```
src/
├── components/          # Sharable UI modules mapping to distinct functional panels.
│   ├── batting/         # Batting analytical cards + charts.
│   ├── bowling/         # Economy, wickets, and milestone trackers.
│   ├── fielding/        # Fielding statistics templates.
│   ├── form/            # The FormTracker engine (Yearly timelines & Current form).
│   ├── profile/         # The global overview headers and player ID cards.
│   ├── ui/              # The ShadCN + Headless primitives (Buttons, Cards, Badges).
│   └── weaknesses/      # The Tactical Briefing logic.
├── hooks/               # Application-level toast wrappers + device state logic.
├── lib/
│   ├── countryFlags.ts  # Maps string countries to regional flag emojis.
│   ├── safeStorage.ts   # Safely interacts with local storage gracefully in hardened browser modes.
│   └── hooks/
│       └── usePlayers.ts # The centralized React Query store wrapping Supabase endpoints.
├── pages/
│   ├── Index.tsx        # The main dashboard with leaderboards and search filtering.
│   ├── MatchHistory.tsx # A drill-down view of historical fixtures for a player.
│   └── PlayerProfile.tsx# The main container injecting data down into specialized tabs.
```

### Specialized Analytics Engines:
- **`FormTracker.tsx` (Batting) & `BowlingFormTracker.tsx` (Bowling)**: 
  Parses recent `match_player_stats` arrays on the fly to establish a proprietary **Form Score** (out of 10), factoring in recent runs/strike rates or wickets/economy rates from the last 20 innings.
- **`WeaknessesTab.tsx`**:
  An artificial intelligence simulation rule-engine. It evaluates key metrics (e.g. Strike Rate > 140, Economy > 9, Balls per wicket > 40) directly from the summary dataset and calculates a confidence score to output tailored "Tactical Advice". It generates automated strategy briefings targeted at opposing players (i.e. How to bowl to an aggressive batsman, or how to survive a destructive bowler).

---

## 5. Website Architecture

The frontend follows a multi-page, Single Page Application (SPA) architecture driven by React Router. 

### Core Pages:
1. **Landing Page (`/`)**: 
   - **Hero Section**: Global Search functionality to find players quickly.
   - **Leaderboards**: Dynamically ranked horizontal carousels displaying the top 10 Batters and Bowlers based on the user's selected Format (Test, ODI, T20) and Gender filters.
   - **Explore Nations**: Interactive buttons to browse the database filtered by specific countries, using dynamic flag mappings.
   - **Recent Activity**: Displays global recent matches injected by the database.

2. **Player Profile Page (`/player/:id`)**:
   - Acts as the central hub for all analytical components. It extracts the raw player UUID from the URL params and hydrates the entire page.
   - **Profile Header**: Displays the player's core identity (Name, Team, Role image layout).
   - **Sticky Navigation**: A customized scrolling spy navigation bar to jump between `Overview`, `Batting`, `Bowling`, `Fielding`, `Form`, & `Weaknesses`.
   - **Modular Content Tabs**: Depending on the currently active tab or scroll position, specific UI cards are unmounted or lazy-loaded for performance using `AnimatePresence` and `motion.div` from Framer Motion.

---

## 6. Code Flow & Data Lifecycle

The application follows a strictly unidirectional data flow via React Hooks and Supabase connections.

```text
  [ User ] 
     │   1. Selects "T20" Format via pill switch
     ▼
  [ Frontend UI ]
     │   2. Invokes React Query: request top players (`queryKey: ["top-batters", format]`)
     ▼
  [ React Query Cache ] ──(Cache Hit?)──► [ UI Instantly Renders ]
     │ 
     │   3. (Cache Miss / Stale)
     ▼
  [ Supabase Client ]
     │   4. Execute `.from('player_stats_summary')` optimized call
     ▼
  [ PostgreSQL Database ]
     │   5. Runs SQL query over indexed data & computes RLS rules
     ▼
  [ Supabase Client ]  ◄── Returns Top 10 rows (JSON)
     │
     ▼
  [ React Query ]      ◄── Caches the payload
     │
     ▼
  [ Frontend UI ]      ◄── Triggers state redraw. Visualizes top batters in carousel.
```

### Lifecycle Breakdown:
1. **User Interaction**: User lands on the page or clicks a filter (e.g. changing format to "T20I").
2. **State Updates**: React Context / Hooks (`useState`) recognize the new format constraint.
3. **Query Invalidation/Fetching**: The `useQuery` hooks built in `src/lib/hooks/usePlayers.ts` immediately trigger requests against the active `queryKey`.
4. **Supabase Fetch**: The client hits the PostgREST API seamlessly. It maps over heavily optimized database views and materialized tables (`player_stats_summary`).
5. **Data Transformation**: The returned arrays are fed into functional components (charts, lists, tactic briefing engines). Some modules (like `FormTracker`) take raw recent unaggregated matches and run heavy array manipulations locally using `useMemo` to ensure zero-lag recalculations.
6. **Rendering**: Shadcn primitives render the structure alongside Tailwind utility classes while Framer Motion handles the enter/exit UI animations.
