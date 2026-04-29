import { useEffect } from "react";

/**
 * useAutoVoiceRecording — start the global VoiceRecorder when `active` is
 * true and stop it when the component unmounts.
 *
 * The VoiceRecorder component (mounted in App.jsx) registers itself on
 * `window.__voiceRecorder`; this hook drives it. A small delay before
 * starting lets the recorder finish registering after a fresh route
 * transition.
 */
export default function useAutoVoiceRecording(active) {
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => {
      const vr = window.__voiceRecorder;
      if (vr && !vr.isRecording) vr.start();
    }, 300);
    return () => clearTimeout(t);
  }, [active]);

  // Stop on unmount so the final page's audio gets flushed to the
  // global pending refs before the rate page calls collectPageTranscripts.
  useEffect(() => {
    return () => {
      const vr = window.__voiceRecorder;
      if (vr && vr.isRecording) vr.stop();
    };
  }, []);
}
