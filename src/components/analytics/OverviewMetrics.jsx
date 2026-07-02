/**
 * OverviewMetrics.jsx — Top-of-dashboard KPI tiles (total sessions, total
 * ratings, unique users, active modes, avg ratings/session), fed by
 * dashboardTransforms.computeOverviewMetrics.
 */
import React from "react";
import { Box, Paper, Typography } from "@mui/material";

const metricDefs = [
  { key: "totalSessions", label: "Total Sessions", format: (v) => String(v) },
  { key: "totalRatings", label: "Total Ratings", format: (v) => v.toLocaleString() },
  { key: "uniqueUsers", label: "Unique Users", format: (v) => String(v) },
  { key: "activeModes", label: "Active Modes", format: (v) => String(v) },
  { key: "avgRatingsPerSession", label: "Avg Ratings / Session", format: (v) => String(v) },
];

export default function OverviewMetrics({ metrics }) {
  if (!metrics) return null;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
          md: "repeat(5, 1fr)",
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
