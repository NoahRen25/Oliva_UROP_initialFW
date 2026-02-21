# Gaze Tracking Integration for Image Rating Modes

**Date:** 2026-02-21
**Status:** Approved

## Goal

Add WebGazer-based gaze tracking to all 8 image rating modes so that when a user evaluates images, we record which image they looked at, when, for how long, and where within the image (for heatmap generation).

## Requirements

- **Modes:** All 8 (Individual, Pairwise, Ranked, Best-Worst, Selection, Group, Grid/Layout, Combo)
- **Data captured per image:** Total gaze time, first gaze timestamp, entry/exit counts, relative (x,y) coordinates
- **Calibration:** Required before rating starts (skip if already calibrated)
- **Storage:** localStorage only (`app_gaze_sessions` key), no Supabase sync

## Approach

Hook + Image Ref Registry. A `useGazeTracker` hook subscribes to `currentGaze` from the existing `WebGazerContext`, hit-tests against registered image DOM elements at 30 FPS, and accumulates per-image gaze data.

## Data Model

```javascript
GazeSessionData = {
  sessionId: string,          // matches the rating session ID
  mode: string,               // "individual", "pairwise", "grid", etc.
  username: string,
  startTime: ISO timestamp,
  endTime: ISO timestamp,
  images: {
    [imageId: string]: {
      firstGazeTime: number,      // ms since session start
      totalGazeTime: number,      // ms total dwell time
      gazeEntries: number,        // how many times gaze entered this image
      gazeExits: number,          // how many times gaze left this image
      coordinates: [              // for heatmaps
        { x: number, y: number, t: number }
        // x,y are 0-1 relative to image bounds, t is ms since session start
      ]
    }
  }
}
```

Stored in localStorage under `app_gaze_sessions` as an array.

## New Files

### `src/hooks/useGazeTracker.js`

Core hook that:
- Subscribes to `currentGaze` from `WebGazerContext`
- Maintains an image registry (Map of imageId to DOM ref + bounding rect)
- Runs hit-testing at 30 FPS against registered images
- Accumulates per-image gaze data (duration, entries/exits, coordinates)
- Exposes `registerImage(id, ref)`, `unregisterImage(id)`, `getGazeData()`, `resetGazeData()`

### `src/components/GazeTrackingProvider.jsx`

Context provider that wraps rating flows. Holds gaze tracker state so all `GazeTrackedImage` children can register themselves.

### `src/components/GazeTrackedImage.jsx`

Wrapper component that registers any image element for gaze tracking. Drop-in replacement for image display during rating.

### `src/components/CalibrationGate.jsx`

Checks if WebGazer is calibrated before allowing the rating flow. Shows "Calibration Required" screen with redirect to `/webgazer-calibration`. Passes through immediately if already calibrated.

## Modified Files

Each of the 8 rating components receives minimal changes:
- Wrap with `GazeTrackingProvider`
- Replace image elements with `GazeTrackedImage`
- Call `getGazeData()` on session submit and save to localStorage
- Add `CalibrationGate` before the rating step

### `src/App.jsx`

Update auto-stop logic: WebGazer stays active on all rating routes, not just `/webgazer-*` routes. Auto-stop only on non-rating, non-webgazer routes.

## Integration Flow

1. User enters rating page
2. `CalibrationGate` checks `isCalibrated` from `WebGazerContext`
3. If not calibrated: show prompt, redirect to calibration, return after
4. If calibrated: WebGazer starts tracking, `GazeTrackingProvider` initializes
5. `GazeTrackedImage` components register on mount, unregister on unmount
6. `useGazeTracker` polls `currentGaze` at 30 FPS, hit-tests registered images
7. On gaze hit: accumulate dwell time, record relative (x,y), track entry/exit
8. On page transitions within a flow: old images unregister, new ones register, data accumulates
9. On final submit: save full `GazeSessionData` to `app_gaze_sessions` in localStorage

## Performance

- Bounding rects recalculated on scroll/resize events, not every frame
- Coordinates stored as 0-1 ratios (display-size independent)
- 30 FPS hit-testing is lightweight (just `getBoundingClientRect` comparisons)

## Out of Scope

- Gaze data visualization / heatmap rendering
- Supabase sync for gaze data
- Gaze replay / animation
- Modifying the existing WebGazer calibration flow
