import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useResults } from "../Results";
import collectPageTranscripts from "./collectPageTranscripts";

/**
 * useRatingFlow — Shared hook for all rating flows.
 *
 * Handles: navigation, username/step state, prompt/page lifecycle,
 * auto-start/stop recording, and transcript/audio collection.
 */
export default function useRatingFlow({ mode, usernameRegex = /^\d+$/ } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig || null;

  const { setActivePrompt, setCurrentRatingPage } = useResults();

  const [step, setStep] = useState(uploadConfig ? 1 : 0);
  const [username, setUsername] = useState(uploadConfig?.username || "");

  const configPrompt = uploadConfig?.prompt || null;
  const count = uploadConfig?.count || 5;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setActivePrompt(null);
      setCurrentRatingPage(null);
      // Stop recording if component unmounts mid-session
      const vr = window.__voiceRecorder;
      if (vr && vr.isRecording) vr.stop();
    };
  }, [setActivePrompt, setCurrentRatingPage]);

  // Auto-start recording when entering the rating step (step 2)
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => {
        const vr = window.__voiceRecorder;
        if (vr && !vr.isRecording) vr.start();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const updatePromptAndPage = useCallback(
    (promptText, pageKey) => {
      setActivePrompt(promptText || null);
      if (pageKey != null) setCurrentRatingPage(pageKey);
    },
    [setActivePrompt, setCurrentRatingPage]
  );

  const clearPrompt = useCallback(() => {
    setActivePrompt(null);
  }, [setActivePrompt]);

  /**
   * Call when the session is done. Stops recording,
   * collects per-page transcripts + audio, and returns them.
   */
  const finishSession = useCallback(() => {
    window.speechSynthesis.cancel();
    // Stop recording so final page data gets flushed to global refs
    const vr = window.__voiceRecorder;
    if (vr && vr.isRecording) vr.stop();
    return collectPageTranscripts();
  }, []);

  return {
    navigate, location, uploadConfig,
    configPrompt, count,
    step, setStep,
    username, setUsername, usernameRegex,
    updatePromptAndPage, clearPrompt,
    setActivePrompt, setCurrentRatingPage,
    finishSession,
  };
}