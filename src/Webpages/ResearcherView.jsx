/**
 * ResearcherView.jsx — "/researcher": the main researcher workbench.
 *
 * Aggregates every session type into a per-image explorer (grid or list)
 * with per-image stats modals, audio recordings, side-by-side comparisons,
 * gaze heatmaps for selected images, CSV export, and an embedded
 * GazeAnalyticsSection tab. Also links to /researcher/simulate for demoing
 * flows without collecting data.
 */
import React, { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Box, Typography, Tabs, Tab, Paper, FormControl,
  Select, MenuItem, InputLabel, Button, IconButton, Chip,
  Card, CardMedia, CardContent, Grid, Divider, Tooltip,
  Table, TableBody, TableCell, TableHead, TableRow,
  ToggleButton, ToggleButtonGroup, Alert, Checkbox,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import PersonIcon from "@mui/icons-material/Person";
import BarChartIcon from "@mui/icons-material/BarChart";
import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";
import SummarizeIcon from "@mui/icons-material/Summarize";
import InsightsIcon from "@mui/icons-material/Insights";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import ImageIcon from "@mui/icons-material/Image";
import VideocamIcon from "@mui/icons-material/Videocam";

import { useResults } from "../Results";
import { getImageUrl } from "../utils/supabaseImageUrl";
import AudioModal from "../components/AudioModal";
import StatsModal from "../components/StatsModal";
import ImageComparisonModal from "../components/ImageComparisonModal";
import ImageActionMenu from "../components/ImageActionMenu";
import VideoThumbnail from "../components/VideoThumbnail";
import GazeAnalyticsSection from "./GazeAnalyticsSection";
import SelectedImagesHeatmapModal from "../components/analytics/SelectedImagesHeatmapModal";
import VisibilityIcon from "@mui/icons-material/Visibility";

// ─── Helpers ────────────────────────────────────────────────────────

const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);


const DEMO_IMAGE_LOOKUP = {
  "GPT Moon":   "GPTMoonFlags.png",
  "Flux Moon":  "FluxMoonFlags.png",
  "Nano Moon":  "NanoMoonFlags.png",
  "GPT Ship":   "GPTShip.png",
  "Flux Ship":  "FluxShip.png",
  "Nano Ship":  "NanoShip.png",
  "GPT Flag":   "GPTFlag.png",
  "Flux Flag":  "FluxFlag.png",
  "Nano Flag":  "NanoFlag.png",
};

const VIDEO_EXT_RE = /\.(mp4|webm|mov|ogg)$/i;

function isVideoName(name) {
  return typeof name === "string" && VIDEO_EXT_RE.test(name);
}

function resolveImageUrl(name) {
  if (!name) return null;

  // Already a full URL
  if (typeof name === "string" && (name.startsWith("http://") || name.startsWith("https://"))) {
    return name;
  }

  // Convert to string in case it's a number (individual mode uses index as imageId)
  const str = String(name);

  // Pure numeric — this is an index, not a filename; can't resolve
  if (/^\d+$/.test(str)) return null;

  // Video files: "folder/filename.mp4" → videos bucket
  if (isVideoName(str)) {
    return getImageUrl("videos", str);
  }

  // Generated images: "folder/filename.ext" pattern
  // e.g. "flux_2_pro/generated_001.png", "gptimage15/img.png", "nano_banana_pro/gen.png"
  if (str.includes("/")) {
    return getImageUrl("generated-images", str);
  }

  // Memorability images: "target_NNNNNN" pattern (grid / combo flows)
  if (str.startsWith("target_")) {
    const filename = str.endsWith(".jpg") ? str : `${str}.jpg`;
    return getImageUrl("mem-images", filename);
  }

  // Demo images by exact filename: "GPTMoonFlags.png" etc.
  if (str.endsWith(".png") || str.endsWith(".jpg")) {
    return getImageUrl("demo-images", str);
  }

  // Demo images by human-readable alt text: "GPT Moon", "Flux Ship" etc.
  // (Best-Worst stores bestName/worstName as the alt text, not the filename)
  if (DEMO_IMAGE_LOOKUP[str]) {
    return getImageUrl("demo-images", DEMO_IMAGE_LOOKUP[str]);
  }

  return null;
}

function buildImageStats(sessions, mode) {
  const imageMap = {};

  if (mode === "individual" || mode === "group") {
    sessions.forEach((session) => {
      (session.scores || []).forEach((score) => {
        const key = score.imageName || score.imageId || "unknown";
        if (!imageMap[key]) {
          imageMap[key] = {
            name: key,
            src: score.src || score.imageSrc || resolveImageUrl(key),
            scores: [],
            times: [],
            interactions: [],
            clickOrders: [],
            memorabilityScore: score.memorabilityScore ?? score.actualMemScore ?? null,
            sessionCount: 0,
            perSession: [],
            audioEntries: [],
          };
        }
        const entry = imageMap[key];
        // If we didn't have a src yet but this score has one, use it
        if (!entry.src && (score.src || score.imageSrc)) {
          entry.src = score.src || score.imageSrc;
        }
        if (score.score != null) entry.scores.push(Number(score.score));
        if (score.timeSpent != null) entry.times.push(Number(score.timeSpent));
        if (score.interactionCount != null) entry.interactions.push(Number(score.interactionCount));
        if (score.clickOrder != null) entry.clickOrders.push(score.clickOrder);
        entry.sessionCount++;
        entry.perSession.push({
          sessionId: session.id,
          username: session.username,
          score: score.score,
          time: score.timeSpent,
          interactions: score.interactionCount,
          clickOrder: score.clickOrder,
        });

        // Audio entries
        const pageKey = score.pageKey;
        if (session.pageAudioUrls) {
          Object.keys(session.pageAudioUrls).forEach((pk) => {
            entry.audioEntries.push({
              sessionId: session.id,
              username: session.username,
              pageKey: pk,
              audioUrl: session.pageAudioUrls[pk],
              isCurrent: String(pk) === String(pageKey),
            });
          });
        }
      });
    });
  }

  if (mode === "pairwise") {
    sessions.forEach((session) => {
      (session.choices || []).forEach((choice) => {
        [choice.winnerName, choice.loserName].forEach((name) => {
          if (!name || name === "TIMEOUT") return;
          if (!imageMap[name]) {
            imageMap[name] = {
              name,
              src: resolveImageUrl(name),
              wins: 0,
              losses: 0,
              sessionCount: 0,
              perSession: [],
              audioEntries: [],
            };
          }
          const entry = imageMap[name];
          if (name === choice.winnerName) entry.wins++;
          else entry.losses++;
          entry.sessionCount++;
          entry.perSession.push({
            sessionId: session.id,
            username: session.username,
            result: name === choice.winnerName ? "Win" : "Loss",
            opponent: name === choice.winnerName ? choice.loserName : choice.winnerName,
            pairId: choice.pairId,
          });
        });

        // Audio
        if (session.pageAudioUrls) {
          [choice.winnerName, choice.loserName].forEach((name) => {
            if (!name || !imageMap[name]) return;
            Object.keys(session.pageAudioUrls).forEach((pk) => {
              imageMap[name].audioEntries.push({
                sessionId: session.id,
                username: session.username,
                pageKey: pk,
                audioUrl: session.pageAudioUrls[pk],
                isCurrent: String(pk) === String(choice.pairId),
              });
            });
          });
        }
      });
    });
  }

  if (mode === "ranked") {
    sessions.forEach((session) => {
      (session.rankings || []).forEach((r) => {
        const key = r.imageName || r.imageId || "unknown";
        if (!imageMap[key]) {
          imageMap[key] = {
            name: key,
            src: r.src || resolveImageUrl(key),
            scores: [],
            ranks: [],
            sessionCount: 0,
            perSession: [],
            audioEntries: [],
          };
        }
        const entry = imageMap[key];
        if (!entry.src && r.src) entry.src = r.src;
        if (r.rank != null) entry.ranks.push(Number(r.rank));
        entry.scores.push(r.rank != null ? 4 - Number(r.rank) : 0); // invert for "score"
        entry.sessionCount++;
        entry.perSession.push({
          sessionId: session.id,
          username: session.username,
          score: r.rank,
          groupId: r.groupId,
        });

        if (session.pageAudioUrls) {
          Object.keys(session.pageAudioUrls).forEach((pk) => {
            entry.audioEntries.push({
              sessionId: session.id,
              username: session.username,
              pageKey: pk,
              audioUrl: session.pageAudioUrls[pk],
              isCurrent: String(pk) === String(r.groupId),
            });
          });
        }
      });
    });
  }

  if (mode === "selection") {
    sessions.forEach((session) => {
      (session.selections || []).forEach((sel) => {
        const key = sel.imageName || sel.imageId || "unknown";
        if (!imageMap[key]) {
          imageMap[key] = {
            name: key,
            src: resolveImageUrl(key),
            selections: 0,
            sessionCount: 0,
            perSession: [],
            audioEntries: [],
          };
        }
        const entry = imageMap[key];
        if (sel.selected) entry.selections++;
        entry.sessionCount++;
        entry.perSession.push({
          sessionId: session.id,
          username: session.username,
          selected: sel.selected,
        });

        if (session.pageAudioUrls) {
          Object.keys(session.pageAudioUrls).forEach((pk) => {
            entry.audioEntries.push({
              sessionId: session.id,
              username: session.username,
              pageKey: pk,
              audioUrl: session.pageAudioUrls[pk],
              isCurrent: true,
            });
          });
        }
      });
    });
  }

  return Object.values(imageMap);
}

function getSessionList(sessions) {
  return sessions.map((s) => ({
    id: s.id,
    label: `User ${s.username} — ${new Date(s.timestamp).toLocaleString()}`,
    username: s.username,
  }));
}

function sessionIsVideo(session) {
  if (!session) return false;
  if (session.scores?.length) return isVideoName(session.scores[0]?.imageName);
  if (session.choices?.length) {
    const c = session.choices[0];
    return isVideoName(c?.winnerName) || isVideoName(c?.loserName);
  }
  if (session.rankings?.length) return isVideoName(session.rankings[0]?.imageName);
  return false;
}

// ─── Aggregate Summary Panel ────────────────────────────────────────

function AggregateSummary({ imageStats, mode }) {
  if (!imageStats.length) return null;

  const isRating = mode === "individual" || mode === "group";
  const isPairwise = mode === "pairwise";

  const allScores = imageStats.flatMap((s) => s.scores || []);
  const totalSessions = new Set(imageStats.flatMap((s) => s.perSession?.map((p) => p.sessionId) || [])).size;

  return (
    <Paper sx={{ p: 2.5, mb: 3, bgcolor: "#f8f9fe", borderRadius: 2, border: "1px solid #e8eaf6" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <InsightsIcon sx={{ color: "#3949ab" }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "#1a237e" }}>
          Aggregate Summary
        </Typography>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">Total Sessions</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{totalSessions}</Typography>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Typography variant="caption" color="text.secondary">Unique Images</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{imageStats.length}</Typography>
        </Grid>
        {isRating && allScores.length > 0 && (
          <>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Global Mean Score</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#1976d2" }}>
                {mean(allScores).toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Total Ratings</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{allScores.length}</Typography>
            </Grid>
          </>
        )}
        {isPairwise && (
          <>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Total Comparisons</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {Math.floor(imageStats.reduce((a, s) => a + (s.wins || 0) + (s.losses || 0), 0) / 2)}
              </Typography>
            </Grid>
          </>
        )}
      </Grid>
    </Paper>
  );
}

// ─── Image Card for Grid View ───────────────────────────────────────

function ResearcherImageCard({ imageData, mode, onViewAudio, onViewStats, onCompare, selectionMode, isSelected, onToggleSelect }) {
  const hasAudio = imageData.audioEntries?.some((e) => e.audioUrl);
  const [imgError, setImgError] = useState(false);
  const isVideo = isVideoName(imageData.name) || isVideoName(imageData.src);

  const primaryStat = useMemo(() => {
    if (mode === "individual" || mode === "group") {
      return imageData.scores?.length ? `Score: ${mean(imageData.scores).toFixed(1)}` : "No scores";
    }
    if (mode === "pairwise") {
      const total = (imageData.wins || 0) + (imageData.losses || 0);
      if (!total) return "No data";
      return `Win: ${((imageData.wins / total) * 100).toFixed(0)}%`;
    }
    if (mode === "ranked") {
      return imageData.ranks?.length ? `Avg Rank: ${mean(imageData.ranks).toFixed(1)}` : "No ranks";
    }
    if (mode === "selection") {
      const rate = imageData.sessionCount ? ((imageData.selections || 0) / imageData.sessionCount * 100) : 0;
      return `Selected: ${rate.toFixed(0)}%`;
    }
    return "";
  }, [imageData, mode]);

  return (
    <Card
      onClick={selectionMode ? onToggleSelect : undefined}
      sx={{
        position: "relative",
        borderRadius: 2,
        overflow: "hidden",
        transition: "box-shadow 0.2s, transform 0.2s",
        cursor: selectionMode ? "pointer" : "default",
        outline: isSelected ? "3px solid #1976d2" : "none",
        outlineOffset: -3,
        "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
      }}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <Checkbox
          checked={!!isSelected}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(); }}
          icon={<CheckBoxOutlineBlankIcon />}
          checkedIcon={<CheckBoxIcon />}
          sx={{
            position: "absolute",
            top: 4,
            left: 4,
            zIndex: 3,
            bgcolor: "rgba(255,255,255,0.9)",
            borderRadius: 1,
            p: 0.5,
            "&:hover": { bgcolor: "white" },
          }}
        />
      )}

      {!selectionMode && (
        <ImageActionMenu
          onViewAudio={onViewAudio}
          onViewStats={onViewStats}
          onCompare={onCompare}
          hasAudio={hasAudio}
        />
      )}

      {imageData.src && !imgError ? (
        isVideo ? (
          <Box
            sx={{
              height: 140,
              bgcolor: "#f5f5f5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 1,
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                bgcolor: "#000",
                position: "relative",
                borderRadius: 1,
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <VideoThumbnail
                src={imageData.src}
                onError={() => setImgError(true)}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: 4,
                  left: 4,
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
          </Box>
        ) : (
          <CardMedia
            component="img"
            image={imageData.src}
            alt={imageData.name}
            onError={() => setImgError(true)}
            sx={{ height: 140, objectFit: "contain", bgcolor: "#f5f5f5" }}
          />
        )
      ) : (
        <Box
          sx={{
            height: 140,
            bgcolor: "#e8eaf6",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              bgcolor: "#c5cae9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#3949ab",
            }}
          >
            {(imageData.name || "?").charAt(0).toUpperCase()}
          </Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 1, textAlign: "center", fontSize: "0.65rem", lineHeight: 1.2, maxWidth: "90%" }}
          >
            {imageData.name}
          </Typography>
        </Box>
      )}

      <CardContent sx={{ py: 1.5, px: 2 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            display: "block",
            textOverflow: "ellipsis",
            overflow: "hidden",
            whiteSpace: "nowrap",
            mb: 0.5,
          }}
        >
          {imageData.name}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Chip
            label={primaryStat}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: "0.7rem", height: 22 }}
          />
          <Typography variant="caption" color="text.secondary">
            n={imageData.sessionCount}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Table View ─────────────────────────────────────────────────────

function ImageTableView({ imageStats, mode, onViewAudio, onViewStats }) {
  const isRating = mode === "individual" || mode === "group";
  const isPairwise = mode === "pairwise";
  const isRanked = mode === "ranked";
  const isSelection = mode === "selection";

  const sorted = useMemo(() => {
    return [...imageStats].sort((a, b) => {
      if (isRating) return mean(b.scores || []) - mean(a.scores || []);
      if (isPairwise) {
        const aRate = a.wins / Math.max(a.wins + a.losses, 1);
        const bRate = b.wins / Math.max(b.wins + b.losses, 1);
        return bRate - aRate;
      }
      if (isRanked) return mean(a.ranks || []) - mean(b.ranks || []);
      if (isSelection) return (b.selections || 0) / Math.max(b.sessionCount, 1) - (a.selections || 0) / Math.max(a.sessionCount, 1);
      return 0;
    });
  }, [imageStats, mode]);

  return (
    <Table size="small">
      <TableHead>
        <TableRow sx={{ bgcolor: "#f5f5f5" }}>
          <TableCell sx={{ fontWeight: 700 }}>Image</TableCell>
          <TableCell align="center" sx={{ fontWeight: 700 }}>Sessions</TableCell>
          {isRating && <TableCell align="right" sx={{ fontWeight: 700 }}>Mean Score</TableCell>}
          {isRating && <TableCell align="right" sx={{ fontWeight: 700 }}>Avg Time</TableCell>}
          {isPairwise && <TableCell align="right" sx={{ fontWeight: 700 }}>Wins</TableCell>}
          {isPairwise && <TableCell align="right" sx={{ fontWeight: 700 }}>Losses</TableCell>}
          {isPairwise && <TableCell align="right" sx={{ fontWeight: 700 }}>Win Rate</TableCell>}
          {isRanked && <TableCell align="right" sx={{ fontWeight: 700 }}>Avg Rank</TableCell>}
          {isSelection && <TableCell align="right" sx={{ fontWeight: 700 }}>Selection Rate</TableCell>}
          <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.map((img) => {
          const hasAudio = img.audioEntries?.some((e) => e.audioUrl);
          const rowIsVideo = isVideoName(img.name) || isVideoName(img.src);
          return (
            <TableRow key={img.name} hover>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  {img.src ? (
                    rowIsVideo ? (
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 1,
                          overflow: "hidden",
                          bgcolor: "#000",
                          border: "1px solid #e0e0e0",
                          flexShrink: 0,
                        }}
                      >
                        <VideoThumbnail src={img.src} />
                      </Box>
                    ) : (
                      <Box
                        component="img"
                        src={img.src}
                        alt={img.name}
                        sx={{
                          width: 44,
                          height: 44,
                          objectFit: "contain",
                          borderRadius: 1,
                          bgcolor: "#f5f5f5",
                          border: "1px solid #e0e0e0",
                          flexShrink: 0,
                        }}
                      />
                    )
                  ) : (
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 1,
                        bgcolor: "#e8eaf6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "#3949ab",
                      }}
                    >
                      {(img.name || "?").charAt(0).toUpperCase()}
                    </Box>
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {img.name}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="center">{img.sessionCount}</TableCell>
              {isRating && (
                <TableCell align="right" sx={{ fontWeight: 600, color: "#1976d2" }}>
                  {img.scores?.length ? mean(img.scores).toFixed(2) : "—"}
                </TableCell>
              )}
              {isRating && (
                <TableCell align="right">
                  {img.times?.length ? `${mean(img.times).toFixed(1)}s` : "—"}
                </TableCell>
              )}
              {isPairwise && <TableCell align="right" sx={{ color: "#2e7d32", fontWeight: 600 }}>{img.wins || 0}</TableCell>}
              {isPairwise && <TableCell align="right" sx={{ color: "#d32f2f" }}>{img.losses || 0}</TableCell>}
              {isPairwise && (
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {img.wins + img.losses > 0
                    ? `${((img.wins / (img.wins + img.losses)) * 100).toFixed(0)}%`
                    : "—"}
                </TableCell>
              )}
              {isRanked && (
                <TableCell align="right" sx={{ fontWeight: 600, color: "#7b1fa2" }}>
                  {img.ranks?.length ? mean(img.ranks).toFixed(1) : "—"}
                </TableCell>
              )}
              {isSelection && (
                <TableCell align="right" sx={{ fontWeight: 600, color: "#2e7d32" }}>
                  {img.sessionCount > 0
                    ? `${(((img.selections || 0) / img.sessionCount) * 100).toFixed(0)}%`
                    : "—"}
                </TableCell>
              )}
              <TableCell align="center">
                <Tooltip title="View Stats">
                  <IconButton size="small" onClick={() => onViewStats(img)}>
                    <BarChartIcon fontSize="small" sx={{ color: "#1976d2" }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={hasAudio ? "View Audio" : "No audio"}>
                  <span>
                    <IconButton size="small" disabled={!hasAudio} onClick={() => onViewAudio(img)}>
                      <BarChartIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ─── PDF Export ──────────────────────────────────────────────────────

function generateReportText(mode, sessions, imageStats) {
  const lines = [];
  lines.push(`RESEARCHER REPORT — ${mode.toUpperCase()} MODE`);
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push(`Total Sessions: ${sessions.length}`);
  lines.push(`Unique Images: ${imageStats.length}`);
  lines.push("");

  const isRating = mode === "individual" || mode === "group";
  const isPairwise = mode === "pairwise";

  if (isRating) {
    const allScores = imageStats.flatMap((s) => s.scores || []);
    lines.push(`Global Mean Score: ${mean(allScores).toFixed(2)}`);
    lines.push(`Total Ratings: ${allScores.length}`);
    lines.push("");
    lines.push("IMAGE BREAKDOWN:");
    lines.push("─".repeat(60));
    imageStats
      .sort((a, b) => mean(b.scores || []) - mean(a.scores || []))
      .forEach((img) => {
        lines.push(`  ${img.name}`);
        lines.push(`    Mean: ${mean(img.scores || []).toFixed(2)}, Sessions: ${img.sessionCount}, Avg Time: ${img.times?.length ? mean(img.times).toFixed(1) + "s" : "—"}`);
      });
  }

  if (isPairwise) {
    lines.push("IMAGE WIN RATES:");
    lines.push("─".repeat(60));
    imageStats
      .sort((a, b) => (b.wins / Math.max(b.wins + b.losses, 1)) - (a.wins / Math.max(a.wins + a.losses, 1)))
      .forEach((img) => {
        const total = (img.wins || 0) + (img.losses || 0);
        const rate = total ? ((img.wins / total) * 100).toFixed(0) : "—";
        lines.push(`  ${img.name}: ${img.wins}W / ${img.losses}L (${rate}%)`);
      });
  }

  lines.push("");
  lines.push("PER-SESSION DATA:");
  lines.push("─".repeat(60));
  sessions.forEach((s) => {
    lines.push(`  Session ${s.id} — User: ${s.username} — ${new Date(s.timestamp).toLocaleString()}`);
  });

  return lines.join("\n");
}

// ─── Main ResearcherView ────────────────────────────────────────────

const MODE_TABS = [
  { id: "individual", label: "Individual" },
  { id: "pairwise", label: "Pairwise" },
  { id: "ranked", label: "Ranked" },
  { id: "selection", label: "Selection" },
  { id: "group", label: "Group" },
];

export default function ResearcherView() {
  const {
    individualSessions,
    pairwiseSessions,
    rankedSessions,
    selectionSessions,
    groupSessions,
    videoPairwiseSessions,
    fixedSessions,
    groupSessionsByLayout,
  } = useResults();

  const navigate = useNavigate();

  const [viewSection, setViewSection] = useState("ratings"); // "ratings" | "gaze"
  const [activeMode, setActiveMode] = useState("individual");
  const [mediaFilter, setMediaFilter] = useState("image"); // "image" | "video"
  // Session filter
  const [selectedSession, setSelectedSession] = useState("all");
  // View mode
  const [viewMode, setViewMode] = useState("grid");

  // Image selection for simulated session
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState(new Set());

  // Modal state
  const [audioModal, setAudioModal] = useState({ open: false, imageName: "", entries: [] });
  const [statsModal, setStatsModal] = useState({ open: false, imageName: "", src: "", stats: null, mode: "", imagesLookup: {} });
  const [comparisonModal, setComparisonModal] = useState({ open: false, images: [], indices: [0, 1] });
  const [heatmapModal, setHeatmapModal] = useState({ open: false, images: [] });

  const wantVideo = mediaFilter === "video";

  // Get sessions for active mode, filtered by media type (images vs videos)
  const allSessions = useMemo(() => {
    const filterByMedia = (list) => list.filter((s) => sessionIsVideo(s) === wantVideo);
    switch (activeMode) {
      case "individual": return filterByMedia(individualSessions);
      case "pairwise": return wantVideo ? videoPairwiseSessions : pairwiseSessions;
      case "ranked": return filterByMedia(rankedSessions);
      case "selection": return filterByMedia(selectionSessions);
      case "group": {
        const layoutSessions = Object.values(groupSessionsByLayout || {}).flat();
        return filterByMedia([...groupSessions, ...layoutSessions, ...fixedSessions]);
      }
      default: return [];
    }
  }, [activeMode, wantVideo, individualSessions, pairwiseSessions, videoPairwiseSessions, rankedSessions, selectionSessions, groupSessions, groupSessionsByLayout, fixedSessions]);

  // Filter by selected session
  const filteredSessions = useMemo(() => {
    if (selectedSession === "all") return allSessions;
    return allSessions.filter((s) => String(s.id) === String(selectedSession));
  }, [allSessions, selectedSession]);

  // Build image stats
  const imageStats = useMemo(() => {
    return buildImageStats(filteredSessions, activeMode);
  }, [filteredSessions, activeMode]);

  // Session list for selector
  const sessionOptions = useMemo(() => getSessionList(allSessions), [allSessions]);

  // Modal handlers
  const handleViewAudio = useCallback((imageData) => {
    setAudioModal({
      open: true,
      imageName: imageData.name,
      entries: imageData.audioEntries || [],
    });
  }, []);

  const handleViewStats = useCallback((imageData) => {
    // Build a name -> src lookup so the stats modal can render
    // opposing-image thumbnails for pairwise per-session rows.
    const lookup = {};
    for (const s of imageStats) {
      if (s?.name && s.src) lookup[s.name] = s.src;
    }
    setStatsModal({
      open: true,
      imageName: imageData.name,
      src: imageData.src || "",
      stats: imageData,
      mode: activeMode,
      imagesLookup: lookup,
    });
  }, [activeMode, imageStats]);

  const handleCompare = useCallback((imageData) => {
    const idx = imageStats.findIndex((s) => s.name === imageData.name);
    const compImages = imageStats.map((s) => ({
      name: s.name,
      src: s.src || "",
      stats: s,
    }));
    const first = idx >= 0 ? idx : 0;
    const second = first === 0 && imageStats.length > 1 ? 1 : 0;
    setComparisonModal({
      open: true,
      images: compImages,
      indices: imageStats.length >= 2 ? [first, second] : [first],
    });
  }, [imageStats]);

  // PDF export
  const handleExportReport = useCallback(() => {
    const text = generateReportText(activeMode, filteredSessions, imageStats);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `researcher_report_${activeMode}_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activeMode, filteredSessions, imageStats]);

  // Open comparison tool
  const handleOpenComparison = useCallback(() => {
    const compImages = imageStats.map((s) => ({
      name: s.name,
      src: s.src || "",
      stats: s,
    }));
    if (compImages.length < 2) return;
    setComparisonModal({
      open: true,
      images: compImages,
      indices: [0, 1],
    });
  }, [imageStats]);

  // Image selection handlers
  const toggleImageSelection = useCallback((imageName) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(imageName)) next.delete(imageName);
      else next.add(imageName);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedImages.size === imageStats.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(imageStats.map((s) => s.name)));
    }
  }, [imageStats, selectedImages.size]);

  const handleStartSimulation = useCallback(() => {
    const selected = imageStats.filter((s) => selectedImages.has(s.name));
    if (selected.length === 0) return;
    navigate("/researcher/simulate", {
      state: { mode: activeMode, images: selected },
    });
  }, [imageStats, selectedImages, activeMode, navigate]);

  const handleViewHeatmaps = useCallback(() => {
    const selected = imageStats.filter((s) => selectedImages.has(s.name));
    if (selected.length === 0) return;
    setHeatmapModal({
      open: true,
      images: selected.map((s) => ({ name: String(s.name), src: s.src || "" })),
    });
  }, [imageStats, selectedImages]);

  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => {
      if (prev) setSelectedImages(new Set()); // clear on exit
      return !prev;
    });
  }, []);

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 6 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a237e" }}>
            Researcher View
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Analyze sessions, audio, and statistics across all rating modes
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            variant={selectionMode ? "contained" : "outlined"}
            startIcon={<SelectAllIcon />}
            onClick={handleToggleSelectionMode}
            size="small"
            color={selectionMode ? "secondary" : "inherit"}
          >
            {selectionMode ? "Cancel Selection" : "Select Images"}
          </Button>
          {selectionMode && (
            <>
              <Button
                variant="outlined"
                size="small"
                onClick={handleSelectAll}
              >
                {selectedImages.size === imageStats.length ? "Deselect All" : "Select All"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<VisibilityIcon />}
                onClick={handleViewHeatmaps}
                disabled={selectedImages.size === 0}
                size="small"
              >
                View Heatmaps ({selectedImages.size})
              </Button>
              <Button
                variant="contained"
                startIcon={<PlayCircleOutlineIcon />}
                onClick={handleStartSimulation}
                disabled={selectedImages.size === 0}
                size="small"
                color="success"
              >
                Simulate ({selectedImages.size})
              </Button>
            </>
          )}
          {!selectionMode && (
            <>
              <Button
                variant="outlined"
                startIcon={<CompareArrowsIcon />}
                onClick={handleOpenComparison}
                disabled={imageStats.length < 2}
                size="small"
              >
                Compare
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportReport}
                disabled={filteredSessions.length === 0}
                size="small"
                sx={{ bgcolor: "#1a237e" }}
              >
                Export Report
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Section Toggle */}
      <Paper sx={{ mb: 3, borderRadius: 2, overflow: "hidden" }}>
        <Tabs
          value={viewSection}
          onChange={(_, v) => setViewSection(v)}
          variant="fullWidth"
          sx={{
            bgcolor: "#1a237e",
            "& .MuiTab-root": { fontWeight: 700, textTransform: "none", minHeight: 56, color: "rgba(255,255,255,0.7)" },
            "& .Mui-selected": { color: "#fff" },
            "& .MuiTabs-indicator": { backgroundColor: "#fff", height: 3 },
          }}
        >
          <Tab value="ratings" label="Ratings & Audio" />
          <Tab value="gaze" label="Gaze Analytics" />
        </Tabs>
      </Paper>

      {viewSection === "gaze" && <GazeAnalyticsSection />}

      {viewSection === "ratings" && (
      <>
      {/* Media Toggle (Images / Videos) */}
      <Paper sx={{ mb: 2, p: 1.5, borderRadius: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#1a237e" }}>
          Media:
        </Typography>
        <ToggleButtonGroup
          value={mediaFilter}
          exclusive
          onChange={(_, v) => {
            if (!v) return;
            setMediaFilter(v);
            setSelectedSession("all");
            setSelectionMode(false);
            setSelectedImages(new Set());
          }}
          size="small"
        >
          <ToggleButton value="image">
            <ImageIcon fontSize="small" sx={{ mr: 0.75 }} />
            Images
          </ToggleButton>
          <ToggleButton value="video">
            <VideocamIcon fontSize="small" sx={{ mr: 0.75 }} />
            Videos
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {/* Mode Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2, overflow: "hidden" }}>
        <Tabs
          value={activeMode}
          onChange={(_, v) => { setActiveMode(v); setSelectedSession("all"); setSelectionMode(false); setSelectedImages(new Set()); }}
          variant="fullWidth"
          sx={{
            bgcolor: "#f5f5f5",
            "& .MuiTab-root": { fontWeight: 600, textTransform: "none", minHeight: 48 },
            "& .Mui-selected": { color: "#1a237e" },
          }}
        >
          {MODE_TABS.map((tab) => (
            <Tab key={tab.id} value={tab.id} label={tab.label} />
          ))}
        </Tabs>
      </Paper>

      {/* Controls Row */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: "center", flexWrap: "wrap" }}>
        {/* Session Selector */}
        <FormControl size="small" sx={{ minWidth: 280 }}>
          <InputLabel>Session</InputLabel>
          <Select
            value={selectedSession}
            label="Session"
            onChange={(e) => setSelectedSession(e.target.value)}
          >
            <MenuItem value="all">
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <InsightsIcon fontSize="small" />
                All Sessions ({allSessions.length})
              </Box>
            </MenuItem>
            <Divider />
            {sessionOptions.map((opt) => (
              <MenuItem key={opt.id} value={opt.id}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <PersonIcon fontSize="small" sx={{ color: "text.secondary" }} />
                  {opt.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* View Toggle */}
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, v) => { if (v) setViewMode(v); }}
          size="small"
        >
          <ToggleButton value="grid">
            <Tooltip title="Grid View">
              <GridViewIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
          <ToggleButton value="table">
            <Tooltip title="Table View">
              <ViewListIcon fontSize="small" />
            </Tooltip>
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Info chips */}
        <Box sx={{ flex: 1 }} />
        <Chip label={`${filteredSessions.length} session(s)`} size="small" variant="outlined" />
        <Chip label={`${imageStats.length} image(s)`} size="small" variant="outlined" />
      </Box>

      {/* Aggregate Summary */}
      {selectedSession === "all" && !selectionMode && (
        <AggregateSummary imageStats={imageStats} mode={activeMode} />
      )}

      {/* Selection mode bar */}
      {selectionMode && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            bgcolor: "#e8eaf6",
            border: "1px solid #c5cae9",
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <PlayCircleOutlineIcon sx={{ color: "#283593" }} />
            <Typography variant="body2">
              <strong>{selectedImages.size}</strong> of {imageStats.length} images selected.
              Click images to select them, then press <strong>Simulate</strong> to preview as a participant would see them.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" variant="outlined" onClick={handleSelectAll}>
              {selectedImages.size === imageStats.length ? "Deselect All" : "Select All"}
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<VisibilityIcon />}
              disabled={selectedImages.size === 0}
              onClick={handleViewHeatmaps}
            >
              View Heatmaps ({selectedImages.size})
            </Button>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<PlayCircleOutlineIcon />}
              disabled={selectedImages.size === 0}
              onClick={handleStartSimulation}
            >
              Simulate ({selectedImages.size})
            </Button>
          </Box>
        </Paper>
      )}

      {/* Content */}
      {filteredSessions.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: "center", borderRadius: 2 }}>
          <SummarizeIcon sx={{ fontSize: 48, color: "action.disabled", mb: 1 }} />
          <Typography color="text.secondary">
            No sessions found for {activeMode} mode.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Complete some rating sessions to see data here.
          </Typography>
        </Paper>
      ) : viewMode === "grid" ? (
        <Grid container spacing={2}>
          {imageStats.map((imgData) => (
            <Grid item xs={6} sm={4} md={3} lg={2.4} key={imgData.name}>
              <ResearcherImageCard
                imageData={imgData}
                mode={activeMode}
                onViewAudio={() => handleViewAudio(imgData)}
                onViewStats={() => handleViewStats(imgData)}
                onCompare={() => handleCompare(imgData)}
                selectionMode={selectionMode}
                isSelected={selectedImages.has(imgData.name)}
                onToggleSelect={() => toggleImageSelection(imgData.name)}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
          <ImageTableView
            imageStats={imageStats}
            mode={activeMode}
            onViewAudio={handleViewAudio}
            onViewStats={handleViewStats}
          />
        </Paper>
      )}
      </>
      )}

      {/* Modals */}
      <AudioModal
        open={audioModal.open}
        onClose={() => setAudioModal({ open: false, imageName: "", entries: [] })}
        imageName={audioModal.imageName}
        audioEntries={audioModal.entries}
      />

      <StatsModal
        open={statsModal.open}
        onClose={() => setStatsModal({ open: false, imageName: "", src: "", stats: null, mode: "", imagesLookup: {} })}
        imageName={statsModal.imageName}
        imageSrc={statsModal.src}
        stats={statsModal.stats}
        mode={statsModal.mode}
        imagesLookup={statsModal.imagesLookup}
      />

      <ImageComparisonModal
        open={comparisonModal.open}
        onClose={() => setComparisonModal({ open: false, images: [], indices: [0, 1] })}
        images={comparisonModal.images}
        initialIndices={comparisonModal.indices}
        mode={activeMode}
      />

      <SelectedImagesHeatmapModal
        open={heatmapModal.open}
        onClose={() => setHeatmapModal({ open: false, images: [] })}
        selectedImageData={heatmapModal.images}
      />
    </Container>
  );
}