import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, List, ListItem, ListItemText,
  ListItemIcon, IconButton, Chip, Divider, LinearProgress,
  Paper, Tooltip,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import StopIcon from "@mui/icons-material/Stop";
import DownloadIcon from "@mui/icons-material/Download";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import CloseIcon from "@mui/icons-material/Close";

/**
 * AudioModal — Shows all audio recordings from sessions that include a specific image.
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
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      stopPlayback();
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

  const entriesWithAudio = audioEntries.filter((e) => e.audioUrl);
  const entriesWithout = audioEntries.filter((e) => !e.audioUrl);

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
          <GraphicEqIcon sx={{ color: "#e94560" }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Audio Recordings
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
              {imageName}
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
              No audio recordings available for this image.
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

                    <Tooltip title="Download recording">
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(entry.audioUrl, `${entry.username}_page${entry.pageKey}`)}
                        sx={{ color: "text.secondary" }}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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

      <DialogActions sx={{ px: 2.5, py: 1.5, bgcolor: "#fafafa" }}>
        <Button onClick={onClose} variant="outlined" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}