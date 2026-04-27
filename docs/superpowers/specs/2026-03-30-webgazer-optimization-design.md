# WebGazer Optimization Design

## Context

The app uses WebGazer.js 3.4.0 for webcam-based eye tracking. The latest version is 3.5.3, which fixes bugs in the Kalman filter (double-wrapping) and ridge regression (coefficient assignment) — both directly affect prediction accuracy. Additionally, the current implementation has a double-smoothing pipeline (WebGazer Kalman + custom EMA) that adds latency, ~100 lines of duplicated save logic across 4 call sites, hardcoded pixel thresholds that break on varied screen sizes, and no pre-flight compatibility checks.

This optimization targets both accuracy and responsiveness equally, keeps the existing 9-point calibration, supports varied devices (general public), and cleans up the codebase.

## Changes

### 1. Upgrade WebGazer to 3.5.3 + Switch to weightedRidge

**Files:** `package.json`, `public/webgazer/webgazer.js`, `src/utils/WebGazerContext.jsx`

- Replace bundled `public/webgazer/webgazer.js` with v3.5.3 build
- Update `package.json` dependency from `^3.4.0` to `^3.5.3`
- Change `webgazer.setRegression('ridge')` to `webgazer.setRegression('weightedRidge')` in `WebGazerContext.jsx:123`

`weightedRidge` decays old calibration samples so recent interactions carry more weight. Better for sessions where users shift position — the model self-corrects over time.

3.5.3 fixes:
- `for..in` array traversal in smoothing loop (incorrect circular buffer)
- Duplicate matrix declaration in ridge regression
- Coefficient assignment using scalar values instead of row arrays
- Double-wrapping in Kalman filter update
- Dead code cleanup

### 2. Simplify Smoothing Pipeline

**Files:** `src/utils/gazeSmoother.js`

Current pipeline:
```
WebGazer Kalman (buggy) -> Outlier rejection -> EMA -> Velocity dampening -> React state
```

New pipeline:
```
WebGazer Kalman (fixed 3.5.3) -> Outlier rejection -> React state
```

Changes to `GazeSmoother`:
- **Keep:** Outlier/blink rejection (stage 1) with 3-consecutive-reject reset logic
- **Remove:** EMA smoothing, adaptive velocity dampening, `_history` ring buffer, `_alpha`/`_baseAlpha`, `_warmupFrames`
- **Change:** Outlier threshold from fixed `300px` to `15% of viewport diagonal`, recalculated on each `process()` call (no resize listener needed — viewport dimensions are cheap to read):
  ```js
  const diag = Math.hypot(window.innerWidth, window.innerHeight);
  const threshold = diag * 0.15;
  ```
- **Keep:** `reset()` method, `requestAnimationFrame` batching in the updater

The `GazeSmoother` class becomes ~40 lines (down from ~120) — just outlier rejection with a viewport-aware threshold.

### 3. Consolidate Save Logic

**Files:** `src/utils/WebGazerContext.jsx`

Current state: identical ~25-line save block copy-pasted in 4 locations:
- `saveCalibrationData()` (lines 290-332)
- `stopCamera()` (lines 444-469)
- `handleBeforeUnload` (lines 511-538)
- Unmount cleanup (lines 553-578)

Changes:
- Extract one `persistCalibration(webgazerInstance)` helper
- Drop dual-key localStorage redundancy (`CALIBRATION_DATA_KEY` + `WEBGAZER_DEFAULT_KEY`). WebGazer's `saveDataAcrossSessions(true)` handles persistence via IndexedDB/localforage natively. The manual mirroring was a workaround for uncertain save behavior.
- Keep `CALIBRATION_TIMESTAMP_KEY` for "last calibrated" tracking
- Simplify `hasStoredCalibration()` to check `WEBGAZER_DEFAULT_KEY` only
- All 4 save sites call `persistCalibration()` instead of inline logic

Result: ~100 lines removed, single save path.

### 4. Add Compatibility Pre-Check

**Files:** `src/utils/WebGazerContext.jsx`

Add to `initWebGazer()` before `webgazer.begin()`:
- Call `webgazer.detectCompatibility()` — returns false if browser lacks required APIs
- Call `navigator.mediaDevices.enumerateDevices()` — verify a video input device exists
- If either fails, set a clear error message: "Your browser doesn't support eye tracking" or "No camera detected"

Currently, unsupported browsers get a cryptic error from WebGazer internals.

## Files Modified

| File | Change |
|------|--------|
| `package.json` | Bump webgazer to `^3.5.3` |
| `public/webgazer/webgazer.js` | Replace with 3.5.3 build |
| `src/utils/WebGazerContext.jsx` | weightedRidge, consolidated save, compat check |
| `src/utils/gazeSmoother.js` | Strip to outlier rejection only, viewport-relative threshold |

## Files NOT Modified

- `src/Webpages/WebGazerCalibration.jsx` — no changes needed, 9-point grid stays as-is
- `src/hooks/useGazeTracker.js` — consumes `currentGaze` from context, unaffected
- `src/components/GazeDebugOverlay.jsx` — visualization only, unaffected
- `src/components/CalibrationGate.jsx` — gate logic unaffected

## Verification

1. **Build:** `npm run build` succeeds with no errors
2. **Calibration flow:** Complete 9-point calibration, verify points register correctly
3. **Gaze tracking:** After calibration, verify gaze dot follows eye movement with less jitter and similar/lower latency compared to current
4. **Session persistence:** Complete calibration, navigate away, return — calibration should be preserved
5. **Page reload:** Reload page — calibration data should survive via `saveDataAcrossSessions`
6. **Incompatible browser test:** Test on a browser without getUserMedia — should show clear error, not crash
7. **Multi-resolution:** Test on different screen sizes — outlier rejection threshold should adapt
