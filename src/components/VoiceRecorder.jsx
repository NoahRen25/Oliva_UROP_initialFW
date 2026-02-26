import React, { useState, useEffect, useRef, useCallback } from "react";
import { IconButton, Tooltip, Badge, Typography, Box } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import { useResults } from "../Results";

/**
 * VoiceRecorder — App-bar mic button.
 *
 * Captures BOTH:
 *   1. Speech-to-text transcription (SpeechRecognition) — segmented by page
 *   2. Actual audio recording (MediaRecorder) — segmented by page as downloadable blobs
 *
 * Props:
 *   onSave           — (text, duration) => void
 *   onSaveWithPages  — (pageTranscripts, pageAudio) => void
 */
const VoiceRecorder = ({ onSave, onSaveWithPages }) => {
  const { currentRatingPage } = useResults();

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  // Speech-to-text refs
  const currentPageRef = useRef(null);
  const pageTranscriptsRef = useRef({});
  const allFinalTextRef = useRef("");
  const pageStartIdxRef = useRef(0);

  // Audio recording refs
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const pageAudioRef = useRef({});        // { [pageKey]: Blob }
  const currentChunksRef = useRef([]);     // chunks for current page segment
  const fullChunksRef = useRef([]);        // all chunks for full recording

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ── SpeechRecognition setup ──────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalText = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + " ";
        }
      }
      allFinalTextRef.current = finalText;

      const pageKey = currentPageRef.current;
      if (pageKey !== null && pageKey !== undefined) {
        const pageText = finalText.substring(pageStartIdxRef.current).trim();
        pageTranscriptsRef.current[pageKey] = pageText;
      }

      // Live-sync to global pending refs so collectPageTranscripts() always has data
      if (window.__pendingPageTranscripts) {
        window.__pendingPageTranscripts.current = { ...pageTranscriptsRef.current };
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current?._shouldContinue) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        console.warn("VoiceRecorder error:", event.error);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition._shouldContinue = false;
      try { recognition.stop(); } catch {}
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Finalize audio for current page ──────────────────────────
  const finalizePageAudio = useCallback(() => {
    const pk = currentPageRef.current;
    if (pk !== null && pk !== undefined && currentChunksRef.current.length > 0) {
      const blob = new Blob(currentChunksRef.current, { type: "audio/webm" });
      pageAudioRef.current[pk] = blob;

      // Live-sync to global pending audio refs
      const url = URL.createObjectURL(blob);
      if (window.__pendingPageAudio) {
        const cur = window.__pendingPageAudio.current || {};
        cur[pk] = url;
        window.__pendingPageAudio.current = cur;
      }
      if (window.__pendingPageAudioBlobs) {
        const cur = window.__pendingPageAudioBlobs.current || {};
        cur[pk] = blob;
        window.__pendingPageAudioBlobs.current = cur;
      }
    }
    currentChunksRef.current = [];
  }, []);

  // ── Track page changes while recording ────────────────────────
  useEffect(() => {
    if (!isRecording) return;
    if (currentRatingPage === null || currentRatingPage === undefined) return;

    // Finalize previous page's text
    if (currentPageRef.current !== null && currentPageRef.current !== undefined) {
      const prevText = allFinalTextRef.current.substring(pageStartIdxRef.current).trim();
      pageTranscriptsRef.current[currentPageRef.current] = prevText;
    }

    // Finalize previous page's audio
    finalizePageAudio();

    // Move to new page
    currentPageRef.current = currentRatingPage;
    pageStartIdxRef.current = allFinalTextRef.current.length;
    if (!pageTranscriptsRef.current[currentRatingPage]) {
      pageTranscriptsRef.current[currentRatingPage] = "";
    }
  }, [currentRatingPage, isRecording, finalizePageAudio]);

  // ── Toggle recording ──────────────────────────────────────────
  const handleToggleRecord = useCallback(async () => {
    if (isRecording) {
      // ─── STOP ─────────────────────────────────────────
      if (recognitionRef.current) {
        recognitionRef.current._shouldContinue = false;
        try { recognitionRef.current.stop(); } catch {}
      }

      // Stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      // Stop mic stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }

      clearInterval(timerRef.current);
      setIsRecording(false);

      // Finalize last page text
      if (currentPageRef.current !== null && currentPageRef.current !== undefined) {
        const text = allFinalTextRef.current.substring(pageStartIdxRef.current).trim();
        pageTranscriptsRef.current[currentPageRef.current] = text;
      }

      // Finalize last page audio
      finalizePageAudio();

      const fullText = allFinalTextRef.current.trim();
      const pages = { ...pageTranscriptsRef.current };

      // Build full recording blob
      const fullBlob = fullChunksRef.current.length > 0
        ? new Blob(fullChunksRef.current, { type: "audio/webm" })
        : null;

      // Build page audio map (convert Blobs to Object URLs for persistence)
      const audioMap = {};
      for (const [key, blob] of Object.entries(pageAudioRef.current)) {
        audioMap[key] = URL.createObjectURL(blob);
      }
      // Also store raw blobs for download
      const audioBlobMap = { ...pageAudioRef.current };
      if (fullBlob) {
        audioMap._full = URL.createObjectURL(fullBlob);
        audioBlobMap._full = fullBlob;
      }

      if (fullText && onSave) {
        onSave(fullText, seconds);
      }

      if (onSaveWithPages) {
        onSaveWithPages(pages, audioMap, audioBlobMap);
      }

      // Reset
      allFinalTextRef.current = "";
      pageTranscriptsRef.current = {};
      currentPageRef.current = null;
      pageStartIdxRef.current = 0;
      pageAudioRef.current = {};
      currentChunksRef.current = [];
      fullChunksRef.current = [];
      setSeconds(0);
    } else {
      // ─── START ────────────────────────────────────────
      allFinalTextRef.current = "";
      pageTranscriptsRef.current = {};
      pageStartIdxRef.current = 0;
      pageAudioRef.current = {};
      currentChunksRef.current = [];
      fullChunksRef.current = [];
      setSeconds(0);

      // Seed with current page
      if (currentRatingPage !== null && currentRatingPage !== undefined) {
        currentPageRef.current = currentRatingPage;
        pageTranscriptsRef.current[currentRatingPage] = "";
      } else {
        currentPageRef.current = null;
      }

      // Start SpeechRecognition
      if (recognitionRef.current) {
        recognitionRef.current._shouldContinue = true;
        try { recognitionRef.current.start(); } catch {}
      }

      // Start MediaRecorder for actual audio
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        const recorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
            ? "audio/webm;codecs=opus"
            : "audio/webm",
        });

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            currentChunksRef.current.push(e.data);
            fullChunksRef.current.push(e.data);
          }
        };

        recorder.start(1000); // collect chunks every second
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.warn("MediaRecorder unavailable, audio download will be disabled:", err.message);
      }

      setIsRecording(true);
      timerRef.current = setInterval(() => setSeconds((p) => p + 1), 1000);
    }
  }, [isRecording, seconds, onSave, onSaveWithPages, currentRatingPage, finalizePageAudio]);

  // Expose control methods globally so rating flows can auto-start/stop recording
  useEffect(() => {
    window.__voiceRecorder = {
      start: () => { if (!isRecording) handleToggleRecord(); },
      stop: () => { if (isRecording) handleToggleRecord(); },
      get isRecording() { return isRecording; },
    };
    return () => { window.__voiceRecorder = null; };
  }, [isRecording, handleToggleRecord]);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {isRecording && (
        <Typography
          variant="body2"
          sx={{
            fontFamily: "monospace",
            color: "error.main",
            fontWeight: "bold",
            animation: "pulse 1.5s infinite",
          }}
        >
          {formatTime(seconds)}
        </Typography>
      )}
      <Tooltip title={isRecording ? "Stop & Save" : "Start Recording"}>
        <IconButton color={isRecording ? "error" : "inherit"} onClick={handleToggleRecord}>
          <Badge variant="dot" color="error" invisible={!isRecording}>
            {isRecording ? <StopIcon /> : <MicIcon />}
          </Badge>
        </IconButton>
      </Tooltip>
      <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
    </Box>
  );
};

export default VoiceRecorder;