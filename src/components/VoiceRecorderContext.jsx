/**
 * VoiceRecorderContext.jsx — Owns the microphone for the whole app
 * (VoiceRecorderProvider / useVoiceRecorder).
 *
 * Holds one persistent getUserMedia stream and runs a MediaRecorder that is
 * segmented per rating page: whenever `currentRatingPage` (from Results
 * context) changes, the current recorder is flushed into a per-page
 * audio/webm blob and a new one starts. Exposes start/stop/isRecording and
 * registers the collector used by utils/collectPageTranscripts so rating
 * pages can grab { transcripts, audioUrls, audioBlobs } keyed by page on
 * submit (blobs are then uploaded via services/supabaseAudioStorage).
 */
import React, {
  createContext, useContext, useState, useEffect, useRef, useCallback,
} from "react";
import { useResults } from "../Results";
import { _registerCollector } from "../utils/collectPageTranscripts";

const VoiceRecorderContext = createContext(null);

export function VoiceRecorderProvider({ children }) {
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
  }, []);

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

  useEffect(() => {
    if (!isRecordingRef.current) return;
    if (currentRatingPage == null) return;
    if (currentPageKeyRef.current === currentRatingPage) return;

    stopPageRecorder();
    currentPageKeyRef.current = currentRatingPage;
    startPageRecorder();
  }, [currentRatingPage, stopPageRecorder, startPageRecorder]);

  const start = useCallback(async () => {
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
  }, [currentRatingPage, startPageRecorder]);

  const stop = useCallback(() => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;

    stopPageRecorder();

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }

    clearInterval(timerRef.current);
    setIsRecording(false);
    setSeconds(0);
  }, [stopPageRecorder]);

  const collectPageAudio = useCallback(() => {
    const result = {
      transcripts: {},
      audioUrls: { ...pageAudioUrlsRef.current },
      audioBlobs: { ...pageAudioBlobsRef.current },
    };
    pageAudioUrlsRef.current = {};
    pageAudioBlobsRef.current = {};
    return result;
  }, []);

  useEffect(() => _registerCollector(collectPageAudio), [collectPageAudio]);

  const value = {
    start, stop, collectPageAudio,
    isRecording, seconds,
    isRecordingRef,
  };

  return (
    <VoiceRecorderContext.Provider value={value}>
      {children}
    </VoiceRecorderContext.Provider>
  );
}

export function useVoiceRecorder() {
  const ctx = useContext(VoiceRecorderContext);
  if (!ctx) throw new Error("useVoiceRecorder must be used inside VoiceRecorderProvider");
  return ctx;
}
