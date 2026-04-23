import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useResults } from "../Results";
import { Card, CardActionArea } from "@mui/material";
import PairwiseFlow from "../components/PairwiseFlow";
import { getPairwiseBatch } from "../utils/ImageLoader";
import { preloadImages } from "../utils/preloadImages";
import GazeTrackingProvider, { useGazeTracking } from "../components/GazeTrackingProvider";
import GazeTrackedImage from "../components/GazeTrackedImage";
import CalibrationGate from "../components/CalibrationGate";
import { saveGazeSession } from "../utils/gazeStorage";

function ImageCard({ imageId, src, selected, onSelect }) {
  return (
    <Card
      sx={{
        border: selected ? "4px solid #1976d2" : "none",
        transition: "0.2s",
      }}
    >
      <CardActionArea onClick={onSelect}>
        <GazeTrackedImage
          imageId={imageId}
          component="img"
          image={src}
          sx={{ objectFit: "contain", height: "55vh" }}
        />
      </CardActionArea>
    </Card>
  );
}

function PairwiseRateInner() {
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig || null;
  const { addPairwiseSession } = useResults();
  const { startSession, getGazeData } = useGazeTracking();

  const [pairs, setPairs] = useState([]);
  const pairCount = uploadConfig?.count || 5;

  useEffect(() => {
    const batch = getPairwiseBatch(pairCount);
    setPairs(batch);
    preloadImages(batch.flatMap((p) => [p.left.src, p.right.src]));
    startSession();
  }, [pairCount]);

  const renderMedia = (pair, side, selected, onSelect) => (
    <ImageCard
      imageId={`${pair[side].filename || pair[side].alt}_${side}`}
      src={pair[side].src}
      selected={selected}
      onSelect={onSelect}
    />
  );

  return (
    <PairwiseFlow
      pairs={pairs}
      renderMedia={renderMedia}
      onSubmit={(username, choices, meta) => {
        addPairwiseSession(username, choices, meta);
        saveGazeSession(Date.now().toString(), "pairwise", username, getGazeData());
      }}
      mode="pairwise"
      title="Pairwise Image Rating"
    />
  );
}

export default function PairwiseRate() {
  return (
    <CalibrationGate>
      <GazeTrackingProvider>
        <PairwiseRateInner />
      </GazeTrackingProvider>
    </CalibrationGate>
  );
}