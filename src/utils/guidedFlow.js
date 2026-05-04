/**
 * guidedFlow — chained "Start Rating" experience.
 *
 * uploadConfig.guided — true while inside a guided run.
 * uploadConfig.flow   — array of step descriptors *remaining after this one*.
 *
 * Step descriptors may set `validateBefore: true` to insert a brief
 * gaze-accuracy check before the step.
 */

export const DEFAULT_GUIDED_STEPS = [
  { kind: "individual",  route: "/individual-rate", count: 10 },
  { kind: "pairwise",    route: "/pairwise-rate",   count: 10, validateBefore: true },
  { kind: "ranked",      route: "/ranked-rate",     count: 10, rankMode: "swap", validateBefore: true },
  { kind: "group-grid",  route: "/group-grid-rate", pageCount: 2, layoutId: "3x3-no-center", validateBefore: true },
];

export const GUIDED_STEPS = DEFAULT_GUIDED_STEPS;

/** Initial uploadConfig used to enter the guided flow (the first step). */
export function buildGuidedUploadConfig(username, steps = DEFAULT_GUIDED_STEPS) {
  const [first, ...rest] = steps;
  return {
    ...first,
    username,
    guided: true,
    flow: rest,
    totalSteps: steps.length,
  };
}

/**
 * Compute where to go after a guided step finishes. Returns
 *   { route, uploadConfig }
 * where uploadConfig is null when the chain is done.
 *
 * If the next step has `validateBefore: true`, the navigation is
 * detoured through `/calibration-check` first; the upload config still
 * carries the next step so the check screen can advance afterwards.
 */
export function nextGuidedNavigation(currentUploadConfig) {
  if (!currentUploadConfig?.guided) return null;
  const flow = currentUploadConfig.flow || [];
  if (flow.length === 0) {
    return { route: "/thank-you", uploadConfig: null };
  }
  const [next, ...rest] = flow;
  const nextUploadConfig = {
    ...next,
    username: currentUploadConfig.username,
    guided: true,
    flow: rest,
    totalSteps: currentUploadConfig.totalSteps ?? DEFAULT_GUIDED_STEPS.length,
  };
  if (next.validateBefore) {
    return { route: "/calibration-check", uploadConfig: nextUploadConfig };
  }
  return { route: next.route, uploadConfig: nextUploadConfig };
}

/** Total step count for progress indicators. */
export function totalGuidedSteps(steps = DEFAULT_GUIDED_STEPS) {
  return steps.length;
}
