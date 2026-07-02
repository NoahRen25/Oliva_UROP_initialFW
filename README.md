# OlivaGroupFW — Image & Video Rating Research Platform

A browser-based framework for running human-subject studies on AI-generated images and videos. Participants rate media through several formats (individual sliders, pairwise comparison, ranking, selection, and multi-image grids) while the app optionally records **webcam-based eye tracking** (WebGazer.js) and **voice think-aloud recordings**. All results are persisted to **Supabase** and can be explored in a built-in researcher analytics dashboard.

Built as part of a UROP with the Oliva group.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Variables](#environment-variables)
3. [Supabase Setup](#supabase-setup)
4. [How a Study Session Works](#how-a-study-session-works)
5. [Rating Modes](#rating-modes)
6. [Gaze Tracking](#gaze-tracking)
7. [Voice Recording](#voice-recording)
8. [Roles: Participant / Researcher / Admin](#roles-participant--researcher--admin)
9. [Repository Layout](#repository-layout)
10. [Data Model](#data-model)
11. [Study Config Files (`config/`)](#study-config-files-config)
12. [Media Assets](#media-assets)
13. [Offline Analysis (`src/analysis/`)](#offline-analysis-srcanalysis)
14. [Testing & Linting](#testing--linting)
15. [Deployment Notes](#deployment-notes)
16. [Troubleshooting](#troubleshooting)

---

## Quick Start

Prerequisites: [Node.js](https://nodejs.org) (LTS). Check with `node -v`.

```bash
npm install            # install all dependencies (React 19, MUI, Supabase, etc.)
cp .env.example .env   # then fill in your Supabase credentials (see below)
npm run dev            # start Vite dev server → http://localhost:5173
```

Other scripts:

```bash
npm run build      # production build → dist/
npm run preview    # serve the production build locally
npm test           # run vitest unit tests once
npm run test:watch # run tests in watch mode
npm run lint       # eslint
```

The app **runs without Supabase configured** (the client is null and most write calls no-op or log errors), which is fine for poking at the UI — but nothing is persisted and auth/dashboards won't work. For real use, set up Supabase first.

## Environment Variables

Create `.env` at the project root (same level as `src/`, see `.env.example`):

```
VITE_SUPABASE_URL=<your Supabase project URL>
VITE_SUPABASE_ANON_KEY=<your Supabase anon public key>
```

`.env` is git-ignored. Both values come from the Supabase dashboard → Project Settings → API.

## Supabase Setup

The app uses Supabase **Postgres** (results), **Auth** (researcher/admin logins), **Storage** (images, videos, audio recordings), and one **Edge Function** (user invites).

1. Create a Supabase project and copy the URL + anon key into `.env`.
2. Run the schema SQL in the Supabase SQL editor. The most complete/most recent schema lives in `scripts/supabase-schema.sql`; the `scripts/*-migration.sql` files add later features (gaze sessions table, audio storage bucket, RLS policy updates). `docs/supabase_schema.sql` is an earlier version kept for reference.
3. Create storage buckets (private unless noted): `experiment-images`, `mem-images`, `videos` (public), and the audio recordings bucket (see `scripts/migrate-audio-bucket.sql`).
4. Enable Email auth. Roles are assigned by inserting rows into the `user_roles` table (`email` → `admin` or `researcher`).
5. (Optional) Deploy `supabase/functions/invite-user` so admins can invite new researchers from the Admin Control Panel.
6. Upload the memorability image set to the `mem-images` bucket with `node scripts/upload-images.mjs` (reads local `public/mem_images/`).

Step-by-step details: `docs/SUPABASE_SETUP.md` and `docs/SUPABASE_DOCS.md`.

## How a Study Session Works

The participant-facing flow is the **guided session**:

1. Participant opens the site → `Home` → clicks **Start Rating** → `/start` (`GuidedSessionWelcome`): enters a username, consents, and calibrates WebGazer.
2. The app loads the active study configuration from the `mode_config` table (which modes run, in what order, how many items each, image vs. video media). Falls back to defaults in `src/services/modeConfig.js` if unreachable.
3. `src/utils/guidedFlow.js` chains the enabled rating pages together, passing a `uploadConfig` object through `location.state`. Each rating page calls `nextGuidedNavigation()` when done instead of routing to its own results page. Steps can require a quick gaze-accuracy re-check (`CalibrationCheck`) before starting.
4. Throughout, gaze data and per-page voice transcripts/audio are captured; a speed check (`checkEngagement` in `src/Results.jsx`) warns participants who click through too fast.
5. After the last step the participant lands on `/thank-you`, and everything has been written to Supabase.

Researchers configure step order/counts/media-mode live from the **Admin Control Panel** (`/admin/control-panel`), which writes `mode_config`.

Individual rating pages can also be launched standalone (see routes in `src/App.jsx`), usually seeded by uploading a JSON config on `/rate/upload` (see [Study Config Files](#study-config-files-config)).

## Rating Modes

| Mode | Image route | Video route | Participant task |
|---|---|---|---|
| Individual | `/individual-rate` | `/video-individual-rate` | Slide a 0–100 score for one item at a time |
| Pairwise | `/pairwise-rate` | `/video-pairwise-rate` | Pick the better of two items (reaction time recorded) |
| Ranked | `/ranked-rate` | `/video-ranked-rate` | Order a set of items best→worst (swap or select style) |
| Selection | `/selection-rate` | — | Select all items matching a prompt |
| Group grid | `/group-grid-rate` | `/video-group-grid-rate` | Rate a whole page of images laid out in a grid (2x2, 3x3, 4x4, …) |
| Combo | `/combo-rate` | — | Combined multi-step flow with its own results page |
| Layout flow | `/rate`, `/rate/grid` | — | Grid rating driven by uploaded config (`LayoutRatingFlow`) |

Grid layout definitions (dimensions, tile counts) live in `src/data/gridConstants.js`. Video modes share the image logic but load media via `src/utils/VideoLoader.js` from `public/videos/` + `manifest.json` (or the Supabase `videos` bucket).

## Gaze Tracking

Webcam eye tracking uses [WebGazer.js](https://webgazer.cs.brown.edu/) — a vendored copy is served from `public/webgazer/webgazer.js`.

- `src/utils/WebGazerContext.jsx` — global provider: loads the script, starts/stops the tracker, throttles gaze updates to ~30 FPS, persists calibration to localStorage.
- `/webgazer-calibration` — click-based 9-point calibration; `/webgazer-gaze-test` — accuracy test; `/calibration-check` — quick mid-session validation used between guided steps.
- `src/hooks/useGazeTracker.js` + `src/components/GazeTrackingProvider.jsx` / `GazeTrackedImage.jsx` — hit-test the current gaze point against registered image elements and accumulate per-image dwell time, entry/exit counts, and in-image coordinates (for heatmaps).
- `src/components/CalibrationGate.jsx` — blocks a rating page until calibration exists and the tracker is running.
- On submit, each rating page calls `saveGazeSession()` (`src/utils/gazeStorage.js`) which writes to the `gaze_sessions` table.
- Researchers explore the data in the Gaze Analytics dashboard (`src/Webpages/GazeAnalyticsSection.jsx` + `src/components/analytics/Gaze*`): heatmaps, dwell charts, timelines, data-quality panels, CSV export.

Design/context docs: `docs/gaze-tracking-session-context.md`, `docs/plans/`, `docs/superpowers/specs/`.

## Voice Recording

A floating microphone widget (`src/components/VoiceRecorder.jsx`, mounted in `App.jsx`) appears on rating routes. It uses the browser SpeechRecognition API for live transcription and MediaRecorder for audio capture. `VoiceRecorderContext` tracks which rating page the participant is on so transcripts/audio are attributed **per page**; audio blobs upload to Supabase Storage (`src/services/supabaseAudioStorage.js`) and transcripts to the `transcripts` table. `/transcripts` shows recording history; `src/analysis/transcribe_recordings.py` can re-transcribe audio offline with Whisper-style tooling.

## Roles: Participant / Researcher / Admin

- **Participants** don't log in — they just enter a username at the start of a guided session. A consent modal (`ConsentModal`) gates all data collection; `/privacy` lets them revoke consent and delete their data.
- **Researchers / Admins** sign in via Supabase email auth (`LoginButton`); their role comes from the `user_roles` table (`src/utils/AuthContext.jsx`).
  - `/researcher` — `ResearcherView`: session browser and results tables.
  - `/researcher/simulate` — generate simulated sessions for testing dashboards.
  - `/admin/control-panel` — configure the guided flow (`mode_config`), invite users (via the `invite-user` edge function), manage data.
  - Results dashboards: `/grid-results`, `/mode-results`, `/combo-results`.
- `/set-password` — landing page for invited users completing signup.

## Repository Layout

```
├── index.html                 # Vite entry HTML
├── vite.config.js             # Vite + React plugin config
├── vitest.config.js           # Test runner config (jsdom)
├── eslint.config.js           # Lint rules
├── .env / .env.example        # Supabase credentials (git-ignored / template)
├── config/                    # Ready-made study config JSONs to upload on /rate/upload
│   ├── Individual|Pairwise|Ranked|Selection/   # per-mode examples (5/10/15 items)
│   └── group/<layout>/        # grid-mode configs per layout & memorability range
├── docs/                      # Setup guides, schema reference, design docs, roadmap
├── scripts/                   # Supabase schema + migrations, image upload script
├── supabase/functions/        # Edge functions (invite-user)
├── public/
│   ├── webgazer/webgazer.js   # Vendored WebGazer build (served as-is)
│   ├── mem_images/            # Memorability dataset images (LaMem-style targets)
│   ├── images/<model>/        # AI-generated study images (flux_2_pro, etc.)
│   └── videos/ + manifest.json# Video stimuli, organized by model folder
├── src/
│   ├── main.jsx               # React entry point
│   ├── App.jsx                # Providers, theme, app bar, ALL route definitions
│   ├── Results.jsx            # ResultsProvider — global session store, hydrates from Supabase
│   ├── supabaseClient.js      # Shared Supabase client (null if env vars missing)
│   ├── services/              # Supabase persistence (results, audio, mode_config)
│   ├── utils/                 # Contexts (WebGazer, Auth), guided flow, loaders, transforms
│   ├── hooks/                 # useGazeTracker, useVideoFleet, useAutoVoiceRecording
│   ├── components/            # Shared UI + rating-flow building blocks
│   │   └── analytics/         # Researcher dashboard charts/panels (recharts)
│   ├── Webpages/              # One component per route (rating pages, results, admin)
│   ├── data/                  # gridConstants, memorability CSV + hook, prompt CSVs
│   └── analysis/              # Offline Python/Jupyter analysis of exported results
└── dist/                      # Build output (committed for convenience; regenerate with npm run build)
```

## Data Model

All persistence goes through `src/services/supabaseResults.js` and the `ResultsProvider` in `src/Results.jsx` (React state is hydrated from Supabase on load and kept in sync on every write). Main tables:

| Table | Contents |
|---|---|
| `sessions` | One row per completed rating session: `id` (Date.now), `type` (`individual`, `group`, `layout_group`, `fixed`, `pairwise`, `video_pairwise`, `ranked`, `selection`), `username`, `timestamp`, `meta` (JSON: per-page transcripts/audio URLs, layoutId, prompt, …) |
| `rating_scores` | Per-image scores for slider/grid/selection sessions (score, time spent, interaction count, click order, memorability scores, image src) |
| `pairwise_choices` | Winner/loser per pair with reaction time and timeout flag |
| `ranked_results` | Final rank per image for ranked sessions |
| `transcripts` | Voice transcript entries (text, duration, timestamp) |
| `gaze_sessions` | Per-session gaze data: per-image dwell/entries/coordinates, per-page aggregates |
| `mode_config` | Single `active` row defining the guided flow (steps + media mode) |
| `user_roles` | email → `admin`/`researcher` |
| `images` | Metadata for images uploaded via Dataset Manager |

## Study Config Files (`config/`)

`/rate/upload` (`UnifiedUploadPage`) accepts a JSON file describing a standalone session, e.g.:

```json
{
  "type": "individual",        // individual | pairwise | ranked | selection |
                               // video_pairwise | a grid layout id (2x2, 3x3, …)
  "count": 5,                  // number of items (or pages for grids)
  "prompt": "Rate how accurately this image depicts the described scene",
  "minScore": 0.4,             // grid modes: memorability-score range to sample from
  "maxScore": 0.8,
  "showRating": true,
  "rankMode": "select"         // ranked mode UI variant: "select" | "swap"
}
```

The `config/` tree contains ready-made examples: per-mode files named `<count>_<mode>.json` and grid configs under `config/group/<layout>/<imageCount>_<minScore>-<maxScore>.json`.

## Media Assets

- **Memorability images** (`public/mem_images/`, ~1k JPGs) are sampled by grid modes according to the score ranges in `src/data/memorability_scores.csv` (loaded by `src/data/useMemImages.js`). In production they're served from the `mem-images` Supabase bucket (`src/utils/supabaseImageUrl.js` decides local vs. remote).
- **Generated images** (`public/images/<model>/`) with matching prompt CSVs in `src/data/` compare text-to-image models (flux_2_pro, gpt-image-1.5, nano_banana_pro).
- **Videos** (`public/videos/<model>/*.mp4` + `manifest.json`) — same filename across model folders = same prompt rendered by different models; the pairwise builder relies on this. Prompt spreadsheet lives alongside the videos.

## Offline Analysis (`src/analysis/`)

Python/Jupyter material for analyzing exported results (not part of the web build):

- `analysis.py` — stats/plots over exported session CSVs.
- `combo_analysis-2.ipynb` — notebook for combo-session results (`combo_results_all-2.csv`).
- `transcribe_recordings.py` — batch speech-to-text for downloaded audio recordings.

The dashboards also export CSVs directly in the browser (`ExportCSVButton`, `GazeExport`, `DashboardExport`).

## Testing & Linting

- `npm test` — Vitest + Testing Library (jsdom). Existing suites: `src/utils/guidedFlow.test.js`, `src/hooks/useGazeTracker.test.js`.
- `npm run lint` — ESLint 9 flat config with React hooks/refresh plugins.

## Deployment Notes

- `npm run build` outputs a static site to `dist/` — deployable to any static host (Netlify, Vercel, GitHub Pages with SPA fallback). All backend interaction happens client-side via the Supabase anon key + RLS.
- The site must be served over **HTTPS** (or localhost) for webcam (WebGazer) and microphone (voice recorder) permissions to work.
- `public/` is copied verbatim into the build, so the full image/video set ships with the site; consider moving large media to Supabase Storage only.

## Troubleshooting

- **Blank data / nothing saves** — check `.env` values and restart `npm run dev` (Vite only reads env at startup). `src/supabaseClient.js` silently exports `null` when unset.
- **WebGazer never initializes** — camera permission denied, or the page isn't HTTPS/localhost. Check the console for "WebGazer script failed to load" (the script is served from `public/webgazer/`).
- **Calibration constantly invalid** — calibration is stored in localStorage (`webgazerCalibrationData`); clearing site data forces recalibration.
- **Grid config rejects an upload** — the `type` must match a key in `src/data/gridConstants.js` or one of the rating modes listed in `UnifiedUploadPage`.
- **Guided flow skips a mode** — check the `mode_config` row in Supabase (or the Admin Control Panel); disabled steps are carried but skipped.
