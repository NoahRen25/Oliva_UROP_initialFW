import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useResults } from "../Results";
import {
  Typography,
  Container,
  TextField,
  Button,
  Slider,
  Card,
  CardContent,
  CardMedia,
  Paper,
} from "@mui/material";
import ScoreSlider from "../components/ScoreSlider";
import UsernameEntry from "../components/UsernameEntry";
import ProgressBar from "../components/ProgressBar";

const BENCHMARK_IMAGE = {
  id: 0,
  src: "/src/images/flux/generated_0182.png",
  alt: "Benchmark Calibration",
};
const IMAGES_TO_RATE = [
  { id: 1, src: "/src/images/FluxFlag.png", alt: "Flux_0187" },
  { id: 2, src: "/src/images/FluxMoonFlags.png", alt: "Flux_0186" },
  { id: 3, src: "/src/images/FluxShip.png", alt: "Flux_0185" },
  { id: 4, src: "/src/images/flux/generated_0184.png", alt: "Flux_0184" },
  { id: 5, src: "/src/images/flux/generated_0183.png", alt: "Flux_0183" },
];

export default function IndividualRate() {
  const navigate = useNavigate();
  const { addIndividualSession } = useResults();
  const [activeStep, setActiveStep] = useState(0);
  const [username, setUsername] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentRating, setCurrentRating] = useState(3);
  const [scores, setScores] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [interactionCount, setInteractionCount] = useState(0);

  const startTimer = () => {
    setStartTime(performance.now());
    setInteractionCount(0);
  };
  const handleStart = () => {
    setActiveStep(1);
    startTimer();
  };
  const totalImages = IMAGES_TO_RATE.length + 1; //+1 is bc of benchmark
  const progressValue =
    activeStep === 1
      ? 0
      : activeStep === 2
      ? currentImageIndex + 1
      : totalImages;
  const handleNext = (isBenchmark = false) => {
    const timeSpent = (performance.now() - startTime) / 1000;
    const img = isBenchmark
      ? BENCHMARK_IMAGE
      : IMAGES_TO_RATE[currentImageIndex];
    const newScore = {
      imageId: img.id,
      imageName: img.alt,
      score: currentRating,
      timeSpent: timeSpent.toFixed(2),
      interactionCount,
    };
    const updatedScores = [...scores, newScore];
    setScores(updatedScores);
    setCurrentRating(3);

    if (isBenchmark) {
      setActiveStep(2);
    } else if (currentImageIndex < IMAGES_TO_RATE.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      addIndividualSession(username, updatedScores);
      setActiveStep(3);
    }
    startTimer();
  };
  const incrementMoves = () => setInteractionCount((prev) => prev + 1);
  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      {activeStep > 0 && activeStep < 3 && (
        <ProgressBar
          current={progressValue}
          total={totalImages}
          label={`Progress: ${progressValue} / ${totalImages}`}
        />
      )}
      {activeStep === 0 && (
        <UsernameEntry
          title="Individual Image Rating"
          username={username}
          setUsername={setUsername}
          onStart={handleStart}
        />
      )}
      {(activeStep === 1 || activeStep === 2) && (
        <Card>
          <Typography
            variant="h6"
            sx={{ p: 2, textAlign: "center", bgcolor: "#fff3e0" }}
          >
            {activeStep === 1
              ? "Benchmark"
              : `Image ${currentImageIndex + 1} of ${IMAGES_TO_RATE.length}`}
            : Rate 1-5
          </Typography>
          <CardMedia
            component="img"
            image={
              activeStep === 1
                ? BENCHMARK_IMAGE.src
                : IMAGES_TO_RATE[currentImageIndex].src
            }
            sx={{ objectFit: "contain", height: "auto" }}
          />
          <CardContent sx={{ textAlign: "center" }}>
            <Typography>Rating: {currentRating}</Typography>
            <ScoreSlider
              value={currentRating}
              setValue={setCurrentRating}
              onInteraction={incrementMoves}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleNext(activeStep === 1)}
            >
              {activeStep === 2 && currentImageIndex === 4 ? "Finish" : "Next"}
            </Button>
          </CardContent>
        </Card>
      )}
      {activeStep === 3 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5">Success!</Typography>
          <Button
            sx={{ mt: 2 }}
            variant="contained"
            onClick={() => navigate("/individual-result")}
          >
            View Results
          </Button>
        </Paper>
      )}
    </Container>
  );
}
