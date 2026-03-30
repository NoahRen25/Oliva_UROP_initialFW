import React from "react";
import { Box, Paper, Typography } from "@mui/material";

const metricDefs = [
  {
    key: "totalSessions",
    label: "Gaze Sessions",
    format: (v) => String(v),
  },
  {
    key: "avgDwellTime",
    label: "Avg Dwell Time",
    format: (v) => (v / 1000).toFixed(1) + "s",
  },
  {
    key: "avgGazeEntries",
    label: "Avg Gaze Entries",
    format: (v) => Number(v).toFixed(1),
  },
  {
    key: "uniqueImages",
    label: "Images Tracked",
    format: (v) => String(v),
  },
];

export default function GazeOverviewMetrics({ metrics }) {
  if (!metrics) return null;

  if (metrics.totalSessions === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography
          sx={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
            fontSize: "1rem",
            color: "text.secondary",
          }}
        >
          No gaze sessions recorded yet.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
          md: "repeat(4, 1fr)",
        },
        gap: 2,
      }}
    >
      {metricDefs.map(({ key, label, format }) => (
        <Paper
          key={key}
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
            {format(metrics[key])}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
