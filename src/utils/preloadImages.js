/**
 * Preloads image URLs into the browser cache using offscreen Image objects.
 * Call this with upcoming image URLs so they're ready when the user navigates.
 */
export function preloadImages(urls) {
  for (const url of urls) {
    if (!url) continue;
    const img = new Image();
    img.src = url;
  }
}
