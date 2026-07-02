/**
 * collectPageTranscripts.js — Bridge between rating pages and the voice
 * recorder.
 *
 * VoiceRecorderContext registers a collector function here; when a rating
 * page submits, it calls collectPageTranscripts() to grab the per-page
 * transcripts, audio URLs, and raw audio blobs accumulated during the
 * session (stored on the session's meta and uploaded via
 * supabaseAudioStorage). A plain module-level registry avoids a context
 * dependency cycle.
 */
let _collector = null;

export function _registerCollector(fn) {
  _collector = fn;
  return () => {
    if (_collector === fn) _collector = null;
  };
}

export default function collectPageTranscripts() {
  if (!_collector) {
    return { transcripts: {}, audioUrls: {}, audioBlobs: {} };
  }
  return _collector();
}
