import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useResults } from "../Results";
import {
  Container, Typography, Box, Button, Card, CardActionArea,
  Alert, CircularProgress, Chip,
} from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import PairwiseFlow from "../components/PairwiseFlow";
import { loadVideoIndex, getVideoPairwiseBatch, getVideoCount } from "../utils/VideoLoader";

function VideoCard({ src, selected, onSelect, label, onEnded, videoRef, onPlay }) {
  const internalRef = useRef(null);
  const ref = videoRef || internalRef;

  useEffect(() => {
    if (ref.current) ref.current.load();
  }, [src]);

  return (
    <Card
      sx={{
        border: selected ? "4px solid #1976d2" : "4px solid transparent",
        transition: "border 0.2s, box-shadow 0.2s",
        boxShadow: selected ? 8 : 2,
        overflow: "hidden",
        cursor: "pointer",
        "&:hover": { boxShadow: 6 },
      }}
      onClick={onSelect}
    >
      <CardActionArea sx={{ position: "relative" }}>
        <video
          ref={ref}
          controls
          playsInline
          preload="metadata"
          style={{
            width: "100%",
            height: "55vh",
            objectFit: "contain",
            background: "#000",
            display: "block",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onEnded={onEnded}
          onPlay={onPlay}
        >
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {label && (
          <Chip
            label={label}
            size="small"
            sx={{
              position: "absolute", top: 8, left: 8,
              bgcolor: "rgba(0,0,0,0.6)", color: "white", fontWeight: "bold",
            }}
          />
        )}
      </CardActionArea>
    </Card>
  );
}

export default function VideoPairwiseRate() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig || null;
  const { addVideoPairwiseSession } = useResults();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [pairs, setPairs] = useState([]);
  const [endedLeft, setEndedLeft] = useState(false);
  const [endedRight, setEndedRight] = useState(false);
  const leftVideoRef = useRef(null);
  const rightVideoRef = useRef(null);
  const pairCount = uploadConfig?.count || 5;

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        await loadVideoIndex();
        const count = getVideoCount();
        if (count === 0) {
          setLoadError('No videos found in Supabase. Make sure you have a public "videos" bucket with sub-folders containing .mp4 files.');
        } else {
          const batch = getVideoPairwiseBatch(pairCount);
          if (batch.length === 0) {
            setLoadError("Videos found but no pairwise comparisons possible. Ensure the same filename exists in at least 2 folders.");
          } else if (!cancelled) {
            setPairs(batch);
          }
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [pairCount]);

  // Loading / error states
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress size={48} />
        <Typography sx={{ mt: 2 }}>Loading videos from Supabase…</Typography>
      </Container>
    );
  }

  if (loadError) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>Video Loading Error:</strong> {loadError}
        </Alert>
        <Button variant="outlined" onClick={() => navigate("/")}>Back to Home</Button>
      </Container>
    );
  }

  const renderMedia = (pair, side, selected, onSelect) => (
    <VideoCard
      src={pair[side].src}
      selected={selected}
      onSelect={onSelect}
      label={side === "left" ? "A" : "B"}
      videoRef={side === "left" ? leftVideoRef : rightVideoRef}
      onEnded={() => {
        if (side === "left") setEndedLeft(true);
        else setEndedRight(true);
      }}
      onPlay={() => {
        // Pause the other video when this one starts playing
        const other = side === "left" ? rightVideoRef : leftVideoRef;
        if (other.current && !other.current.paused) {
          other.current.pause();
        }
      }}
    />
  );

  const headerContent = (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1 }}>
      <VideocamIcon color="error" />
    </Box>
  );

  return (
    <PairwiseFlow
      pairs={pairs}
      renderMedia={renderMedia}
      onSubmit={(username, choices, meta) => addVideoPairwiseSession(username, choices, meta)}
      mode="video_pairwise"
      title="Video Pairwise Rating"
      headerContent={headerContent}
      canProceed={endedLeft && endedRight}
      onPairChange={() => { setEndedLeft(false); setEndedRight(false); }}
    />
  );
}