import React from "react";
import { Box, LinearProgress, Typography } from "@mui/material";

export default function ProgressIndicator({ current, total, label = "Progress" }) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 64,
        left: 0,
        right: 0,
        zIndex: 1100,
        backgroundColor: "#fff",
        borderBottom: "1px solid #e0e0e0",
        px: 2,
        py: 0.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 120 }}>
          {label} {current} of {total}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            flexGrow: 1,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#e0e0e0",
            "& .MuiLinearProgress-bar": {
              borderRadius: 4,
              backgroundColor: percentage === 100 ? "#4caf50" : "#1976d2",
            },
          }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 45 }}>
          {Math.round(percentage)}%
        </Typography>
      </Box>
    </Box>
  );
}
