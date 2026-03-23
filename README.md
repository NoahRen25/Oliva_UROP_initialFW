# Oliva Group Image Rating Platform

A React-based visual cognition experiment platform for collecting and analyzing image ratings across multiple methodologies.

## Features

- **8+ Rating Modes**: Individual, pairwise comparison, ranked ordering, best-worst scaling, selection, pressure cooker (timed pairwise), combo protocol, and grid/layout rating
- **Eye Tracking**: WebGazer.js integration with 9-point calibration, gaze smoothing (EMA + outlier rejection), and real-time visualization
- **Analytics Dashboard**: Session metrics, timeline charts, mode breakdown, data quality analysis, image-level statistics, and CSV export
- **Voice Recording**: In-browser speech-to-text transcription with per-page recording history
- **Data Persistence**: Supabase (Postgres + Storage) with localStorage fallback
- **Consent & Privacy**: Built-in consent modal, privacy settings page, and data deletion

## Prerequisites

- Node.js (v18+)
- npm

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the project root:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   The app works without Supabase (falls back to localStorage only).
4. For full Supabase setup, see `docs/SUPABASE_SETUP.md` and run `scripts/supabase-schema.sql` in the SQL editor.
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Open `http://localhost:5173`

## Key Routes

| Route | Page |
|-------|------|
| `/` | Home - navigation hub |
| `/rate/upload` | Upload JSON config for any mode |
| `/individual-rate` | Individual image rating |
| `/pairwise-rate` | Pairwise comparison |
| `/ranked-rate` | Ranked ordering |
| `/best-worst-rate` | Best-worst scaling |
| `/selection-rate` | Image selection |
| `/pressure-cooker` | Timed pairwise (pressure cooker) |
| `/combo-rate` | Combo multi-mode protocol |
| `/rate` | Grid/layout rating (manual) |
| `/analytics` | Analytics dashboard |
| `/webgazer-calibration` | Eye tracking calibration |
| `/webgazer-gaze-test` | Gaze visualization test |
| `/grid-results` | Grid & combo results |
| `/mode-results` | Mode-specific results |
| `/dataset-manager` | Image upload management |
| `/privacy` | Privacy settings & data deletion |

## Data Storage

- **Supabase** (primary): Sessions, scores, pairwise choices, rankings, best-worst trials, and transcripts stored in Postgres with RLS policies. Images stored in Storage buckets.
- **localStorage** (fallback): All session data mirrored locally for offline or no-Supabase operation.

## Project Structure

```
src/
├── Webpages/          # Page components (rating flows, results, tools)
├── components/        # Reusable components
│   └── analytics/     # Analytics dashboard sub-components
├── services/          # Supabase CRUD operations
├── utils/             # WebGazer context, gaze smoother, stats, transforms
├── hooks/             # Custom hooks (page transcription)
├── App.jsx            # Router, theme, layout
└── Results.jsx        # Global state context (all session data)
docs/                  # Supabase setup and architecture guides
scripts/               # Database schema SQL, image upload utility
```

## Technologies

- React 19 + React Router 7
- Material UI 7 (MUI)
- Recharts (analytics charts)
- PapaParse (CSV export)
- Supabase (backend-as-a-service)
- WebGazer.js (eye tracking)
- Vite (build tool)
