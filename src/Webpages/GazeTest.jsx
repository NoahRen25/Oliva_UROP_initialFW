import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  Chip,
  Switch,
  FormControlLabel,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DeleteIcon from "@mui/icons-material/Delete";
import SpeedIcon from "@mui/icons-material/Speed";

import useWebGazer from "../hooks/useWebGazer";

const ACCURACY_RADIUS = 100;
const ACCURACY_TEST_DURATION = 5000;

export default function GazeTest() {
  const navigate = useNavigate();
  const {
    isInitialized,
    isLoading,
    error,
    prediction,
    initWebGazer,
    showVideo,
    clearCalibration,
    endWebGazer,
  } = useWebGazer();

  const [showGazeDot, setShowGazeDot] = useState(true);
  const [stats, setStats] = useState({ fps: 0, sampleCount: 0 });
  const [isTestingAccuracy, setIsTestingAccuracy] = useState(false);
  const [accuracyResult, setAccuracyResult] = useState(null);
  const [testTimeLeft, setTestTimeLeft] = useState(0);
  const [testSampleCount, setTestSampleCount] = useState(0);

  const videoContainerRef = useRef(null);
  const accuracyPredictionsRef = useRef([]);
  const testStartRef = useRef(null);
  const sampleCountRef = useRef(0);
  const lastPredictionRef = useRef(null);

  // Update FPS counter every second
  useEffect(() => {
    const interval = setInterval(() => {
      setStats({ fps: sampleCountRef.current, sampleCount: 0 });
      sampleCountRef.current = 0;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Count each prediction for FPS using ref comparison
  useEffect(() => {
    if (prediction && isInitialized && prediction !== lastPredictionRef.current) {
      sampleCountRef.current += 1;
      lastPredictionRef.current = prediction;
    }
  }, [prediction, isInitialized]);

  // Move WebGazer's video element to our container
  useEffect(() => {
    const container = videoContainerRef.current;
    if (isInitialized && container) {
      const video = document.getElementById("webgazerVideoFeed");
      const overlay = document.getElementById("webgazerFaceOverlay");
      const faceBox = document.getElementById("webgazerFaceFeedbackBox");

      if (video) {
        // Save original parent
        const originalParent = video.parentElement;

        // Style and move video
        video.style.position = "relative";
        video.style.top = "auto";
        video.style.left = "auto";
        video.style.width = "320px";
        video.style.height = "240px";
        video.style.borderRadius = "8px";
        video.style.transform = "scaleX(-1)";
        container.appendChild(video);

        // Also move overlay if present
        if (overlay) {
          overlay.style.position = "absolute";
          overlay.style.top = "0";
          overlay.style.left = "0";
          overlay.style.width = "320px";
          overlay.style.height = "240px";
          overlay.style.transform = "scaleX(-1)";
          container.appendChild(overlay);
        }

        if (faceBox) {
          faceBox.style.display = "none";
        }

        // Cleanup: return video to original position
        return () => {
          if (originalParent && video.parentElement === container) {
            originalParent.appendChild(video);
            if (overlay) {
              originalParent.appendChild(overlay);
            }
          }
        };
      }
    }
  }, [isInitialized]);

  // Quick accuracy test
  const startAccuracyTest = useCallback(() => {
    setIsTestingAccuracy(true);
    setAccuracyResult(null);
    accuracyPredictionsRef.current = [];
    setTestSampleCount(0);
    testStartRef.current = performance.now();
    setTestTimeLeft(ACCURACY_TEST_DURATION);
  }, []);

  // Collect predictions during accuracy test
  useEffect(() => {
    if (isTestingAccuracy && prediction) {
      accuracyPredictionsRef.current.push({
        x: prediction.x,
        y: prediction.y,
      });
      setTestSampleCount(accuracyPredictionsRef.current.length);
    }
  }, [isTestingAccuracy, prediction]);

  // Accuracy test timer
  useEffect(() => {
    if (!isTestingAccuracy) return;

    const tick = () => {
      const elapsed = performance.now() - testStartRef.current;
      const remaining = Math.max(0, ACCURACY_TEST_DURATION - elapsed);
      setTestTimeLeft(remaining);

      if (remaining <= 0) {
        // Calculate accuracy
        const predictions = accuracyPredictionsRef.current;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        if (predictions.length === 0) {
          setAccuracyResult(0);
        } else {
          const accurateCount = predictions.filter((pred) => {
            const distance = Math.sqrt(
              Math.pow(pred.x - centerX, 2) + Math.pow(pred.y - centerY, 2)
            );
            return distance <= ACCURACY_RADIUS;
          }).length;
          setAccuracyResult(Math.round((accurateCount / predictions.length) * 100));
        }
        setIsTestingAccuracy(false);
        return;
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [isTestingAccuracy]);

  const handleStart = async () => {
    await initWebGazer();
    showVideo(true);
  };

  const handleStop = () => {
    endWebGazer();
    setStats({ fps: 0, sampleCount: 0 });
  };

  const handleClearCalibration = () => {
    clearCalibration();
    setAccuracyResult(null);
  };

  const handleBack = () => {
    if (isInitialized) {
      endWebGazer();
    }
    navigate("/");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#1a1a2e",
        color: "white",
        pb: 4,
      }}
    >
      {/* Floating gaze indicator */}
      {isInitialized && showGazeDot && prediction && !isTestingAccuracy && (
        <Box
          sx={{
            position: "fixed",
            left: prediction.x,
            top: prediction.y,
            transform: "translate(-50%, -50%)",
            width: 24,
            height: 24,
            borderRadius: "50%",
            backgroundColor: "rgba(0, 255, 0, 0.7)",
            border: "2px solid white",
            pointerEvents: "none",
            zIndex: 10000,
            boxShadow: "0 0 10px rgba(0, 255, 0, 0.5)",
            transition: "left 0.03s linear, top 0.03s linear",
          }}
        />
      )}

      {/* Accuracy test overlay */}
      {isTestingAccuracy && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <Typography variant="h5" sx={{ mb: 4, color: "white" }}>
            Look at the center target
          </Typography>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              backgroundColor: "#4caf50",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 30px rgba(76, 175, 80, 0.6)",
              animation: "pulse 1s infinite",
              "@keyframes pulse": {
                "0%, 100%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.05)" },
              },
            }}
          >
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                backgroundColor: "white",
              }}
            />
          </Box>
          <Typography
            variant="h2"
            sx={{ mt: 4, fontFamily: "monospace", color: "white" }}
          >
            {Math.ceil(testTimeLeft / 1000)}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, color: "rgba(255,255,255,0.5)" }}>
            Collecting {testSampleCount} samples...
          </Typography>
        </Box>
      )}

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ color: "white" }}
        >
          Back
        </Button>
        <Typography variant="h5" fontWeight="bold">
          Gaze Test
        </Typography>
        <Box sx={{ width: 80 }} /> {/* Spacer for centering */}
      </Box>

      {/* Main content */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          mt: 4,
          px: 2,
        }}
      >
        {/* Camera preview container */}
        <Paper
          ref={videoContainerRef}
          sx={{
            width: 320,
            height: 240,
            backgroundColor: "#0f0f1a",
            borderRadius: 2,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            mb: 3,
          }}
        >
          {!isInitialized && !isLoading && (
            <Typography color="text.secondary">Camera Off</Typography>
          )}
          {isLoading && <CircularProgress sx={{ color: "#00bcd4" }} />}
        </Paper>

        {/* Error display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, maxWidth: 400 }}>
            {error}
          </Alert>
        )}

        {/* Status panel */}
        <Paper
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 2,
            minWidth: 350,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Status:
              </Typography>
              <Chip
                size="small"
                label={isInitialized ? "Tracking" : "Stopped"}
                color={isInitialized ? "success" : "default"}
                sx={{ fontWeight: "bold" }}
              />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SpeedIcon fontSize="small" sx={{ color: "text.secondary" }} />
              <Typography variant="body2">
                {stats.fps} Hz
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Gaze X:
              </Typography>
              <Typography variant="body1" fontFamily="monospace">
                {prediction ? Math.round(prediction.x) : "—"}
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Gaze Y:
              </Typography>
              <Typography variant="body1" fontFamily="monospace">
                {prediction ? Math.round(prediction.y) : "—"}
              </Typography>
            </Box>
          </Box>

          {accuracyResult !== null && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: "1px solid rgba(255,255,255,0.1)",
                textAlign: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Last Accuracy Test:
              </Typography>
              <Typography
                variant="h4"
                fontWeight="bold"
                sx={{
                  color: accuracyResult >= 70 ? "#4caf50" : "#ff9800",
                }}
              >
                {accuracyResult}%
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Controls */}
        <Paper
          sx={{
            p: 2,
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 2,
            minWidth: 350,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {/* Start/Stop button */}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              {!isInitialized ? (
                <Button
                  variant="contained"
                  startIcon={<PlayArrowIcon />}
                  onClick={handleStart}
                  disabled={isLoading}
                  sx={{ backgroundColor: "#4caf50" }}
                >
                  {isLoading ? "Starting..." : "Start Camera"}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<StopIcon />}
                  onClick={handleStop}
                  sx={{ backgroundColor: "#f44336" }}
                >
                  Stop Camera
                </Button>
              )}
            </Box>

            {/* Toggle controls */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={showGazeDot}
                    onChange={(e) => setShowGazeDot(e.target.checked)}
                    disabled={!isInitialized}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    {showGazeDot ? (
                      <VisibilityIcon fontSize="small" />
                    ) : (
                      <VisibilityOffIcon fontSize="small" />
                    )}
                    Show Dot
                  </Box>
                }
              />
            </Box>

            {/* Action buttons */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="outlined"
                onClick={startAccuracyTest}
                disabled={!isInitialized || isTestingAccuracy}
                sx={{ borderColor: "#00bcd4", color: "#00bcd4" }}
              >
                Quick Accuracy Test
              </Button>

              <Button
                variant="outlined"
                startIcon={<DeleteIcon />}
                onClick={handleClearCalibration}
                sx={{ borderColor: "#ff9800", color: "#ff9800" }}
              >
                Clear Calibration
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Instructions */}
        <Typography
          variant="body2"
          sx={{ mt: 4, color: "rgba(255,255,255,0.5)", textAlign: "center", maxWidth: 400 }}
        >
          Use this page to test eye tracking. Start the camera, then move your eyes
          around to see the gaze indicator follow. Run a quick accuracy test to check
          calibration quality.
        </Typography>
      </Box>
    </Box>
  );
}
