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
