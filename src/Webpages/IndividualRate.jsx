import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useResults } from "../Results";
import { Typography, Container, TextField, Button, Slider, Card, CardContent, CardMedia, Paper, Box } from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import ProgressIndicator from "../components/ProgressIndicator";
import useKeyboardShortcuts from "../components/useKeyboardShortcuts";
import CompletionSummary from "../components/CompletionSummary";

const BENCHMARK_IMAGE = { id: 0, src: "/src/images/flux/generated_0182.png", alt: "Benchmark Calibration" };
const IMAGES_TO_RATE = [
  { id: 1, src: "/src/images/FluxFlag.png", alt: "Flux2" },
  { id: 2, src: "/src/images/FluxMoonFlags.png", alt: "GPT-15" },
  { id: 3, src: "/src/images/FluxShip.png", alt: "GPT5.2_diff" },
  { id: 4, src: "/src/images/flux/generated_0184.png", alt: "GPT5.2" },
  { id: 5, src: "/src/images/flux/generated_0183.png", alt: "Nano" },
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
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const [history, setHistory] = useState([]);

  const startTimer = () => { setStartTime(performance.now()); setInteractionCount(0); };
  const handleStart = () => {
    setActiveStep(1);
    startTimer();
    setSessionStartTime(performance.now());
  };

  const handleNext = (isBenchmark = false) => {
    const timeSpent = (performance.now() - startTime) / 1000;
    const img = isBenchmark ? BENCHMARK_IMAGE : IMAGES_TO_RATE[currentImageIndex];
    const newScore = { imageId: img.id, imageName: img.alt, score: currentRating, timeSpent: timeSpent.toFixed(2), interactionCount };
    const updatedScores = [...scores, newScore];

    // Save current state to history before advancing
    setHistory(prev => [...prev, {
      activeStep,
      currentImageIndex,
      currentRating,
      scores,
      interactionCount,
    }]);

    setScores(updatedScores);
    setCurrentRating(3);

    if (isBenchmark) { setActiveStep(2); }
    else if (currentImageIndex < IMAGES_TO_RATE.length - 1) { setCurrentImageIndex(currentImageIndex + 1); }
    else { addIndividualSession(username, updatedScores); setActiveStep(3); }
    startTimer();
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setActiveStep(lastState.activeStep);
    setCurrentImageIndex(lastState.currentImageIndex);
    setCurrentRating(lastState.currentRating);
    setScores(lastState.scores);
    setInteractionCount(lastState.interactionCount);
    setHistory(prev => prev.slice(0, -1));
    startTimer();
  };

  const canUndo = history.length > 0 && activeStep !== 3;
  const isRating = activeStep === 1 || activeStep === 2;
  const canNext = isRating;

  useKeyboardShortcuts({
    onRatingChange: isRating ? (value) => setCurrentRating(value) : null,
    onNext: canNext ? () => handleNext(activeStep === 1) : null,
    onUndo: canUndo ? handleUndo : null,
    enabled: activeStep !== 0 && activeStep !== 3,
  });

  // Calculate stats for completion summary
  const stats = useMemo(() => {
    if (activeStep !== 3) return null;
    const imageScores = scores.filter(s => s.imageId !== 0);
    const avgScore = imageScores.length > 0
      ? imageScores.reduce((sum, s) => sum + s.score, 0) / imageScores.length
      : 0;
    const totalTime = sessionStartTime ? (performance.now() - sessionStartTime) / 1000 : 0;
    return { itemsRated: imageScores.length, averageScore: avgScore, totalTime };
  }, [activeStep, scores, sessionStartTime]);

  // Calculate progress (benchmark + images)
  const totalSteps = IMAGES_TO_RATE.length + 1; // +1 for benchmark
  const currentProgress = activeStep === 1 ? 1 : (activeStep === 2 ? currentImageIndex + 2 : totalSteps + 1);

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      {isRating && (
        <ProgressIndicator
          current={currentProgress - 1}
          total={totalSteps}
          label="Image"
        />
      )}

      {activeStep === 0 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>Individual Evaluation</Typography>
          <TextField fullWidth label="User ID" value={username} onChange={(e) => setUsername(e.target.value)} sx={{ mb: 3 }} />
          <Button variant="contained" onClick={handleStart} disabled={!username}>Start</Button>
        </Paper>
      )}

      {isRating && (
        <Box sx={{ mt: 4 }}>
          <Card>
            <Typography variant="h6" sx={{ p: 2, textAlign: "center", bgcolor: "#fff3e0" }}>
               {activeStep === 1 ? "Benchmark" : `Image ${currentImageIndex + 1} of ${IMAGES_TO_RATE.length}`}: Rate 1-5
            </Typography>
            <CardMedia component="img" image={activeStep === 1 ? BENCHMARK_IMAGE.src : IMAGES_TO_RATE[currentImageIndex].src} sx={{objectFit: "contain", height: "auto"}}/>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography>Rating: {currentRating}</Typography>
              <Slider value={currentRating} onChange={(e, v) => { setCurrentRating(v); setInteractionCount(prev => prev + 1); }} step={1} marks min={1} max={5} />
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<UndoIcon />}
                  onClick={handleUndo}
                  disabled={!canUndo}
                  sx={{ flex: 1 }}
                >
                  Undo
                </Button>
                <Button variant="contained" onClick={() => handleNext(activeStep === 1)} sx={{ flex: 2 }}>
                  {activeStep === 2 && currentImageIndex === IMAGES_TO_RATE.length - 1 ? "Finish" : "Next"}
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                Keyboard: 1-5 to rate | Enter to next | Backspace to undo
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {activeStep === 3 && stats && (
        <CompletionSummary
          itemsRated={stats.itemsRated}
          averageScore={stats.averageScore}
          totalTime={stats.totalTime}
          resultPath="/individual-result"
          ratePath="/individual-rate"
        />
      )}
    </Container>
  );
}
