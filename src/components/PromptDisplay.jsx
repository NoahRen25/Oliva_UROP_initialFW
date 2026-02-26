import React from "react";
import { Typography } from "@mui/material";

/**
 * PromptDisplay — Shows a global task prompt (italic, secondary) and
 * an item-level prompt (primary color, medium weight).
 *
 * Used by: IndividualRate, PairwiseRate, VideoPairwiseRate, RankedRate, etc.
 *
 * Props:
 *   globalPrompt  — the overarching task description (shown if configPrompt exists)
 *   itemPrompt    — the per-image/pair/group prompt
 *   showGlobal    — whether to show the global prompt (default: true when globalPrompt is truthy)
 */
export default function PromptDisplay({ globalPrompt, itemPrompt, showGlobal = !!globalPrompt }) {
  return (
    <>
      {showGlobal && globalPrompt && (
        <Typography
          align="center"
          sx={{ mb: 1, fontStyle: "italic", color: "text.secondary" }}
        >
          Task: &ldquo;{globalPrompt}&rdquo;
        </Typography>
      )}

      {itemPrompt && (
        <Typography
          variant="h6"
          align="center"
          sx={{ mb: 2, color: "primary.main", fontWeight: "medium" }}
        >
          &ldquo;{itemPrompt}&rdquo;
        </Typography>
      )}
    </>
  );
}