import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton, Paper,
  Tooltip, FormControl,
  Select, MenuItem, InputLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import AddIcon from "@mui/icons-material/Add";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";

/**
 * ImageComparisonModal — Side-by-side comparison of N images with their stats.
 *
 * Props:
 *   open            — boolean
 *   onClose         — () => void
 *   images          — [{ name, src, stats }] — full list of available images
 *   initialIndices  — number[] of indices into `images` to show on open (default: [0, 1])
 *   mode            — rating mode (drives which stats are shown)
 */

const VIDEO_EXT_RE = /\.(mp4|webm|mov|ogg)$/i;
const isVideo = (s) => typeof s === "string" && VIDEO_EXT_RE.test(s);

const MAX_COLUMNS = 6;

function ComparisonColumn({ image, stats, mode, h2h, onChange, onRemove, choices, selfIdx, takenIndices, canRemove }) {
  const isPairwise = mode === "pairwise";
  const mean = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : "—";

  const scoreMean = mean(stats?.scores || []);
  const timeMean = mean(stats?.times || []);
  const interactionMean = mean(stats?.interactions || []);

  const totalPairs = (stats?.wins || 0) + (stats?.losses || 0);
  const winRate = totalPairs > 0
    ? `${((stats.wins / totalPairs) * 100).toFixed(0)}%`
    : "—";

  const isVid = isVideo(image?.src) || isVideo(image?.name);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        height: "100%",
        minWidth: 240,
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {canRemove && (
        <IconButton
          size="small"
          onClick={onRemove}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
            zIndex: 2,
            bgcolor: "rgba(255,255,255,0.9)",
            "&:hover": { bgcolor: "white" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}

      <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
        <InputLabel>Image</InputLabel>
        <Select
          value={selfIdx}
          label="Image"
          onChange={(e) => onChange(e.target.value)}
        >
          {choices.map((img, i) => (
            <MenuItem key={i} value={i} disabled={i !== selfIdx && takenIndices.has(i)}>
              {img.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Media */}
      {image?.src ? (
        isVid ? (
          <Box sx={{ position: "relative", mb: 1.5 }}>
            <Box
              component="video"
              src={image.src}
              controls
              preload="metadata"
              playsInline
              sx={{
                width: "100%",
                height: 200,
                objectFit: "contain",
                borderRadius: 1.5,
                bgcolor: "#000",
                display: "block",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: 6,
                left: 6,
                px: 0.75,
                py: 0.25,
                bgcolor: "rgba(0,0,0,0.65)",
                color: "white",
                borderRadius: 0.5,
                fontSize: "0.65rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                pointerEvents: "none",
              }}
            >
              <PlayCircleOutlineIcon sx={{ fontSize: 12 }} />
              VIDEO
            </Box>
          </Box>
        ) : (
          <Box
            component="img"
            src={image.src}
            alt={image.name}
            onError={(e) => { e.target.style.display = "none"; }}
            sx={{
              width: "100%",
              height: 180,
              objectFit: "contain",
              borderRadius: 1.5,
              bgcolor: "#f5f5f5",
              mb: 1.5,
            }}
          />
        )
      ) : (
        <Box
          sx={{
            width: "100%",
            height: 180,
            borderRadius: 1.5,
            bgcolor: "#e8eaf6",
            mb: 1.5,
            display: "flex",
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
            {(image?.name || "?").charAt(0).toUpperCase()}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ px: 2, textAlign: "center" }}>
            {image?.name}
          </Typography>
        </Box>
      )}

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
        {image?.name}
      </Typography>

      {/* Stats */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {isPairwise ? (
          <>
            <StatRow label="Win Rate" value={winRate} />
            <StatRow label="Sessions" value={stats?.sessionCount || 0} />
            {h2h && <StatRow label="H2H Record" value={h2h} />}
          </>
        ) : (
          <>
            <StatRow label="Mean Score" value={scoreMean} />
            <StatRow label="Avg Time" value={timeMean !== "—" ? `${timeMean}s` : "—"} />
            <StatRow label="Avg Interactions" value={interactionMean} />
            <StatRow label="Sessions" value={stats?.sessionCount || 0} />
            {stats?.memorabilityScore != null && (
              <StatRow label="Memorability" value={Number(stats.memorabilityScore).toFixed(3)} />
            )}
            {stats?.selections != null && (
              <StatRow
                label="Selection Rate"
                value={`${((stats.selections / Math.max(stats.sessionCount, 1)) * 100).toFixed(0)}%`}
              />
            )}
          </>
        )}
      </Box>
    </Paper>
  );
}

function StatRow({ label, value }) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        py: 0.5,
        px: 1,
        borderRadius: 1,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function ImageComparisonModal({
  open,
  onClose,
  images = [],
  initialIndices = [0, 1],
  mode,
}) {
  const [indices, setIndices] = useState(initialIndices);

  // Reset when modal re-opens with new initial indices.
  useEffect(() => {
    if (open) setIndices(initialIndices.filter((i) => i < images.length));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const taken = useMemo(() => new Set(indices), [indices]);

  const setAt = (slot, newIdx) => {
    setIndices((prev) => {
      const copy = [...prev];
      copy[slot] = newIdx;
      return copy;
    });
  };

  const removeAt = (slot) => {
    setIndices((prev) => prev.filter((_, i) => i !== slot));
  };

  const addColumn = () => {
    setIndices((prev) => {
      const next = images.findIndex((_, i) => !prev.includes(i));
      if (next < 0) return prev;
      return [...prev, next];
    });
  };

  // Head-to-head only meaningful for exactly 2 pairwise columns.
  const h2hPair = useMemo(() => {
    if (mode !== "pairwise" || indices.length !== 2) return null;
    const left = images[indices[0]];
    const right = images[indices[1]];
    if (!left || !right) return null;
    const leftPS = left.stats?.perSession || [];
    let leftWins = 0;
    let leftLosses = 0;
    for (const ps of leftPS) {
      if (ps.opponent !== right.name) continue;
      if (ps.result === "Win") leftWins++;
      else if (ps.result === "Loss") leftLosses++;
    }
    return {
      [indices[0]]: `${leftWins}-${leftLosses}`,
      [indices[1]]: `${leftLosses}-${leftWins}`,
    };
  }, [mode, indices, images]);

  const canAdd = indices.length < Math.min(MAX_COLUMNS, images.length);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
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
            Comparison ({indices.length})
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title={canAdd ? "Add another image to compare" : `Limit ${MAX_COLUMNS} columns`}>
            <span>
              <Button
                onClick={addColumn}
                disabled={!canAdd}
                startIcon={<AddIcon />}
                size="small"
                sx={{ color: "white", borderColor: "rgba(255,255,255,0.4)" }}
                variant="outlined"
              >
                Add
              </Button>
            </span>
          </Tooltip>
          <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)" }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {indices.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography>No images to compare. Press &quot;Add&quot; to add one.</Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              gap: 2,
              overflowX: "auto",
              pb: 1,
            }}
          >
            {indices.map((idx, slot) => {
              const img = images[idx];
              return (
                <Box
                  key={`slot-${slot}-${idx}`}
                  sx={{
                    flex: "0 0 auto",
                    width: { xs: "75%", sm: 280, md: 300 },
                  }}
                >
                  <ComparisonColumn
                    image={img}
                    stats={img?.stats}
                    mode={mode}
                    h2h={h2hPair?.[idx]}
                    selfIdx={idx}
                    choices={images}
                    takenIndices={taken}
                    onChange={(newIdx) => setAt(slot, newIdx)}
                    onRemove={() => removeAt(slot)}
                    canRemove={indices.length > 1}
                  />
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, bgcolor: "#fafafa", justifyContent: "space-between" }}>
        <Typography variant="caption" color="text.secondary">
          {indices.length}/{Math.min(MAX_COLUMNS, images.length)} columns
        </Typography>
        <Button onClick={onClose} variant="outlined" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

