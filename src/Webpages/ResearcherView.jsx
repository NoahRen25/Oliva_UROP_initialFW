import React, { useState, useMemo, useCallback, useRef } from "react";
import { useResults } from "../Results";
import {
  Container, Typography, Box, Paper, Card, CardMedia, CardContent,
  Chip, IconButton, Tooltip, Select, MenuItem, FormControl,
  InputLabel, Slider, Divider, Avatar, LinearProgress, Badge,
  Table, TableBody, TableCell, TableHead, TableRow, Button, Alert,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import DownloadIcon from "@mui/icons-material/Download";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import PersonIcon from "@mui/icons-material/Person";
import BarChartIcon from "@mui/icons-material/BarChart";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SpeedIcon from "@mui/icons-material/Speed";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import TimelineIcon from "@mui/icons-material/Timeline";
import InfoIcon from "@mui/icons-material/Info";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExportCSVButton from "../components/ExportCSVButton";

// ─── Audio player mini-component ─────────────────────────────────
function AudioPlayer({ url, label }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const toggle = useCallback(() => {
    if (playing) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current = null; }
      setPlaying(false);
    } else if (url) {
      const a = new Audio(url);
      audioRef.current = a;
      a.onended = () => { setPlaying(false); audioRef.current = null; };
      a.onerror = () => { setPlaying(false); audioRef.current = null; };
      a.play().catch(() => setPlaying(false));
      setPlaying(true);
    }
  }, [playing, url]);

  const download = useCallback(() => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label || "recording"}.webm`.replace(/\s+/g, "_");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [url, label]);

  if (!url) return <Chip label="No audio" size="small" variant="outlined" sx={{ opacity: 0.4 }} />;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Tooltip title={playing ? "Stop" : "Play"}>
        <IconButton
          size="small"
          onClick={toggle}
          sx={{ color: playing ? "error.main" : "success.main" }}
        >
          {playing ? <StopIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      <Tooltip title="Download">
        <IconButton size="small" onClick={download} sx={{ color: "grey.600" }}>
          <DownloadIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

// ─── Score distribution mini-bar ──────────────────────────────────
function MiniHistogram({ scores, maxScore = 10 }) {
  const buckets = {};
  for (let i = 1; i <= maxScore; i++) buckets[i] = 0;
  scores.forEach((s) => {
    const k = Math.round(s);
    if (k >= 1 && k <= maxScore) buckets[k]++;
  });
  const maxCount = Math.max(...Object.values(buckets), 1);

  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", gap: "2px", height: 40 }}>
      {Object.entries(buckets).map(([k, count]) => (
        <Tooltip key={k} title={`Score ${k}: ${count} rating${count !== 1 ? "s" : ""}`}>
          <Box
            sx={{
              width: 8,
              height: `${Math.max((count / maxCount) * 100, 4)}%`,
              bgcolor: count > 0 ? "#1976d2" : "#e0e0e0",
              borderRadius: "2px 2px 0 0",
              transition: "height 0.3s",
              cursor: "default",
            }}
          />
        </Tooltip>
      ))}
    </Box>
  );
}

// ─── Stat chip ────────────────────────────────────────────────────
function StatChip({ icon, label, value, color = "default" }) {
  return (
    <Chip
      icon={icon}
      label={`${label}: ${value}`}
      size="small"
      variant="outlined"
      color={color}
      sx={{ fontWeight: "medium" }}
    />
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function ResearcherView() {
  const {
    individualSessions,
    pairwiseSessions,
    videoPairwiseSessions,
    rankedSessions,
    bestWorstSessions,
    selectionSessions,
    fixedSessions,
    groupSessionsByLayout,
    pressureCookerSessions,
  } = useResults();

  const [selectedMode, setSelectedMode] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");

  // ── Aggregate all sessions into a unified shape ──────────────
  const allSessions = useMemo(() => {
    const sessions = [];

    // Individual
    individualSessions.forEach((s) => {
      sessions.push({
        ...s,
        mode: "individual",
        modeLabel: "Individual",
        items: (s.scores || []).map((sc, i) => ({
          type: "score",
          imageName: sc.imageName,
          imageSrc: sc.imageSrc || null,
          prompt: sc.prompt,
          score: sc.score,
          timeSpent: sc.timeSpent,
          moves: sc.interactionCount || 0,
          pageKey: sc.imageId === 0 || sc.imageId === "0" ? "benchmark" : i,
          isBenchmark: sc.imageId === 0 || sc.imageId === "0",
        })),
      });
    });

    // Pairwise
    pairwiseSessions.forEach((s) => {
      sessions.push({
        ...s,
        mode: "pairwise",
        modeLabel: "Pairwise",
        items: (s.choices || []).map((c) => ({
          type: "pairwise",
          winner: c.winnerName,
          loser: c.loserName,
          winnerSide: c.winnerSide,
          prompt: c.prompt,
          pageKey: c.pairId,
        })),
      });
    });

    // Video Pairwise
    videoPairwiseSessions.forEach((s) => {
      sessions.push({
        ...s,
        mode: "video_pairwise",
        modeLabel: "Video Pairwise",
        items: (s.choices || []).map((c) => ({
          type: "pairwise",
          winner: c.winnerName,
          loser: c.loserName,
          winnerSide: c.winnerSide,
          prompt: c.prompt,
          pageKey: c.pairId,
        })),
      });
    });

    // Ranked
    rankedSessions.forEach((s) => {
      sessions.push({
        ...s,
        mode: "ranked",
        modeLabel: "Ranked",
        items: (s.rankings || []).map((r) => ({
          type: "ranked",
          imageName: r.imageName,
          rank: r.rank,
          groupId: r.groupId,
          prompt: r.groupPrompt,
          pageKey: r.groupId,
        })),
      });
    });

    // Best-Worst
    bestWorstSessions.forEach((s) => {
      sessions.push({
        ...s,
        mode: "best_worst",
        modeLabel: "Best-Worst",
        items: (s.trials || []).map((t) => ({
          type: "best_worst",
          bestName: t.bestName,
          worstName: t.worstName,
          prompt: t.prompt,
          responseTime: t.responseTime,
          pageKey: t.trialId,
        })),
      });
    });

    // Selection
    selectionSessions.forEach((s) => {
      sessions.push({
        ...s,
        mode: "selection",
        modeLabel: "Selection",
        items: (s.selections || []).map((sel, i) => ({
          type: "selection",
          imageName: sel.imageName,
          selected: sel.selected,
          prompt: sel.imagePrompt,
          pageKey: 1,
        })),
      });
    });

    // Fixed (Combo)
    fixedSessions.forEach((s) => {
      sessions.push({
        ...s,
        mode: "combo",
        modeLabel: "Combo Protocol",
        items: (s.scores || []).map((sc) => ({
          type: "score",
          imageName: sc.imageName,
          score: sc.score,
          position: sc.position,
          moves: sc.interactionCount || 0,
          clickOrder: sc.clickOrder,
          pageKey: parseInt((sc.position || "P1").replace(/P(\d).*/, "$1"), 10),
        })),
      });
    });

    // Layout groups
    Object.entries(groupSessionsByLayout || {}).forEach(([layoutId, layoutSessions]) => {
      (layoutSessions || []).forEach((s) => {
        sessions.push({
          ...s,
          mode: `layout_${layoutId}`,
          modeLabel: `Grid: ${layoutId}`,
          items: (s.scores || []).map((sc) => ({
            type: "score",
            imageName: sc.imageName,
            score: sc.score,
            position: sc.position,
            moves: sc.interactionCount || 0,
            clickOrder: sc.clickOrder,
            pageKey: parseInt((sc.position || "P1").replace(/P(\d).*/, "$1"), 10),
          })),
        });
      });
    });

    return sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [
    individualSessions, pairwiseSessions, videoPairwiseSessions,
    rankedSessions, bestWorstSessions, selectionSessions,
    fixedSessions, groupSessionsByLayout, pressureCookerSessions,
  ]);

  // ── Derived data ────────────────────────────────────────────
  const modes = useMemo(() => {
    const set = new Set(allSessions.map((s) => s.mode));
    return Array.from(set).sort();
  }, [allSessions]);

  const users = useMemo(() => {
    const set = new Set(allSessions.map((s) => s.username));
    return Array.from(set).sort();
  }, [allSessions]);

  const filtered = useMemo(() => {
    return allSessions.filter((s) => {
      if (selectedMode !== "all" && s.mode !== selectedMode) return false;
      if (selectedUser !== "all" && s.username !== selectedUser) return false;
      return true;
    });
  }, [allSessions, selectedMode, selectedUser]);

  // ── Aggregate stats ─────────────────────────────────────────
  const aggregateStats = useMemo(() => {
    const allScores = [];
    const allTimes = [];
    const allMoves = [];
    const imageScoreMap = {};

    filtered.forEach((s) => {
      (s.items || []).forEach((item) => {
        if (item.type === "score" && item.score != null) {
          allScores.push(item.score);
          if (item.timeSpent) allTimes.push(parseFloat(item.timeSpent));
          if (item.moves) allMoves.push(item.moves);
          const key = item.imageName || "unknown";
          if (!imageScoreMap[key]) imageScoreMap[key] = [];
          imageScoreMap[key].push(item.score);
        }
      });
    });

    const mean = (arr) => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : "N/A";
    const std = (arr) => {
      if (arr.length < 2) return "0.00";
      const m = arr.reduce((a, b) => a + b, 0) / arr.length;
      return Math.sqrt(arr.map((v) => (v - m) ** 2).reduce((a, b) => a + b, 0) / arr.length).toFixed(2);
    };

    return {
      totalSessions: filtered.length,
      totalRatings: allScores.length,
      uniqueUsers: new Set(filtered.map((s) => s.username)).size,
      meanScore: mean(allScores),
      stdScore: std(allScores),
      meanTime: mean(allTimes),
      meanMoves: mean(allMoves),
      scores: allScores,
      imageScoreMap,
    };
  }, [filtered]);

  // ── CSV export data ─────────────────────────────────────────
  const exportData = useMemo(() => {
    return filtered.flatMap((s) =>
      (s.items || []).map((item) => ({
        Mode: s.modeLabel,
        Username: s.username,
        Timestamp: s.timestamp,
        Image: item.imageName || item.winner || item.bestName || "",
        Score: item.score ?? "",
        Rank: item.rank ?? "",
        Winner: item.winner || "",
        Loser: item.loser || "",
        Selected: item.selected != null ? (item.selected ? "Yes" : "No") : "",
        Position: item.position || "",
        Moves: item.moves ?? "",
        ClickOrder: item.clickOrder || "",
        TimeSpent: item.timeSpent || "",
        Prompt: item.prompt || "",
      }))
    );
  }, [filtered]);

  if (allSessions.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          No experiment sessions found. Complete some rating flows first, then return here to see the researcher dashboard.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 6 }}>
      {/* ═══════ HEADER ═══════ */}
      <Paper
        elevation={0}
        sx={{
          p: 3, mb: 3, borderRadius: 3,
          background: "linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)",
          color: "white",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Researcher Dashboard
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
              Aggregated view of all participant sessions with recordings and analytics
            </Typography>
          </Box>
          <ExportCSVButton
            data={exportData}
            filename={`researcher_export_${new Date().toISOString().split("T")[0]}.csv`}
            label="Export All"
            variant="contained"
          />
        </Box>
      </Paper>

      {/* ═══════ FILTERS ═══════ */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2, display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
        <FilterListIcon color="action" />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Mode</InputLabel>
          <Select value={selectedMode} label="Mode" onChange={(e) => setSelectedMode(e.target.value)}>
            <MenuItem value="all">All Modes ({allSessions.length})</MenuItem>
            {modes.map((m) => {
              const label = allSessions.find((s) => s.mode === m)?.modeLabel || m;
              const count = allSessions.filter((s) => s.mode === m).length;
              return <MenuItem key={m} value={m}>{label} ({count})</MenuItem>;
            })}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>User</InputLabel>
          <Select value={selectedUser} label="User" onChange={(e) => setSelectedUser(e.target.value)}>
            <MenuItem value="all">All Users ({users.length})</MenuItem>
            {users.map((u) => (
              <MenuItem key={u} value={u}>{u}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Chip label={`${filtered.length} session${filtered.length !== 1 ? "s" : ""} shown`} color="primary" variant="outlined" />
      </Paper>

      {/* ═══════ AGGREGATE STATS ═══════ */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2, mb: 3 }}>
        {[
          { icon: <PersonIcon />, label: "Users", value: aggregateStats.uniqueUsers, color: "#1976d2" },
          { icon: <VisibilityIcon />, label: "Sessions", value: aggregateStats.totalSessions, color: "#2e7d32" },
          { icon: <BarChartIcon />, label: "Total Ratings", value: aggregateStats.totalRatings, color: "#ed6c02" },
          { icon: <TimelineIcon />, label: "Mean Score", value: aggregateStats.meanScore, color: "#9c27b0" },
        ].map((stat) => (
          <Paper
            key={stat.label}
            elevation={0}
            sx={{
              p: 2, borderRadius: 2, border: "1px solid",
              borderColor: `${stat.color}30`,
              bgcolor: `${stat.color}08`,
              display: "flex", alignItems: "center", gap: 2,
            }}
          >
            <Avatar sx={{ bgcolor: stat.color, width: 44, height: 44 }}>{stat.icon}</Avatar>
            <Box>
              <Typography variant="h5" fontWeight="bold">{stat.value}</Typography>
              <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Score Distribution (if we have scores) */}
      {aggregateStats.scores.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Overall Score Distribution ({aggregateStats.totalRatings} ratings, σ = {aggregateStats.stdScore})
          </Typography>
          <MiniHistogram scores={aggregateStats.scores} maxScore={10} />
        </Paper>
      )}

      {/* ═══════ SESSION CARDS ═══════ */}
      {filtered.map((session) => (
        <SessionCard key={`${session.mode}-${session.id}`} session={session} />
      ))}
    </Container>
  );
}

// ─── Session Card ─────────────────────────────────────────────────
function SessionCard({ session }) {
  const [expanded, setExpanded] = useState(false);

  const hasAudio = session.pageAudioUrls && Object.keys(session.pageAudioUrls).length > 0;

  // Aggregate item stats
  const scores = (session.items || []).filter((i) => i.score != null).map((i) => i.score);
  const meanScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
  const totalItems = (session.items || []).length;

  return (
    <Paper
      elevation={expanded ? 3 : 1}
      sx={{
        mb: 2, borderRadius: 2, overflow: "hidden",
        transition: "box-shadow 0.2s, border 0.2s",
        border: expanded ? "1px solid #1976d2" : "1px solid #e0e0e0",
      }}
    >
      {/* ── Session Header ── */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          p: 2, cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 1,
          bgcolor: expanded ? "#e3f2fd" : "#fafafa",
          transition: "background 0.2s",
          "&:hover": { bgcolor: "#e3f2fd" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Chip label={session.modeLabel} size="small" color="primary" variant="outlined" />
          <Typography fontWeight="bold">User: {session.username}</Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(session.timestamp).toLocaleString()}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {meanScore && (
            <StatChip
              icon={<BarChartIcon sx={{ fontSize: 16 }} />}
              label="Avg"
              value={meanScore}
              color="primary"
            />
          )}
          <Chip label={`${totalItems} item${totalItems !== 1 ? "s" : ""}`} size="small" variant="outlined" />
          {hasAudio && (
            <Badge variant="dot" color="success">
              <GraphicEqIcon sx={{ fontSize: 20, color: "success.main" }} />
            </Badge>
          )}
          <Typography variant="body2" sx={{ ml: 1 }}>
            {expanded ? "▲" : "▼"}
          </Typography>
        </Box>
      </Box>

      {/* ── Expanded Content ── */}
      {expanded && (
        <Box sx={{ p: 2 }}>
          {/* Audio recordings section */}
          {hasAudio && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: "#f9fbe7" }}>
              <Typography variant="subtitle2" sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
                <GraphicEqIcon fontSize="small" color="success" />
                Session Recordings
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                {Object.entries(session.pageAudioUrls).map(([pageKey, url]) => (
                  <Box key={pageKey} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip label={`Page ${pageKey}`} size="small" variant="outlined" />
                    <AudioPlayer url={url} label={`${session.modeLabel}_User${session.username}_Page${pageKey}`} />
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* Items table/grid based on mode */}
          {session.items && session.items.length > 0 && (
            <ItemsDisplay items={session.items} mode={session.mode} audioUrls={session.pageAudioUrls} />
          )}

          {/* Session metadata if available */}
          {session.metadata && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {session.metadata.browser} · {session.metadata.platform} ·
                Window {session.metadata.screenSize} · {session.metadata.pixelRatio}x DPR
                {session.metadata.isMobile && " · Mobile"}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
}

// ─── Items Display (adapts to mode type) ──────────────────────────
function ItemsDisplay({ items, mode, audioUrls }) {
  const hasScores = items.some((i) => i.score != null);
  const hasPairwise = items.some((i) => i.type === "pairwise");
  const hasRanked = items.some((i) => i.type === "ranked");
  const hasBestWorst = items.some((i) => i.type === "best_worst");
  const hasSelection = items.some((i) => i.type === "selection");

  if (hasScores) {
    return (
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
            <TableCell><strong>Image</strong></TableCell>
            {items[0]?.position && <TableCell align="center"><strong>Position</strong></TableCell>}
            <TableCell align="right"><strong>Score</strong></TableCell>
            {items[0]?.moves != null && <TableCell align="right"><strong>Moves</strong></TableCell>}
            {items[0]?.clickOrder && <TableCell align="center"><strong>Click Order</strong></TableCell>}
            {items[0]?.timeSpent && <TableCell align="right"><strong>Time (s)</strong></TableCell>}
            <TableCell align="center"><strong>Audio</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, i) => (
            <TableRow key={i} sx={{ bgcolor: item.isBenchmark ? "#fff8e1" : "inherit" }}>
              <TableCell sx={{ fontSize: "0.85rem", wordBreak: "break-word" }}>
                {item.isBenchmark && <Chip label="BM" size="small" sx={{ mr: 0.5, bgcolor: "#fff3e0" }} />}
                {item.imageName}
              </TableCell>
              {item.position !== undefined && <TableCell align="center" sx={{ fontSize: "0.8rem", color: "text.secondary" }}>{item.position}</TableCell>}
              <TableCell align="right">
                <ScoreBadge score={item.score} />
              </TableCell>
              {item.moves != null && <TableCell align="right">{item.moves}</TableCell>}
              {item.clickOrder && <TableCell align="center">{item.clickOrder}</TableCell>}
              {item.timeSpent && <TableCell align="right">{item.timeSpent}</TableCell>}
              <TableCell align="center">
                <AudioPlayer
                  url={audioUrls?.[item.pageKey]}
                  label={`${item.imageName || "item"}_${i}`}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (hasPairwise) {
    return (
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
            <TableCell><strong>Pair</strong></TableCell>
            <TableCell><strong>Winner</strong></TableCell>
            <TableCell><strong>Loser</strong></TableCell>
            <TableCell><strong>Side</strong></TableCell>
            <TableCell align="center"><strong>Audio</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, i) => (
            <TableRow key={i}>
              <TableCell>{item.pageKey}</TableCell>
              <TableCell sx={{ color: "green", fontWeight: "bold", wordBreak: "break-word" }}>{item.winner}</TableCell>
              <TableCell sx={{ color: "text.secondary", wordBreak: "break-word" }}>{item.loser}</TableCell>
              <TableCell><Chip label={item.winnerSide} size="small" variant="outlined" /></TableCell>
              <TableCell align="center">
                <AudioPlayer url={audioUrls?.[item.pageKey]} label={`pair_${item.pageKey}`} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (hasRanked) {
    return (
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
            <TableCell><strong>Group</strong></TableCell>
            <TableCell><strong>Image</strong></TableCell>
            <TableCell><strong>Rank</strong></TableCell>
            <TableCell align="center"><strong>Audio</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, i) => (
            <TableRow key={i}>
              <TableCell>{item.groupId}</TableCell>
              <TableCell sx={{ wordBreak: "break-word" }}>{item.imageName}</TableCell>
              <TableCell>
                <Chip label={`#${item.rank}`} size="small" color={item.rank === 1 ? "success" : item.rank === 2 ? "primary" : "default"} />
              </TableCell>
              <TableCell align="center">
                <AudioPlayer url={audioUrls?.[item.pageKey]} label={`group_${item.groupId}`} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (hasBestWorst) {
    return (
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
            <TableCell><strong>Trial</strong></TableCell>
            <TableCell><strong>Best</strong></TableCell>
            <TableCell><strong>Worst</strong></TableCell>
            <TableCell><strong>Time (s)</strong></TableCell>
            <TableCell align="center"><strong>Audio</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, i) => (
            <TableRow key={i}>
              <TableCell>{item.pageKey}</TableCell>
              <TableCell sx={{ color: "green", fontWeight: "bold" }}>{item.bestName}</TableCell>
              <TableCell sx={{ color: "text.secondary" }}>{item.worstName}</TableCell>
              <TableCell>{item.responseTime}</TableCell>
              <TableCell align="center">
                <AudioPlayer url={audioUrls?.[item.pageKey]} label={`trial_${item.pageKey}`} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (hasSelection) {
    return (
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
            <TableCell><strong>Image</strong></TableCell>
            <TableCell align="center"><strong>Selected</strong></TableCell>
            <TableCell align="center"><strong>Audio</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, i) => (
            <TableRow key={i}>
              <TableCell sx={{ wordBreak: "break-word" }}>{item.imageName}</TableCell>
              <TableCell align="center">
                <Chip label={item.selected ? "Yes" : "No"} size="small" color={item.selected ? "primary" : "default"} />
              </TableCell>
              <TableCell align="center">
                <AudioPlayer url={audioUrls?.[item.pageKey]} label={`sel_${i}`} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return <Typography color="text.secondary">No displayable items.</Typography>;
}

// ─── Score badge with color ───────────────────────────────────────
function ScoreBadge({ score }) {
  if (score == null) return <span>—</span>;
  const s = Number(score);
  let color = "#757575";
  if (s >= 8) color = "#2e7d32";
  else if (s >= 6) color = "#1976d2";
  else if (s >= 4) color = "#ed6c02";
  else color = "#d32f2f";

  return (
    <Chip
      label={s}
      size="small"
      sx={{
        bgcolor: `${color}18`,
        color,
        fontWeight: "bold",
        minWidth: 36,
      }}
    />
  );
}