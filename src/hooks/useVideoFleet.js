import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useVideoFleet — coordinator for multiple <video> elements on one page.
 *
 *   - Pauses every other registered video when one starts playing
 *     (mirrors the rule from the legacy video-pairwise flow).
 *   - Tracks which videos have played to completion. Use `allEnded(ids)`
 *     to gate "Next"/"Submit" until the participant has watched everything.
 *   - Tracks each video's reported duration (via setDuration) and a
 *     per-page start timestamp (reset by reset()), so callers can also
 *     gate on total elapsed time >= sum of video durations.
 *
 * The page that owns the fleet should:
 *   1. const fleet = useVideoFleet();
 *   2. pass `fleet` as the `coordinator` prop on each VideoCard.
 *   3. before swapping in a new batch (next pair / page / group),
 *      call fleet.reset() so the ended-set + durations + page timer reset.
 */
export default function useVideoFleet() {
  const refs = useRef({});
  const durationsRef = useRef({});
  const pageStartRef = useRef(0);
  const [endedMap, setEndedMap] = useState({});
  const [, setTick] = useState(0);
  const [tickerActive, setTickerActive] = useState(true);

  // Drive a periodic re-render so time-based gating (allWatched) updates
  // even when no other state changes. Also stamps the initial page start.
  // The ticker is paused once a caller signals the gate is satisfied.
  useEffect(() => {
    pageStartRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (!tickerActive) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(id);
  }, [tickerActive]);

  const register = useCallback((id, ref) => {
    refs.current[id] = ref;
  }, []);

  const unregister = useCallback((id) => {
    delete refs.current[id];
    delete durationsRef.current[id];
  }, []);

  const handlePlay = useCallback((playingId) => {
    for (const id of Object.keys(refs.current)) {
      if (id === playingId) continue;
      const el = refs.current[id]?.current;
      if (el && !el.paused) el.pause();
    }
  }, []);

  const handleEnded = useCallback((id) => {
    setEndedMap((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  }, []);

  const setDuration = useCallback((id, dur) => {
    if (!id || !Number.isFinite(dur) || dur <= 0) return;
    durationsRef.current[id] = dur;
  }, []);

  const reset = useCallback(() => {
    setEndedMap({});
    durationsRef.current = {};
    pageStartRef.current = performance.now();
    setTickerActive(true);
  }, []);

  const allEnded = useCallback(
    (ids) => {
      if (!ids || ids.length === 0) return false;
      return ids.every((id) => endedMap[id]);
    },
    [endedMap]
  );

  const totalDuration = useCallback((ids) => {
    if (!ids || ids.length === 0) return 0;
    return ids.reduce((sum, id) => sum + (durationsRef.current[id] || 0), 0);
  }, []);

  const pageElapsed = useCallback(() => {
    if (!pageStartRef.current) return 0;
    return (performance.now() - pageStartRef.current) / 1000;
  }, []);

  // Gate: every video has reached `ended` AND the participant has spent
  // at least the sum of all video durations on this page.
  const allWatched = useCallback(
    (ids) => {
      if (!allEnded(ids)) return false;
      const total = totalDuration(ids);
      if (total <= 0) return true;
      const cleared = pageElapsed() >= total;
      // Once the runtime gate is satisfied, no further re-renders are needed
      // until the page changes (which calls reset()).
      if (cleared && tickerActive) setTickerActive(false);
      return cleared;
    },
    [allEnded, totalDuration, pageElapsed, tickerActive]
  );

  // Seconds remaining before the runtime gate clears for the given ids.
  // Returns 0 once enough wall-clock time has elapsed (or no duration is known).
  const remainingRuntime = useCallback(
    (ids) => {
      const total = totalDuration(ids);
      if (total <= 0) return 0;
      return Math.max(0, total - pageElapsed());
    },
    [totalDuration, pageElapsed]
  );

  return {
    register,
    unregister,
    handlePlay,
    handleEnded,
    setDuration,
    reset,
    allEnded,
    allWatched,
    totalDuration,
    pageElapsed,
    remainingRuntime,
    endedMap,
  };
}
