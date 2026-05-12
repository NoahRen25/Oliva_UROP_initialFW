import React, { useCallback, useEffect, useRef } from "react";
import { IconButton, Tooltip, Badge, Typography, Box } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import { useVoiceRecorder } from "./VoiceRecorderContext";

const VoiceRecorder = ({ onSave }) => {
  const { start, stop, isRecording, seconds } = useVoiceRecorder();

  const lastSecondsRef = useRef(0);
  useEffect(() => {
    if (isRecording) lastSecondsRef.current = seconds;
  }, [isRecording, seconds]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  };

  const handleToggle = useCallback(() => {
    if (isRecording) {
      const finalSeconds = lastSecondsRef.current;
      stop();
      if (onSave) onSave("", finalSeconds);
    } else {
      start();
    }
  }, [isRecording, start, stop, onSave]);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {isRecording && (
        <Typography variant="body2" sx={{
          fontFamily: "monospace", color: "error.main",
          fontWeight: "bold", animation: "pulse 1.5s infinite",
        }}>
          {formatTime(seconds)}
        </Typography>
      )}
      <Tooltip title={isRecording ? "Stop & Save" : "Start Recording"}>
        <IconButton color={isRecording ? "error" : "inherit"} onClick={handleToggle}>
          <Badge variant="dot" color="error" invisible={!isRecording}>
            {isRecording ? <StopIcon /> : <MicIcon />}
          </Badge>
        </IconButton>
      </Tooltip>
      <style>{`@keyframes pulse{0%{opacity:1}50%{opacity:.5}100%{opacity:1}}`}</style>
    </Box>
  );
};

export default VoiceRecorder;
