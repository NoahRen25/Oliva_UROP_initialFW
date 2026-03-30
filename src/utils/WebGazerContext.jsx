import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { GazeSmoother } from './gazeSmoother';

// Storage keys for calibration persistence
const CALIBRATION_TIMESTAMP_KEY = 'webgazerCalibrationTimestamp';
const WEBGAZER_DEFAULT_KEY = 'webgazerGlobalData';

// Single save helper — replaces 4 duplicated blocks
const persistCalibration = (wg) => {
  if (!wg) return;
  try {
    if (typeof wg.storePoints === 'function') {
      wg.storePoints(false, true);
    }
    localStorage.setItem(CALIBRATION_TIMESTAMP_KEY, Date.now().toString());
  } catch (e) {
    console.warn('WebGazer: Failed to persist calibration:', e);
  }
};

const WebGazerContext = createContext(null);
let webgazerLoaderPromise = null;

// Smoothed gaze updater using GazeSmoother + requestAnimationFrame
const createSmoothedGazeUpdater = (setGaze, smoother) => {
  let pendingGaze = null;
  let rafId = null;

  const flush = () => {
    if (pendingGaze) {
      setGaze(pendingGaze);
      pendingGaze = null;
    }
    rafId = null;
  };

  return {
    update: (x, y) => {
      const result = smoother.process(x, y);
      if (!result) return; // rejected (blink/outlier)
      pendingGaze = result;
      if (!rafId) {
        rafId = requestAnimationFrame(flush);
      }
    },
    cleanup: () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
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
  const [isCalibrated, setIsCalibrated] = useState(() => {
    return !!localStorage.getItem(WEBGAZER_DEFAULT_KEY);
  });
  const [isTracking, setIsTracking] = useState(false);
  const [currentGaze, setCurrentGaze] = useState({ x: null, y: null });
  const [error, setError] = useState(null);
  const webgazerRef = useRef(null);
  const initializingRef = useRef(false);
  const mountedRef = useRef(true);
  const smoothedGazeRef = useRef(null);
  const smootherRef = useRef(new GazeSmoother());

  // Check if webgazer has existing calibration data in localStorage
  const checkCalibration = useCallback(() => {
    const calibrated = !!localStorage.getItem(WEBGAZER_DEFAULT_KEY);
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

      // Pre-flight compatibility check
      if (typeof webgazer.detectCompatibility === 'function' && !webgazer.detectCompatibility()) {
        throw new Error('Your browser does not support eye tracking. Please use Chrome, Edge, or Firefox.');
      }

      // Verify camera exists
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(d => d.kind === 'videoinput');
        if (!hasCamera) {
          throw new Error('No camera detected. Please connect a webcam and try again.');
        }
      } catch (deviceErr) {
        if (deviceErr.message.includes('No camera')) throw deviceErr;
        // enumerateDevices may fail in some browsers — proceed anyway, begin() will catch it
      }

      // IMPORTANT: Enable saveDataAcrossSessions FIRST before begin()
      // This ensures WebGazer loads existing calibration data from localStorage
      webgazer.saveDataAcrossSessions(true);

      // Configure webgazer with optimal settings
      webgazer.setRegression('weightedRidge');  // Weighted ridge regression for accuracy
      webgazer.setTracker('TFFacemesh'); // TensorFlow Facemesh tracker
      webgazer.applyKalmanFilter(true); // Smooth gaze predictions
      webgazer.showVideoPreview(true);
      webgazer.showPredictionPoints(false);
      webgazer.showFaceOverlay(true);
      webgazer.showFaceFeedbackBox(true);

      // Set image dimensions for better performance (smaller = faster)
      webgazer.params.imgWidth = 320;
      webgazer.params.imgHeight = 240;

      // Set up smoothed gaze listener using GazeSmoother pipeline
      if (!smoothedGazeRef.current) {
        smoothedGazeRef.current = createSmoothedGazeUpdater(setCurrentGaze, smootherRef.current);
      }

      webgazer.setGazeListener((data, elapsedTime) => {
        if (data && mountedRef.current) {
          smoothedGazeRef.current.update(data.x, data.y);
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

    persistCalibration(webgazerRef.current);
    return !!localStorage.getItem(WEBGAZER_DEFAULT_KEY);
  }, []);

  // Check if stored calibration data exists
  const hasStoredCalibration = useCallback(() => {
    return !!localStorage.getItem(WEBGAZER_DEFAULT_KEY);
  }, []);

  // Mark calibration as complete and ensure data is saved
  const completeCalibration = useCallback(() => {
    setIsCalibrated(true);
    smootherRef.current.reset();
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
    localStorage.removeItem(WEBGAZER_DEFAULT_KEY);
    localStorage.removeItem(CALIBRATION_TIMESTAMP_KEY);
    setIsCalibrated(false);
    smootherRef.current.reset();
    console.log('WebGazer: All calibration data cleared from localStorage');
  }, []);

  // Stop camera and release resources WITHOUT clearing calibration data
  // Use this when navigating away from webgazer pages
  const stopCamera = useCallback(() => {
    // Cleanup throttled gaze updater first
    if (smoothedGazeRef.current) {
      smoothedGazeRef.current.cleanup();
      smoothedGazeRef.current = null;
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
      persistCalibration(webgazerRef.current);

      try {
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
        persistCalibration(webgazerRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Cleanup throttled gaze updater
      if (smoothedGazeRef.current) {
        smoothedGazeRef.current.cleanup();
        smoothedGazeRef.current = null;
      }
      if (webgazerRef.current) {
        // Save calibration data before cleanup
        persistCalibration(webgazerRef.current);

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
    hasStoredCalibration,
  };

  return (
    <WebGazerContext.Provider value={value}>
      {children}
    </WebGazerContext.Provider>
  );
}
