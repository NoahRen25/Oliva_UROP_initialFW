/**
 * GazeTimeline.jsx — Horizontal timeline strip of a single gaze session:
 * consecutive gaze samples are merged into colored segments per image, so
 * you can read the order and duration of what the participant looked at.
 */
import React, { useMemo } from "react";
import { Paper, Typography, Box } from "@mui/material";

const PALETTE = [
  "#5b8ef0",
  "#34d399",
  "#fb923c",
  "#a78bfa",
  "#f472b6",
  "#84cc16",
  "#06b6d4",
  "#ef4444",
  "#fbbf24",
  "#8b5cf6",
];

export default function GazeTimeline({ data }) {
  const { segments, colorMap, totalDuration, uniqueImages } = useMemo(() => {
    if (!data || data.length === 0) {
      return { segments: [], colorMap: {}, totalDuration: 0, uniqueImages: [] };
    }

    // Assign colors to unique imageIds
    const imageSet = [...new Set(data.map((d) => d.imageId))];
    const cMap = {};
    imageSet.forEach((id, i) => {
      cMap[id] = PALETTE[i % PALETTE.length];
    });

    // Group consecutive same-imageId entries into segments
    const segs = [];
    let current = { imageId: data[0].imageId, start: data[0].time, end: data[0].time };

    for (let i = 1; i < data.length; i++) {
      if (data[i].imageId === current.imageId) {
        current.end = data[i].time;
      } else {
        segs.push({ ...current });
        current = { imageId: data[i].imageId, start: data[i].time, end: data[i].time };
      }
    }
    segs.push({ ...current });

    const total = data[data.length - 1].time - data[0].time || 1;

    return {
      segments: segs,
      colorMap: cMap,
      totalDuration: total,
      uniqueImages: imageSet,
    };
  }, [data]);

  const minTime = data && data.length > 0 ? data[0].time : 0;

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
        Gaze Timeline
      </Typography>

      {!data || data.length === 0 ? (
        <Typography
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.75rem",
            color: "text.secondary",
            py: 4,
            textAlign: "center",
          }}
        >
          Select a specific session to view the gaze timeline.
        </Typography>
      ) : (
        <>
          {/* Timeline bar */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: 36,
              borderRadius: 1,
              overflow: "hidden",
              bgcolor: "action.hover",
              mb: 2,
            }}
          >
            {segments.map((seg, i) => {
              const left = ((seg.start - minTime) / totalDuration) * 100;
              const width = Math.max(
                ((seg.end - seg.start) / totalDuration) * 100,
                0.5
              );
              return (
                <Box
                  key={i}
                  title={`${seg.imageId} (${seg.start.toFixed(1)}s - ${seg.end.toFixed(1)}s)`}
                  sx={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: `${left}%`,
                    width: `${width}%`,
                    bgcolor: colorMap[seg.imageId],
                    borderRight: "1px solid rgba(0,0,0,0.15)",
                    cursor: "default",
                    transition: "opacity 0.15s",
                    "&:hover": { opacity: 0.8 },
                  }}
                />
              );
            })}
          </Box>

          {/* Time labels */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography
              sx={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.65rem",
                color: "text.secondary",
              }}
            >
              {minTime.toFixed(1)}s
            </Typography>
            <Typography
              sx={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.65rem",
                color: "text.secondary",
              }}
            >
              {(minTime + totalDuration).toFixed(1)}s
            </Typography>
          </Box>

          {/* Legend */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {uniqueImages.map((imageId) => (
              <Box
                key={imageId}
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "2px",
                    bgcolor: colorMap[imageId],
                    flexShrink: 0,
                  }}
                />
                <Typography
                  sx={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.65rem",
                    color: "text.secondary",
                  }}
                >
                  {imageId.length > 24 ? imageId.slice(0, 24) + "\u2026" : imageId}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Paper>
  );
}
