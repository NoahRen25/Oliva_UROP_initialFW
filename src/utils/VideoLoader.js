/**
 * VideoLoader.js
 * ══════════════════════════════════════════════════════════════════
 *
 * Loads videos for pairwise comparison. Works in two modes:
 *
 *   1. LOCAL (default for testing) — reads from public/videos/
 *   2. SUPABASE — reads from a "videos" storage bucket
 *
 * ── LOCAL TESTING SETUP (no Supabase needed) ────────────────────
 *
 * Create this folder structure inside your project's  public/  dir:
 *
 *   public/
 *   └── videos/
 *       ├── model_a/
 *       │   ├── scene_001.mp4
 *       │   ├── scene_002.mp4
 *       │   └── scene_003.mp4
 *       └── model_b/
 *           ├── scene_001.mp4
 *           ├── scene_002.mp4
 *           └── scene_003.mp4
 *
 *  Then create a manifest file at  public/videos/manifest.json :
 *
 *   {
 *     "folders": ["model_a", "model_b"],
 *     "files": {
 *       "model_a": ["scene_001.mp4", "scene_002.mp4", "scene_003.mp4"],
 *       "model_b": ["scene_001.mp4", "scene_002.mp4", "scene_003.mp4"]
 *     },
 *     "prompts": {
 *       "scene_001.mp4": "A cat sitting on a windowsill at sunset",
 *       "scene_002.mp4": "Aerial drone shot of a coastal highway",
 *       "scene_003.mp4": "A person walking through a neon-lit city at night"
 *     }
 *   }
 *
 * KEY RULE: Videos with the same filename across different folders
 * are treated as the same scene/prompt rendered by different models.
 * The pairwise builder picks one filename from two random folders.
 *
 * ── SUPABASE SETUP (for production) ─────────────────────────────
 *
 * The loader auto-detects Supabase if VITE_SUPABASE_URL is set.
 * Set up a public "videos" bucket with the same folder structure.
 * See the Supabase section at the bottom for details.
 *
 * ══════════════════════════════════════════════════════════════════
 */

import { supabase } from "../supabaseClient";

// ── Config ──────────────────────────────────────────────────────
const VIDEO_BUCKET = "videos";
const LOCAL_BASE = "/videos"; // relative to public/
const MANIFEST_PATH = `${LOCAL_BASE}/manifest.json`;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// ── State ───────────────────────────────────────────────────────

// { "scene_001.mp4": { "model_a": { src, folder, filename }, ... } }
let BY_FILENAME = {};
let FOLDERS = [];
let PROMPTS = {};
let _loaded = false;

// ── Helpers ─────────────────────────────────────────────────────

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Local loader ────────────────────────────────────────────────

async function loadFromLocal() {
  const resp = await fetch(MANIFEST_PATH);
  if (!resp.ok) {
    throw new Error(
      `Could not load ${MANIFEST_PATH}. ` +
        "Create public/videos/manifest.json — see VideoLoader.js header for the format."
    );
  }

  const manifest = await resp.json();
  FOLDERS = manifest.folders || [];
  PROMPTS = manifest.prompts || {};

  const files = manifest.files || {};
  for (const folder of FOLDERS) {
    for (const filename of files[folder] || []) {
      if (!BY_FILENAME[filename]) BY_FILENAME[filename] = {};
      BY_FILENAME[filename][folder] = {
        src: `${LOCAL_BASE}/${folder}/${filename}`,
        folder,
        filename,
      };
    }
  }
}

// ── Supabase loader ─────────────────────────────────────────────

async function loadFromSupabase() {
  if (!supabase || !SUPABASE_URL) {
    throw new Error("Supabase not configured");
  }

  const publicUrl = (path) =>
    `${SUPABASE_URL}/storage/v1/object/public/${VIDEO_BUCKET}/${path}`;

  // List top-level folders
  const { data: topLevel, error: topErr } = await supabase.storage
    .from(VIDEO_BUCKET)
    .list("", { limit: 200, sortBy: { column: "name", order: "asc" } });

  if (topErr) throw new Error(`Bucket listing failed: ${topErr.message}`);

  const folders = (topLevel || [])
    .filter((item) => item.id === null && !item.name.startsWith("_"))
    .map((item) => item.name);
  FOLDERS = folders;

  for (const folder of folders) {
    const { data: files, error: listErr } = await supabase.storage
      .from(VIDEO_BUCKET)
      .list(folder, { limit: 1000 });
    if (listErr) continue;

    for (const file of files || []) {
      if (file.id === null) continue;
      const ext = file.name.split(".").pop().toLowerCase();
      if (!["mp4", "webm", "mov", "ogg"].includes(ext)) continue;

      if (!BY_FILENAME[file.name]) BY_FILENAME[file.name] = {};
      BY_FILENAME[file.name][folder] = {
        src: publicUrl(`${folder}/${file.name}`),
        folder,
        filename: file.name,
      };
    }
  }

  // Optional prompts CSV
  try {
    const csvResp = await fetch(publicUrl("_prompts.csv"));
    if (csvResp.ok) {
      const text = await csvResp.text();
      const lines = text.split("\n").filter(Boolean);
      for (let i = 1; i < lines.length; i++) {
        const comma = lines[i].indexOf(",");
        if (comma === -1) continue;
        const fname = lines[i].substring(0, comma).trim().replace(/"/g, "");
        const prompt = lines[i].substring(comma + 1).trim().replace(/^"|"$/g, "");
        PROMPTS[fname] = prompt;
      }
    }
  } catch {
    /* no prompts file, that's fine */
  }
}

// ── Public API ──────────────────────────────────────────────────

/**
 * loadVideoIndex() — Call once before getVideoPairwiseBatch().
 * Prefers Supabase when VITE_SUPABASE_URL is configured; falls back to a
 * local manifest at public/videos/manifest.json for dev without Supabase.
 */
export async function loadVideoIndex() {
  if (_loaded) return;

  BY_FILENAME = {};
  FOLDERS = [];
  PROMPTS = {};

  // Prefer Supabase when configured
  if (supabase && SUPABASE_URL) {
    try {
      await loadFromSupabase();
      if (Object.keys(BY_FILENAME).length > 0) {
        _loaded = true;
        console.log(
          `VideoLoader [supabase]: ${Object.keys(BY_FILENAME).length} videos across ${FOLDERS.length} folders`
        );
        return;
      }
    } catch (e) {
      console.log("VideoLoader: Supabase load failed, trying local manifest...", e.message);
    }
  }

  // Fall back to local manifest
  try {
    await loadFromLocal();
    if (Object.keys(BY_FILENAME).length > 0) {
      _loaded = true;
      console.log(
        `VideoLoader [local]: ${Object.keys(BY_FILENAME).length} videos across ${FOLDERS.length} folders`
      );
      return;
    }
  } catch (e) {
    console.error("VideoLoader: Both Supabase and local loading failed.", e.message);
  }

  _loaded = true; // mark loaded so we don't retry forever
}

/**
 * getVideoPairwiseBatch(count) — Build pairwise comparison pairs.
 * Same filename from two different folders = one pair.
 */
export function getVideoPairwiseBatch(count = 5) {
  const filenames = Object.keys(BY_FILENAME).filter(
    (fname) => Object.keys(BY_FILENAME[fname]).length >= 2
  );

  if (filenames.length === 0) return [];

  const batch = [];
  const used = new Set();

  for (let i = 0; i < count; i++) {
    let fname;
    let attempts = 0;
    do {
      fname = getRandomItem(filenames);
      attempts++;
    } while (used.has(fname) && attempts < filenames.length * 3);

    used.add(fname);
    const variants = BY_FILENAME[fname];
    const avail = Object.keys(variants);

    const folderA = getRandomItem(avail);
    let folderB = getRandomItem(avail);
    while (folderB === folderA) folderB = getRandomItem(avail);

    batch.push({
      id: i,
      prompt: PROMPTS[fname] || "",
      left: {
        src: variants[folderA].src,
        folder: folderA,
        filename: `${folderA}/${fname}`,
      },
      right: {
        src: variants[folderB].src,
        folder: folderB,
        filename: `${folderB}/${fname}`,
      },
    });
  }

  return batch;
}

/** Flat list of every indexed video variant. */
function allVideoVariants() {
  const list = [];
  for (const fname of Object.keys(BY_FILENAME)) {
    for (const folder of Object.keys(BY_FILENAME[fname])) {
      list.push({
        filename: fname,
        folder,
        src: BY_FILENAME[fname][folder].src,
        prompt: PROMPTS[fname] || "",
      });
    }
  }
  return list;
}

/**
 * getVideoIndividualBatch(count) — Pick `count` individual videos at random
 * across all folders. Mirrors `getIndividualBatch` for images.
 */
export function getVideoIndividualBatch(count = 5) {
  const all = allVideoVariants();
  if (all.length === 0) return [];

  const batch = [];
  for (let i = 0; i < count; i++) {
    const item = getRandomItem(all);
    batch.push({
      id: `vi_${i}`,
      src: item.src,
      prompt: item.prompt,
      filename: `${item.folder}/${item.filename}`,
      alt: `${item.folder} – ${item.filename}`,
      folder: item.folder,
    });
  }
  return batch;
}

/**
 * getVideoRankedBatch(count) — `count` groups of N variants of the same
 * filename across different folders (up to 3). Mirrors `getRankedBatch`.
 */
export function getVideoRankedBatch(count = 3) {
  const filenames = Object.keys(BY_FILENAME).filter(
    (fname) => Object.keys(BY_FILENAME[fname]).length >= 2
  );
  if (filenames.length === 0) return [];

  const batch = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let fname;
    let attempts = 0;
    do {
      fname = getRandomItem(filenames);
      attempts++;
    } while (used.has(fname) && attempts < filenames.length * 3);
    used.add(fname);

    const variants = BY_FILENAME[fname];
    const folders = Object.keys(variants).slice(0, 3);
    batch.push({
      groupId: i,
      prompt: PROMPTS[fname] || "",
      images: folders.map((folder, idx) => ({
        id: `vr${i}_${idx}`,
        src: variants[folder].src,
        filename: `${folder}/${fname}`,
        alt: `${folder} – ${fname}`,
        folder,
      })),
    });
  }
  return batch;
}

/**
 * getVideoGroupBatch(count) — Flat list of `count` random video variants for
 * grid-style rating. Mirrors `getIndividualBatch` shape.
 */
export function getVideoGroupBatch(count = 8) {
  return getVideoIndividualBatch(count);
}

/** Number of unique video filenames indexed. */
export function getVideoCount() {
  return Object.keys(BY_FILENAME).length;
}

/** Whether the index has been loaded. */
export function isVideoIndexLoaded() {
  return _loaded;
}