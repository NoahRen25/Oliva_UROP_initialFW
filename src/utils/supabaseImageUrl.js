/**
 * Returns the public Supabase Storage URL for a given bucket and path.
 * Falls back to a local path when Supabase is not configured.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * @param {string} bucket  – e.g. 'generated-images', 'mem-images', 'demo-images'
 * @param {string} path    – object path inside the bucket, e.g. 'flux_2_pro/generated_001.png'
 * @param {string} [localFallback] – optional local path to use when Supabase is not configured
 * @returns {string} full URL or local path
 */
export function getImageUrl(bucket, path, localFallback) {
  if (SUPABASE_URL) {
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
  }
  // Fallback to local path when Supabase is not configured
  if (localFallback) return localFallback;
  // Best-effort local mapping
  if (bucket === "generated-images") return `/images/${path}`;
  if (bucket === "mem-images") return `/mem_images/${path}`;
  if (bucket === "demo-images") return `/src/images/${path}`;
  return path;
}
