import { useRef, useCallback, useEffect } from 'react';
import { useWebGazer } from '../utils/WebGazerContext';

export default function useGazeTracker() {
  const { currentGaze, isTracking } = useWebGazer();

  const registryRef = useRef(new Map());
  const gazeDataRef = useRef(new Map());
  const currentlyGazedRef = useRef(null);
  const sessionStartRef = useRef(null);
  const lastGazeTimeRef = useRef(null);
  const rectsRef = useRef(new Map());
  const rectsDirtyRef = useRef(true);

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

  useEffect(() => {
    if (!isTracking || currentGaze.x == null || currentGaze.y == null) {
      return;
    }
    if (!sessionStartRef.current) {
      sessionStartRef.current = performance.now();
    }

    const now = performance.now();
    const elapsed = now - sessionStartRef.current;

    refreshRects();

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

    const timeDelta = lastGazeTimeRef.current != null
      ? now - lastGazeTimeRef.current
      : 0;
    lastGazeTimeRef.current = now;

    const prevGazed = currentlyGazedRef.current;

    if (prevGazed && prevGazed !== hitImageId) {
      const prevData = gazeDataRef.current.get(prevGazed);
      if (prevData) {
        prevData.gazeExits += 1;
      }
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
      }

      if (data.firstGazeTime == null) {
        data.firstGazeTime = elapsed;
      }

      if (prevGazed === hitImageId && timeDelta > 0) {
        data.totalGazeTime += timeDelta;
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
