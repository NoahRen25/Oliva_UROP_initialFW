/**
 * collectPageTranscripts()
 *
 * Reads per-page audio from global refs. Resets after reading.
 */
export default function collectPageTranscripts() {
  const textRef = window.__pendingPageTranscripts;
  const audioRef = window.__pendingPageAudio;
  const blobRef = window.__pendingPageAudioBlobs;

  const transcripts = textRef?.current || {};
  const audioUrls = audioRef?.current || {};
  const audioBlobs = blobRef?.current || {};

  if (textRef) textRef.current = {};
  if (audioRef) audioRef.current = {};
  if (blobRef) blobRef.current = {};

  return { transcripts, audioUrls, audioBlobs };
}