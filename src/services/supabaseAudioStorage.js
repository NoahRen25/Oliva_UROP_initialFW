/**
 * supabaseAudioStorage.js
 * 
 * Handles uploading and retrieving per-page audio recordings
 * to/from Supabase Storage. Uses a dedicated "session-audio" bucket.
 * 
 * Audio files are stored as: {sessionId}/page_{pageKey}.webm
 */

import { supabase } from "../supabaseClient";

const AUDIO_BUCKET = "session-audio";
const isConfigured = () => !!supabase;

/**
 * Upload all page audio blobs for a session.
 * @param {number|string} sessionId
 * @param {Object} pageAudioBlobs - { [pageKey]: Blob }
 * @returns {Object} pageAudioUrls - { [pageKey]: publicUrl }
 */
export async function uploadSessionAudio(sessionId, pageAudioBlobs) {
  if (!isConfigured() || !pageAudioBlobs) return {};

  const urls = {};

  for (const [pageKey, blob] of Object.entries(pageAudioBlobs)) {
    if (!blob || !(blob instanceof Blob)) continue;

    const path = `${sessionId}/page_${pageKey}.webm`;

    try {
      const { error } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(path, blob, {
          contentType: "audio/webm",
          upsert: true,
        });

      if (error) {
        console.warn(`Audio upload failed for page ${pageKey}:`, error.message);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from(AUDIO_BUCKET)
        .getPublicUrl(path);

      if (urlData?.publicUrl) {
        urls[pageKey] = urlData.publicUrl;
      }
    } catch (err) {
      console.warn(`Audio upload error for page ${pageKey}:`, err.message);
    }
  }

  return urls;
}

/**
 * Fetch all audio URLs for a session from Supabase Storage.
 * @param {number|string} sessionId
 * @returns {Object} { [pageKey]: publicUrl }
 */
export async function fetchSessionAudioUrls(sessionId) {
  if (!isConfigured()) return {};

  try {
    const { data: files, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .list(String(sessionId), { limit: 100 });

    if (error || !files) return {};

    const urls = {};
    for (const file of files) {
      if (!file.name.endsWith(".webm")) continue;

      const pageKey = file.name
        .replace("page_", "")
        .replace(".webm", "");

      const { data: urlData } = supabase.storage
        .from(AUDIO_BUCKET)
        .getPublicUrl(`${sessionId}/${file.name}`);

      if (urlData?.publicUrl) {
        urls[pageKey] = urlData.publicUrl;
      }
    }

    return urls;
  } catch (err) {
    console.warn("fetchSessionAudioUrls error:", err.message);
    return {};
  }
}

/**
 * Delete all audio files for a session.
 * @param {number|string} sessionId
 */
export async function deleteSessionAudio(sessionId) {
  if (!isConfigured()) return;

  try {
    const { data: files } = await supabase.storage
      .from(AUDIO_BUCKET)
      .list(String(sessionId), { limit: 100 });

    if (files?.length) {
      const paths = files.map((f) => `${sessionId}/${f.name}`);
      await supabase.storage.from(AUDIO_BUCKET).remove(paths);
    }
  } catch (err) {
    console.warn("deleteSessionAudio error:", err.message);
  }
}