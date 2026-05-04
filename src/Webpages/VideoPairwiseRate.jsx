import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useResults } from "../Results";
import {
  Container, Typography, Box, Button, Alert, CircularProgress,
} from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import PairwiseFlow from "../components/PairwiseFlow";
import VideoCard from "../components/VideoCard";
import useVideoFleet from "../hooks/useVideoFleet";
import { loadVideoIndex, getVideoPairwiseBatch, getVideoCount } from "../utils/VideoLoader";

export default function VideoPairwiseRate() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig || null;
  const { addVideoPairwiseSession } = useResults();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [pairs, setPairs] = useState([]);
  const fleet = useVideoFleet();
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

  const renderMedia = (pair, side, selected, onSelect) => {
    const id = `pair${pair.id}_${side}`;
    return (
      <VideoCard
        videoId={id}
        coordinator={fleet}
        src={pair[side].src}
        selected={selected}
        onSelect={onSelect}
        label={side === "left" ? "A" : "B"}
      />
    );
  };

  const headerContent = (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1 }}>
      <VideocamIcon color="error" />
    </Box>
  );

  // Has the participant watched both halves of the *current* pair?
  const currentPairBothEnded = (pairIndex) => {
    if (pairIndex == null || !pairs[pairIndex]) return false;
    return fleet.allEnded([`pair${pairs[pairIndex].id}_left`, `pair${pairs[pairIndex].id}_right`]);
  };

  return (
    <PairwiseFlow
      pairs={pairs}
      renderMedia={renderMedia}
      onSubmit={(username, choices, meta) => addVideoPairwiseSession(username, choices, meta)}
      mode="video_pairwise"
      title="Video Pairwise Rating"
      headerContent={headerContent}
      canProceedFor={currentPairBothEnded}
      onPairChange={() => fleet.reset()}
    />
  );
}
