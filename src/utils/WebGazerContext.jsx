import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const WebGazerContext = createContext(null);
let webgazerLoaderPromise = null;

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
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [currentGaze, setCurrentGaze] = useState({ x: null, y: null });
  const [error, setError] = useState(null);
  const webgazerRef = useRef(null);

  // Check if webgazer has existing calibration data
  const checkCalibration = useCallback(() => {
    const hasData = localStorage.getItem('webgazerGlobalData');
    setIsCalibrated(!!hasData);
  }, []);

  // Initialize WebGazer
  const initWebGazer = useCallback(async () => {
    if (isInitialized) return;
    
    try {
      // Dynamic import webgazer (package has invalid module entry)
      const webgazer = await loadWebGazerScript();
      if (!webgazer) throw new Error('WebGazer failed to load.');
      webgazerRef.current = webgazer;
      
      // Configure webgazer with optimal settings
      webgazer.setRegression('ridge');  // Ridge regression for accuracy
      webgazer.setTracker('TFFacemesh'); // TensorFlow Facemesh tracker
      webgazer.applyKalmanFilter(true); // Smooth gaze predictions (Context7 best practice)
      webgazer.saveDataAcrossSessions(true);
      webgazer.showVideoPreview(true);
      webgazer.showPredictionPoints(false);
      webgazer.showFaceOverlay(true);
      webgazer.showFaceFeedbackBox(true);
      
      // Set image dimensions for better performance
      webgazer.params.imgWidth = 640;
      webgazer.params.imgHeight = 480;
      
      // Set up gaze listener
      webgazer.setGazeListener((data, elapsedTime) => {
        if (data) {
          setCurrentGaze({ x: data.x, y: data.y });
        }
      });
      
      // Start webgazer
      await webgazer.begin();

      // Ensure preview elements are visible (webgazer sometimes injects with hidden styles)
      const forceVideoVisible = () => {
        const video = document.getElementById('webgazerVideoFeed');
        const overlay = document.getElementById('webgazerFaceOverlay');
        const box = document.getElementById('webgazerFaceFeedbackBox');
        if (video) {
          video.style.display = 'block';
          video.style.position = 'fixed';
          video.style.top = '80px';
          video.style.right = '20px';
          video.style.width = '240px';
          video.style.height = '180px';
          video.style.zIndex = '1200';
          video.style.borderRadius = '8px';
          video.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
          video.style.background = '#000';
        }
        if (overlay) {
          overlay.style.display = 'block';
          overlay.style.position = 'fixed';
          overlay.style.top = '80px';
          overlay.style.right = '20px';
          overlay.style.width = '240px';
          overlay.style.height = '180px';
          overlay.style.zIndex = '1201';
          overlay.style.pointerEvents = 'none';
        }
        if (box) {
          box.style.display = 'block';
          box.style.position = 'fixed';
          box.style.top = '80px';
          box.style.right = '20px';
          box.style.width = '240px';
          box.style.height = '180px';
          box.style.zIndex = '1202';
          box.style.pointerEvents = 'none';
        }
      };
      forceVideoVisible();
      
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
      forceVideoVisible();
      
      setIsInitialized(true);
      setIsTracking(true);
      checkCalibration();
      setError(null);
    } catch (err) {
      console.error('WebGazer initialization failed:', err);
      setError(err.message || 'Failed to initialize WebGazer. Please allow camera access.');
    }
  }, [isInitialized, checkCalibration]);

  // Record calibration point
  const recordCalibrationPoint = useCallback((x, y) => {
    if (webgazerRef.current) {
      webgazerRef.current.recordScreenPosition(x, y, 'click');
    }
  }, []);

  // Mark calibration as complete
  const completeCalibration = useCallback(() => {
    setIsCalibrated(true);
  }, []);

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
    localStorage.removeItem('webgazerGlobalData');
    setIsCalibrated(false);
  }, []);

  // End WebGazer session
  const endWebGazer = useCallback(() => {
    if (webgazerRef.current) {
      webgazerRef.current.end();
      webgazerRef.current = null;
      setIsInitialized(false);
      setIsTracking(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webgazerRef.current) {
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
    endWebGazer,
  };

  return (
    <WebGazerContext.Provider value={value}>
      {children}
    </WebGazerContext.Provider>
  );
}
