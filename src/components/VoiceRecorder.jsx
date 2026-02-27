import React, { useState, useEffect, useRef, useCallback } from "react";
import { IconButton, Tooltip, Badge, Typography, Box } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import { useResults } from "../Results";

/**
 * VoiceRecorder — App-bar mic button.
 * Records audio per page via MediaRecorder (restarted on each page change).
 */
const VoiceRecorder = ({ onSave }) => {
  const { currentRatingPage } = useResults();

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);
  const isRecordingRef = useRef(false);

  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const currentChunksRef = useRef([]);
  const currentPageKeyRef = useRef(null);
  const pageAudioBlobsRef = useRef({});
  const pageAudioUrlsRef = useRef({});

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
  };

  const syncToGlobal = useCallback(() => {
    if (window.__pendingPageTranscripts)
      window.__pendingPageTranscripts.current = {};
    if (window.__pendingPageAudio)
      window.__pendingPageAudio.current = { ...pageAudioUrlsRef.current };
    if (window.__pendingPageAudioBlobs)
      window.__pendingPageAudioBlobs.current = { ...pageAudioBlobsRef.current };
  }, []);

  const stopPageRecorder = useCallback(() => {
    const pk = currentPageKeyRef.current;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try { mediaRecorderRef.current.requestData(); } catch {}
      try { mediaRecorderRef.current.stop(); } catch {}
    }
    if (pk != null && currentChunksRef.current.length > 0) {
      const blob = new Blob(currentChunksRef.current, { type: "audio/webm" });
      pageAudioBlobsRef.current[pk] = blob;
      pageAudioUrlsRef.current[pk] = URL.createObjectURL(blob);
    }
    currentChunksRef.current = [];
    mediaRecorderRef.current = null;
    syncToGlobal();
  }, [syncToGlobal]);

  const startPageRecorder = useCallback(() => {
    const stream = mediaStreamRef.current;
    if (!stream) return;
    try {
      const rec = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus" : "audio/webm",
      });
      currentChunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data?.size > 0) currentChunksRef.current.push(e.data);
      };
      rec.start(500);
      mediaRecorderRef.current = rec;
    } catch {}
  }, []);

  // Page change
  useEffect(() => {
    if (!isRecordingRef.current) return;
    if (currentRatingPage == null) return;
    if (currentPageKeyRef.current === currentRatingPage) return;

    stopPageRecorder();
    currentPageKeyRef.current = currentRatingPage;
    startPageRecorder();
    syncToGlobal();
  }, [currentRatingPage, stopPageRecorder, startPageRecorder, syncToGlobal]);

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;
    isRecordingRef.current = true;

    pageAudioBlobsRef.current = {};
    pageAudioUrlsRef.current = {};
    currentChunksRef.current = [];
    currentPageKeyRef.current = null;
    setSeconds(0);
    setIsRecording(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
    } catch (err) {
      console.warn("Mic unavailable:", err.message);
    }

    if (currentRatingPage != null) {
      currentPageKeyRef.current = currentRatingPage;
      startPageRecorder();
    }

    timerRef.current = setInterval(() => setSeconds((p) => p + 1), 1000);
    syncToGlobal();
  }, [currentRatingPage, startPageRecorder, syncToGlobal]);

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;

    stopPageRecorder();

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    clearInterval(timerRef.current);
    if (onSave) onSave("", seconds);

    syncToGlobal();
    setIsRecording(false);
    setSeconds(0);
  }, [seconds, onSave, stopPageRecorder, syncToGlobal]);

  const handleToggle = useCallback(() => {
    if (isRecordingRef.current) stopRecording();
    else startRecording();
  }, [startRecording, stopRecording]);

  useEffect(() => {
    window.__voiceRecorder = {
      start: startRecording,
      stop: stopRecording,
      get isRecording() { return isRecordingRef.current; },
    };
    return () => { window.__voiceRecorder = null; };
  }, [startRecording, stopRecording]);

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