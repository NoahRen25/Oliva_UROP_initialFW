import React, { useMemo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Grid, Divider, Paper,
  IconButton, Chip, Table, TableBody, TableCell,
  TableHead, TableRow, Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import BarChartIcon from "@mui/icons-material/BarChart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TimerIcon from "@mui/icons-material/Timer";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import VideoThumbnail from "./VideoThumbnail";

const VIDEO_EXT_RE = /\.(mp4|webm|mov|ogg)$/i;
const isVideoSrc = (s) => typeof s === "string" && VIDEO_EXT_RE.test(s);

/**
 * StatsModal — Shows aggregated statistics for a specific image.
 *
 * Props:
 *   open           — boolean
 *   onClose        — () => void
 *   imageName      — string
 *   imageSrc       — string (URL)
 *   stats          — { scores, times, interactions, clickOrders, ranks,
 *                      wins, losses, selections, memorabilityScore,
 *                      sessionCount, perSession }
 *   mode           — "individual" | "pairwise" | "ranked" | "selection" | "group"
 */

function StatCard({ label, value, subtitle, icon, color = "#1976d2" }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        textAlign: "center",
        bgcolor: "white",
      }}
    >
      <Box sx={{ color, mb: 0.5, display: "flex", justifyContent: "center" }}>
        {icon}
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 700, color }}>
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.25, fontSize: "0.65rem" }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
}

function MiniHistogram({ data, maxVal = 10, color = "#1976d2" }) {
  if (!data || data.length === 0) return null;

  const counts = {};
  data.forEach((v) => {
    const key = Math.round(v);
    counts[key] = (counts[key] || 0) + 1;
  });

  const maxCount = Math.max(...Object.values(counts), 1);
  const keys = [];
  for (let i = 1; i <= maxVal; i++) keys.push(i);

  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, height: 60, mt: 1 }}>
      {keys.map((k) => {
        const count = counts[k] || 0;
        const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0;
        return (
          <Tooltip key={k} title={`Score ${k}: ${count} time(s)`}>
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Box
                sx={{
                  width: "100%",
                  height: `${Math.max(heightPct, 4)}%`,
                  minHeight: 2,
                  bgcolor: count > 0 ? color : "#e0e0e0",
                  borderRadius: "2px 2px 0 0",
                  transition: "height 0.3s",
                }}
              />
              <Typography variant="caption" sx={{ fontSize: "0.55rem", mt: 0.25, color: "text.secondary" }}>
                {k}
              </Typography>
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
}

function WinLossBar({ wins, losses }) {
  const total = wins + losses;
  if (total === 0) return null;
  const winPct = (wins / total) * 100;

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: "#2e7d32", fontWeight: 600 }}>
          Wins: {wins} ({winPct.toFixed(0)}%)
        </Typography>
        <Typography variant="caption" sx={{ color: "#d32f2f", fontWeight: 600 }}>
          Losses: {losses} ({(100 - winPct).toFixed(0)}%)
        </Typography>
      </Box>
      <Box sx={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden" }}>
        <Box sx={{ width: `${winPct}%`, bgcolor: "#2e7d32", transition: "width 0.3s" }} />
        <Box sx={{ width: `${100 - winPct}%`, bgcolor: "#d32f2f", transition: "width 0.3s" }} />
      </Box>
    </Box>
  );
}

export default function StatsModal({ open, onClose, imageName, imageSrc, stats, mode, imagesLookup }) {
  const computed = useMemo(() => {
    if (!stats) return null;

    const { scores = [], times = [], interactions = [], clickOrders = [] } = stats;

    const mean = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    const median = (arr) => {
      if (!arr.length) return 0;
      const s = [...arr].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    };
    const stdDev = (arr) => {
      if (arr.length < 2) return 0;
      const m = mean(arr);
      return Math.sqrt(arr.reduce((a, v) => a + (v - m) ** 2, 0) / arr.length);
    };

    return {
      scoreMean: mean(scores).toFixed(2),
      scoreMedian: median(scores).toFixed(2),
      scoreStdDev: stdDev(scores).toFixed(2),
      scoreMin: scores.length ? Math.min(...scores) : "—",
      scoreMax: scores.length ? Math.max(...scores) : "—",
      timeMean: mean(times).toFixed(2),
      timeMedian: median(times).toFixed(2),
      interactionMean: mean(interactions).toFixed(1),
      clickOrderMean: clickOrders.filter((c) => c !== "-" && c != null).length
        ? mean(clickOrders.filter((c) => c !== "-" && c != null).map(Number)).toFixed(1)
        : "—",
    };
  }, [stats]);

  if (!stats || !computed) return null;

  const isRating = mode === "individual" || mode === "group";
  const isPairwise = mode === "pairwise";
  const isRanked = mode === "ranked";
  const isSelection = mode === "selection";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#0f3460",
          color: "white",
          py: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <BarChartIcon sx={{ color: "#e94560" }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Image Statistics
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
              {imageName} — {stats.sessionCount || 0} session(s)
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Image preview + memorability */}
        <Box sx={{ display: "flex", gap: 3, mb: 3 }}>
          {imageSrc ? (
            isVideoSrc(imageSrc) || isVideoSrc(imageName) ? (
              <Box
                sx={{
                  width: 160,
                  height: 120,
                  borderRadius: 2,
                  bgcolor: "#000",
                  border: "1px solid #e0e0e0",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                <VideoThumbnail src={imageSrc} objectFit="contain" />
              </Box>
            ) : (
            <Box
              component="img"
              src={imageSrc}
              alt={imageName}
              onError={(e) => { e.target.style.display = "none"; }}
              sx={{
                width: 160,
                height: 120,
                objectFit: "contain",
                borderRadius: 2,
                bgcolor: "#f0f0f0",
                border: "1px solid #e0e0e0",
                flexShrink: 0,
              }}
            />
            )
          ) : (
            <Box
              sx={{
                width: 160,
                height: 120,
                borderRadius: 2,
                bgcolor: "#e8eaf6",
                border: "1px solid #c5cae9",
                flexShrink: 0,
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
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: "#3949ab",
                }}
              >
                {(imageName || "?").charAt(0).toUpperCase()}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.6rem", textAlign: "center", px: 1 }}>
                No preview
              </Typography>
            </Box>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              {imageName}
            </Typography>
            {stats.memorabilityScore != null && (
              <Chip
                label={`Memorability: ${Number(stats.memorabilityScore).toFixed(3)}`}
                size="small"
                color="secondary"
                sx={{ mb: 1 }}
              />
            )}
            <Typography variant="body2" color="text.secondary">
              Appeared in {stats.sessionCount || 0} session(s)
              {mode && ` (${mode} mode)`}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Score statistics (for rating modes) */}
        {(isRating || isRanked) && stats.scores?.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#0f3460" }}>
              Score Distribution
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={4} sm={2.4}>
                <StatCard label="Mean" value={computed.scoreMean} icon={<TrendingUpIcon fontSize="small" />} />
              </Grid>
              <Grid item xs={4} sm={2.4}>
                <StatCard label="Median" value={computed.scoreMedian} icon={<BarChartIcon fontSize="small" />} color="#7b1fa2" />
              </Grid>
              <Grid item xs={4} sm={2.4}>
                <StatCard label="Std Dev" value={computed.scoreStdDev} icon={<BarChartIcon fontSize="small" />} color="#e65100" />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StatCard label="Min" value={computed.scoreMin} icon={<BarChartIcon fontSize="small" />} color="#d32f2f" />
              </Grid>
              <Grid item xs={6} sm={2.4}>
                <StatCard label="Max" value={computed.scoreMax} icon={<BarChartIcon fontSize="small" />} color="#2e7d32" />
              </Grid>
            </Grid>
            <Paper sx={{ p: 2, mb: 3, bgcolor: "#fafafa", borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
                Score Histogram (n={stats.scores.length})
              </Typography>
              <MiniHistogram data={stats.scores} maxVal={isRating ? 5 : 10} color="#1976d2" />
            </Paper>
          </>
        )}

        {/* Time statistics */}
        {stats.times?.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#0f3460" }}>
              Response Time
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <StatCard
                  label="Avg Time"
                  value={`${computed.timeMean}s`}
                  icon={<TimerIcon fontSize="small" />}
                  color="#00695c"
                />
              </Grid>
              <Grid item xs={4}>
                <StatCard
                  label="Median Time"
                  value={`${computed.timeMedian}s`}
                  icon={<TimerIcon fontSize="small" />}
                  color="#00695c"
                />
              </Grid>
              <Grid item xs={4}>
                <StatCard
                  label="Avg Interactions"
                  value={computed.interactionMean}
                  icon={<TouchAppIcon fontSize="small" />}
                  color="#6a1b9a"
                />
              </Grid>
            </Grid>
          </>
        )}

        {/* Click order stats */}
        {stats.clickOrders?.filter((c) => c !== "-" && c != null).length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#0f3460" }}>
              Click Order
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <StatCard
                  label="Avg Click Position"
                  value={computed.clickOrderMean}
                  subtitle="Lower = clicked earlier"
                  icon={<TouchAppIcon fontSize="small" />}
                  color="#f57c00"
                />
              </Grid>
            </Grid>
          </>
        )}

        {/* Pairwise: Win/Loss */}
        {isPairwise && (stats.wins > 0 || stats.losses > 0) && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#0f3460" }}>
              Pairwise Record
            </Typography>
            <Paper sx={{ p: 2, mb: 3, bgcolor: "#fafafa", borderRadius: 2 }}>
              <WinLossBar wins={stats.wins || 0} losses={stats.losses || 0} />
            </Paper>
          </>
        )}

        {/* Selection: selection rate */}
        {isSelection && stats.selections != null && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#0f3460" }}>
              Selection Rate
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <StatCard
                  label="Selected"
                  value={`${((stats.selections / Math.max(stats.sessionCount, 1)) * 100).toFixed(0)}%`}
                  subtitle={`${stats.selections} / ${stats.sessionCount} sessions`}
                  icon={<EmojiEventsIcon fontSize="small" />}
                  color="#2e7d32"
                />
              </Grid>
            </Grid>
          </>
        )}

        {/* Ranked: rank distribution */}
        {isRanked && stats.ranks?.length > 0 && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: "#0f3460" }}>
              Rank Distribution
            </Typography>
            <Paper sx={{ p: 2, mb: 3, bgcolor: "#fafafa", borderRadius: 2 }}>
              <MiniHistogram data={stats.ranks} maxVal={3} color="#7b1fa2" />
            </Paper>
          </>
        )}

        {/* Per-session breakdown */}
        {stats.perSession?.length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: "#0f3460" }}>
              Per-Session Breakdown
            </Typography>
            {isPairwise ? (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell><strong>User ID</strong></TableCell>
                    <TableCell align="center"><strong>Result</strong></TableCell>
                    <TableCell><strong>Opposing Image</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.perSession.map((ps, i) => {
                    const opponentName = ps.opponent || "—";
                    const opponentSrc =
                      imagesLookup && opponentName ? imagesLookup[opponentName] : null;
                    const isWin = ps.result === "Win";
                    return (
                      <TableRow key={i}>
                        <TableCell>{ps.username ?? "—"}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={ps.result || "—"}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.7rem",
                              fontWeight: 600,
                              bgcolor: isWin ? "#e8f5e9" : "#ffebee",
                              color: isWin ? "#2e7d32" : "#c62828",
                              border: `1px solid ${isWin ? "#a5d6a7" : "#ef9a9a"}`,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {opponentSrc ? (
                              isVideoSrc(opponentSrc) || isVideoSrc(opponentName) ? (
                                <Box
                                  sx={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 1,
                                    bgcolor: "#000",
                                    border: "1px solid #e0e0e0",
                                    overflow: "hidden",
                                    flexShrink: 0,
                                  }}
                                >
                                  <VideoThumbnail src={opponentSrc} />
                                </Box>
                              ) : (
                              <Box
                                component="img"
                                src={opponentSrc}
                                alt={opponentName}
                                onError={(e) => { e.target.style.display = "none"; }}
                                sx={{
                                  width: 36,
                                  height: 36,
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
                                  width: 36,
                                  height: 36,
                                  borderRadius: 1,
                                  bgcolor: "#e8eaf6",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  color: "#3949ab",
                                  flexShrink: 0,
                                }}
                              >
                                {(opponentName || "?").charAt(0).toUpperCase()}
                              </Box>
                            )}
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {opponentName}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell><strong>User</strong></TableCell>
                    <TableCell align="right"><strong>Score</strong></TableCell>
                    <TableCell align="right"><strong>Time</strong></TableCell>
                    <TableCell align="right"><strong>Interactions</strong></TableCell>
                    <TableCell align="center"><strong>Click Order</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.perSession.map((ps, i) => (
                    <TableRow key={i}>
                      <TableCell>{ps.username}</TableCell>
                      <TableCell align="right">{ps.score ?? "—"}</TableCell>
                      <TableCell align="right">{ps.time ? `${ps.time}s` : "—"}</TableCell>
                      <TableCell align="right">{ps.interactions ?? "—"}</TableCell>
                      <TableCell align="center">{ps.clickOrder ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, bgcolor: "#fafafa" }}>
        <Button onClick={onClose} variant="outlined" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}