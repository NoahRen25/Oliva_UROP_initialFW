import React, { useEffect, useRef } from "react";
import { Box, Card, CardActionArea, Chip } from "@mui/material";

/**
 * VideoCard — single <video> element with playback controls and a hook for
 * coordinated playback across multiple cards on the same page.
 *
 * Behavior taken from the existing video pairwise flow:
 *   - When this video starts playing, every other registered video pauses.
 *   - When it finishes, the parent learns via onEnded so it can decide
 *     whether the user is allowed to advance.
 *
 * Props:
 *   src         — video source URL
 *   videoId     — stable id used by the coordinator to track ended state
 *   coordinator — object returned by useVideoFleet()
 *   selected    — visually highlight (for pairwise selection)
 *   onSelect    — click handler (passes through clicks on the video itself)
 *   label       — optional Chip label (e.g. "A" / "B")
 *   height      — optional CSS height (default "55vh")
 *   showBorder  — show the selection border (default true)
 */
export default function VideoCard({
  src,
  videoId,
  coordinator,
  selected = false,
  onSelect,
  label,
  height = "55vh",
  showBorder = true,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.load();
  }, [src]);

  useEffect(() => {
    if (!coordinator || !videoId) return;
    coordinator.register(videoId, ref);
    return () => coordinator.unregister(videoId);
  }, [coordinator, videoId]);

  const handlePlay = () => {
    if (coordinator && videoId) coordinator.handlePlay(videoId);
  };

  const handleEnded = () => {
    if (coordinator && videoId) coordinator.handleEnded(videoId);
  };

  const handleLoadedMetadata = (e) => {
    if (coordinator && videoId && coordinator.setDuration) {
      coordinator.setDuration(videoId, e.target.duration || 0);
    }
  };

  const borderStyle = !showBorder
    ? "none"
    : selected
    ? "4px solid #1976d2"
    : "4px solid transparent";

  return (
    <Card
      sx={{
        border: borderStyle,
        transition: "border 0.2s, box-shadow 0.2s",
        boxShadow: selected ? 8 : 2,
        overflow: "hidden",
        cursor: onSelect ? "pointer" : "default",
        "&:hover": { boxShadow: 6 },
      }}
      onClick={onSelect}
    >
      <CardActionArea sx={{ position: "relative" }} disableRipple={!onSelect}>
        <Box
          component="video"
          ref={ref}
          controls
          playsInline
          preload="metadata"
          sx={{
            width: "100%",
            height,
            objectFit: "contain",
            background: "#000",
            display: "block",
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelect) onSelect();
          }}
          onPlay={handlePlay}
          onEnded={handleEnded}
          onLoadedMetadata={handleLoadedMetadata}
        >
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </Box>
        {label && (
          <Chip
            label={label}
            size="small"
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              bgcolor: "rgba(0,0,0,0.6)",
              color: "white",
              fontWeight: "bold",
            }}
          />
        )}
      </CardActionArea>
    </Card>
  );
}
