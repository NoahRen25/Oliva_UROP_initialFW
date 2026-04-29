import React from "react";
import { Box, Typography, Button, LinearProgress } from "@mui/material";
import ImageGrid from "./ImageGrid";

/**
 * GridRatingStep — Shared rendering for the rating step in grid-based flows.
 *
 * Props:
 *   title           — e.g. "2X2 Grid" or "Combo Protocol"
 *   currentPage     — 0-indexed current page
 *   totalPages      — total number of pages
 *   images          — current page's images array
 *   totalImages     — total image count across all pages
 *   pageSize        — images per page
 *   prompt          — task prompt text (optional)
 *   gridColumns     — number of columns for ImageGrid
 *   imageHeight     — height for grid images
 *   removeCenter    — whether to remove center cell in grid
 *   showRating      — whether to show rating slider (default true)
 *   ratings         — { [id]: score } state
 *   setRatings      — setter for ratings
 *   onInteraction   — handler for slider/click interactions
 *   isLastPage      — whether this is the final page
 *   onNext          — handler for next/submit button
 */
export default function GridRatingStep({
  title,
  currentPage,
  totalPages,
  images,
  totalImages,
  pageSize,
  prompt,
  gridColumns,
  imageHeight,
  removeCenter,
  showRating = true,
  ratings,
  setRatings,
  onInteraction,
  isLastPage,
  onNext,
}) {
  const startImg = currentPage * pageSize + 1;
  const endImg = Math.min((currentPage + 1) * pageSize, totalImages);

  return (
    <Box sx={{ mt: 1, pb: 10 }}>
      {/* Progress */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" align="center" gutterBottom>
          {title}: Page {currentPage + 1} of {totalPages}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={((currentPage + 1) / totalPages) * 100}
          sx={{ height: 10, borderRadius: 5 }}
        />
        <Typography
          variant="caption"
          display="block"
          align="center"
          sx={{ mt: 1, color: "text.secondary" }}
        >
          Images {startImg} – {endImg} of {totalImages}
        </Typography>
      </Box>

      {/* Prompt */}
      {prompt && (
        <Box
          sx={{
            p: 2,
            mb: 2,
            bgcolor: "#fff3e0",
            borderRadius: 2,
            textAlign: "center",
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Task Prompt
          </Typography>
          <Typography variant="h6" color="primary.main">
            {prompt}
          </Typography>
        </Box>
      )}

      {/* Grid */}
      <ImageGrid
        images={images}
        ratings={ratings}
        setRatings={setRatings}
        trackMove={onInteraction}
        columns={gridColumns}
        imageHeight={imageHeight}
        removeCenter={removeCenter}
        showRating={showRating}
      />

      {/* Submit / Next */}
      <Button
        variant="contained"
        fullWidth
        size="large"
        sx={{ mt: 4 }}
        onClick={onNext}
      >
        {isLastPage ? "Finish & View Results" : "Next Page"}
      </Button>
    </Box>
  );
}