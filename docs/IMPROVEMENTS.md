# Improvements Roadmap

Notes from a quick pass. Pick a few that match your current goal and ignore the rest.

## 1) Data Capture and Persistence
- ~~Persist sessions to a backend~~ **Done** (Supabase integration)
- ~~Add local persistence fallback~~ **Done** (localStorage write-through)
- ~~Provide export buttons for CSV/JSON~~ **Done** (Analytics Dashboard CSV export)
- ~~Store per-session metadata~~ **Done** (meta JSONB field in sessions table)
- ~~Record prompt text alongside each image~~ **Done** (prompt field in rating_scores)

## 2) Analysis and Reporting
- ~~Add per-image aggregate stats: mean, median, std dev, distribution histogram~~ **Done** (ImageAggregateStats component)
- Add cross-method comparisons (individual vs group vs ranked vs pairwise).
- Provide per-user consistency checks (variance, repeatability).
- Add "exclude benchmark" toggle in results tables.
- ~~Add outlier detection for extreme ratings or fast completions~~ **Done** (detectOutliers in statsUtils.js)

## 3) Experimental Design and Rigor
- Randomize image order for individual and group rating flows.
- Randomize pair order and left/right positions in pairwise flow.
- Counterbalance benchmark placement (not always first).
- Add attention checks (simple "obvious" items to detect low-effort responses).
- Collect confidence rating per answer (low/med/high).
- Add minimum viewing time before enabling "Next."

## 4) UX and Flow
- ~~Add a progress indicator~~ **Done** (ProgressBar + ProgressIndicator components)
- Add a review/undo step for the last selection.
- ~~Add clear completion summary and next actions after submit~~ **Done** (CompletionSummary component)
- ~~Show prompt text alongside images in all rating modes~~ **Done**
- ~~Add keyboard shortcuts~~ **Done** (1-5 ratings, arrows to navigate)
- Improve mobile layouts for card grids and ranking lists.

## 5) Accessibility
- Ensure all images have alt text and ARIA labels.
- Improve contrast for selected states and feedback.
- Provide non-color cues for selection (icons or outlines).
- Support keyboard-only navigation for all flows.
- Add focus management when switching steps.

## 6) Performance and Reliability
- Lazy-load images to reduce initial load time.
- Preload next image to reduce wait during rating.
- Use responsive image sizes for mobile vs desktop.
- Add error boundaries to prevent full-app crashes.
- Add analytics for slow renders or long image load times.

## 7) Engineering and Code Quality
- Add unit tests for Results context and page logic.
- Add integration tests for flows using Playwright/Cypress.
- Type safety (TypeScript or JSDoc types for session shapes).
- Centralize image data and prompts in a single config file.
- Extract shared UI components (rating card, prompt header).
- Enforce lint rules and formatting (ESLint + Prettier).

## 8) Security and Privacy
- ~~Provide consent notice before data collection~~ **Done** (ConsentModal component)
- ~~Add a privacy note for stored data~~ **Done** (PrivacySettings page)
- ~~Add a "delete my data" flow~~ **Done** (clearAllData in Results.jsx)

## 9) Deployment and Ops
- Add environment-based config (dev vs prod settings).
- Add CI pipeline for lint/tests/build.
- Add static hosting instructions (Vercel/Netlify).

## 10) Future Features (Optional)
- ~~Add multi-task sessions (combine pairwise + ranked in one flow)~~ **Done** (ComboRatingFlow)
- Add annotations or free-text feedback per image.
- Add "explain why you chose this" capture for qualitative data.
- Support multiple datasets (prompt sets) with dynamic switching.
- ~~Add admin dashboard with filters and data export~~ **Done** (AnalyticsDashboard)
