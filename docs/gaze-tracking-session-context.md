# Gaze Tracking Integration - Session Context

**Last Updated:** 2026-02-21
**Branch:** `henrystesting`

## What Was Built

WebGazer.js-based gaze tracking was integrated into all 8 image rating modes in the OlivaGroupFW app. When a user evaluates images, the system now records which image they looked at, when, for how long, and where within the image (for heatmap generation).

## New Files Created

| File | Purpose |
|------|---------|
| `src/hooks/useGazeTracker.js` | Core hook: subscribes to `currentGaze` from WebGazerContext, hit-tests registered image DOM elements at 30 FPS, accumulates per-image gaze data (dwell time, entry/exit counts, relative coordinates) |
| `src/components/GazeTrackingProvider.jsx` | React Context provider wrapping `useGazeTracker` so all `GazeTrackedImage` children can register themselves |
| `src/components/GazeTrackedImage.jsx` | Drop-in replacement for MUI `CardMedia` that auto-registers/unregisters images for gaze tracking via refs |
| `src/components/CalibrationGate.jsx` | Gates rating flow on both calibration AND active tracking. Auto-initializes WebGazer when calibrated but not yet started. Shows loading spinner during init, calibration prompt otherwise |
| `src/utils/gazeStorage.js` | localStorage utility for saving/loading gaze sessions under `app_gaze_sessions` key |
| `docs/plans/2026-02-21-gaze-tracking-integration-design.md` | Approved design document |
| `docs/plans/2026-02-21-gaze-tracking-implementation.md` | 15-task implementation plan |

## Modified Files

| File | Change |
|------|--------|
| `src/App.jsx` | Updated `KEEP_WEBGAZER_ROUTES` to include all rating routes so WebGazer stays alive during rating |
| `src/Webpages/IndividualRate.jsx` | Wrapped with CalibrationGate + GazeTrackingProvider, replaced CardMedia with GazeTrackedImage, saves gaze data on submit |
| `src/Webpages/PairwiseRate.jsx` | Same pattern as above |
| `src/Webpages/RankedRate.jsx` | Same pattern as above |
| `src/Webpages/BestWorstRate.jsx` | Same pattern as above |
| `src/Webpages/SelectionRate.jsx` | Same pattern as above |
| `src/components/ImageGrid.jsx` | Same pattern as above |
| `src/components/LayoutRatingFlow.jsx` | Same pattern as above |
| `src/Webpages/ComboRatingFlow.jsx` | Same pattern as above |
| `src/Webpages/PressureCooker.jsx` | Same pattern as above |

## Integration Pattern (applied to each rating mode)

Each rating component was modified with the same pattern:

1. **Import** `GazeTrackingProvider`, `GazeTrackedImage`, `CalibrationGate`, `useGazeTracking`, `saveGazeSession`
2. **Rename** component to `*Inner` (e.g., `IndividualRate` -> `IndividualRateInner`)
3. **Add** `useGazeTracking()` hook inside Inner component to get `startSession`, `getGazeData`
4. **Call** `startSession()` when the user starts rating (e.g., after reading instructions)
5. **Replace** `<CardMedia>` with `<GazeTrackedImage imageId={...}>` for all rated images
6. **Call** `saveGazeSession(sessionId, mode, username, getGazeData())` on submit
7. **Export** wrapper that nests `CalibrationGate` > `GazeTrackingProvider` > `*Inner`

## Data Model

Gaze data is stored in `localStorage` under the key `app_gaze_sessions`:

```javascript
{
  sessionId: string,          // matches the rating session ID
  mode: string,               // "individual", "pairwise", "grid", etc.
  username: string,
  startTime: ISO timestamp,
  endTime: ISO timestamp,
  images: {
    [imageId]: {
      firstGazeTime: number,    // ms since session start
      totalGazeTime: number,    // ms total dwell time
      gazeEntries: number,      // how many times gaze entered this image
      gazeExits: number,        // how many times gaze left this image
      coordinates: [            // for heatmaps
        { x: number, y: number, t: number }
        // x,y are 0-1 relative to image bounds, t is ms since session start
      ]
    }
  }
}
```

## How to Check Gaze Data

After completing a rating session with eye tracking:

1. Open Chrome DevTools (`F12` or `Ctrl+Shift+I`)
2. Go to **Application** tab > **Local Storage** > `http://localhost:5173`
3. Find the `app_gaze_sessions` key

Or paste this in the Console:
```js
JSON.parse(localStorage.getItem('app_gaze_sessions'))
```

## User Flow

1. User navigates to any rating page (e.g., `/individual-rate`)
2. **CalibrationGate** checks if WebGazer is calibrated (`isCalibrated` from localStorage) AND actively tracking (`isTracking`)
3. If not calibrated: shows prompt with "Go to Calibration" button → redirects to `/webgazer-calibration`
4. If calibrated but WebGazer not initialized: auto-calls `initWebGazer()` and shows "Initializing Eye Tracker..." spinner with `CircularProgress`
5. Once `isCalibrated && isTracking` are both true: renders the rating component
6. `GazeTrackedImage` components register on mount, unregister on unmount
7. `useGazeTracker` polls `currentGaze` at 30 FPS, hit-tests registered images
8. On gaze hit: accumulates dwell time, records relative (x,y), tracks entry/exit
9. On final submit: saves full gaze session data to localStorage

## Bugs Fixed

### Session 2 (2026-02-21): Null gaze data in all rating modes

**Problem:** All gaze data saved to localStorage had null/zero values (`firstGazeTime: null`, `totalGazeTime: 0`, empty `coordinates`). No actual eye tracking data was being collected.

**Root Cause:** `CalibrationGate` only checked `isCalibrated` (derived from localStorage). If calibration data existed from a previous session, it immediately rendered the rating components without ensuring WebGazer was initialized. This meant:
- `isTracking` stayed `false` in the WebGazer context
- `currentGaze` stayed `{x: null, y: null}`
- The gaze tracking effect in `useGazeTracker.js` always hit the early return at line 83 (`if (!isTracking || currentGaze.x == null || currentGaze.y == null) return;`)
- No gaze data was ever accumulated

**Fix (commit `fb2be50`):** Updated `CalibrationGate` to:
1. Auto-initialize WebGazer via `useEffect` when `isCalibrated && !isInitialized`
2. Gate children on `isCalibrated && isTracking` (not just `isCalibrated`)
3. Show a loading spinner during WebGazer initialization

## Commits (oldest to newest)

| SHA | Message |
|-----|---------|
| `08e4988` | feat: add GazeTrackingProvider context for image gaze tracking |
| `fdd1861` | feat: add useGazeTracker hook + GazeTrackedImage for per-image gaze data collection |
| `572bccd` | feat: add CalibrationGate to require eye tracking calibration before rating |
| `e554594` | feat: add gaze session localStorage utility |
| `a919ac7` | feat: keep WebGazer alive on rating routes for gaze tracking |
| `c4e52a7` | feat: integrate gaze tracking into IndividualRate |
| `48b43a0` | feat: integrate gaze tracking into PairwiseRate |
| `401ae93` | feat: integrate gaze tracking into RankedRate |
| `202eda3` | feat: integrate gaze tracking into BestWorstRate and SelectionRate |
| `38601d7` | feat: integrate gaze tracking into ImageGrid, LayoutRatingFlow, ComboRatingFlow, and PressureCooker |
| `814222b` | gaze progress for mini games |
| `fb2be50` | fix: auto-initialize WebGazer in CalibrationGate to collect gaze data |

## Out of Scope (not implemented)

- Gaze data visualization / heatmap rendering
- Supabase sync for gaze data
- Gaze replay / animation
- Modifying the existing WebGazer calibration flow

## Tech Stack

- React 19, Vite 7, MUI v7
- WebGazer v2.1.2 (existing integration via `src/utils/WebGazerContext.jsx`)
- React Router v7
- localStorage for gaze data storage
