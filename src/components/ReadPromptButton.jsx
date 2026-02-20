import React, { useState, useEffect, useCallback } from "react";
import { IconButton, Tooltip } from "@mui/material";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import StopIcon from "@mui/icons-material/Stop";
import { useResults } from "../Results";

export default function ReadPromptButton() {
  const { activePrompt } = useResults();
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  useEffect(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [activePrompt]);

  const handleClick = useCallback(() => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    if (!activePrompt) return;

    const u = new SpeechSynthesisUtterance(activePrompt);
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.name.includes("Karen") && v.lang.startsWith("en")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0];
    if (voice) u.voice = voice;
    u.rate = 1.05;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }, [activePrompt, speaking]);

  if (!activePrompt) return null;

  return (
    <Tooltip title={speaking ? "Stop reading" : "Read current prompt aloud"}>
      <IconButton
        color={speaking ? "error" : "inherit"}
        onClick={handleClick}
        sx={{ mr: 1 }}
      >
        {speaking ? <StopIcon /> : <RecordVoiceOverIcon />}
      </IconButton>
    </Tooltip>
  );
}