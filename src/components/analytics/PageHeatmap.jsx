import React, { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";

/**
 * PageHeatmap — renders a viewport-space gaze heatmap with overlaid
 * image-position rectangles. Built from the result of buildPageHeatmap().
 *
 * Props:
 *   data: { grid, maxDensity, imageBoxes, viewport, pageCount }
 *   height: pixel height of the canvas (width derived from viewport AR)
 *   showLabels: whether to render image labels on top of the boxes
 */
function intensityToColor(intensity) {
  if (intensity <= 0) return "rgba(0,0,0,0)";
  if (intensity <= 0.25) return `rgba(0, 0, 255, ${intensity * 0.6})`;
  if (intensity <= 0.5) return `rgba(0, 255, 0, ${intensity * 0.6})`;
  if (intensity <= 0.75) return `rgba(255, 255, 0, ${intensity * 0.7})`;
  return `rgba(255, 0, 0, ${intensity * 0.8})`;
}

function drawHeatmap(canvas, grid, maxDensity) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w;
  canvas.height = h;
  ctx.clearRect(0, 0, w, h);
  if (!maxDensity) return;
  const size = grid.length;
  const cellW = w / size;
  const cellH = h / size;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const intensity = grid[row][col] / maxDensity;
      if (intensity <= 0) continue;
      ctx.fillStyle = intensityToColor(intensity);
      ctx.fillRect(col * cellW, row * cellH, cellW + 0.5, cellH + 0.5);
    }
  }
}

export default function PageHeatmap({ data, height = 380, showLabels = true, highlightImageIds = null }) {
  const canvasRef = useRef(null);

  const grid = data?.grid;
  const maxDensity = data?.maxDensity || 0;
  const imageBoxes = data?.imageBoxes || [];
  const viewport = data?.viewport || { width: 1, height: 1 };
  const pageCount = data?.pageCount || 0;

  // Aspect ratio from median viewport
  const ar = viewport.width && viewport.height ? viewport.width / viewport.height : 16 / 9;
  const width = Math.round(height * ar);

  useEffect(() => {
    if (!grid) return;
    drawHeatmap(canvasRef.current, grid, maxDensity);
  }, [grid, maxDensity]);

  if (!grid || pageCount === 0) {
    return (
      <Box
        sx={{
          height,
          width: "100%",
          maxWidth: width,
          mx: "auto",
          bgcolor: "#f5f5f5",
          border: "1px dashed #ccc",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          No page-level gaze data available for this format yet.
        </Typography>
      </Box>
    );
  }

  const highlight = highlightImageIds ? new Set(highlightImageIds.map(String)) : null;

  return (
    <Box
      sx={{
        position: "relative",
        height,
        width: "100%",
        maxWidth: width,
        mx: "auto",
        bgcolor: "#1a1a2e",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />
      {imageBoxes.map((b, i) => {
        const isHighlighted =
          highlight &&
          (highlight.has(String(b.imageId)) || (b.name && highlight.has(String(b.name))));
        return (
          <Box
            key={`${b.imageId || b.name || i}-${i}`}
            sx={{
              position: "absolute",
              left: `${b.x * 100}%`,
              top: `${b.y * 100}%`,
              width: `${b.w * 100}%`,
              height: `${b.h * 100}%`,
              border: isHighlighted ? "3px solid #ffeb3b" : "2px solid rgba(255,255,255,0.8)",
              boxShadow: isHighlighted ? "0 0 12px rgba(255, 235, 59, 0.6)" : "none",
              boxSizing: "border-box",
              borderRadius: 1,
              pointerEvents: "none",
              backgroundColor: isHighlighted ? "rgba(255, 235, 59, 0.05)" : "rgba(255,255,255,0.02)",
            }}
          >
            {showLabels && (b.name || b.imageId) && (
              <Box
                sx={{
                  position: "absolute",
                  top: 2,
                  left: 4,
                  px: 0.5,
                  py: 0.1,
                  bgcolor: "rgba(0,0,0,0.6)",
                  color: isHighlighted ? "#ffeb3b" : "#fff",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.6rem",
                  borderRadius: 0.5,
                  maxWidth: "calc(100% - 8px)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {b.name || b.imageId}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
