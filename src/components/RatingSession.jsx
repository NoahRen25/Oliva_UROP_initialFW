import { useState } from "react";
import { Button } from "@mui/material";
import ImageGrid from "./ImageGrid";
import { useResults } from "../Results";
import { useNavigate } from "react-router-dom";

export default function RatingSession({
  images,
  gridProps,
}) {
  const [ratings, setRatings] = useState({});
  const [sliderMoves, setSliderMoves] = useState({});
  const [startTime] = useState(performance.now());
  const { addGroupSession } = useResults();
  const navigate = useNavigate();

  const trackMove = (id) => {
    setSliderMoves((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleSubmit = () => {
    const totalTime = (performance.now() - startTime) / 1000;

    const results = images.map((img) => ({
      imageId: img.id,
      score: ratings[img.id],
      memorability: img.score,
      timeSpent: (totalTime / images.length).toFixed(2),
    }));

    addGroupSession("anonymous", results);
    navigate("/group-result");
  };

  return (
    <>
      <ImageGrid
        images={images}
        ratings={ratings}
        setRatings={setRatings}
        trackMove={trackMove}
        {...gridProps}
      />

      <Button
        sx={{ mt: 4 }}
        variant="contained"
        fullWidth
        onClick={handleSubmit}
      >
        Submit
      </Button>
    </>
  );
}