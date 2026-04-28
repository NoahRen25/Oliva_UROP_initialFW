import { useRef, useCallback, useEffect } from 'react';
import { useWebGazer } from '../utils/WebGazerContext';

export default function useGazeTracker({ debugMode = false } = {}) {
  const { currentGaze, isTracking } = useWebGazer();

  const registryRef = useRef(new Map());
  const gazeDataRef = useRef(new Map());
  const currentlyGazedRef = useRef(null);
  const sessionStartRef = useRef(null);
  const sessionStartWallRef = useRef(null);
  const sessionStartedRef = useRef(false);
  const lastGazeTimeRef = useRef(null);
  const currentFixationStartRef = useRef(null);
  const rectsRef = useRef(new Map());
  const rectsDirtyRef = useRef(true);
  const debugModeRef = useRef(debugMode);

  // Page-level (whole-viewport) tracking. A "page" is one screen the
  // participant sees during a rating flow (e.g., one trial in best-worst,
  // one group in ranked). We record gaze coords as fractions of the
  // viewport plus a snapshot of where each image lived on that page so
  // researchers can reconstruct the layout after the fact.
  const pagesRef = useRef(new Map());
  const currentPageKeyRef = useRef(null);
  const currentPageStartRef = useRef(null);
  const pageCoordsRef = useRef([]);

  useEffect(() => { debugModeRef.current = debugMode; }, [debugMode]);

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
    const existing = registryRef.current.get(imageId);
    if (existing?.observer) existing.observer.disconnect();

    let observer = null;
    if (ref && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        rectsDirtyRef.current = true;
      });
      observer.observe(ref);
    }
    registryRef.current.set(imageId, { ref, observer });
    rectsDirtyRef.current = true;
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
    const entry = registryRef.current.get(imageId);
    if (entry?.observer) entry.observer.disconnect();
    if (entry?.ref) {
      entry.ref.classList.remove('gaze-debug-highlight');
    }
    if (currentlyGazedRef.current === imageId) {
      currentlyGazedRef.current = null;
    }
    registryRef.current.delete(imageId);
    rectsRef.current.delete(imageId);
  }, []);

  const startSession = useCallback(() => {
    sessionStartRef.current = performance.now();
    sessionStartWallRef.current = Date.now();
    sessionStartedRef.current = true;
    lastGazeTimeRef.current = null;
    currentlyGazedRef.current = null;
    currentFixationStartRef.current = null;
    gazeDataRef.current = new Map();
    pagesRef.current = new Map();
    currentPageKeyRef.current = null;
    pageCoordsRef.current = [];
  }, []);

  // Snapshot bounding boxes of currently registered images, normalized
  // to viewport. `imageNames` lets the caller pass alt-text/filenames
  // alongside imageIds when ids alone aren't recognizable later.
  const snapshotImageBoxes = useCallback((imageNames = {}) => {
    refreshRects();
    const vw = window.innerWidth || 1;
    const vh = window.innerHeight || 1;
    const boxes = [];
    for (const [imageId, rect] of rectsRef.current) {
      if (!rect || rect.width <= 0 || rect.height <= 0) continue;
      boxes.push({
        imageId: String(imageId),
        name: imageNames[imageId] != null ? String(imageNames[imageId]) : null,
        x: rect.left / vw,
        y: rect.top / vh,
        w: rect.width / vw,
        h: rect.height / vh,
      });
    }
    return boxes;
  }, [refreshRects]);

  const startPage = useCallback((pageKey, format) => {
    if (pageKey == null) return;
    // Close any previously open page (without box snapshot — only at endPage).
    if (currentPageKeyRef.current != null) {
      const prev = pagesRef.current.get(currentPageKeyRef.current);
      if (prev) {
        prev.coordinates = [...pageCoordsRef.current];
        prev.endTime = new Date().toISOString();
        prev.imageBoxes = snapshotImageBoxes(prev.imageNames);
      }
    }

    const key = String(pageKey);
    currentPageKeyRef.current = key;
    currentPageStartRef.current = performance.now();
    pageCoordsRef.current = [];
    pagesRef.current.set(key, {
      pageKey: key,
      format: format || null,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      startTime: new Date().toISOString(),
      endTime: null,
      coordinates: [],
      imageBoxes: [],
      imageNames: {},
    });
  }, [snapshotImageBoxes]);

  const endPage = useCallback(() => {
    const key = currentPageKeyRef.current;
    if (key == null) return;
    const page = pagesRef.current.get(key);
    if (page) {
      page.coordinates = [...pageCoordsRef.current];
      page.endTime = new Date().toISOString();
      page.imageBoxes = snapshotImageBoxes(page.imageNames);
    }
    currentPageKeyRef.current = null;
    pageCoordsRef.current = [];
  }, [snapshotImageBoxes]);

  // Optional: associate an imageId with a human-readable name (alt text
  // or filename) for the current page, so aggregate views can label
  // image squares later.
  const tagImageOnPage = useCallback((imageId, name) => {
    const key = currentPageKeyRef.current;
    if (key == null || imageId == null) return;
    const page = pagesRef.current.get(key);
    if (!page) return;
    page.imageNames[String(imageId)] = name == null ? null : String(name);
  }, []);

  const getGazeData = useCallback(() => {
    // Flush any open page first.
    if (currentPageKeyRef.current != null) {
      const key = currentPageKeyRef.current;
      const page = pagesRef.current.get(key);
      if (page) {
        page.coordinates = [...pageCoordsRef.current];
        page.endTime = new Date().toISOString();
        page.imageBoxes = snapshotImageBoxes(page.imageNames);
      }
      currentPageKeyRef.current = null;
      pageCoordsRef.current = [];
    }

    const images = {};
    for (const [id, data] of gazeDataRef.current) {
      images[id] = { ...data, coordinates: [...data.coordinates] };
    }
    const pages = {};
    for (const [key, page] of pagesRef.current) {
      // Strip imageNames helper map; bake names into imageBoxes instead.
      const { imageNames, ...rest } = page;
      pages[key] = { ...rest, imageBoxes: rest.imageBoxes.map((b) => ({ ...b })) };
    }
    return {
      startTime: sessionStartWallRef.current
        ? new Date(sessionStartWallRef.current).toISOString()
        : null,
      endTime: new Date().toISOString(),
      images,
      pages,
    };
  }, [snapshotImageBoxes]);

  const resetGazeData = useCallback(() => {
    gazeDataRef.current = new Map();
    pagesRef.current = new Map();
    currentPageKeyRef.current = null;
    pageCoordsRef.current = [];
    currentlyGazedRef.current = null;
    lastGazeTimeRef.current = null;
    currentFixationStartRef.current = null;
    sessionStartRef.current = performance.now();
    sessionStartWallRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!sessionStartedRef.current) return;
    if (!isTracking || currentGaze.x == null || currentGaze.y == null) return;

    const now = performance.now();
    const elapsed = now - sessionStartRef.current;

    refreshRects();

    // Record viewport-level coords for the current page.
    if (currentPageKeyRef.current != null) {
      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;
      pageCoordsRef.current.push({
        x: currentGaze.x / vw,
        y: currentGaze.y / vh,
        t: now - (currentPageStartRef.current ?? now),
      });
    }

    let hitImageId = null;
    if (typeof document !== 'undefined' && document.elementFromPoint) {
      const el = document.elementFromPoint(currentGaze.x, currentGaze.y);
      if (el) {
        for (const [id, entry] of registryRef.current) {
          if (entry.ref && (entry.ref === el || entry.ref.contains(el))) {
            hitImageId = id;
            break;
          }
        }
      }
    }
    if (hitImageId == null) {
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
    }

    const prevGazed = currentlyGazedRef.current;

    if (prevGazed && prevGazed !== hitImageId) {
      const prevData = gazeDataRef.current.get(prevGazed);
      if (prevData && currentFixationStartRef.current != null) {
        prevData.totalGazeTime += now - currentFixationStartRef.current;
        prevData.gazeExits += 1;
      }
      currentFixationStartRef.current = null;
    }

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

      if (prevGazed !== hitImageId) {
        data.gazeEntries += 1;
        currentFixationStartRef.current = now;
      }

      if (data.firstGazeTime == null) {
        data.firstGazeTime = elapsed;
      }

      const rect = rectsRef.current.get(hitImageId);
      if (rect && rect.width > 0 && rect.height > 0) {
        data.coordinates.push({
          x: (currentGaze.x - rect.left) / rect.width,
          y: (currentGaze.y - rect.top) / rect.height,
          t: elapsed,
        });
      }
    }

    lastGazeTimeRef.current = now;
    currentlyGazedRef.current = hitImageId;

    // Debug mode: highlight gazed image via DOM class
    if (debugModeRef.current) {
      if (prevGazed && prevGazed !== hitImageId) {
        const prevEntry = registryRef.current.get(prevGazed);
        if (prevEntry?.ref) {
          prevEntry.ref.classList.remove('gaze-debug-highlight');
        }
      }
      if (hitImageId && hitImageId !== prevGazed) {
        const entry = registryRef.current.get(hitImageId);
        if (entry?.ref) {
          entry.ref.classList.add('gaze-debug-highlight');
        }
      }
      if (!hitImageId && prevGazed) {
        const prevEntry = registryRef.current.get(prevGazed);
        if (prevEntry?.ref) {
          prevEntry.ref.classList.remove('gaze-debug-highlight');
        }
      }
    }
  }, [currentGaze, isTracking, refreshRects]);

  return {
    registerImage,
    unregisterImage,
    startSession,
    startPage,
    endPage,
    tagImageOnPage,
    getGazeData,
    resetGazeData,
    debugMode,
  };
}
