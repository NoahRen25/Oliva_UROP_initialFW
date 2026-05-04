import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useResults } from "../Results";
import { useVoiceRecorder } from "../components/VoiceRecorderContext";

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
  const voiceRecorder = useVoiceRecorder();

  const [step, setStep] = useState(uploadConfig ? 1 : 0);
  const [username, setUsername] = useState(uploadConfig?.username || "");

  const configPrompt = uploadConfig?.prompt || null;
  const count = uploadConfig?.count || 5;

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setActivePrompt(null);
      setCurrentRatingPage(null);
      if (voiceRecorder.isRecordingRef.current) voiceRecorder.stop();
    };
  }, [setActivePrompt, setCurrentRatingPage, voiceRecorder]);

  useEffect(() => {
    if (step === 2 && !voiceRecorder.isRecordingRef.current) {
      voiceRecorder.start();
    }
  }, [step, voiceRecorder]);

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
    if (voiceRecorder.isRecordingRef.current) voiceRecorder.stop();
    return voiceRecorder.collectPageAudio();
  }, [voiceRecorder]);

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