# Gaze Analytics Design Spec

**Date:** 2026-03-30
**Status:** Draft
**Audience:** Researchers + participants (accessible summaries with researcher-grade detail)

## Problem

The gaze tracker collects rich per-image eye tracking data (dwell time, entry/exit counts, normalized coordinates) during every minigame session, but there is no UI to view this data. It sits in localStorage (`app_gaze_sessions`) with no visualization, no export, and no integration with the existing analytics dashboard.

## Solution

Add gaze analytics in two locations:

1. **Summary panels** on the existing `/analytics` dashboard — quick KPIs and mode-level overview
2. **Dedicated `/gaze-analytics` page** — session drill-down with heatmaps, timelines, dwell charts, and export

---

## Part 1: Dashboard Summary Panels (`/analytics`)

Add 2 new panels to `AnalyticsDashboard.jsx`, below existing panels.

### Panel: GazeOverviewMetrics

KPI card row (same style as `OverviewMetrics.jsx`):

| Card | Value | Source |
|------|-------|--------|
| Gaze Sessions | Total count of gaze sessions | `getGazeSessions().length` |
| Avg Dwell Time | Mean `totalGazeTime` across all images in all sessions | Computed from `images[id].totalGazeTime` |
| Avg Gaze Entries | Mean `gazeEntries` per image across all sessions | Computed from `images[id].gazeEntries` |
| Images Tracked | Unique image IDs across all gaze sessions | Count unique keys in `images` |

### Panel: GazeByMode

Recharts `BarChart` (same style as `ModeBreakdown.jsx`):

- X-axis: mode (individual, pairwise, ranked, best-worst, selection, combo, grid)
- Y-axis: average total dwell time per session (ms → seconds)
- Uses `MODE_COLORS` from existing code
- Tooltip: mode, session count, avg dwell time, avg entries

### New Transform: `buildGazeOverview(gazeSessions)`

Returns:
```js
{
  totalSessions: number,
  avgDwellTime: number,        // ms
  avgGazeEntries: number,
  uniqueImages: number,
  byMode: [
    { mode, sessions, avgDwellTime, avgEntries }
  ]
}
```

---

## Part 2: Dedicated Gaze Analytics Page (`/gaze-analytics`)

New route and page component.

### Layout

```
┌─────────────────────────────────────────────────┐
│  Session Picker (mode filter + session dropdown) │
├─────────────────────────────────────────────────┤
│  KPI Cards (aggregate or per-session)            │
├──────────────────────┬──────────────────────────┤
│  Dwell Time Chart    │  Gaze Timeline            │
│  (BarChart)          │  (AreaChart)              │
├──────────────────────┴──────────────────────────┤
│  Attention Heatmaps (image grid with canvas)     │
├─────────────────────────────────────────────────┤
│  Export (CSV)                                    │
└─────────────────────────────────────────────────┘
```

### Component: GazeSessionPicker

- Mode filter dropdown: All / Individual / Pairwise / Ranked / Best-Worst / Selection / Combo / Grid
- Session dropdown: lists sessions matching mode filter, showing `username — timestamp`
- "All Sessions (Aggregate)" option for cross-session view
- State: `selectedMode`, `selectedSessionId`

### Component: GazeKPICards

When **aggregate** (no specific session selected):
- Total gaze sessions, avg dwell time, avg entries/exits, most-viewed image (by total dwell)

When **specific session** selected:
- Session duration, total images tracked, total gaze time, total gaze entries

### Component: GazeDwellChart

Recharts horizontal `BarChart`:
- Y-axis: image names (sorted by dwell time, most attention at top)
- X-axis: total dwell time (seconds)
- Bar color intensity: mapped to gaze entry count (more entries = warmer)
- Tooltip: image name, dwell time (s), entries, exits, first gaze time (s)
- In aggregate mode: shows sum/average across all sessions per image

### Component: GazeTimeline

Recharts `AreaChart`:
- X-axis: elapsed time from session start (seconds)
- Y-axis: categorical — which image is being gazed at
- Implementation: sample the gaze coordinates at 100ms intervals, determine which image each point belongs to, render as colored bands
- Each image gets a distinct color
- Only shown when a specific session is selected (not in aggregate mode)
- Legend shows image-to-color mapping

### Component: GazeHeatmap

Canvas-based heatmap overlay on images:
- Renders each tracked image from the session in a responsive grid
- On top of each image: HTML `<canvas>` element at matching dimensions
- Draws gaze density using normalized coordinates from `images[id].coordinates`
- Algorithm:
  1. Create a 2D density grid (e.g., 50x50 cells)
  2. For each coordinate `{x, y}`, increment the cell it falls into
  3. Apply Gaussian blur (kernel radius ~3 cells) for smoothing
  4. Map density values to color scale: transparent → blue → green → yellow → red
  5. Draw to canvas with `globalAlpha` for semi-transparency over the image
- Click to expand: opens a modal/dialog with larger image + heatmap
- Shows image name and total dwell time below each thumbnail
- **Image URL resolution**: Gaze sessions store `imageId` but not the image URL. The heatmap component will attempt to resolve URLs by matching `imageId` against the current rating session data (from `useResults()`). If the image URL cannot be resolved, show a placeholder gray rectangle with the imageId label and the heatmap overlay still rendered on top.

### Component: GazeExport

CSV export buttons (follows `DashboardExport.jsx` pattern using papaparse):
- **Session-level CSV**: sessionId, mode, username, startTime, endTime, totalImages, totalDwellTime
- **Image-level CSV**: sessionId, imageId, dwellTime, gazeEntries, gazeExits, firstGazeTime, coordinateCount
- **Raw coordinates CSV**: sessionId, imageId, x, y, t (for researchers who want raw data)

### New Transforms: `src/utils/gazeTransforms.js`

```js
buildGazeOverview(gazeSessions)
// → { totalSessions, avgDwellTime, avgGazeEntries, uniqueImages, byMode[] }

buildDwellChart(gazeSession | gazeSessions)
// → [{ imageName, dwellTime, entries, exits, firstGazeTime }] sorted by dwellTime desc

buildGazeTimeline(gazeSession)
// → [{ time (s), imageId }] sampled at 100ms intervals from coordinates

buildHeatmapData(gazeSession, imageId)
// → { grid: number[][], maxDensity: number } — 50x50 density grid for one image

flattenForExport(gazeSessions, level: "session" | "image" | "coordinates")
// → row arrays ready for papaparse
```

---

## Routing & Navigation

### New route in `App.jsx`:
```
/gaze-analytics → GazeAnalyticsPage
```

### Navigation updates:
- Add "Gaze Analytics" link on Home page under **Lab Tools** section (next to Eye Tracking)
- Add link from dashboard gaze summary panels to `/gaze-analytics` ("View detailed gaze analytics →")

---

## File Plan

### New files:
| File | Purpose |
|------|---------|
| `src/Webpages/GazeAnalyticsPage.jsx` | Main page component with session picker + panel layout |
| `src/components/analytics/GazeOverviewMetrics.jsx` | KPI cards for dashboard summary |
| `src/components/analytics/GazeByMode.jsx` | Mode bar chart for dashboard summary |
| `src/components/analytics/GazeKPICards.jsx` | KPI cards for dedicated page (session-aware) |
| `src/components/analytics/GazeDwellChart.jsx` | Per-image dwell time horizontal bar chart |
| `src/components/analytics/GazeTimeline.jsx` | Time-series chart of gaze attention |
| `src/components/analytics/GazeHeatmap.jsx` | Canvas heatmap overlay on images |
| `src/components/analytics/GazeExport.jsx` | CSV export for gaze data |
| `src/components/analytics/GazeSessionPicker.jsx` | Mode + session filter dropdowns |
| `src/utils/gazeTransforms.js` | Transform functions for gaze data |

### Modified files:
| File | Change |
|------|--------|
| `src/Webpages/AnalyticsDashboard.jsx` | Import and render GazeOverviewMetrics + GazeByMode panels |
| `src/App.jsx` | Add `/gaze-analytics` route |
| `src/Webpages/Home.jsx` | Add Gaze Analytics link to Lab Tools section |

---

## Styling

- Follow existing dashboard conventions: MUI `<Paper>` with `p: 3`, responsive grid
- Fonts: Syne for headers, JetBrains Mono for data/labels
- Colors: Use `MODE_COLORS` for mode-related charts, heatmap uses custom gradient (transparent → blue → green → yellow → red)
- Responsive: panels stack vertically on mobile

## Dependencies

- **No new dependencies** — Recharts already available, Canvas is native browser API, papaparse already available for CSV export

## Verification

1. Run `npm run build` — no errors
2. Navigate to `/analytics` — verify gaze KPI cards and mode chart appear with data
3. Navigate to `/gaze-analytics` — verify session picker, all 4 panels render
4. Complete a minigame session → verify gaze data appears in both locations
5. Test heatmap rendering — verify canvas overlay aligns with image
6. Test CSV export — verify all 3 export levels produce valid CSV
7. Test with no gaze data — verify graceful empty states ("No gaze sessions recorded yet")
