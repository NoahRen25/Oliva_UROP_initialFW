import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, List, ListItem, ListItemText,
  ListItemIcon, IconButton, Chip, Divider, LinearProgress,
  Paper, Tooltip,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import DownloadIcon from "@mui/icons-material/Download";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";

/**
 * AudioModal — Shows audio recordings related to a specific image.
 *
 * Default view shows only recordings from the page where the image appeared.
 * Each row exposes a per-session "View All" action (next to download) that
 * opens the rest of that one session's recordings; a Back button returns
 * to the matching list.
 *
 * Props:
 *   open            — boolean
 *   onClose         — () => void
 *   imageName       — string, the image being inspected
 *   audioEntries    — [{ sessionId, username, pageKey, audioUrl, isCurrent }]
 *                     isCurrent = true if this entry is the page where the image appears
 */
export default function AudioModal({ open, onClose, imageName, audioEntries = [] }) {
  const [playingId, setPlayingId] = useState(null);
  const [progress, setProgress] = useState(0);
  // null => show only matching (isCurrent) entries.
  // sessionId => show all entries for that one session.
  const [viewingSession, setViewingSession] = useState(null);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      stopPlayback();
      setViewingSession(null);
    }
  }, [open]);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPlayingId(null);
    setProgress(0);
  }, []);

  const handlePlay = useCallback((entryId, url) => {
    if (playingId === entryId) {
      stopPlayback();
      return;
    }

    stopPlayback();

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onended = () => {
      setPlayingId(null);
      setProgress(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    audio.onerror = () => {
      setPlayingId(null);
      setProgress(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };

    audio.play().then(() => {
      setPlayingId(entryId);
      intervalRef.current = setInterval(() => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      }, 100);
    }).catch(() => {
      setPlayingId(null);
    });
  }, [playingId, stopPlayback]);

  const handleDownload = useCallback((url, label) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `recording_${label}.webm`.replace(/\s+/g, "_");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const allWithAudio = useMemo(
    () => audioEntries.filter((e) => e.audioUrl),
    [audioEntries]
  );
  const matchingWithAudio = useMemo(
    () => allWithAudio.filter((e) => e.isCurrent),
    [allWithAudio]
  );

  // Count of additional (non-current) recordings per session, used to
  // decide whether to show the inline "View All" button on each row.
  const extraCountBySession = useMemo(() => {
    const seen = new Set();
    const counts = {};
    for (const e of allWithAudio) {
      if (e.isCurrent) continue;
      const dedupeKey = `${e.sessionId}::${e.pageKey}::${e.audioUrl}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      const sid = String(e.sessionId);
      counts[sid] = (counts[sid] || 0) + 1;
    }
    return counts;
  }, [allWithAudio]);

  // Entries to render. Default: matching only (deduped). When a session
  // is being inspected: all of that session's entries, deduped, with
  // matching entries pinned to the top.
  const entriesWithAudio = useMemo(() => {
    const dedupe = (arr) => {
      const seen = new Set();
      const out = [];
      for (const e of arr) {
        const key = `${e.sessionId}::${e.pageKey}::${e.audioUrl}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(e);
      }
      return out;
    };
    if (viewingSession == null) return dedupe(matchingWithAudio);

    const sid = String(viewingSession);
    const ofSession = allWithAudio.filter((e) => String(e.sessionId) === sid);
    const sorted = [...ofSession].sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return String(a.pageKey).localeCompare(String(b.pageKey), undefined, { numeric: true });
    });
    return dedupe(sorted);
  }, [viewingSession, matchingWithAudio, allWithAudio]);

  const entriesWithout = useMemo(() => {
    if (viewingSession == null) {
      return audioEntries.filter((e) => !e.audioUrl && e.isCurrent);
    }
    const sid = String(viewingSession);
    return audioEntries.filter((e) => !e.audioUrl && String(e.sessionId) === sid);
  }, [viewingSession, audioEntries]);

  const inSessionView = viewingSession != null;
  const sessionUsername = inSessionView
    ? entriesWithAudio[0]?.username ||
      audioEntries.find((e) => String(e.sessionId) === String(viewingSession))?.username
    : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#1a1a2e",
          color: "white",
          py: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {inSessionView && (
            <Tooltip title="Back to matching recordings">
              <IconButton
                size="small"
                onClick={() => { stopPlayback(); setViewingSession(null); }}
                sx={{ color: "rgba(255,255,255,0.85)" }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
          )}
          <GraphicEqIcon sx={{ color: "#e94560" }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {inSessionView ? "Session Recordings" : "Audio Recordings"}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
              {imageName}
              {inSessionView
                ? ` — Session ${viewingSession}${sessionUsername ? ` (User ${sessionUsername})` : ""}`
                : ""}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: "rgba(255,255,255,0.7)" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {entriesWithAudio.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <VolumeUpIcon sx={{ fontSize: 48, color: "action.disabled", mb: 1 }} />
            <Typography color="text.secondary">
              {inSessionView
                ? "No audio recordings available for this session."
                : "No audio recorded on the page where this image appeared."}
            </Typography>
            {entriesWithout.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                {entriesWithout.length} session(s) found but audio was not recorded or has expired.
              </Typography>
            )}
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {entriesWithAudio.map((entry, idx) => {
              const entryId = `${entry.sessionId}-${entry.pageKey}`;
              const isPlaying = playingId === entryId;
              const isCurrent = entry.isCurrent;
              const sid = String(entry.sessionId);
              const extras = extraCountBySession[sid] || 0;
              // Only offer "View All" while in the matching list — once
              // viewing a single session, every row already belongs to it.
              const canViewAll = !inSessionView && extras > 0;

              return (
                <React.Fragment key={entryId}>
                  {idx > 0 && <Divider />}
                  <ListItem
                    sx={{
                      py: 1.5,
                      px: 2.5,
                      bgcolor: isCurrent ? "rgba(25, 118, 210, 0.06)" : "transparent",
                      borderLeft: isCurrent ? "4px solid #1976d2" : "4px solid transparent",
                      transition: "background-color 0.2s",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <IconButton
                        size="small"
                        onClick={() => handlePlay(entryId, entry.audioUrl)}
                        sx={{
                          color: isPlaying ? "#e94560" : "#1976d2",
                          bgcolor: isPlaying ? "rgba(233,69,96,0.1)" : "rgba(25,118,210,0.1)",
                          "&:hover": {
                            bgcolor: isPlaying ? "rgba(233,69,96,0.2)" : "rgba(25,118,210,0.2)",
                          },
                        }}
                      >
                        {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                      </IconButton>
                    </ListItemIcon>

                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            User {entry.username}
                          </Typography>
                          <Chip
                            label={`Page ${entry.pageKey}`}
                            size="small"
                            color={isCurrent ? "primary" : "default"}
                            variant={isCurrent ? "filled" : "outlined"}
                            sx={{ height: 22, fontSize: "0.7rem" }}
                          />
                          {isCurrent && (
                            <Chip
                              label="Current"
                              size="small"
                              color="info"
                              sx={{ height: 20, fontSize: "0.65rem" }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          {isPlaying && (
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              sx={{
                                height: 3,
                                borderRadius: 2,
                                bgcolor: "rgba(233,69,96,0.15)",
                                "& .MuiLinearProgress-bar": { bgcolor: "#e94560" },
                              }}
                            />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            Session {entry.sessionId}
                          </Typography>
                        </Box>
                      }
                    />

                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Tooltip title="Download recording">
                        <IconButton
                          size="small"
                          onClick={() => handleDownload(entry.audioUrl, `${entry.username}_page${entry.pageKey}`)}
                          sx={{ color: "text.secondary" }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {canViewAll && (
                        <Tooltip title={`View all recordings from session ${entry.sessionId}`}>
                          <IconButton
                            size="small"
                            onClick={() => { stopPlayback(); setViewingSession(entry.sessionId); }}
                            sx={{ color: "text.secondary" }}
                          >
                            <LibraryMusicIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        )}

        {entriesWithout.length > 0 && entriesWithAudio.length > 0 && (
          <Paper sx={{ mx: 2, mb: 2, p: 1.5, bgcolor: "#fafafa" }}>
            <Typography variant="caption" color="text.secondary">
              {entriesWithout.length} additional session(s) without audio recordings
            </Typography>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, bgcolor: "#fafafa", justifyContent: "space-between" }}>
        {inSessionView ? (
          <Button
            onClick={() => { stopPlayback(); setViewingSession(null); }}
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
          >
            Back
          </Button>
        ) : <span />}
        <Button onClick={onClose} variant="outlined" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
