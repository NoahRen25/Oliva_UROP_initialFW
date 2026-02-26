import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useResults } from "../Results";
import { Card, CardMedia, CardActionArea } from "@mui/material";
import PairwiseFlow from "../components/PairwiseFlow";
import { getPairwiseBatch } from "../utils/ImageLoader";
import { preloadImages } from "../utils/preloadImages";

function ImageCard({ src, selected, onSelect }) {
  return (
    <Card
      sx={{
        border: selected ? "4px solid #1976d2" : "none",
        transition: "0.2s",
      }}
    >
      <CardActionArea onClick={onSelect}>
        <CardMedia
          component="img"
          image={src}
          sx={{ objectFit: "contain", height: "55vh" }}
        />
      </CardActionArea>
    </Card>
  );
}

export default function PairwiseRate() {
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig || null;
  const { addPairwiseSession } = useResults();

  const [pairs, setPairs] = useState([]);
  const pairCount = uploadConfig?.count || 5;

  useEffect(() => {
    const batch = getPairwiseBatch(pairCount);
    setPairs(batch);
    preloadImages(batch.flatMap((p) => [p.left.src, p.right.src]));
  }, [pairCount]);

  const renderMedia = (pair, side, selected, onSelect) => (
    <ImageCard
      src={pair[side].src}
      selected={selected}
      onSelect={onSelect}
    />
  );

  return (
    <PairwiseFlow
      pairs={pairs}
      renderMedia={renderMedia}
      onSubmit={(username, choices, meta) => addPairwiseSession(username, choices, meta)}
      mode="pairwise"
      title="Pairwise Image Rating"
    />
  );
}