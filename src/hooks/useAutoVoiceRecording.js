/**
 * useAutoVoiceRecording.js — Hands-free recording for rating pages.
 *
 * While `active` is true, starts the shared voice recorder (see
 * VoiceRecorderContext) if it isn't already running, and stops it when the
 * page unmounts. Lets rating flows capture think-aloud audio without the
 * participant touching the mic widget.
 */
import { useEffect } from "react";
import { useVoiceRecorder } from "../components/VoiceRecorderContext";

export default function useAutoVoiceRecording(active) {
  const { start, stop, isRecordingRef } = useVoiceRecorder();

  useEffect(() => {
    if (!active) return;
    if (!isRecordingRef.current) start();
  }, [active, start, isRecordingRef]);

  useEffect(() => {
    return () => {
      if (isRecordingRef.current) stop();
    };
  }, [stop, isRecordingRef]);
}
