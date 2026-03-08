
# CricIntel - Phase 1: MVP Foundation

## Overview
Build the player search, profile card, and batting analytics dashboard using Lovable Cloud (Supabase) with seeded sample data and Recharts-based visualizations.

## Database Setup (Supabase/PostgreSQL)
- **players** table: name, country, role, batting_style, bowling_style, photo_url, date_of_birth
- **matches** table: match date, format (Test/ODI/T20), venue, teams, result
- **deliveries** table: match_id, innings, over, ball, batter, bowler, runs_batter, runs_extras, wicket_type, ball_length, ball_line, shot_type, is_boundary, is_six — this is the core granular data table
- **batting_analytics** (view or materialized): pre-computed career stats per player per format (matches, runs, avg, SR, 50s, 100s, dots, 4s, 6s, dismissal types)
- Seed ~15-20 real players (Kohli, Smith, Babar, etc.) with ~200-500 realistic deliveries each

## Pages & Components

### 1. Landing / Search Page
- App header with CricIntel branding (teal primary color scheme)
- Prominent search bar with autocomplete dropdown (searches by player name, filterable by country)
- Featured/popular players grid below search for quick access
- Clean, modern sports analytics aesthetic

### 2. Player Profile Page (`/player/:id`)
- **Player Card**: Photo, name, country flag, role badge, batting/bowling style
- **Format Toggle**: Test | ODI | T20 tabs that filter all data
- **Career Summary Stats**: Matches, runs, average, strike rate, 50s/100s in stat cards
- **Form Score Widget**: Color-coded 0-10 score based on last 10 innings (calculated from deliveries data)
- **Last 10 Matches Mini-Table**: Date, opponent, runs, balls, SR, result

### 3. Batting Analytics Dashboard (tab within player page)
- **Wagon Wheel**: Recharts polar/scatter chart overlaid on an SVG cricket field outline showing boundary distribution by scoring zone. Filterable by shot type, bowler type (pace/spin), match phase
- **Dismissal Breakdown**: Pie/donut chart (caught, bowled, LBW, run out, stumped, etc.)
- **Ball Length Response Matrix**: Color-coded table (green=strength, red=weakness) showing runs scored, balls faced, SR, and dismissals for each length category (yorker, full, good, short, bouncer)
- **Phase-wise Performance**: Cards for Powerplay (1-6), Middle (7-15), Death (16-20) showing runs, average, SR, boundary %
- **Pace vs Spin Split**: Side-by-side comparison cards with runs, balls, average, SR against fast vs spin

## Design
- **Color scheme**: Teal primary (#20B2AA), green for strengths, red for weaknesses, slate neutrals
- **Dark mode support** via CSS variables
- Mobile responsive layout
- Card-based UI with shadcn/ui components

## Data Seeding
- Edge function or SQL seed script with realistic data for ~15 international cricket players across all 3 formats
- Deliveries data modeled to produce meaningful analytics patterns (e.g., Kohli strong against pace in powerplay, weaker against spin in middle overs)

## Key Interactions
- Search with debounced autocomplete
- Format toggle updates all stats/charts instantly
- Wagon wheel filters (shot type, bowler type, phase) update visualization
- Clicking on chart elements shows detail tooltips
- Responsive tables with horizontal scroll on mobile
