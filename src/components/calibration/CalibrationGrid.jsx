import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, LinearProgress } from "@mui/material";
import CalibrationPoint from "./CalibrationPoint";

// 9-point layout with percentage positions (moved away from edges to avoid text overlap)
// Row 1: y: 12% (moved down from 5%)
// Row 2: y: 50% (center - unchanged)
// Row 3: y: 88% (moved up from 95%)
// Columns: x: 10%, 50%, 90% (moved inward from 5%, 50%, 95%)
const POINT_POSITIONS = [
  { id: 1, xPercent: 10, yPercent: 12 },
  { id: 2, xPercent: 50, yPercent: 12 },
  { id: 3, xPercent: 90, yPercent: 12 },
  { id: 4, xPercent: 10, yPercent: 50 },
  { id: 5, xPercent: 50, yPercent: 50 }, // Center point - shown last
  { id: 6, xPercent: 90, yPercent: 50 },
  { id: 7, xPercent: 10, yPercent: 88 },
  { id: 8, xPercent: 50, yPercent: 88 },
  { id: 9, xPercent: 90, yPercent: 88 },
];

const CLICKS_REQUIRED = 5;
const TOTAL_CLICKS = 9 * CLICKS_REQUIRED; // 45 total clicks

export default function CalibrationGrid({ onCalibrationComplete, onRecordPoint }) {
  // Track clicks per point
  const [clickCounts, setClickCounts] = useState({
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
  });

  // Track viewport dimensions for pixel position calculation
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Convert percentage to pixel position
  const getPixelPosition = useCallback(
    (xPercent, yPercent) => ({
      x: (xPercent / 100) * dimensions.width,
      y: (yPercent / 100) * dimensions.height,
    }),
    [dimensions.width, dimensions.height]
  );

  // Check if all outer points are complete (with explicit type check)
  const outerPointIds = [1, 2, 3, 4, 6, 7, 8, 9];
  const outerPointsComplete = outerPointIds.every((id) => {
    const count = clickCounts[id];
    return typeof count === "number" && count >= CLICKS_REQUIRED;
  });

  // Check if center point should be visible
  const showCenterPoint = outerPointsComplete;

  // Calculate total progress
  const totalClicks = Object.values(clickCounts).reduce((sum, count) => sum + count, 0);
  const progress = (totalClicks / TOTAL_CLICKS) * 100;

  // Check for completion
  useEffect(() => {
    const allComplete = Object.values(clickCounts).every(
      (count) => typeof count === "number" && count >= CLICKS_REQUIRED
    );
    if (allComplete && onCalibrationComplete) {
      onCalibrationComplete();
    }
  }, [clickCounts, onCalibrationComplete]);

  const handlePointClick = useCallback(
    (pointId, pixelX, pixelY) => {
      if (clickCounts[pointId] >= CLICKS_REQUIRED) return;

      // Record the screen position for WebGazer
      if (onRecordPoint) {
        onRecordPoint(pixelX, pixelY);
      }

      setClickCounts((prev) => ({
        ...prev,
        [pointId]: prev[pointId] + 1,
      }));
    },
    [clickCounts, onRecordPoint]
  );

  const completedPoints = Object.values(clickCounts).filter(
    (count) => count >= CLICKS_REQUIRED
  ).length;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {/* Thin progress bar at very top edge */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10002,
        }}
      >
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 4,
            backgroundColor: "rgba(255,255,255,0.2)",
            "& .MuiLinearProgress-bar": {
              backgroundColor: "#4caf50",
            },
          }}
        />
      </Box>

      {/* Progress indicator in top-left corner (away from points) */}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          left: 16,
          zIndex: 10002,
        }}
      >
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
          {completedPoints}/9 points • {totalClicks}/{TOTAL_CLICKS} clicks
        </Typography>
      </Box>

      {/* Instructions in top-right corner (away from points) */}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 16,
          zIndex: 10002,
        }}
      >
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
          Click each point 5 times
        </Typography>
      </Box>

      {/* Center point instruction (only when outer points complete) */}
      {showCenterPoint && clickCounts[5] < CLICKS_REQUIRED && (
        <Typography
          sx={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            color: "#ffeb3b",
            textAlign: "center",
            fontWeight: "bold",
            zIndex: 10002,
          }}
        >
          Now click the center point!
        </Typography>
      )}

      {/* Bottom instruction (moved to very bottom, won't overlap with 88% row) */}
      {!showCenterPoint && (
        <Typography
          sx={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            fontSize: "0.75rem",
            zIndex: 10002,
          }}
        >
          Complete all outer points first. Center point will appear after.
        </Typography>
      )}

      {/* Calibration points with pre-calculated pixel positions */}
      {POINT_POSITIONS.map((point) => {
        const { x, y } = getPixelPosition(point.xPercent, point.yPercent);
        return (
          <CalibrationPoint
            key={point.id}
            id={point.id}
            pixelX={x}
            pixelY={y}
            clickCount={clickCounts[point.id]}
            isComplete={clickCounts[point.id] >= CLICKS_REQUIRED}
            isVisible={point.id === 5 ? showCenterPoint : true}
            onClick={handlePointClick}
          />
        );
      })}
    </Box>
  );
}
