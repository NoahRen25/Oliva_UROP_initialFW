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
