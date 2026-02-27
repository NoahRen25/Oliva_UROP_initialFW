import React, { useState, useRef, useCallback } from "react";
import {
  IconButton, Tooltip, TableCell, Box,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import DownloadIcon from "@mui/icons-material/Download";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";

// ─────────────────────────────────────────────────────────────────
// RecordingCell — Play + download the audio recording for a page
// ─────────────────────────────────────────────────────────────────
export function RecordingCell({ pageKey, audioUrls, label }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const url = audioUrls?.[pageKey] || null;
  const hasAudio = !!url;
  const hasAny = audioUrls && Object.keys(audioUrls).length > 0;

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current = null; }
      setIsPlaying(false);
      return;
    }
    if (!url) return;
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => { setIsPlaying(false); audioRef.current = null; };
    audio.onerror = () => { setIsPlaying(false); audioRef.current = null; };
    audio.play().catch(() => setIsPlaying(false));
    setIsPlaying(true);
  }, [isPlaying, url]);

  const handleDownload = useCallback(() => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `recording_${label || `page_${pageKey}`}.webm`.replace(/\s+/g, "_");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [url, label, pageKey]);

  if (!hasAny) {
    return (
      <TableCell align="center">
        <Tooltip title="No recording for this session">
          <GraphicEqIcon sx={{ fontSize: 18, color: "action.disabled" }} />
        </Tooltip>
      </TableCell>
    );
  }

  return (
    <TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
      <Tooltip title={hasAudio ? (isPlaying ? "Stop" : "Play recording") : "No audio for this page"}>
        <span>
          <IconButton
            size="small"
            onClick={handlePlay}
            disabled={!hasAudio}
            sx={{ color: isPlaying ? "error.main" : hasAudio ? "success.main" : "action.disabled" }}
          >
            {isPlaying ? <StopIcon sx={{ fontSize: 18 }} /> : <PlayArrowIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={hasAudio ? "Download .webm" : "No audio"}>
        <span>
          <IconButton
            size="small"
            onClick={handleDownload}
            disabled={!hasAudio}
            sx={{ color: hasAudio ? "grey.700" : "action.disabled", ml: 0.25 }}
          >
            <DownloadIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>
    </TableCell>
  );
}

// ─────────────────────────────────────────────────────────────────
// RecordingHeader
// ─────────────────────────────────────────────────────────────────
export function RecordingHeader() {
  return (
    <TableCell align="center">
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
        <GraphicEqIcon sx={{ fontSize: 16 }} />
        <strong>Recording</strong>
      </Box>
    </TableCell>
  );
}

// ─────────────────────────────────────────────────────────────────
// Backward-compat exports (no-op for transcript)
// ─────────────────────────────────────────────────────────────────
export function TranscriptHeader() { return null; }
export function TranscriptCell() { return null; }
export function AudioDownloadHeader() { return <RecordingHeader />; }
export function AudioDownloadCell(props) { return <RecordingCell {...props} />; }
export function PageTranscriptHeader() { return null; }

// Default export (no-op, transcript removed)
export default function PageTranscriptCell() { return null; }