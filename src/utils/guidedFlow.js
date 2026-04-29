/**
 * guidedFlow — Defines the chained "Start Rating" experience that walks
 * a participant through every rating format back-to-back.
 *
 * Flow (after the welcome screen + calibration):
 *   1. Individual Rate      — 10 images
 *   2. Pairwise Rate        — 10 pairs
 *   3. Ranked Rate          — 10 groups (swap mode)
 *   4. Group Grid Rate      — 2 pages of 3x3-no-center (16 images)
 *   ─ Thank-you screen
 *
 * Each rate page already accepts `uploadConfig` via location.state. We
 * piggy-back on that channel by adding two extra fields:
 *
 *   uploadConfig.guided  — true while the participant is inside a guided run
 *   uploadConfig.flow    — array of step descriptors *remaining after this one*
 *
 * When a rate page finishes, it calls `nextGuidedNavigation(uploadConfig)`
 * to learn where to go next instead of routing to its own results page.
 */

export const GUIDED_STEPS = [
  { kind: "individual",  route: "/individual-rate", count: 10 },
  { kind: "pairwise",    route: "/pairwise-rate",   count: 10 },
  { kind: "ranked",      route: "/ranked-rate",     count: 10, rankMode: "swap" },
  { kind: "group-grid",  route: "/group-grid-rate", pageCount: 2, layoutId: "3x3-no-center" },
];

/** Initial uploadConfig used to enter the guided flow (the first step). */
export function buildGuidedUploadConfig(username) {
  const [first, ...rest] = GUIDED_STEPS;
  return {
    ...first,
    username,
    guided: true,
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
      flow: rest,
    },
  };
}
