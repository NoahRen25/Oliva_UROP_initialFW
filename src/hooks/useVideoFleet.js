import { useCallback, useRef, useState } from "react";

/**
 * useVideoFleet — coordinator for multiple <video> elements on one page.
 *
 *   - Pauses every other registered video when one starts playing
 *     (mirrors the rule from the legacy video-pairwise flow).
 *   - Tracks which videos have played to completion. Use `allEnded(ids)`
 *     to gate "Next"/"Submit" until the participant has watched everything.
 *
 * The page that owns the fleet should:
 *   1. const fleet = useVideoFleet();
 *   2. pass `fleet` as the `coordinator` prop on each VideoCard.
 *   3. before swapping in a new batch (next pair / page / group),
 *      call fleet.reset() so the ended-set is cleared.
 */
export default function useVideoFleet() {
  const refs = useRef({});
  const [endedMap, setEndedMap] = useState({});

  const register = useCallback((id, ref) => {
    refs.current[id] = ref;
  }, []);

  const unregister = useCallback((id) => {
    delete refs.current[id];
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

  const reset = useCallback(() => {
    setEndedMap({});
  }, []);

  const allEnded = useCallback(
    (ids) => {
      if (!ids || ids.length === 0) return false;
      return ids.every((id) => endedMap[id]);
    },
    [endedMap]
  );

  return {
    register,
    unregister,
    handlePlay,
    handleEnded,
    reset,
    allEnded,
    endedMap,
  };
}
