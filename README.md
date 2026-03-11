# CricIntel — Cricket Player Analytics

## Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud (Supabase)
- **Charts**: Recharts
- **Animations**: Framer Motion

## Getting Started

```sh
npm install
npm run dev
```

## Cricsheet Data Import

This app uses [Cricsheet](https://cricsheet.org/) JSON data as its canonical input format.

### Setup

1. Download JSON match files from Cricsheet
2. Place them in a `data/` folder with subfolders by format:
   ```
   data/
   ├── odi/       # ODI matches
   ├── test/      # Test matches
   ├── t20i/      # T20I matches
   └── ipl/       # IPL matches
   ```

3. Set environment variables:
   ```sh
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

4. Run the import:
   ```sh
   npm run import:cricsheet
   # Or specify a custom data directory:
   npx tsx scripts/import-cricsheet.ts ./my-data-folder
   ```

### What gets imported

- **Players** — extracted from Cricsheet registry with name, country, gender
- **Matches** — full metadata (date, venue, teams, result, toss, format)
- **Match Player Stats** — per-match batting/bowling aggregates for each player
- **Player Stats Summary** — career aggregates by format (computed after all matches)

### Supported Formats

- Test
- ODI
- T20I
- IPL (detected via event name)

## Project Structure

```
scripts/
  import-cricsheet.ts    # ETL script for Cricsheet JSON → Supabase
src/
  lib/
    cricsheet.ts         # Cricsheet JSON type definitions
    hooks/usePlayers.ts  # React Query hooks for data fetching
  components/
    batting/             # Batting dashboard components
    bowling/             # Bowling tab components
    form/                # Form tracker components
    weaknesses/          # Weakness analysis components
    fielding/            # Fielding tab components
    profile/             # Player profile components
  pages/
    Index.tsx            # Home page with search & featured players
    PlayerProfile.tsx    # Player analytics dashboard
    Compare.tsx          # Side-by-side player comparison
    MatchHistory.tsx     # Innings log & trends
```
