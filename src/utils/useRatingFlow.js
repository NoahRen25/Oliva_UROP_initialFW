import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useResults } from "../Results";
import collectPageTranscripts from "./collectPageTranscripts";

/**
 * useRatingFlow — Extracts the boilerplate shared by every rating flow:
 *   - navigate / location / uploadConfig
 *   - username + step state
 *   - activePrompt + currentRatingPage lifecycle
 *   - page transcript collection on submit
 *
 * Usage:
 *   const flow = useRatingFlow({ mode: "pairwise" });
 *   // flow.step, flow.setStep, flow.username, flow.navigate, ...
 *   // flow.updatePromptAndPage(promptText, pageKey)
 *   // const transcripts = flow.finishSession()
 *
 * @param {Object} opts
 * @param {string} opts.mode - e.g. "individual", "pairwise", "ranked"
 * @param {RegExp} [opts.usernameRegex] - validation regex for username (default: /^\d+$/)
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
    };
  }, [setActivePrompt, setCurrentRatingPage]);

  /**
   * Call when the active prompt or page changes during rating.
   * Handles both setActivePrompt and setCurrentRatingPage.
   */
  const updatePromptAndPage = useCallback(
    (promptText, pageKey) => {
      setActivePrompt(promptText || null);
      if (pageKey !== undefined && pageKey !== null) {
        setCurrentRatingPage(pageKey);
      }
    },
    [setActivePrompt, setCurrentRatingPage]
  );

  /**
   * Call to clear prompt (e.g., when not on rating step).
   */
  const clearPrompt = useCallback(() => {
    setActivePrompt(null);
  }, [setActivePrompt]);

  /**
   * Call when the session is done. Stops any active recording,
   * collects page transcripts + audio, and returns them.
   */
  const finishSession = useCallback(() => {
    window.speechSynthesis.cancel();
    // Stop recording if it was auto-started, so data gets flushed to refs
    const vr = window.__voiceRecorder;
    if (vr && vr.isRecording) {
      vr.stop();
    }
    // Give a moment for any final data to flush, then collect
    // (The stop path is synchronous for text; audio may lose last chunk but text is primary)
    return collectPageTranscripts();
  }, []);

  return {
    // Navigation
    navigate,
    location,
    uploadConfig,

    // Config shortcuts
    configPrompt,
    count,

    // Step & username
    step,
    setStep,
    username,
    setUsername,
    usernameRegex,

    // Prompt & page lifecycle
    updatePromptAndPage,
    clearPrompt,
    setActivePrompt,
    setCurrentRatingPage,

    // Session finalization
    finishSession,
  };
}