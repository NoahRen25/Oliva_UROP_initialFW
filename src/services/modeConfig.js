import { supabase } from "../supabaseClient";

export const MODE_DEFINITIONS = {
  individual: {
    label: "Individual",
    routes: { image: "/individual-rate", video: "/video-individual-rate" },
    fields: ["count"],
    defaults: { count: 10 },
  },
  pairwise: {
    label: "Pairwise",
    routes: { image: "/pairwise-rate", video: "/video-pairwise-rate" },
    fields: ["count"],
    defaults: { count: 10 },
  },
  ranked: {
    label: "Ranked",
    routes: { image: "/ranked-rate", video: "/video-ranked-rate" },
    fields: ["count"],
    defaults: { count: 10, rankMode: "swap" },
  },
  "group-grid": {
    label: "Group",
    routes: { image: "/group-grid-rate", video: "/video-group-grid-rate" },
    fields: ["pageCount", "layoutId"],
    defaults: { pageCount: 2, layoutId: "3x3-no-center" },
  },
};

export const DEFAULT_MEDIA_MODE = "image";

export const DEFAULT_STEPS = [
  { kind: "individual", count: 10, enabled: true },
  { kind: "pairwise", count: 10, enabled: true },
  { kind: "ranked", count: 10, rankMode: "swap", enabled: true },
  { kind: "group-grid", pageCount: 2, layoutId: "3x3-no-center", enabled: true },
];

function routeFor(kind, mediaMode) {
  const def = MODE_DEFINITIONS[kind];
  if (!def) return null;
  return def.routes[mediaMode] || def.routes.image;
}

function normalizeStep(raw, mediaMode) {
  const def = MODE_DEFINITIONS[raw?.kind];
  if (!def) return null;
  const { route: _ignored, ...rest } = raw || {};
  return {
    kind: raw.kind,
    enabled: raw.enabled !== false,
    ...def.defaults,
    ...rest,
    route: routeFor(raw.kind, mediaMode),
  };
}

export function normalizeSteps(steps, mediaMode = DEFAULT_MEDIA_MODE) {
  const mode = mediaMode === "video" ? "video" : "image";
  if (!Array.isArray(steps)) {
    return DEFAULT_STEPS.map((s) => normalizeStep(s, mode));
  }
  const normalized = steps
    .map((s) => normalizeStep(s, mode))
    .filter(Boolean);
  const seen = new Set(normalized.map((s) => s.kind));
  for (const fallback of DEFAULT_STEPS) {
    if (!seen.has(fallback.kind)) {
      normalized.push(normalizeStep({ ...fallback, enabled: false }, mode));
    }
  }
  return normalized;
}

/** Returns { mediaMode, steps }. */
export async function loadModeConfig() {
  if (!supabase) {
    return {
      mediaMode: DEFAULT_MEDIA_MODE,
      steps: normalizeSteps(DEFAULT_STEPS, DEFAULT_MEDIA_MODE),
    };
  }
  const { data, error } = await supabase
    .from("mode_config")
    .select("steps, media_mode")
    .eq("id", "active")
    .maybeSingle();
  if (error || !data) {
    return {
      mediaMode: DEFAULT_MEDIA_MODE,
      steps: normalizeSteps(DEFAULT_STEPS, DEFAULT_MEDIA_MODE),
    };
  }
  const mediaMode = data.media_mode === "video" ? "video" : "image";
  return {
    mediaMode,
    steps: normalizeSteps(data.steps, mediaMode),
  };
}

export async function saveModeConfig(steps, mediaMode, email) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const mode = mediaMode === "video" ? "video" : "image";
  const cleaned = normalizeSteps(steps, mode);
  const { error } = await supabase
    .from("mode_config")
    .upsert({
      id: "active",
      steps: cleaned,
      media_mode: mode,
      updated_at: new Date().toISOString(),
      updated_by: email ?? null,
    });
  if (error) throw error;
  return { mediaMode: mode, steps: cleaned };
}
