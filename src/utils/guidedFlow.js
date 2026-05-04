/**
 * guidedFlow — Defines the chained "Start Rating" experience that walks
 * a participant through every rating format back-to-back.
 *
 * The order, counts, and layouts are driven by `mode_config` in Supabase
 * (see src/services/modeConfig.js). When that table is unreachable, the
 * defaults below are used.
 *
 * `mode_config` also stores a top-level `mediaMode` ("image" | "video")
 * which decides whether each step routes to its image or video page.
 *
 * Each rate page accepts `uploadConfig` via location.state. We piggy-back
 * on that channel by adding extra fields:
 *
 *   uploadConfig.guided     — true while the participant is inside a guided run
 *   uploadConfig.flow       — array of step descriptors *remaining after this one*
 *   uploadConfig.mediaMode  — "image" or "video"
 *
 * When a rate page finishes, it calls `nextGuidedNavigation(uploadConfig)`
 * to learn where to go next instead of routing to its own results page.
 */

import {
  DEFAULT_STEPS,
  DEFAULT_MEDIA_MODE,
  normalizeSteps,
} from "../services/modeConfig";

function stripEnabled(step) {
  const copy = { ...step };
  delete copy.enabled;
  return copy;
}

/** Default chain — used as a fallback when Supabase is unreachable. */
export const GUIDED_STEPS = normalizeSteps(DEFAULT_STEPS, DEFAULT_MEDIA_MODE)
  .filter((s) => s.enabled !== false)
  .map(stripEnabled);

function activeSteps(steps, mediaMode) {
  const list = Array.isArray(steps)
    ? normalizeSteps(steps, mediaMode)
    : GUIDED_STEPS;
  return list.filter((s) => s.enabled !== false).map(stripEnabled);
}

/** Initial uploadConfig used to enter the guided flow (the first step). */
export function buildGuidedUploadConfig(username, steps, mediaMode = DEFAULT_MEDIA_MODE) {
  const mode = mediaMode === "video" ? "video" : "image";
  const chain = activeSteps(steps, mode);
  if (chain.length === 0) return null;
  const [first, ...rest] = chain;
  return {
    ...first,
    username,
    guided: true,
    mediaMode: mode,
    flow: rest,
  };
}

/**
 * Compute where to go after a guided step finishes. Returns
 *   { route, uploadConfig }
 * where uploadConfig is null when the chain is done.
 */
export function nextGuidedNavigation(currentUploadConfig) {
  if (!currentUploadConfig?.guided) return null;
  const flow = currentUploadConfig.flow || [];
  if (flow.length === 0) {
    return { route: "/thank-you", uploadConfig: null };
  }
  const [next, ...rest] = flow;
  return {
    route: next.route,
    uploadConfig: {
      ...next,
      username: currentUploadConfig.username,
      guided: true,
      mediaMode: currentUploadConfig.mediaMode || DEFAULT_MEDIA_MODE,
      flow: rest,
    },
  };
}
