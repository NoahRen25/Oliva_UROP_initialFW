import React, { useCallback } from "react";
import { Box } from "@mui/material";

/**
 * VideoThumbnail — Renders a static first-frame preview of a video file.
 *
 * `<video preload="metadata">` alone reliably loads dimensions/duration but
 * many browsers won't paint a frame until the playhead has actually moved.
 * Seeking to ~0.1s on `loadedmetadata` forces the browser to render that
 * frame, giving us a true thumbnail without downloading the whole file.
 */
export default function VideoThumbnail({
  src,
  onError,
  objectFit = "cover",
  sx,
  ...rest
}) {
  const handleLoadedMetadata = useCallback((e) => {
    const el = e.target;
    if (!el) return;
    try {
      // Some browsers reject seek to 0; a small offset is most reliable.
      el.currentTime = Math.min(0.1, (el.duration || 0.5) / 4);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <Box
      component="video"
      src={src}
      preload="metadata"
      muted
      playsInline
      disablePictureInPicture
      onLoadedMetadata={handleLoadedMetadata}
      onError={onError}
      sx={{
        width: "100%",
        height: "100%",
        objectFit,
        display: "block",
        background: "#000",
        ...sx,
      }}
      {...rest}
    />
  );
}
