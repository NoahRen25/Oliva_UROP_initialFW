import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

// Storage keys for manual calibration persistence
// We use a custom key in addition to WebGazer's default for redundancy
const CALIBRATION_DATA_KEY = 'webgazerCalibrationData';
const CALIBRATION_TIMESTAMP_KEY = 'webgazerCalibrationTimestamp';
const WEBGAZER_DEFAULT_KEY = 'webgazerGlobalData';

const WebGazerContext = createContext(null);
let webgazerLoaderPromise = null;

// Throttle function to limit gaze update frequency
const createThrottledGazeUpdater = (setGaze, fps = 30) => {
  let lastUpdate = 0;
  let pendingGaze = null;
  let rafId = null;
  const interval = 1000 / fps;

  const update = () => {
    if (pendingGaze) {
      setGaze(pendingGaze);
      pendingGaze = null;
    }
    rafId = null;
  };

  return {
    update: (x, y) => {
      const now = performance.now();
      if (now - lastUpdate >= interval) {
        lastUpdate = now;
        setGaze({ x, y });
      } else {
        // Store pending update and schedule RAF if not already scheduled
        pendingGaze = { x, y };
        if (!rafId) {
          rafId = requestAnimationFrame(update);
        }
      }
    },
    cleanup: () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }
  };
};

const loadWebGazerScript = () => {
  if (window.webgazer) return Promise.resolve(window.webgazer);
  if (webgazerLoaderPromise) return webgazerLoaderPromise;

  webgazerLoaderPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-webgazer]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.webgazer));
      existing.addEventListener('error', () => reject(new Error('WebGazer script failed to load.')));
      return;
    }

    const script = document.createElement('script');
    script.src = '/webgazer/webgazer.js';
    script.async = true;
    script.defer = true;
    script.dataset.webgazer = 'true';
    script.onload = () => {
      if (window.webgazer) resolve(window.webgazer);
      else reject(new Error('WebGazer script loaded, but API not found.'));
    };
    script.onerror = () => reject(new Error('WebGazer script failed to load.'));
    document.head.appendChild(script);
  });

  return webgazerLoaderPromise;
};

export function useWebGazer() {
  const context = useContext(WebGazerContext);
  if (!context) {
    throw new Error('useWebGazer must be used within a WebGazerProvider');
  }
  return context;
}

export function WebGazerProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  // Initialize isCalibrated from localStorage to persist across sessions
  // Check both our custom key and WebGazer's default key
  const [isCalibrated, setIsCalibrated] = useState(() => {
    const hasCustomData = localStorage.getItem(CALIBRATION_DATA_KEY);
    const hasDefaultData = localStorage.getItem(WEBGAZER_DEFAULT_KEY);
    return !!(hasCustomData || hasDefaultData);
  });
  const [isTracking, setIsTracking] = useState(false);
  const [currentGaze, setCurrentGaze] = useState({ x: null, y: null });
  const [error, setError] = useState(null);
  const webgazerRef = useRef(null);
  const initializingRef = useRef(false);
  const mountedRef = useRef(true);
  const throttledGazeRef = useRef(null);

  // Check if webgazer has existing calibration data in localStorage
  const checkCalibration = useCallback(() => {
    const hasCustomData = localStorage.getItem(CALIBRATION_DATA_KEY);
    const hasDefaultData = localStorage.getItem(WEBGAZER_DEFAULT_KEY);
    const calibrated = !!(hasCustomData || hasDefaultData);
    setIsCalibrated(calibrated);
    return calibrated;
  }, []);

  // Initialize WebGazer
  const initWebGazer = useCallback(async () => {
    if (isInitialized || initializingRef.current) return;
    initializingRef.current = true;

    try {
      // Dynamic import webgazer (package has invalid module entry)
      const webgazer = await loadWebGazerScript();
      if (!webgazer) throw new Error('WebGazer failed to load.');
      webgazerRef.current = webgazer;

      // IMPORTANT: Enable saveDataAcrossSessions FIRST before begin()
      // This ensures WebGazer loads existing calibration data from localStorage
      webgazer.saveDataAcrossSessions(true);

      // Configure webgazer with optimal settings
      webgazer.setRegression('ridge');  // Ridge regression for accuracy
      webgazer.setTracker('TFFacemesh'); // TensorFlow Facemesh tracker
      webgazer.applyKalmanFilter(true); // Smooth gaze predictions
      webgazer.showVideoPreview(true);
      webgazer.showPredictionPoints(false);
      webgazer.showFaceOverlay(true);
      webgazer.showFaceFeedbackBox(true);

      // Set image dimensions for better performance (smaller = faster)
      webgazer.params.imgWidth = 320;
      webgazer.params.imgHeight = 240;

      // Set up throttled gaze listener to reduce React re-renders
      // Default 30 FPS is smooth enough for UI while reducing CPU usage
      if (!throttledGazeRef.current) {
        throttledGazeRef.current = createThrottledGazeUpdater(setCurrentGaze, 30);
      }

      webgazer.setGazeListener((data, elapsedTime) => {
        if (data && mountedRef.current) {
          throttledGazeRef.current.update(data.x, data.y);
        }
      });

      // Start webgazer
      await webgazer.begin();

      // Check if we navigated away during begin()
      if (!mountedRef.current) {
        webgazer.end();
        return;
      }

      // Ensure preview elements are visible (webgazer sometimes injects with hidden styles)
      // Returns true if all expected elements were found and styled
      const forceVideoVisible = () => {
        const video = document.getElementById('webgazerVideoFeed');
        const overlay = document.getElementById('webgazerFaceOverlay');
        const box = document.getElementById('webgazerFaceFeedbackBox');

        let allFound = true;

        if (video) {
          video.style.display = 'block';
          video.style.position = 'fixed';
          video.style.top = '160px';
          video.style.left = '20px';
          video.style.bottom = 'auto';
          video.style.right = 'auto';
          video.style.width = '200px';
          video.style.height = '150px';
          video.style.zIndex = '1200';
          video.style.borderRadius = '12px';
          video.style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)';
          video.style.background = '#000';
          video.style.border = '3px solid #1976d2';
        } else {
          allFound = false;
        }

        if (overlay) {
          // The faceOverlay canvas contains the face mesh/detection drawing
          overlay.style.display = 'block';
          overlay.style.position = 'fixed';
          overlay.style.top = '160px';
          overlay.style.left = '20px';
          overlay.style.bottom = 'auto';
          overlay.style.right = 'auto';
          overlay.style.width = '200px';
          overlay.style.height = '150px';
          overlay.style.zIndex = '1201';
          overlay.style.pointerEvents = 'none';
          overlay.style.borderRadius = '12px';
        }

        if (box) {
          // Show the WebGazer face feedback box inside the camera area
          box.style.display = 'block';
          box.style.position = 'fixed';
          box.style.top = '160px';
          box.style.left = '20px';
          box.style.bottom = 'auto';
          box.style.right = 'auto';
          box.style.width = '200px';
          box.style.height = '150px';
          box.style.zIndex = '1202';
          box.style.pointerEvents = 'none';
          box.style.borderRadius = '12px';
          box.style.boxSizing = 'border-box';
        }

        return allFound;
      };

      // Try to style elements, retry if video not found yet
      const styleWithRetry = (maxRetries = 5, delay = 100) => {
        let retries = 0;
        const attempt = () => {
          if (forceVideoVisible() || retries >= maxRetries) {
            return;
          }
          retries++;
          setTimeout(attempt, delay);
        };
        attempt();
      };

      styleWithRetry();

      // Wait for WebGazer to be ready (Context7 best practice)
      const waitForReady = () => {
        return new Promise((resolve) => {
          const checkReady = () => {
            if (webgazer.isReady()) {
              resolve();
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
        });
      };

      await waitForReady();

      // Check if we're still mounted before updating state
      if (!mountedRef.current) {
        // Cleanup if we navigated away during init
        webgazer.end();
        return;
      }

      // Ensure styles are applied after ready state
      styleWithRetry();

      setIsInitialized(true);
      setIsTracking(true);
      // Check calibration status from localStorage
      // This ensures we recognize existing calibration data after reinit
      const hasExistingCalibration = checkCalibration();
      if (hasExistingCalibration) {
        // Ensure our custom data is synced to WebGazer's expected key
        // WebGazer automatically loads from 'webgazerGlobalData' when 
        // saveDataAcrossSessions(true) is called before begin()
        const customData = localStorage.getItem(CALIBRATION_DATA_KEY);
        if (customData) {
          localStorage.setItem(WEBGAZER_DEFAULT_KEY, customData);
        }
        console.log('WebGazer: Existing calibration data found in localStorage');
      }
      setError(null);
    } catch (err) {
      console.error('WebGazer initialization failed:', err);
      if (mountedRef.current) {
        setError(err.message || 'Failed to initialize WebGazer. Please allow camera access.');
      }
      initializingRef.current = false;
    }
  }, [isInitialized, checkCalibration]);

  // Record calibration point
  const recordCalibrationPoint = useCallback((x, y) => {
    if (webgazerRef.current) {
      webgazerRef.current.recordScreenPosition(x, y, 'click');
    }
  }, []);

  // Manually save calibration data to localStorage
  const saveCalibrationData = useCallback(() => {
    if (!webgazerRef.current) {
      console.warn('WebGazer: Cannot save - webgazer not initialized');
      return false;
    }

    try {
      // Try to use storePoints to force WebGazer to save its internal state
      // storePoints(async, precision) - async=false for synchronous, precision=true for full precision
      if (typeof webgazerRef.current.storePoints === 'function') {
        webgazerRef.current.storePoints(false, true);
      }

      // Check if WebGazer has saved data to localStorage
      const webgazerData = localStorage.getItem(WEBGAZER_DEFAULT_KEY);
      if (webgazerData) {
        // Copy to our custom key for redundancy
        localStorage.setItem(CALIBRATION_DATA_KEY, webgazerData);
        localStorage.setItem(CALIBRATION_TIMESTAMP_KEY, Date.now().toString());
        console.log('WebGazer: Calibration data manually saved to localStorage');
        return true;
      }

      // If no data in default key, try to get stored points and save manually
      if (typeof webgazerRef.current.getStoredPoints === 'function') {
        const storedPoints = webgazerRef.current.getStoredPoints();
        if (storedPoints && (storedPoints.length > 0 || Object.keys(storedPoints).length > 0)) {
          const dataToStore = JSON.stringify(storedPoints);
          localStorage.setItem(CALIBRATION_DATA_KEY, dataToStore);
          localStorage.setItem(CALIBRATION_TIMESTAMP_KEY, Date.now().toString());
          // Also set to WebGazer's key for compatibility
          localStorage.setItem(WEBGAZER_DEFAULT_KEY, dataToStore);
          console.log('WebGazer: Calibration data saved via getStoredPoints()');
          return true;
        }
      }

      console.warn('WebGazer: No calibration data found to save');
    } catch (e) {
      console.error('WebGazer: Failed to save calibration data:', e);
    }
    return false;
  }, []);

  // Manually load calibration data from localStorage
  const loadCalibrationData = useCallback(() => {
    try {
      // Try to load from our custom key first (more reliable)
      let data = localStorage.getItem(CALIBRATION_DATA_KEY);

      // Fallback to WebGazer's default key
      if (!data) {
        data = localStorage.getItem(WEBGAZER_DEFAULT_KEY);
      }

      if (data) {
        // Ensure data is in WebGazer's expected key
        localStorage.setItem(WEBGAZER_DEFAULT_KEY, data);

        // Note: WebGazer reads from localStorage when initialized with saveDataAcrossSessions(true)
        // If WebGazer is already running, the data will be used on next reinit
        console.log('WebGazer: Calibration data synced to localStorage');
        return true;
      }
    } catch (e) {
      console.error('WebGazer: Failed to load calibration data:', e);
    }
    return false;
  }, []);

  // Check if stored calibration data exists
  const hasStoredCalibration = useCallback(() => {
    return !!(
      localStorage.getItem(CALIBRATION_DATA_KEY) ||
      localStorage.getItem(WEBGAZER_DEFAULT_KEY)
    );
  }, []);

  // Mark calibration as complete and ensure data is saved
  const completeCalibration = useCallback(() => {
    setIsCalibrated(true);
    // Explicitly save calibration data to localStorage
    const saved = saveCalibrationData();
    if (saved) {
      console.log('WebGazer: Calibration completed and data saved');
    } else {
      console.warn('WebGazer: Calibration completed but data save may have failed');
    }
  }, [saveCalibrationData]);

  // Pause tracking
  const pauseTracking = useCallback(() => {
    if (webgazerRef.current && isTracking) {
      webgazerRef.current.pause();
      setIsTracking(false);
    }
  }, [isTracking]);

  // Resume tracking
  const resumeTracking = useCallback(() => {
    if (webgazerRef.current && !isTracking) {
      webgazerRef.current.resume();
      setIsTracking(true);
    }
  }, [isTracking]);

  // Show/hide prediction point
  const showPredictionPoint = useCallback((show) => {
    if (webgazerRef.current) {
      webgazerRef.current.showPredictionPoints(show);
    }
  }, []);

  // Show/hide video preview
  const showVideo = useCallback((show) => {
    if (webgazerRef.current) {
      webgazerRef.current.showVideoPreview(show);
    }
  }, []);

  // Clear all calibration data
  const clearCalibration = useCallback(() => {
    if (webgazerRef.current) {
      webgazerRef.current.clearData();
    }
    // Clear both WebGazer's default key and our custom keys
    localStorage.removeItem(WEBGAZER_DEFAULT_KEY);
    localStorage.removeItem(CALIBRATION_DATA_KEY);
    localStorage.removeItem(CALIBRATION_TIMESTAMP_KEY);
    setIsCalibrated(false);
    console.log('WebGazer: All calibration data cleared from localStorage');
  }, []);

  // Stop camera and release resources WITHOUT clearing calibration data
  // Use this when navigating away from webgazer pages
  const stopCamera = useCallback(() => {
    // Cleanup throttled gaze updater first
    if (throttledGazeRef.current) {
      throttledGazeRef.current.cleanup();
      throttledGazeRef.current = null;
    }

    if (webgazerRef.current) {
      // Pause tracking first
      webgazerRef.current.pause();

      // Stop all camera tracks to release webcam
      const video = document.getElementById('webgazerVideoFeed');
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }

      // Explicitly save calibration data before ending
      // This ensures data is persisted even if end() doesn't save properly
      try {
        if (webgazerRef.current) {
          // Try to force WebGazer to save its internal state using storePoints
          if (typeof webgazerRef.current.storePoints === 'function') {
            webgazerRef.current.storePoints(false, true);
          }

          // Check if data was saved, if so copy to our custom key
          let data = localStorage.getItem(WEBGAZER_DEFAULT_KEY);

          // If no data in default key, try to get stored points directly
          if (!data && typeof webgazerRef.current.getStoredPoints === 'function') {
            const storedPoints = webgazerRef.current.getStoredPoints();
            if (storedPoints && (storedPoints.length > 0 || Object.keys(storedPoints).length > 0)) {
              data = JSON.stringify(storedPoints);
              localStorage.setItem(WEBGAZER_DEFAULT_KEY, data);
            }
          }

          if (data) {
            localStorage.setItem(CALIBRATION_DATA_KEY, data);
            localStorage.setItem(CALIBRATION_TIMESTAMP_KEY, Date.now().toString());
            console.log('WebGazer: Calibration data saved before stopping camera');
          }
        }
        // WebGazer's end() should also save if saveDataAcrossSessions is true
        webgazerRef.current.end();
      } catch (e) {
        console.warn('WebGazer end() error:', e);
      }
      webgazerRef.current = null;

      // Remove WebGazer-injected DOM elements (they'll be recreated on next init)
      const elementsToRemove = [
        'webgazerVideoFeed',
        'webgazerFaceOverlay',
        'webgazerFaceFeedbackBox',
        'webgazerGazeDot'
      ];
      elementsToRemove.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });

      // DO NOT reset webgazerLoaderPromise - keep WebGazer script loaded
      // This allows faster reinit and preserves the global webgazer state

      setIsInitialized(false);
      setIsTracking(false);
      setCurrentGaze({ x: null, y: null });
      initializingRef.current = false;
      // NOTE: Do NOT reset isCalibrated - it's based on localStorage data which persists
    }
  }, []);

  // End WebGazer session with complete cleanup (keeps calibration data)
  const endWebGazer = useCallback(() => {
    stopCamera();
  }, [stopCamera]);

  // Cleanup on unmount - stop camera but preserve calibration data
  useEffect(() => {
    mountedRef.current = true;

    // Save calibration data when user navigates away or closes tab
    const handleBeforeUnload = () => {
      if (webgazerRef.current && mountedRef.current) {
        try {
          // Try to force WebGazer to save its internal state using storePoints
          if (typeof webgazerRef.current.storePoints === 'function') {
            webgazerRef.current.storePoints(false, true);
          }

          // Check if data was saved, if so copy to our custom key
          let data = localStorage.getItem(WEBGAZER_DEFAULT_KEY);

          // If no data in default key, try to get stored points directly
          if (!data && typeof webgazerRef.current.getStoredPoints === 'function') {
            const storedPoints = webgazerRef.current.getStoredPoints();
            if (storedPoints && (storedPoints.length > 0 || Object.keys(storedPoints).length > 0)) {
              data = JSON.stringify(storedPoints);
              localStorage.setItem(WEBGAZER_DEFAULT_KEY, data);
            }
          }

          if (data) {
            localStorage.setItem(CALIBRATION_DATA_KEY, data);
            localStorage.setItem(CALIBRATION_TIMESTAMP_KEY, Date.now().toString());
          }
        } catch (e) {
          console.warn('WebGazer: Failed to save on beforeunload:', e);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Cleanup throttled gaze updater
      if (throttledGazeRef.current) {
        throttledGazeRef.current.cleanup();
        throttledGazeRef.current = null;
      }
      if (webgazerRef.current) {
        // Save calibration data before cleanup
        try {
          // Try to force WebGazer to save its internal state using storePoints
          if (typeof webgazerRef.current.storePoints === 'function') {
            webgazerRef.current.storePoints(false, true);
          }

          // Check if data was saved, if so copy to our custom key
          let data = localStorage.getItem(WEBGAZER_DEFAULT_KEY);

          // If no data in default key, try to get stored points directly
          if (!data && typeof webgazerRef.current.getStoredPoints === 'function') {
            const storedPoints = webgazerRef.current.getStoredPoints();
            if (storedPoints && (storedPoints.length > 0 || Object.keys(storedPoints).length > 0)) {
              data = JSON.stringify(storedPoints);
              localStorage.setItem(WEBGAZER_DEFAULT_KEY, data);
            }
          }

          if (data) {
            localStorage.setItem(CALIBRATION_DATA_KEY, data);
            localStorage.setItem(CALIBRATION_TIMESTAMP_KEY, Date.now().toString());
          }
        } catch (e) {
          console.warn('WebGazer: Failed to save on unmount:', e);
        }

        // Stop camera tracks
        const video = document.getElementById('webgazerVideoFeed');
        if (video && video.srcObject) {
          video.srcObject.getTracks().forEach(track => track.stop());
        }
        webgazerRef.current.end();
      }
    };
  }, []);

  const value = {
    isInitialized,
    isCalibrated,
    isTracking,
    currentGaze,
    error,
    initWebGazer,
    recordCalibrationPoint,
    completeCalibration,
    pauseTracking,
    resumeTracking,
    showPredictionPoint,
    showVideo,
    clearCalibration,
    stopCamera,
    endWebGazer,
    // Manual calibration storage functions
    saveCalibrationData,
    loadCalibrationData,
    hasStoredCalibration,
  };

  return (
    <WebGazerContext.Provider value={value}>
      {children}
    </WebGazerContext.Provider>
  );
}
