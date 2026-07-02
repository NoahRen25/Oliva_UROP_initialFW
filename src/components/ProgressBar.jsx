/**
 * ProgressBar.jsx — Simple determinate progress bar with an optional label
 * and percentage, used inside rating flows ("image 3 of 10"). Distinct from
 * GuidedProgress, which tracks whole-session steps.
 */
import React from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

export default function ProgressBar({ current, total, label }) {
  const progress = Math.min((current / total) * 100, 100);

  return (
    <Box sx={{ width: "100%", mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        {label && (
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          {Math.round(progress)}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{ height: 10, borderRadius: 5 }}
      />
    </Box>
  );
}
