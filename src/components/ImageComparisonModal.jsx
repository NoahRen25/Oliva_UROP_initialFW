import React, { useState, useMemo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton, Paper,
  Chip, Grid, Divider, Tooltip, FormControl,
  Select, MenuItem, InputLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

/**
 * ImageComparisonModal — Side-by-side comparison of two images with their stats.
 *
 * Props:
 *   open         — boolean
 *   onClose      — () => void
 *   images       — [{ name, src, stats }] — full list of available images
 *   initialLeft  — index into images for left panel
 *   initialRight — index into images for right panel
 */

function ComparisonColumn({ image, stats, highlight }) {
  if (!image) {
    return (
      <Paper sx={{ p: 3, textAlign: "center", bgcolor: "#fafafa", height: "100%" }}>
        <Typography color="text.secondary">Select an image</Typography>
      </Paper>
    );
  }

  const mean = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : "—";

  const scoreMean = mean(stats?.scores || []);
  const timeMean = mean(stats?.times || []);
  const interactionMean = mean(stats?.interactions || []);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
      }}
    >
      {/* Image */}
      {image.src ? (
        <Box
          component="img"
          src={image.src}
          alt={image.name}
          onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
          sx={{
            width: "100%",
            height: 180,
            objectFit: "contain",
            borderRadius: 1.5,
            bgcolor: "#f5f5f5",
            mb: 1.5,
          }}
        />
      ) : null}
      <Box
        sx={{
          width: "100%",
          height: 180,
          borderRadius: 1.5,
          bgcolor: "#e8eaf6",
          mb: 1.5,
          display: image.src ? "none" : "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            bgcolor: "#c5cae9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#3949ab",
          }}
        >
          {(image.name || "?").charAt(0).toUpperCase()}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, textAlign: "center" }}>
          {image.name}
        </Typography>
      </Box>

      {/* Name */}
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          mb: 1,
          textOverflow: "ellipsis",
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {image.name}
      </Typography>

      {/* Stats rows */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <StatRow
          label="Mean Score"
          value={scoreMean}
          highlight={highlight === "score"}
        />
        <StatRow
          label="Avg Time"
          value={timeMean !== "—" ? `${timeMean}s` : "—"}
          highlight={highlight === "time"}
        />
        <StatRow
          label="Avg Interactions"
          value={interactionMean}
          highlight={highlight === "interactions"}
        />
        <StatRow
          label="Sessions"
          value={stats?.sessionCount || 0}
        />
        {stats?.memorabilityScore != null && (
          <StatRow
            label="Memorability"
            value={Number(stats.memorabilityScore).toFixed(3)}
            highlight={highlight === "memorability"}
          />
        )}
        {(stats?.wins > 0 || stats?.losses > 0) && (
          <StatRow
            label="Win Rate"
            value={`${((stats.wins / Math.max(stats.wins + stats.losses, 1)) * 100).toFixed(0)}%`}
            highlight={highlight === "winrate"}
          />
        )}
        {stats?.selections != null && (
          <StatRow
            label="Selection Rate"
            value={`${((stats.selections / Math.max(stats.sessionCount, 1)) * 100).toFixed(0)}%`}
          />
        )}
      </Box>
    </Paper>
  );
}

function StatRow({ label, value, highlight }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 0.5,
        px: 1,
        borderRadius: 1,
        bgcolor: highlight ? "rgba(25, 118, 210, 0.08)" : "transparent",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, color: highlight ? "#1976d2" : "text.primary" }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function ImageComparisonModal({ open, onClose, images = [], initialLeft = 0, initialRight = 1 }) {
  const [leftIdx, setLeftIdx] = useState(initialLeft);
  const [rightIdx, setRightIdx] = useState(initialRight);
  const [highlightStat, setHighlightStat] = useState(null);

  const leftImage = images[leftIdx] || null;
  const rightImage = images[rightIdx] || null;

  const handleSwap = () => {
    setLeftIdx(rightIdx);
    setRightIdx(leftIdx);
  };

  // Determine which side "wins" each stat for subtle highlighting
  const winner = useMemo(() => {
    if (!leftImage?.stats || !rightImage?.stats) return {};
    const mean = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    const ls = mean(leftImage.stats.scores || []);
    const rs = mean(rightImage.stats.scores || []);
    return { leftScoreHigher: ls > rs, rightScoreHigher: rs > ls };
  }, [leftImage, rightImage]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#16213e",
          color: "white",
          py: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <CompareArrowsIcon sx={{ color: "#e94560" }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Image Comparison
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Image selectors */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={5}>
            <FormControl fullWidth size="small">
              <InputLabel>Left Image</InputLabel>
              <Select
                value={leftIdx}
                label="Left Image"
                onChange={(e) => setLeftIdx(e.target.value)}
              >
                {images.map((img, i) => (
                  <MenuItem key={i} value={i} disabled={i === rightIdx}>
                    {img.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={2} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Tooltip title="Swap images">
              <IconButton onClick={handleSwap} sx={{ bgcolor: "rgba(0,0,0,0.04)" }}>
                <SwapHorizIcon />
              </IconButton>
            </Tooltip>
          </Grid>

          <Grid item xs={5}>
            <FormControl fullWidth size="small">
              <InputLabel>Right Image</InputLabel>
              <Select
                value={rightIdx}
                label="Right Image"
                onChange={(e) => setRightIdx(e.target.value)}
              >
                {images.map((img, i) => (
                  <MenuItem key={i} value={i} disabled={i === leftIdx}>
                    {img.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Comparison columns */}
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <ComparisonColumn image={leftImage} stats={leftImage?.stats} />
          </Grid>
          <Grid item xs={6}>
            <ComparisonColumn image={rightImage} stats={rightImage?.stats} />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, bgcolor: "#fafafa" }}>
        <Button onClick={onClose} variant="outlined" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}