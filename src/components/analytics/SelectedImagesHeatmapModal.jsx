import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton, ToggleButton, ToggleButtonGroup,
  Tooltip, Paper, Chip, Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ImageIcon from "@mui/icons-material/Image";
import GridViewIcon from "@mui/icons-material/GridView";
import { fetchGazeSessions } from "../../services/supabaseResults";
import {
  buildHeatmapData,
  buildPageHeatmap,
  findFormatsForImage,
} from "../../utils/gazeTransforms";
import PageHeatmap from "./PageHeatmap";

function intensityToColor(intensity) {
  if (intensity <= 0) return "rgba(0,0,0,0)";
  if (intensity <= 0.25) return `rgba(0, 0, 255, ${intensity * 0.6})`;
  if (intensity <= 0.5) return `rgba(0, 255, 0, ${intensity * 0.6})`;
  if (intensity <= 0.75) return `rgba(255, 255, 0, ${intensity * 0.7})`;
  return `rgba(255, 0, 0, ${intensity * 0.8})`;
}

function drawGrid(canvas, grid, maxDensity) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w;
  canvas.height = h;
  ctx.clearRect(0, 0, w, h);
  if (!maxDensity) return;
  const size = grid.length;
  const cellW = w / size;
  const cellH = h / size;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const intensity = grid[r][c] / maxDensity;
      if (intensity <= 0) continue;
      ctx.fillStyle = intensityToColor(intensity);
      ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5);
    }
  }
}

/** Merge per-image gaze coords across sessions into a synthetic session
 *  matching the shape buildHeatmapData expects. */
function mergeImageSessions(sessions, imageKey) {
  const target = String(imageKey);
  const coords = [];
  for (const s of sessions) {
    if (!s.images) continue;
    // Try by exact id first, then by name match in pages.imageBoxes (rare).
    const data = s.images[target];
    if (data?.coordinates) coords.push(...data.coordinates);
  }
  return { images: { [target]: { coordinates: coords, totalGazeTime: 0 } } };
}

function ImageHeatmapCard({ imageData, sessions }) {
  const canvasRef = useRef(null);

  const merged = useMemo(() => mergeImageSessions(sessions, imageData.name), [sessions, imageData.name]);
  const { grid, maxDensity } = useMemo(
    () => buildHeatmapData(merged, String(imageData.name)),
    [merged, imageData.name]
  );

  useEffect(() => {
    drawGrid(canvasRef.current, grid, maxDensity);
  }, [grid, maxDensity]);

  return (
    <Paper sx={{ overflow: "hidden", borderRadius: 2 }}>
      <Box sx={{ position: "relative", aspectRatio: "1 / 1", bgcolor: "#0f0f1c" }}>
        {imageData.src ? (
          <Box
            component="img"
            src={imageData.src}
            alt={imageData.name}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "contain",
              opacity: 0.65,
            }}
          />
        ) : null}
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
        {!maxDensity && (
          <Box sx={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
              No gaze data for this image
            </Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ px: 1.5, py: 1, bgcolor: "#fafafa" }}>
        <Typography variant="caption" sx={{ fontWeight: 600, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {imageData.name}
        </Typography>
      </Box>
    </Paper>
  );
}

function PageHeatmapCard({ imageData, sessions }) {
  // Find the dominant page format for this image, then build a page heatmap
  // restricted to pages that included this image.
  const formats = useMemo(
    () => findFormatsForImage(sessions, imageData.name),
    [sessions, imageData.name]
  );
  const format = formats[0]?.format;

  const data = useMemo(() => {
    if (!format) return null;
    return buildPageHeatmap({
      sessions,
      format,
      matchImageIds: [imageData.name],
    });
  }, [sessions, format, imageData.name]);

  return (
    <Paper sx={{ overflow: "hidden", borderRadius: 2 }}>
      <Box sx={{ p: 1.5, bgcolor: "#fafafa", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="caption" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {imageData.name}
        </Typography>
        {format && <Chip size="small" label={format} variant="outlined" />}
      </Box>
      <Box sx={{ p: 1.5, bgcolor: "#1a1a2e" }}>
        {format ? (
          <PageHeatmap
            data={data}
            height={220}
            highlightImageIds={[imageData.name]}
            showLabels={false}
          />
        ) : (
          <Box sx={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
              No page-level gaze data for this image yet.
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

export default function SelectedImagesHeatmapModal({ open, onClose, selectedImageData = [] }) {
  const [view, setView] = useState("image"); // "image" | "page"
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchGazeSessions()
      .then((data) => setSessions(data || []))
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#1a237e",
          color: "white",
          py: 2,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Heatmap Viewer
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
            {selectedImageData.length} image{selectedImageData.length === 1 ? "" : "s"} selected
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, v) => { if (v) setView(v); }}
            size="small"
          >
            <ToggleButton value="image">
              <Tooltip title="Heatmap for each specific image">
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <ImageIcon fontSize="small" /> Per-Image
                </Box>
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="page">
              <Tooltip title="Aggregate page heatmap for the format the image appeared on">
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <GridViewIcon fontSize="small" /> Page Aggregate
                </Box>
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center", mb: 2 }}>
          {view === "image"
            ? "One heatmap per selected image — gaze inside the image's bounding box, aggregated across all sessions."
            : "One heatmap per selected image — full-page gaze for the format that contained the image, with the selected image highlighted."}
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {loading && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
            Loading gaze sessions…
          </Typography>
        )}

        {!loading && selectedImageData.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
            No images selected.
          </Typography>
        )}

        {!loading && selectedImageData.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: view === "page" ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            {selectedImageData.map((img) =>
              view === "image" ? (
                <ImageHeatmapCard key={img.name} imageData={img} sessions={sessions} />
              ) : (
                <PageHeatmapCard key={img.name} imageData={img} sessions={sessions} />
              )
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, bgcolor: "#fafafa" }}>
        <Button onClick={onClose} variant="outlined" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
