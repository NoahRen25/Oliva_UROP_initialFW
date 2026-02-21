# Gaze Tracking Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate WebGazer eye tracking into all 8 image rating modes, recording per-image gaze duration, entry/exit counts, and relative (x,y) coordinates for heatmap generation.

**Architecture:** A `GazeTrackingProvider` context + `useGazeTracker` hook subscribes to `currentGaze` from the existing `WebGazerContext`, hit-tests against registered image DOM elements, and accumulates per-image gaze data. A `GazeTrackedImage` wrapper component auto-registers images. A `CalibrationGate` component blocks rating flows until WebGazer calibration is complete.

**Tech Stack:** React 19, WebGazer.js (already integrated), MUI v7, localStorage

---

### Task 1: Create `useGazeTracker` hook

**Files:**
- Create: `src/hooks/useGazeTracker.js`

**Step 1: Create the hook file**

```javascript
// src/hooks/useGazeTracker.js
import { useRef, useCallback, useEffect } from 'react';
import { useWebGazer } from '../utils/WebGazerContext';

const GAZE_SAMPLE_INTERVAL = 1000 / 30; // 30 FPS

export default function useGazeTracker() {
  const { currentGaze, isTracking } = useWebGazer();

  // Registry: Map<imageId, { ref: HTMLElement, rect: DOMRect }>
  const registryRef = useRef(new Map());
  // Gaze data: Map<imageId, { firstGazeTime, totalGazeTime, gazeEntries, gazeExits, coordinates }>
  const gazeDataRef = useRef(new Map());
  // Track which image the gaze is currently on (for entry/exit detection)
  const currentlyGazedRef = useRef(null);
  // Session start time
  const sessionStartRef = useRef(null);
  // Last gaze update timestamp (for dwell time calculation)
  const lastGazeTimeRef = useRef(null);
  // Cached bounding rects (refreshed on scroll/resize)
  const rectsRef = useRef(new Map());
  const rectsDirtyRef = useRef(true);

  // Mark rects as needing refresh on scroll/resize
  useEffect(() => {
    const markDirty = () => { rectsDirtyRef.current = true; };
    window.addEventListener('scroll', markDirty, true);
    window.addEventListener('resize', markDirty);
    return () => {
      window.removeEventListener('scroll', markDirty, true);
      window.removeEventListener('resize', markDirty);
    };
  }, []);

  const refreshRects = useCallback(() => {
    if (!rectsDirtyRef.current) return;
    for (const [id, entry] of registryRef.current) {
      if (entry.ref) {
        rectsRef.current.set(id, entry.ref.getBoundingClientRect());
      }
    }
    rectsDirtyRef.current = false;
  }, []);

  const registerImage = useCallback((imageId, ref) => {
    registryRef.current.set(imageId, { ref });
    rectsDirtyRef.current = true;
    // Initialize gaze data for this image if not present
    if (!gazeDataRef.current.has(imageId)) {
      gazeDataRef.current.set(imageId, {
        firstGazeTime: null,
        totalGazeTime: 0,
        gazeEntries: 0,
        gazeExits: 0,
        coordinates: [],
      });
    }
  }, []);

  const unregisterImage = useCallback((imageId) => {
    registryRef.current.delete(imageId);
    rectsRef.current.delete(imageId);
    // Do NOT delete gaze data — it accumulates across pages
  }, []);

  const startSession = useCallback(() => {
    sessionStartRef.current = performance.now();
    lastGazeTimeRef.current = null;
    currentlyGazedRef.current = null;
    gazeDataRef.current = new Map();
  }, []);

  const getGazeData = useCallback(() => {
    const images = {};
    for (const [id, data] of gazeDataRef.current) {
      images[id] = { ...data, coordinates: [...data.coordinates] };
    }
    return {
      startTime: sessionStartRef.current
        ? new Date(Date.now() - (performance.now() - sessionStartRef.current)).toISOString()
        : null,
      endTime: new Date().toISOString(),
      images,
    };
  }, []);

  const resetGazeData = useCallback(() => {
    gazeDataRef.current = new Map();
    currentlyGazedRef.current = null;
    lastGazeTimeRef.current = null;
    sessionStartRef.current = performance.now();
  }, []);

  // Main gaze processing loop
  useEffect(() => {
    if (!isTracking || currentGaze.x == null || currentGaze.y == null) {
      return;
    }
    if (!sessionStartRef.current) {
      sessionStartRef.current = performance.now();
    }

    const now = performance.now();
    const elapsed = now - sessionStartRef.current;

    // Refresh cached rects if dirty
    refreshRects();

    // Hit-test: find which image (if any) the gaze is on
    let hitImageId = null;
    for (const [id, rect] of rectsRef.current) {
      if (
        currentGaze.x >= rect.left &&
        currentGaze.x <= rect.right &&
        currentGaze.y >= rect.top &&
        currentGaze.y <= rect.bottom
      ) {
        hitImageId = id;
        break;
      }
    }

    // Calculate dwell time delta
    const timeDelta = lastGazeTimeRef.current != null
      ? now - lastGazeTimeRef.current
      : 0;
    lastGazeTimeRef.current = now;

    const prevGazed = currentlyGazedRef.current;

    // Handle exit from previous image
    if (prevGazed && prevGazed !== hitImageId) {
      const prevData = gazeDataRef.current.get(prevGazed);
      if (prevData) {
        prevData.gazeExits += 1;
      }
    }

    // Handle current hit
    if (hitImageId) {
      let data = gazeDataRef.current.get(hitImageId);
      if (!data) {
        data = {
          firstGazeTime: null,
          totalGazeTime: 0,
          gazeEntries: 0,
          gazeExits: 0,
          coordinates: [],
        };
        gazeDataRef.current.set(hitImageId, data);
      }

      // Entry detection
      if (prevGazed !== hitImageId) {
        data.gazeEntries += 1;
      }

      // First gaze
      if (data.firstGazeTime == null) {
        data.firstGazeTime = elapsed;
      }

      // Accumulate dwell time
      if (prevGazed === hitImageId && timeDelta > 0) {
        data.totalGazeTime += timeDelta;
      }

      // Record relative coordinate
      const rect = rectsRef.current.get(hitImageId);
      if (rect && rect.width > 0 && rect.height > 0) {
        data.coordinates.push({
          x: (currentGaze.x - rect.left) / rect.width,
          y: (currentGaze.y - rect.top) / rect.height,
          t: elapsed,
        });
      }
    }

    currentlyGazedRef.current = hitImageId;
  }, [currentGaze, isTracking, refreshRects]);

  return {
    registerImage,
    unregisterImage,
    startSession,
    getGazeData,
    resetGazeData,
  };
}
```

**Step 2: Verify file was created**

Run: `ls src/hooks/useGazeTracker.js`
Expected: File exists

**Step 3: Commit**

```bash
git add src/hooks/useGazeTracker.js
git commit -m "feat: add useGazeTracker hook for per-image gaze data collection"
```

---

### Task 2: Create `GazeTrackingProvider` context

**Files:**
- Create: `src/components/GazeTrackingProvider.jsx`

**Step 1: Create the context provider**

```jsx
// src/components/GazeTrackingProvider.jsx
import React, { createContext, useContext } from 'react';
import useGazeTracker from '../hooks/useGazeTracker';

const GazeTrackingContext = createContext(null);

export function useGazeTracking() {
  const context = useContext(GazeTrackingContext);
  if (!context) {
    throw new Error('useGazeTracking must be used within a GazeTrackingProvider');
  }
  return context;
}

export default function GazeTrackingProvider({ children }) {
  const gazeTracker = useGazeTracker();

  return (
    <GazeTrackingContext.Provider value={gazeTracker}>
      {children}
    </GazeTrackingContext.Provider>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/GazeTrackingProvider.jsx
git commit -m "feat: add GazeTrackingProvider context for image gaze tracking"
```

---

### Task 3: Create `GazeTrackedImage` component

**Files:**
- Create: `src/components/GazeTrackedImage.jsx`

**Step 1: Create the wrapper component**

This is a drop-in wrapper that auto-registers any image for gaze tracking. It renders a MUI `CardMedia` (or a plain `img`) and attaches a ref that gets registered with the gaze tracker.

```jsx
// src/components/GazeTrackedImage.jsx
import React, { useRef, useEffect } from 'react';
import { CardMedia } from '@mui/material';
import { useGazeTracking } from './GazeTrackingProvider';

export default function GazeTrackedImage({ imageId, ...props }) {
  const ref = useRef(null);
  const { registerImage, unregisterImage } = useGazeTracking();

  useEffect(() => {
    if (ref.current && imageId) {
      registerImage(imageId, ref.current);
    }
    return () => {
      if (imageId) {
        unregisterImage(imageId);
      }
    };
  }, [imageId, registerImage, unregisterImage]);

  return <CardMedia ref={ref} {...props} />;
}
```

**Step 2: Commit**

```bash
git add src/components/GazeTrackedImage.jsx
git commit -m "feat: add GazeTrackedImage wrapper for auto-registering images"
```

---

### Task 4: Create `CalibrationGate` component

**Files:**
- Create: `src/components/CalibrationGate.jsx`

**Step 1: Create the gate component**

```jsx
// src/components/CalibrationGate.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebGazer } from '../utils/WebGazerContext';
import {
  Container, Paper, Typography, Button, Box, CircularProgress,
} from '@mui/material';

export default function CalibrationGate({ children }) {
  const navigate = useNavigate();
  const { isCalibrated, isInitialized, initWebGazer, error } = useWebGazer();

  // If calibrated, render children directly
  if (isCalibrated) {
    return <>{children}</>;
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Eye Tracking Calibration Required
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Before starting the rating session, you need to calibrate the eye
          tracker. This ensures accurate gaze data collection.
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/webgazer-calibration')}
          >
            Go to Calibration
          </Button>
          {!isInitialized && (
            <Button
              variant="outlined"
              onClick={initWebGazer}
            >
              Initialize WebGazer
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/CalibrationGate.jsx
git commit -m "feat: add CalibrationGate to require eye tracking calibration before rating"
```

---

### Task 5: Create gaze data save utility

**Files:**
- Create: `src/utils/gazeStorage.js`

**Step 1: Create the localStorage utility**

```javascript
// src/utils/gazeStorage.js
const GAZE_STORAGE_KEY = 'app_gaze_sessions';

export function saveGazeSession(sessionId, mode, username, gazeData) {
  const sessions = getGazeSessions();
  sessions.push({
    sessionId,
    mode,
    username,
    startTime: gazeData.startTime,
    endTime: gazeData.endTime,
    images: gazeData.images,
  });
  localStorage.setItem(GAZE_STORAGE_KEY, JSON.stringify(sessions));
}

export function getGazeSessions() {
  try {
    const data = localStorage.getItem(GAZE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function clearGazeSessions() {
  localStorage.removeItem(GAZE_STORAGE_KEY);
}
```

**Step 2: Commit**

```bash
git add src/utils/gazeStorage.js
git commit -m "feat: add gaze session localStorage utility"
```

---

### Task 6: Update `App.jsx` auto-stop logic

**Files:**
- Modify: `src/App.jsx:110-121`

**Step 1: Update `WebGazerAutoStop` to keep WebGazer alive on rating routes**

Replace the `WebGazerAutoStop` component (lines 110-121) with a version that checks if the current route is a rating route or webgazer route:

```jsx
// Replace lines 110-121 in src/App.jsx
const KEEP_WEBGAZER_ROUTES = [
  '/webgazer',
  '/individual-rate',
  '/pairwise-rate',
  '/ranked-rate',
  '/best-worst-rate',
  '/selection-rate',
  '/rate',
  '/combo-rate',
  '/pressure-cooker',
];

function WebGazerAutoStop() {
  const location = useLocation();
  const { endWebGazer, isInitialized } = useWebGazer();

  useEffect(() => {
    const shouldKeep = KEEP_WEBGAZER_ROUTES.some(route =>
      location.pathname.startsWith(route)
    );
    if (!shouldKeep && isInitialized) {
      endWebGazer();
    }
  }, [location.pathname, endWebGazer, isInitialized]);

  return null;
}
```

**Step 2: Verify the app still loads**

Run: `npm run dev` (should already be running)
Navigate to home page — WebGazer should NOT start.
Navigate to any rating route — WebGazer should NOT be killed.

**Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: keep WebGazer alive on rating routes for gaze tracking"
```

---

### Task 7: Integrate gaze tracking into `IndividualRate`

**Files:**
- Modify: `src/Webpages/IndividualRate.jsx`

**Step 1: Add imports and wrap with gaze tracking**

At the top of the file, add imports:

```javascript
import GazeTrackingProvider, { useGazeTracking } from "../components/GazeTrackingProvider";
import GazeTrackedImage from "../components/GazeTrackedImage";
import CalibrationGate from "../components/CalibrationGate";
import { saveGazeSession } from "../utils/gazeStorage";
```

**Step 2: Wrap the component export**

Rename the current default export to `IndividualRateInner` and wrap it:

```jsx
function IndividualRateInner() {
  // ... existing component code with modifications below
}

export default function IndividualRate() {
  return (
    <CalibrationGate>
      <GazeTrackingProvider>
        <IndividualRateInner />
      </GazeTrackingProvider>
    </CalibrationGate>
  );
}
```

**Step 3: Use gaze tracking inside the inner component**

At the top of `IndividualRateInner`, add:

```javascript
const { startSession, getGazeData } = useGazeTracking();
```

In the instructions step `onNext` callback (where `startTimer()` is called), also call `startSession()`:

```javascript
onNext={() => { setActiveStep(2); startTimer(); startSession(); }}
```

**Step 4: Replace `CardMedia` with `GazeTrackedImage`**

Replace the `<CardMedia>` at line 200-203:

```jsx
<GazeTrackedImage
  imageId={currentImg.id}
  component="img"
  image={currentImg.src}
  sx={{ objectFit: "contain", height: "auto", maxHeight: "60vh" }}
/>
```

**Step 5: Save gaze data on session submit**

In the `handleNext` function, where `addIndividualSession(username, updatedScores)` is called (around line 108), add gaze data saving:

```javascript
} else {
  const sessionId = Date.now().toString();
  addIndividualSession(username, updatedScores);
  saveGazeSession(sessionId, "individual", username, getGazeData());
  setActiveStep(4);
}
```

**Step 6: Verify the app compiles without errors**

Open `http://localhost:5174/individual-rate` — should show CalibrationGate if not calibrated, or username entry if calibrated.

**Step 7: Commit**

```bash
git add src/Webpages/IndividualRate.jsx
git commit -m "feat: integrate gaze tracking into IndividualRate"
```

---

### Task 8: Integrate gaze tracking into `PairwiseRate`

**Files:**
- Modify: `src/Webpages/PairwiseRate.jsx`

**Step 1: Add imports**

```javascript
import GazeTrackingProvider, { useGazeTracking } from "../components/GazeTrackingProvider";
import GazeTrackedImage from "../components/GazeTrackedImage";
import CalibrationGate from "../components/CalibrationGate";
import { saveGazeSession } from "../utils/gazeStorage";
```

**Step 2: Wrap with CalibrationGate and GazeTrackingProvider**

Rename `PairwiseRate` to `PairwiseRateInner`, create wrapper:

```jsx
function PairwiseRateInner() {
  // ... existing component code
}

export default function PairwiseRate() {
  return (
    <CalibrationGate>
      <GazeTrackingProvider>
        <PairwiseRateInner />
      </GazeTrackingProvider>
    </CalibrationGate>
  );
}
```

**Step 3: Add gaze tracking hooks**

At top of `PairwiseRateInner`:

```javascript
const { startSession, getGazeData } = useGazeTracking();
```

Start session when instructions complete (where `setStep(2)` is called):

```javascript
onNext={() => { setStep(2); startSession(); }}
```

**Step 4: Replace both `CardMedia` elements with `GazeTrackedImage`**

Left image (line ~172-175):
```jsx
<GazeTrackedImage
  imageId={`${currentPair.left.filename || currentPair.left.alt}_left`}
  component="img"
  image={currentPair.left.src}
  sx={{ objectFit: "contain", height: "55vh" }}
/>
```

Right image (line ~186-189):
```jsx
<GazeTrackedImage
  imageId={`${currentPair.right.filename || currentPair.right.alt}_right`}
  component="img"
  image={currentPair.right.src}
  sx={{ objectFit: "contain", height: "55vh" }}
/>
```

**Step 5: Save gaze data on submit**

Where `addPairwiseSession(username, newChoices)` is called (line ~72):

```javascript
addPairwiseSession(username, newChoices);
saveGazeSession(Date.now().toString(), "pairwise", username, getGazeData());
```

**Step 6: Commit**

```bash
git add src/Webpages/PairwiseRate.jsx
git commit -m "feat: integrate gaze tracking into PairwiseRate"
```

---

### Task 9: Integrate gaze tracking into `RankedRate`

**Files:**
- Modify: `src/Webpages/RankedRate.jsx`

**Step 1: Add imports, wrap, add hooks, replace CardMedia**

Same pattern as Tasks 7-8:

- Add imports for `GazeTrackingProvider`, `useGazeTracking`, `GazeTrackedImage`, `CalibrationGate`, `saveGazeSession`
- Rename to `RankedRateInner`, wrap with `CalibrationGate` + `GazeTrackingProvider`
- Call `startSession()` when instructions complete
- Replace `CardMedia` at line ~193-195 inside the `.map()`:

```jsx
<GazeTrackedImage
  imageId={img.id}
  component="img"
  image={img.src}
  sx={{ objectFit: "contain", height: "30vh" }}
/>
```

- Save gaze data where `addRankedSession` is called (line ~91):

```javascript
addRankedSession(username, updated);
saveGazeSession(Date.now().toString(), "ranked", username, getGazeData());
```

**Step 2: Commit**

```bash
git add src/Webpages/RankedRate.jsx
git commit -m "feat: integrate gaze tracking into RankedRate"
```

---

### Task 10: Integrate gaze tracking into `BestWorstRate`

**Files:**
- Modify: `src/Webpages/BestWorstRate.jsx`

**Step 1: Same pattern**

- Add imports
- Rename to `BestWorstRateInner`, wrap with `CalibrationGate` + `GazeTrackingProvider`
- Call `startSession()` in `handleStart` (where `setStep(1)` is called)
- Replace `CardMedia` at line ~209-212 inside the images `.map()`:

```jsx
<GazeTrackedImage
  imageId={img.id}
  component="img"
  image={img.src}
  sx={{ objectFit: "contain", height: "30vh" }}
/>
```

- Save gaze data where `addBestWorstSession` is called (line ~122):

```javascript
addBestWorstSession(username, updated);
saveGazeSession(Date.now().toString(), "best-worst", username, getGazeData());
```

**Step 2: Commit**

```bash
git add src/Webpages/BestWorstRate.jsx
git commit -m "feat: integrate gaze tracking into BestWorstRate"
```

---

### Task 11: Integrate gaze tracking into `SelectionRate`

**Files:**
- Modify: `src/Webpages/SelectionRate.jsx`

**Step 1: Same pattern**

- Add imports
- Rename to `SelectionRateInner`, wrap
- Call `startSession()` when instructions complete
- Replace `CardMedia` at line ~118-124:

```jsx
<GazeTrackedImage
  imageId={img.id}
  component="img"
  image={img.src}
  sx={{
    height: "22vh",
    objectFit: "contain",
    bgcolor: "#f0f0f0",
  }}
/>
```

- Save gaze data in `handleSubmit` where `addSelectionSession` is called:

```javascript
addSelectionSession(username, taskPrompt, selections);
saveGazeSession(Date.now().toString(), "selection", username, getGazeData());
```

**Step 2: Commit**

```bash
git add src/Webpages/SelectionRate.jsx
git commit -m "feat: integrate gaze tracking into SelectionRate"
```

---

### Task 12: Integrate gaze tracking into `ImageGrid` and `LayoutRatingFlow`

**Files:**
- Modify: `src/components/ImageGrid.jsx`
- Modify: `src/components/LayoutRatingFlow.jsx`

**Step 1: Update ImageGrid to use GazeTrackedImage**

In `ImageGrid.jsx`, add import and replace `CardMedia`:

```javascript
import GazeTrackedImage from './GazeTrackedImage';
```

Replace the `CardMedia` at line ~44-55:

```jsx
<GazeTrackedImage
  imageId={img.id}
  component="img"
  image={img.path.startsWith("http") ? img.path : `/${img.path}`}
  sx={{
    height: imageHeight || "25vh",
    width: "100%",
    objectFit: "contain",
    bgcolor: '#f0f0f0',
    borderRadius: 1
  }}
/>
```

**Step 2: Update LayoutRatingFlow**

Add imports:

```javascript
import GazeTrackingProvider, { useGazeTracking } from "./GazeTrackingProvider";
import CalibrationGate from "./CalibrationGate";
import { saveGazeSession } from "../utils/gazeStorage";
```

Rename to `LayoutRatingFlowInner`, wrap:

```jsx
function LayoutRatingFlowInner({ mode = "upload" }) {
  // ... existing code
}

export default function LayoutRatingFlow({ mode }) {
  return (
    <CalibrationGate>
      <GazeTrackingProvider>
        <LayoutRatingFlowInner mode={mode} />
      </GazeTrackingProvider>
    </CalibrationGate>
  );
}
```

Add `startSession()` call when rating step starts (`handleInstructionsNext`):

```javascript
const { startSession, getGazeData } = useGazeTracking();

const handleInstructionsNext = () => {
  window.scrollTo(0, 0);
  setStep(2);
  startSession();
};
```

Save gaze data in `handleNext` where `addGroupSessionForLayout` is called:

```javascript
addGroupSessionForLayout(layoutId, username, scores, { grid: gridConfig, prompt: taskPromptText });
saveGazeSession(Date.now().toString(), "grid", username, getGazeData());
```

**Step 3: Commit**

```bash
git add src/components/ImageGrid.jsx src/components/LayoutRatingFlow.jsx
git commit -m "feat: integrate gaze tracking into ImageGrid and LayoutRatingFlow"
```

---

### Task 13: Integrate gaze tracking into `ComboRatingFlow`

**Files:**
- Modify: `src/Webpages/ComboRatingFlow.jsx`

**Step 1: Same wrapper pattern**

Add imports:

```javascript
import GazeTrackingProvider, { useGazeTracking } from "../components/GazeTrackingProvider";
import CalibrationGate from "../components/CalibrationGate";
import { saveGazeSession } from "../utils/gazeStorage";
```

Rename to `ComboRatingFlowInner`, wrap:

```jsx
function ComboRatingFlowInner() {
  // ... existing code
}

export default function ComboRatingFlow() {
  return (
    <CalibrationGate>
      <GazeTrackingProvider>
        <ComboRatingFlowInner />
      </GazeTrackingProvider>
    </CalibrationGate>
  );
}
```

Note: `ImageGrid` is already updated in Task 12, so images inside Combo will auto-register.

Add `startSession()` in `handleInstructionsNext`:

```javascript
const { startSession, getGazeData } = useGazeTracking();

const handleInstructionsNext = () => {
  window.scrollTo(0, 0);
  setStep(2);
  startSession();
};
```

Save gaze data where `addFixedSession` is called:

```javascript
addFixedSession(username, scores);
saveGazeSession(Date.now().toString(), "combo", username, getGazeData());
```

**Step 2: Commit**

```bash
git add src/Webpages/ComboRatingFlow.jsx
git commit -m "feat: integrate gaze tracking into ComboRatingFlow"
```

---

### Task 14: Integrate gaze tracking into `PressureCooker`

**Files:**
- Modify: `src/Webpages/PressureCooker.jsx`

**Step 1: Same wrapper pattern**

Add imports, rename to `PressureCookerInner`, wrap with `CalibrationGate` + `GazeTrackingProvider`.

Call `startSession()` where `setStep(1)` is called (line ~248).

Replace both `CardMedia` elements (left image line ~413-416, right image line ~462-465):

Left:
```jsx
<GazeTrackedImage
  imageId={`${PAIRS[currentPairIndex].left.alt}_left`}
  component="img"
  height="350"
  image={PAIRS[currentPairIndex].left.src}
  sx={{ objectFit: "contain", backgroundColor: "#f5f5f5" }}
/>
```

Right:
```jsx
<GazeTrackedImage
  imageId={`${PAIRS[currentPairIndex].right.alt}_right`}
  component="img"
  height="350"
  image={PAIRS[currentPairIndex].right.src}
  sx={{ objectFit: "contain", backgroundColor: "#f5f5f5" }}
/>
```

Save gaze data in `finishSession`:

```javascript
const finishSession = (finalChoices) => {
  addPressureCookerSession(username, finalChoices, Math.max(bestStreak, streak));
  saveGazeSession(Date.now().toString(), "pressure-cooker", username, getGazeData());
  navigate("/pairwise-result");
};
```

Also save gaze data in the timeout case (line ~126-134) where `finishSession` is called — that already goes through `finishSession` so it's covered.

**Step 2: Commit**

```bash
git add src/Webpages/PressureCooker.jsx
git commit -m "feat: integrate gaze tracking into PressureCooker"
```

---

### Task 15: Smoke test all modes

**Files:** None (manual verification)

**Step 1: Start dev server**

Run: `npm run dev` (if not running)

**Step 2: Check each mode compiles and renders**

Open each of these routes and verify no console errors:
- `http://localhost:5174/individual-rate`
- `http://localhost:5174/pairwise-rate`
- `http://localhost:5174/ranked-rate`
- `http://localhost:5174/best-worst-rate`
- `http://localhost:5174/selection-rate`
- `http://localhost:5174/rate/upload`
- `http://localhost:5174/combo-rate`
- `http://localhost:5174/pressure-cooker`

Each should show CalibrationGate if not calibrated, otherwise the normal flow.

**Step 3: Verify gaze data in localStorage**

After completing one full rating session:
1. Open DevTools > Application > localStorage
2. Check for `app_gaze_sessions` key
3. Verify the JSON contains the expected `GazeSessionData` structure

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve any smoke test issues with gaze tracking integration"
```
