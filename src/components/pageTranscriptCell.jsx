import React, { useState, useCallback, useRef } from "react";
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  TableCell,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import DownloadIcon from "@mui/icons-material/Download";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";

/**
 * PageTranscriptCell — A table cell showing:
 *   1. Mic icon → opens dialog with transcript text
 *   2. Play icon → plays the REAL audio recording if available, otherwise TTS fallback
 *   3. Download icon → downloads the audio recording as .webm file
 *
 * Props:
 *   pageKey       — the page/pair/trial key
 *   transcripts   — { [pageKey]: string } text transcripts
 *   audioUrls     — { [pageKey]: objectURL } real audio recordings (optional)
 *   label         — display label for the dialog title
 */
export default function PageTranscriptCell({ pageKey, transcripts, audioUrls, label }) {
  const [open, setOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const text = transcripts?.[pageKey] || "";
  const audioUrl = audioUrls?.[pageKey] || null;
  const hasText = text.trim().length > 0;
  const hasAudio = !!audioUrl;
  const hasAnyTranscripts = transcripts && Object.keys(transcripts).length > 0;

  // Play real audio or fall back to TTS
  const handlePlay = useCallback(() => {
    if (isPlaying) {
      // Stop whatever is playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (hasAudio) {
      // Play real recording
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => { setIsPlaying(false); audioRef.current = null; };
      audio.onerror = () => { setIsPlaying(false); audioRef.current = null; };
      audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    } else if (hasText) {
      // TTS fallback
      const u = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const voice =
        voices.find((v) => v.lang.startsWith("en") && v.name.includes("Google")) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];
      if (voice) u.voice = voice;
      u.rate = 1.0;
      u.onend = () => setIsPlaying(false);
      u.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(u);
      setIsPlaying(true);
    }
  }, [isPlaying, hasAudio, hasText, audioUrl, text]);

  // Download audio as file
  const handleDownload = useCallback(() => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `recording_${label || `page_${pageKey}`}.webm`.replace(/\s+/g, "_");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [audioUrl, label, pageKey]);

  if (!hasAnyTranscripts) {
    return (
      <TableCell align="center">
        <Tooltip title="No recording for this session">
          <MicOffIcon sx={{ fontSize: 18, color: "action.disabled" }} />
        </Tooltip>
      </TableCell>
    );
  }

  return (
    <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
      {/* View transcript */}
      <Tooltip title={hasText ? "View transcript" : "No speech for this page"}>
        <IconButton
          size="small"
          onClick={() => hasText && setOpen(true)}
          sx={{ color: hasText ? "primary.main" : "action.disabled" }}
        >
          {hasText ? <MicIcon sx={{ fontSize: 18 }} /> : <MicOffIcon sx={{ fontSize: 18 }} />}
        </IconButton>
      </Tooltip>

      {/* Play/stop */}
      {(hasText || hasAudio) && (
        <Tooltip
          title={
            isPlaying
              ? "Stop playback"
              : hasAudio
              ? "Play recording"
              : "Play transcript (TTS)"
          }
        >
          <IconButton
            size="small"
            onClick={handlePlay}
            sx={{ color: isPlaying ? "error.main" : "success.main", ml: 0.25 }}
          >
            {isPlaying ? (
              <StopIcon sx={{ fontSize: 18 }} />
            ) : hasAudio ? (
              <GraphicEqIcon sx={{ fontSize: 18 }} />
            ) : (
              <VolumeUpIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </Tooltip>
      )}

      {/* Transcript dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MicIcon color="primary" />
          <Typography variant="h6" component="span">{label || `Page ${pageKey} Transcript`}</Typography>
          <Box sx={{ ml: "auto", display: "flex", gap: 0.5 }}>
            <Chip
              label={`${text.split(/\s+/).length} words`}
              size="small"
              color="primary"
            />
            {hasAudio && (
              <Chip
                icon={<GraphicEqIcon />}
                label="Audio"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Audio player */}
          {hasAudio && (
            <Box sx={{ mb: 2 }}>
              <audio controls src={audioUrl} style={{ width: "100%" }}>
                Your browser does not support the audio element.
              </audio>
            </Box>
          )}

          {/* Text transcript */}
          <Box
            sx={{
              p: 2,
              bgcolor: "#f5f5f5",
              borderRadius: 2,
              maxHeight: 300,
              overflowY: "auto",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mb: 1 }}
            >
              Transcript
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
              {text}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions>
          {hasAudio && (
            <Button startIcon={<DownloadIcon />} onClick={handleDownload} color="info">
              Download Audio
            </Button>
          )}
          <Button
            startIcon={isPlaying ? <StopIcon /> : <PlayArrowIcon />}
            onClick={handlePlay}
            color={isPlaying ? "error" : "primary"}
          >
            {isPlaying ? "Stop" : hasAudio ? "Play Recording" : "Play TTS"}
          </Button>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </TableCell>
  );
}

/**
 * PageTranscriptHeader — column header for the transcript column.
 */
export function PageTranscriptHeader() {
  return (
    <TableCell align="center">
      <Tooltip title="Voice transcripts + audio recordings">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
          }}
        >
          <MicIcon sx={{ fontSize: 16 }} />
          <strong>Audio</strong>
        </Box>
      </Tooltip>
    </TableCell>
  );
}

/**
 * AudioDownloadHeader — column header for the download column.
 */
export function AudioDownloadHeader() {
  return (
    <TableCell align="center">
      <Tooltip title="Download audio recording">
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
          <DownloadIcon sx={{ fontSize: 16 }} />
          <strong>Download</strong>
        </Box>
      </Tooltip>
    </TableCell>
  );
}

/**
 * AudioDownloadCell — Table cell with a download button.
 * Always visible: gray/disabled when no audio, active when audio exists.
 */
export function AudioDownloadCell({ pageKey, audioUrls, label }) {
  const audioUrl = audioUrls?.[pageKey] || null;
  const hasAudio = !!audioUrl;

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `recording_${label || `page_${pageKey}`}.webm`.replace(/\s+/g, "_");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <TableCell align="center">
      <Tooltip title={hasAudio ? "Download recording" : "No recording available"}>
        <span>
          <IconButton
            size="small"
            onClick={handleDownload}
            disabled={!hasAudio}
            sx={{ color: hasAudio ? "grey.700" : "action.disabled" }}
          >
            <DownloadIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </span>
      </Tooltip>
    </TableCell>
  );
}