/**
 * collectPageTranscripts()
 *
 * Grabs the page-segmented transcripts AND audio from the VoiceRecorder's
 * pending refs and resets them. Call this right before saving a session.
 *
 * @returns {{ transcripts: object, audioUrls: object, audioBlobs: object }}
 *   - transcripts: { [pageKey]: string }
 *   - audioUrls:   { [pageKey]: objectURL string } (for playback)
 *   - audioBlobs:  { [pageKey]: Blob } (for download)
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
  
  /**
   * Legacy helper — returns just the text transcripts object.
   * Used by the older code paths that only need text.
   */
  export function collectPageTranscriptsText() {
    const result = collectPageTranscripts();
    return result.transcripts;
  }