import React, { useState, useEffect, useRef, useCallback } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";

const TEST_DURATION = 5000; // 5 seconds
const ACCURACY_RADIUS = 100; // pixels

export default function AccuracyTest({ prediction, onTestComplete }) {
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [isRunning, setIsRunning] = useState(true);
  const predictionsRef = useRef([]);
  const centerRef = useRef(null);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Calculate center position
  const getCenter = useCallback(() => {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
  }, []);

  // Calculate accuracy - must be declared before useEffect that uses it
  const calculateAccuracy = useCallback(() => {
    const center = getCenter();
    const predictions = predictionsRef.current;

    if (predictions.length === 0) {
      onTestComplete(0);
      return;
    }

    // Calculate how many predictions were within the accuracy radius
    const accurateCount = predictions.filter((pred) => {
      const distance = Math.sqrt(
        Math.pow(pred.x - center.x, 2) + Math.pow(pred.y - center.y, 2)
      );
      return distance <= ACCURACY_RADIUS;
    }).length;

    const accuracy = Math.round((accurateCount / predictions.length) * 100);
    onTestComplete(accuracy);
  }, [getCenter, onTestComplete]);

  // Collect predictions
  useEffect(() => {
    if (isRunning && prediction) {
      predictionsRef.current.push({
        x: prediction.x,
        y: prediction.y,
        timestamp: prediction.timestamp,
      });
    }
  }, [prediction, isRunning]);

  // Timer countdown
  useEffect(() => {
    if (!isRunning) return;

    startTimeRef.current = performance.now();

    const tick = (now) => {
      const elapsed = now - startTimeRef.current;
      const remaining = Math.max(0, TEST_DURATION - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setIsRunning(false);
        calculateAccuracy();
        return;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, calculateAccuracy]);

  const progress = ((TEST_DURATION - timeLeft) / TEST_DURATION) * 100;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.95)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      {/* Instructions */}
      <Typography
        variant="h5"
        sx={{ color: "white", mb: 4, textAlign: "center" }}
      >
        Look at the center target for {Math.ceil(timeLeft / 1000)} seconds
      </Typography>

      {/* Timer progress */}
      <Box sx={{ position: "relative", mb: 4 }}>
        <CircularProgress
          variant="determinate"
          value={progress}
          size={200}
          thickness={3}
          sx={{
            color: "#4caf50",
            position: "absolute",
            top: -100,
            left: -100,
          }}
        />
      </Box>

      {/* Center target */}
      <Box
        ref={centerRef}
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
            "0%, 100%": {
              transform: "scale(1)",
              boxShadow: "0 0 30px rgba(76, 175, 80, 0.6)",
            },
            "50%": {
              transform: "scale(1.05)",
              boxShadow: "0 0 50px rgba(76, 175, 80, 0.8)",
            },
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

      {/* Countdown */}
      <Typography
        variant="h2"
        sx={{
          color: "white",
          mt: 4,
          fontFamily: "monospace",
          fontWeight: "bold",
        }}
      >
        {Math.ceil(timeLeft / 1000)}
      </Typography>

      <Typography
        variant="body2"
        sx={{ color: "rgba(255,255,255,0.5)", mt: 2 }}
      >
        Collecting {predictionsRef.current.length} samples...
      </Typography>
    </Box>
  );
}
