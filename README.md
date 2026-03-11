# CricIntel 🏏

CricIntel is a comprehensive and visually stunning web application for analyzing cricket player statistics across all formats (Test, ODI, T20I). Built with modern web technologies and a robust database backend, it offers deep tactical insights, form tracking, and rich visualizations.

## 🚀 Key Features

- **Format Specific Dashboards**: Seamlessly toggle between Test, ODI, and T20I statistics.
- **Gender Integration**: Explore stats for both Men's and Women's cricket.
- **Comprehensive Player Profiles**:
  - **Overall Summary**: High-level snapshot of a player's career.
  - **Batting Analytics**: In-depth look at runs, strike rates, boundaries, and dismissal types.
  - **Bowling Analytics**: Wickets, economy rates, best figures, and milestone tracking.
  - **Form Tracker**: Visual timelines and year-by-year breakdowns to analyze a player's recent runs or wickets, complete with calculated "Form Scores".
  - **Tactical Briefing (Weaknesses/Strengths)**: A rule-based analysis engine that detects patterns (like low strike rates or high economies) and generates actionable tactical advice on how to bowl to a batter or bat against a bowler.
- **Country Navigation**: Filter and browse players by their national teams with integrated dynamic flag fetching.
- **Dark/Light Mode**: First-class support for theme toggling using a custom safe storage implementation.

## 🛠️ Tech Stack

- **Frontend Core**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Data Fetching/Caching**: React Query (`@tanstack/react-query`)
- **Routing**: React Router DOM
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend / Database**: Supabase (PostgreSQL)
- **Data Scripts**: `tsx` for running Typescript data ingestion scripts locally.

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- npm or yarn
- A Supabase account and project.

### 2. Environment Variables
Create a `.env` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Only needed for running the import script
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup
Run the migrations found in `supabase/migrations` inside your Supabase project's SQL editor, or link your project via the Supabase CLI to push the migrations. This sets up the following schema:
- `players`
- `matches`
- `match_player_stats`
- `player_stats_summary`

### 5. Running the Application
```bash
npm run dev
```

## 📊 Data Ingestion (Cricsheet Data)

The application tracks detailed ball-by-ball analysis summarized at a per-match level. The data source used is [Cricsheet](https://cricsheet.org/). We support ingesting data natively via our custom pipeline script.

1. Download the JSON data dumps from Cricsheet and place them in the `data/` folder (e.g. `data/tests_json`, `data/odis_json`, `data/t20s_json`).
2. Run the ingestion script for the specific format you want to process. (Make sure your `SUPABASE_SERVICE_ROLE_KEY` is set in your environment variables for bulk upsert bypassing RLS).

```bash
# Example for T20 Data
npm run import:cricsheet ./data/t20s_json
```

## 🤝 Contributing
Contributions are welcome! Feel free to open issues or submit pull requests for new features, bug fixes, or performance improvements.
