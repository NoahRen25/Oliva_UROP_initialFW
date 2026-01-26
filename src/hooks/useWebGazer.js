import { useState, useEffect, useRef, useCallback } from "react";

export default function useWebGazer() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const initRef = useRef(false);
  const webgazerRef = useRef(null);

  // Load webgazer dynamically
  const loadWebGazer = useCallback(async () => {
    if (webgazerRef.current) {
      return webgazerRef.current;
    }

    // WebGazer is loaded as a global from the CDN or npm
    if (window.webgazer) {
      webgazerRef.current = window.webgazer;
      return window.webgazer;
    }

    // Import from npm package
    const webgazer = await import("webgazer");
    webgazerRef.current = webgazer.default || webgazer;
    window.webgazer = webgazerRef.current;
    return webgazerRef.current;
  }, []);

  const initWebGazer = useCallback(async () => {
    if (initRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const webgazer = await loadWebGazer();

      // Configure WebGazer
      webgazer
        .setRegression("ridge")
        .setTracker("TFFacemesh")
        .saveDataAcrossSessions(true)
        .showVideoPreview(true)
        .showPredictionPoints(false)
        .applyKalmanFilter(true);

      // Start WebGazer
      await webgazer.begin();

      // Set up gaze listener
      webgazer.setGazeListener((data, timestamp) => {
        if (data) {
          setPrediction({ x: data.x, y: data.y, timestamp });
        }
      });

      initRef.current = true;
      setIsInitialized(true);
    } catch (err) {
      console.error("WebGazer initialization failed:", err);
      setError(err.message || "Failed to initialize eye tracking");
    } finally {
      setIsLoading(false);
    }
  }, [loadWebGazer]);

  const recordCalibrationPoint = useCallback((x, y) => {
    const webgazer = webgazerRef.current;
    if (webgazer && initRef.current) {
      webgazer.recordScreenPosition(x, y);
    }
  }, []);

  const clearCalibration = useCallback(() => {
    const webgazer = webgazerRef.current;
    if (webgazer) {
      webgazer.clearData();
    }
  }, []);

  const showVideo = useCallback((show) => {
    const webgazer = webgazerRef.current;
    if (webgazer) {
      webgazer.showVideoPreview(show);
    }
  }, []);

  const showPredictionPoints = useCallback((show) => {
    const webgazer = webgazerRef.current;
    if (webgazer) {
      webgazer.showPredictionPoints(show);
    }
  }, []);

  const pause = useCallback(() => {
    const webgazer = webgazerRef.current;
    if (webgazer && initRef.current) {
      webgazer.pause();
    }
  }, []);

  const resume = useCallback(() => {
    const webgazer = webgazerRef.current;
    if (webgazer && initRef.current) {
      webgazer.resume();
    }
  }, []);

  const endWebGazer = useCallback(() => {
    const webgazer = webgazerRef.current;
    if (webgazer && initRef.current) {
      webgazer.pause();
      webgazer.showVideoPreview(false);
      webgazer.showPredictionPoints(false);
      webgazer.end();
      initRef.current = false;
      setIsInitialized(false);
      setPrediction(null);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (initRef.current && webgazerRef.current) {
        try {
          webgazerRef.current.pause();
          webgazerRef.current.showVideoPreview(false);
          webgazerRef.current.showPredictionPoints(false);
          webgazerRef.current.end();
        } catch (e) {
          console.warn("WebGazer cleanup error:", e);
        }
        initRef.current = false;
      }
    };
  }, []);

  return {
    isInitialized,
    isLoading,
    error,
    prediction,
    initWebGazer,
    recordCalibrationPoint,
    clearCalibration,
    showVideo,
    showPredictionPoints,
    pause,
    resume,
    endWebGazer,
  };
}
