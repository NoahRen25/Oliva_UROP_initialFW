import React, { useEffect, useRef, useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import { buildHeatmapData } from "../../utils/gazeTransforms";

/**
 * Returns the heatmap color for a given normalized intensity.
 */
function intensityToColor(intensity) {
  if (intensity <= 0) return "rgba(0,0,0,0)";
  if (intensity <= 0.25) return `rgba(0, 0, 255, ${intensity * 0.6})`;
  if (intensity <= 0.5) return `rgba(0, 255, 0, ${intensity * 0.6})`;
  if (intensity <= 0.75) return `rgba(255, 255, 0, ${intensity * 0.7})`;
  return `rgba(255, 0, 0, ${intensity * 0.8})`;
}

/**
 * Draws the heatmap grid onto a canvas.
 */
function drawHeatmap(canvas, grid, maxDensity) {
  if (!canvas || maxDensity === 0) return;

  const ctx = canvas.getContext("2d");
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  canvas.width = displayWidth;
  canvas.height = displayHeight;

  ctx.clearRect(0, 0, displayWidth, displayHeight);

  const size = grid.length; // 50
  const cellW = displayWidth / size;
  const cellH = displayHeight / size;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const intensity = grid[row][col] / maxDensity;
      if (intensity <= 0) continue;

      ctx.fillStyle = intensityToColor(intensity);
      ctx.fillRect(col * cellW, row * cellH, cellW + 0.5, cellH + 0.5);
    }
  }
}

/**
 * Merges gaze coordinate data for a given imageId across multiple sessions.
 * Returns a synthetic session object usable by buildHeatmapData.
 */
function mergeSessionsForImage(sessions, imageId) {
  const mergedCoords = [];
  let totalGazeTime = 0;

  for (const session of sessions) {
    if (!session.images || !session.images[imageId]) continue;
    const imgData = session.images[imageId];
    if (imgData.coordinates) {
      mergedCoords.push(...imgData.coordinates);
    }
    totalGazeTime += imgData.totalGazeTime || 0;
  }

  return {
    images: {
      [imageId]: {
        coordinates: mergedCoords,
        totalGazeTime,
      },
    },
  };
}

/**
 * Collects all unique imageIds from sessions with their total dwell time.
 */
function collectImageStats(sessions) {
  const imageMap = {}; // imageId -> { dwellTime }

  for (const session of sessions) {
    if (!session.images) continue;
    for (const [imageId, imgData] of Object.entries(session.images)) {
      if (!imageMap[imageId]) {
        imageMap[imageId] = { imageId, dwellTime: 0 };
      }
      imageMap[imageId].dwellTime += imgData.totalGazeTime || 0;
    }
  }

  return Object.values(imageMap).sort((a, b) => b.dwellTime - a.dwellTime);
}

function HeatmapCard({ imageId, session, dwellTime, dark, onClick }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { grid, maxDensity } = buildHeatmapData(session, imageId);
    drawHeatmap(canvas, grid, maxDensity);
  }, [session, imageId]);

  return (
    <Paper
      sx={{
        p: 0,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: (theme) =>
            theme.palette.mode === "dark"
              ? "0 8px 24px rgba(0,0,0,0.5)"
              : "0 8px 24px rgba(0,0,0,0.12)",
        },
      }}
      onClick={onClick}
    >
      <Box sx={{ position: "relative", height: 200 }}>
        <Box
          sx={{
            backgroundColor: dark ? "#1a1a2e" : "#e8e8ee",
            height: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.7rem",
              color: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
              letterSpacing: "0.04em",
            }}
          >
            {imageId}
          </Typography>
        </Box>
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </Box>
      <Box sx={{ p: 1.5 }}>
        <Typography
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.68rem",
            color: "text.primary",
            fontWeight: 500,
          }}
        >
          {imageId}
        </Typography>
        <Typography
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.62rem",
            color: "text.secondary",
          }}
        >
          Dwell: {(dwellTime / 1000).toFixed(2)}s
        </Typography>
      </Box>
    </Paper>
  );
}

function HeatmapDialog({ open, onClose, imageId, session, dwellTime, dark }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    // Small delay to ensure dialog has rendered and canvas has dimensions
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const { grid, maxDensity } = buildHeatmapData(session, imageId);
      drawHeatmap(canvas, grid, maxDensity);
    }, 100);

    return () => clearTimeout(timer);
  }, [open, session, imageId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 600,
          fontSize: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>
          {imageId} — Dwell: {(dwellTime / 1000).toFixed(2)}s
        </span>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 2 }}>
        <Box sx={{ position: "relative", height: 400, width: "100%" }}>
          <Box
            sx={{
              backgroundColor: dark ? "#1a1a2e" : "#e8e8ee",
              height: 400,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              sx={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.85rem",
                color: dark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)",
              }}
            >
              {imageId}
            </Typography>
          </Box>
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function GazeHeatmap({ gazeSession, gazeSessions }) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Determine which images to show
  const isAggregate = !gazeSession;
  const sessions = gazeSessions || [];

  // Build the list of image entries to render
  let imageEntries = [];

  if (isAggregate) {
    // Aggregate mode: top 6 most-gazed images
    const allImageStats = collectImageStats(sessions);
    imageEntries = allImageStats.slice(0, 6).map((stat) => ({
      imageId: stat.imageId,
      dwellTime: stat.dwellTime,
      session: mergeSessionsForImage(sessions, stat.imageId),
    }));
  } else {
    // Single session mode: show all images from that session
    if (gazeSession.images) {
      imageEntries = Object.entries(gazeSession.images).map(
        ([imageId, imgData]) => ({
          imageId,
          dwellTime: imgData.totalGazeTime || 0,
          session: gazeSession,
        })
      );
      // Sort by dwell time descending
      imageEntries.sort((a, b) => b.dwellTime - a.dwellTime);
    }
  }

  // No data state
  if (imageEntries.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography
          sx={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
            fontSize: "1rem",
            mb: 2,
          }}
        >
          Attention Heatmaps
        </Typography>
        <Typography
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.75rem",
            color: "text.secondary",
          }}
        >
          No heatmap data available. Complete a rating session with gaze tracking
          enabled.
        </Typography>
      </Paper>
    );
  }

  const handleCardClick = (entry) => {
    setSelectedImage(entry);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedImage(null);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography
        sx={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 600,
          fontSize: "1rem",
          mb: 2,
        }}
      >
        Attention Heatmaps
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 2,
        }}
      >
        {imageEntries.map((entry) => (
          <HeatmapCard
            key={entry.imageId}
            imageId={entry.imageId}
            session={entry.session}
            dwellTime={entry.dwellTime}
            dark={dark}
            onClick={() => handleCardClick(entry)}
          />
        ))}
      </Box>

      {selectedImage && (
        <HeatmapDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          imageId={selectedImage.imageId}
          session={selectedImage.session}
          dwellTime={selectedImage.dwellTime}
          dark={dark}
        />
      )}
    </Paper>
  );
}
