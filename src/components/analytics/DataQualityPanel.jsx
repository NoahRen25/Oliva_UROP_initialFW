import React from "react";
import { Paper, Typography, Box, Chip } from "@mui/material";

const monoFont = "'JetBrains Mono', monospace";

function getStatusColor(rate) {
  const num = parseFloat(rate);
  if (num < 5) return "#34d399";   // green
  if (num < 15) return "#fb923c";  // yellow/orange
  return "#ef4444";                // red
}

function getStatusLabel(rate) {
  const num = parseFloat(rate);
  if (num < 5) return "Good";
  if (num < 15) return "Moderate";
  return "High";
}

export default function DataQualityPanel({ report }) {
  if (!report || report.totalSessions === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography
          sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "1rem", mb: 2 }}
        >
          Data Quality
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
          No sessions to analyze for data quality.
        </Typography>
      </Paper>
    );
  }

  const statusColor = getStatusColor(report.outlierRate);
  const statusLabel = getStatusLabel(report.outlierRate);

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography
          sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "1rem" }}
        >
          Data Quality
        </Typography>
        <Chip
          label={`${report.outlierRate}% outlier rate - ${statusLabel}`}
          size="small"
          sx={{
            fontFamily: monoFont,
            fontSize: "0.68rem",
            fontWeight: 600,
            bgcolor: `${statusColor}22`,
            color: statusColor,
            border: `1px solid ${statusColor}44`,
          }}
        />
      </Box>

      {/* Summary row */}
      <Box sx={{ display: "flex", gap: 3, mb: 2.5, flexWrap: "wrap" }}>
        {[
          { label: "Checked", value: report.totalSessions },
          { label: "Flagged", value: report.totalOutliers },
          { label: "Rate", value: `${report.outlierRate}%` },
        ].map(({ label, value }) => (
          <Box key={label}>
            <Typography
              sx={{
                fontFamily: monoFont,
                fontSize: "0.6rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "text.secondary",
              }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                fontFamily: monoFont,
                fontWeight: 700,
                fontSize: "1.15rem",
                color: "text.primary",
              }}
            >
              {value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Outliers by mode */}
      {Object.keys(report.outliersByMode).length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{
              fontFamily: monoFont,
              fontSize: "0.62rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "text.secondary",
              mb: 1,
            }}
          >
            By Mode
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {Object.entries(report.outliersByMode).map(([mode, count]) => (
              <Chip
                key={mode}
                label={`${mode}: ${count}`}
                size="small"
                variant="outlined"
                sx={{
                  fontFamily: monoFont,
                  fontSize: "0.68rem",
                  borderColor: "divider",
                  color: count > 0 ? "#fb923c" : "text.secondary",
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Top reasons */}
      {report.topReasons && report.topReasons.length > 0 && (
        <Box>
          <Typography
            sx={{
              fontFamily: monoFont,
              fontSize: "0.62rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "text.secondary",
              mb: 1,
            }}
          >
            Top Reasons
          </Typography>
          {report.topReasons.map(({ reason, count }, i) => (
            <Box
              key={i}
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.5 }}
            >
              <Typography
                sx={{ fontFamily: monoFont, fontSize: "0.72rem", color: "text.secondary" }}
              >
                {reason}
              </Typography>
              <Typography
                sx={{ fontFamily: monoFont, fontSize: "0.72rem", fontWeight: 600, color: "text.primary" }}
              >
                {count}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
