import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const WebGazerContext = createContext(null);

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
      // Dynamic import webgazer
      const webgazer = (await import('webgazer')).default;
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
