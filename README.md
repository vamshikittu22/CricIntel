# CricIntel | Professional Cricket Analytics 🏏

**CricIntel** is an elite, high-performance cricket intelligence platform designed to decode the game through professional-grade ball-by-ball analytics. It transforms raw data into actionable tactical insights, providing a premium experience for player scouting, match analysis, and performance tracking.

---

## 🚀 Elite Feature Suite

### 1. Tactical Match Intelligence (Match Center)
- **Combat Scorecard**: Real-time deployment yield analysis for batters and bowlers.
- **H2H Analytics**: Historical head-to-head performance matrices including strike rate trends and dismissal patterns.
- **Leaders & Milestones**: Automatic detection of match-defining performances and momentum shifts.

### 2. Player Intelligence Profiles
- **Momentum Intelligence Index**: A normalized [1-10] rating system that analyzes active form, strike rate efficiency, and "Resilience Quotients".
- **Multi-Format Versatility**: Seamlessly pivot between career-aggregated "All" stats or granular Test, ODI, T20I, and IPL statistics.
- **Tactical Briefing Engine**: Automated deployment advice based on historical weaknesses and strength vectors.

### 3. Professional Data Ingestion
- **Automated Bowler Classification**: Advanced descriptor-based detection for "Pace vs Spin" classification (detecting legbreak, offbreak, arm, etc.).
- **Persisted Stats Engine**: Ball-by-ball processing that persists complex metrics like Phase Stats and Bowling Type splits.

### 4. Premium UI/UX
- **High-Contrast Aesthetics**: Optimized dark and light modes using semantic theme variables for elite readability.
- **Micro-Animations**: Smooth transitions powered by Framer Motion for a liquid interface feel.
- **Responsive Visualization**: Dynamic charts using Recharts for visual performance analysis.

---

## 🛠️ The Tech Stack

- **Framework**: React 18 + Vite (SPA)
- **Typing**: TypeScript (Strict Persistence)
- **Styling**: Tailwind CSS + Custom Design Tokens
- **State & Data**: React Query + Supabase (PostgreSQL)
- **Motion**: Framer Motion
- **Visuals**: Recharts + Lucide React
- **Ingestion**: Node.js TSX Pipeline

---

## ⚙️ Engineering Setup

### 1. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Required for Ingestion Pipeline
```

### 2. Dependency Management
```bash
npm install
```

### 3. Bootstrapping the Schema
Apply migrations from `supabase/migrations/` to your project to establish the core entities:
- `players` | `matches` | `match_player_stats` | `player_stats_summary` | `player_vs_bowling_type`

### 4. Deployment Launch
```bash
npm run dev
```

---

## 📊 High-Yield Data Ingestion (Cricsheet)

CricIntel leverages ball-by-ball data from [Cricsheet](https://cricsheet.org/).

1. Populate `data/` with Cricsheet JSON dumps (e.g., `data/t20s_json`).
2. Execute the professional ingestion pipeline:

```bash
# General Syntax
npm run import:cricsheet <PATH_TO_JSON_FOLDER>

# Example: Process T20 Data
npm run import:cricsheet ./data/t20s_json
```

---

*CricIntel Engineering — Precision Driven Analytics*
