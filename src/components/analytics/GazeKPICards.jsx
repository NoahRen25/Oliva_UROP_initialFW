/**
 * GazeKPICards.jsx — Row of headline gaze stats (avg dwell, avg entries,
 * most-viewed image, tracked-image count). Aggregates across all gaze
 * sessions, or shows a single session's numbers when one is selected in
 * GazeSessionPicker.
 */
import React, { useMemo } from "react";
import { Box, Paper, Typography } from "@mui/material";

export default function GazeKPICards({ gazeSessions, selectedSessionId }) {
  const cards = useMemo(() => {
    const sessions = gazeSessions || [];
    if (sessions.length === 0) return [];

    // --- Aggregate mode ---
    if (!selectedSessionId) {
      // Avg dwell time: average of all images' totalGazeTime across all sessions
      let totalDwell = 0;
      let totalEntries = 0;
      let imageCount = 0;
      const dwellByImage = {}; // imageId -> total dwell

      for (const session of sessions) {
        if (!session.images) continue;
        for (const [imageId, imgData] of Object.entries(session.images)) {
          const dwell = imgData.totalGazeTime || 0;
          totalDwell += dwell;
          totalEntries += imgData.gazeEntries || 0;
          imageCount++;
          dwellByImage[imageId] = (dwellByImage[imageId] || 0) + dwell;
        }
      }

      const avgDwell = imageCount > 0 ? totalDwell / imageCount / 1000 : 0;
      const avgEntries = imageCount > 0 ? totalEntries / imageCount : 0;

      // Most viewed image
      let mostViewed = "N/A";
      let maxDwell = 0;
      for (const [imageId, dwell] of Object.entries(dwellByImage)) {
        if (dwell > maxDwell) {
          maxDwell = dwell;
          mostViewed = imageId;
        }
      }
      if (mostViewed.length > 20) {
        mostViewed = mostViewed.slice(0, 20) + "\u2026";
      }

      return [
        { label: "Total Sessions", value: String(sessions.length) },
        { label: "Avg Dwell Time", value: avgDwell.toFixed(1) + "s" },
        { label: "Avg Entries", value: avgEntries.toFixed(1) },
        { label: "Most Viewed", value: mostViewed },
      ];
    }

    // --- Single session mode ---
    const session = sessions.find((s) => s.sessionId === selectedSessionId);
    if (!session) return [];

    const images = session.images || {};
    const imageKeys = Object.keys(images);
    const duration = ((session.endTime || 0) - (session.startTime || 0)) / 1000;

    let totalGazeTime = 0;
    let totalGazeEntries = 0;
    for (const imgData of Object.values(images)) {
      totalGazeTime += imgData.totalGazeTime || 0;
      totalGazeEntries += imgData.gazeEntries || 0;
    }

    return [
      { label: "Duration", value: duration.toFixed(1) + "s" },
      { label: "Images Tracked", value: String(imageKeys.length) },
      { label: "Total Gaze Time", value: (totalGazeTime / 1000).toFixed(1) + "s" },
      { label: "Gaze Entries", value: String(totalGazeEntries) },
    ];
  }, [gazeSessions, selectedSessionId]);

  if (cards.length === 0) return null;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(4, 1fr)",
        },
        gap: 2,
      }}
    >
      {cards.map(({ label, value }) => (
        <Paper
          key={label}
          sx={{
            p: 2.5,
            borderLeft: "3px solid",
            borderLeftColor: "primary.main",
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          <Typography
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.12em",
              color: "text.secondary",
              textTransform: "uppercase",
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              fontSize: "1.75rem",
              color: "text.primary",
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
