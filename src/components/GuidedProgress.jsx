import React from "react";
import { useLocation } from "react-router-dom";
import { Box, LinearProgress, Typography } from "@mui/material";
import { DEFAULT_GUIDED_STEPS } from "../utils/guidedFlow";

const STEP_LABELS = {
  individual: "Individual rating",
  pairwise: "Pairwise comparison",
  ranked: "Ranked comparison",
  "group-grid": "Grid rating",
  selection: "Selection",
  "best-worst": "Best / worst",
  combo: "Combined rating",
};

export default function GuidedProgress({ uploadConfig: propConfig }) {
  const location = useLocation();
  const uploadConfig = propConfig ?? location.state?.uploadConfig ?? null;

  if (!uploadConfig?.guided) return null;

  const total = uploadConfig.totalSteps ?? DEFAULT_GUIDED_STEPS.length;
  const remaining = uploadConfig.flow?.length ?? 0;
  const current = total - remaining;
  const pct = Math.max(0, Math.min(100, (current / total) * 100));
  const label = STEP_LABELS[uploadConfig.kind] ?? uploadConfig.kind;

  return (
    <Box sx={{ width: "100%", maxWidth: 720, mx: "auto", mb: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Step {current} of {total} — {label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {Math.round(pct)}%
        </Typography>
      </Box>
      <LinearProgress variant="determinate" value={pct} />
    </Box>
  );
}
