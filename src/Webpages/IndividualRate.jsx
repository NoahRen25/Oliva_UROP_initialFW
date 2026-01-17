import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useResults } from "../Results";
import { Typography, Container, TextField, Button, Slider, Card, CardContent, CardMedia, Paper } from "@mui/material";

const BENCHMARK_IMAGE = { id: 0, src: "/src/images/GPTShip.png", alt: "Benchmark Calibration" };
const IMAGES_TO_RATE = [
  { id: 1, src: "/src/images/Flux2.png", alt: "Flux2" },
  { id: 2, src: "/src/images/GPT-Image15.png", alt: "GPT-15" },
  { id: 3, src: "/src/images/GPT5.2_diff_viewpoint.png", alt: "GPT5.2_diff" },
  { id: 4, src: "/src/images/GPT5.2.png", alt: "GPT5.2" },
  { id: 5, src: "/src/images/NanoBananaPro.png", alt: "Nano" },
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

  const startTimer = () => { setStartTime(performance.now()); setInteractionCount(0); };
  const handleStart = () => { setActiveStep(1); startTimer(); };

  const handleNext = (isBenchmark = false) => {
    const timeSpent = (performance.now() - startTime) / 1000;
    const img = isBenchmark ? BENCHMARK_IMAGE : IMAGES_TO_RATE[currentImageIndex];
    const newScore = { imageId: img.id, imageName: img.alt, score: currentRating, timeSpent: timeSpent.toFixed(2), interactionCount };
    const updatedScores = [...scores, newScore];
    setScores(updatedScores);
    setCurrentRating(3);
    
    if (isBenchmark) { setActiveStep(2); } 
    else if (currentImageIndex < IMAGES_TO_RATE.length - 1) { setCurrentImageIndex(currentImageIndex + 1); } 
    else { addIndividualSession(username, updatedScores); setActiveStep(3); }
    startTimer();
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      {activeStep === 0 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>Individual Evaluation</Typography>
          <TextField fullWidth label="User ID" value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mb: 3 }} />
          <Button variant="contained" onClick={handleStart} disabled={!username}>Start</Button>
        </Paper>
      )}
      {(activeStep === 1 || activeStep === 2) && (
        <Card>
          <Typography variant="h6" sx={{ p: 2, textAlign: "center", bgcolor: "#fff3e0" }}>
             {activeStep === 1 ? "Benchmark" : `Image ${currentImageIndex + 1}/${IMAGES_TO_RATE.length}`}: Rate 1-5
          </Typography>
          <CardMedia component="img" height="300" image={activeStep === 1 ? BENCHMARK_IMAGE.src : IMAGES_TO_RATE[currentImageIndex].src} />
          <CardContent sx={{ textAlign: "center" }}>
            <Typography>Rating: {currentRating}</Typography>
            <Slider value={currentRating} onChange={(e, v) => { setCurrentRating(v); setInteractionCount(prev => prev + 1); }} step={1} marks min={1} max={5} />
            <Button variant="contained" fullWidth onClick={() => handleNext(activeStep === 1)}>
              {activeStep === 2 && currentImageIndex === 4 ? "Finish" : "Next"}
            </Button>
          </CardContent>
        </Card>
      )}
      {activeStep === 3 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5">Success!</Typography>
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate("/individual-result")}>View Results</Button>
        </Paper>
      )}
    </Container>
  );
}