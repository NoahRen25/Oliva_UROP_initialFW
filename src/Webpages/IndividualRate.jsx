import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useResults } from "../Results";
import {
  Typography, Container, Button, Card, CardContent, CardMedia, Paper, Box
} from "@mui/material";
import ScoreSlider from "../components/ScoreSlider";
import UsernameEntry from "../components/UsernameEntry";
import ProgressBar from "../components/ProgressBar";
import ModeInstructionScreen from "../components/ModeInstructionScreen";
import { getIndividualBatch } from "../utils/ImageLoader";
import SpeedWarning from "../components/SpeedWarning";
import { preloadImages } from "../utils/preloadImages";
import usePageTranscription from "../hooks/usePageTranscription";

export default function IndividualRate() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig || null;

  const {
    addIndividualSession, checkEngagement, setShowSpeedWarning,
    resetEngagement, setActivePrompt,
  } = useResults();

  const [activeStep, setActiveStep] = useState(uploadConfig ? 1 : 0);
  const [username, setUsername] = useState(uploadConfig?.username || "");
  const [imagesToRate, setImagesToRate] = useState([]);
  const [benchmarkImage, setBenchmarkImage] = useState(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentRating, setCurrentRating] = useState(3);
  const [scores, setScores] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const { markPage, stopAndCollect } = usePageTranscription();

  const imageCount = uploadConfig?.count || 6;
  const configPrompt = uploadConfig?.prompt || null;

  useEffect(() => {
    const batch = getIndividualBatch(imageCount);
    setBenchmarkImage(batch[0]);
    setImagesToRate(batch.slice(1));
    preloadImages(batch.map((img) => img.src));
    resetEngagement();
  }, []);

  // Cleanup activePrompt on unmount
  useEffect(() => {
    return () => setActivePrompt(null);
  }, [setActivePrompt]);

  const startTimer = () => {
    setStartTime(performance.now());
    setInteractionCount(0);
  };

  const totalImages = imageCount;
  const progressValue =
    activeStep === 2 ? 0 : activeStep === 3 ? currentImageIndex + 1 : totalImages;

  // Update activePrompt on image change
  useEffect(() => {
    if (activeStep === 2 && benchmarkImage) {
      setActivePrompt(configPrompt || benchmarkImage.prompt);
      markPage("benchmark");
    } else if (activeStep === 3 && imagesToRate[currentImageIndex]) {
      const img = imagesToRate[currentImageIndex];
      setActivePrompt(configPrompt || img.prompt);
      markPage(currentImageIndex + 1);
    } else {
      setActivePrompt(null);
    }
  }, [activeStep, currentImageIndex, benchmarkImage, imagesToRate, configPrompt, setActivePrompt, markPage]);

  const handleNext = (isBenchmark = false) => {
    if (isLocked) return;

    const timeSpent = (performance.now() - startTime) / 1000;
    const img = isBenchmark ? benchmarkImage : imagesToRate[currentImageIndex];

    const newScore = {
      imageId: img.id,
      imageName: img.filename,
      prompt: configPrompt || img.prompt,
      score: currentRating,
      timeSpent: Number(timeSpent.toFixed(2)),
      interactionCount,
    };

    const updatedScores = [...scores, newScore];
    setScores(updatedScores);
    setCurrentRating(3);

    const stepIndex = isBenchmark ? 0 : currentImageIndex + 1;
    const currentTimes = updatedScores.map((s) => s.timeSpent);
    const isSafeToProceed = checkEngagement(currentTimes, stepIndex);

    if (!isSafeToProceed) {
      setIsLocked(true);
      setTimeout(() => { setIsLocked(false); setShowSpeedWarning(false); }, 2000);
      return;
    }

    if (isBenchmark) {
      setActiveStep(3);
    } else if (currentImageIndex < imagesToRate.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      const pageTranscripts = stopAndCollect();
      addIndividualSession(username, updatedScores, { pageTranscripts });
      setActiveStep(4);
    }
    startTimer();
  };

  const incrementMoves = () => setInteractionCount((prev) => prev + 1);

  if (!benchmarkImage || imagesToRate.length === 0) return null;

  const currentImg = activeStep === 2 ? benchmarkImage : imagesToRate[currentImageIndex];
  const globalPrompt = configPrompt || "Rate this image";
  const imagePrompt = currentImg ? currentImg.prompt : "";

  const handleBack = () => {
    if (activeStep !== 3) return;
    setScores((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setCurrentRating(last.score ?? 3);
      return prev.slice(0, -1);
    });
    if (currentImageIndex > 0) {
      setCurrentImageIndex((idx) => Math.max(0, idx - 1));
    } else {
      setActiveStep(2);
    }
    setInteractionCount(0);
    startTimer();
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      {/* Step 0: Username */}
      {activeStep === 0 && (
        <UsernameEntry
          title="Individual Image Rating"
          username={username}
          setUsername={setUsername}
          onStart={() => setActiveStep(1)}
        />
      )}

      {/* Step 1: Instructions */}
      {activeStep === 1 && (
        <ModeInstructionScreen
          mode="individual"
          prompt={configPrompt || "Per-image prompts will be shown"}
          onNext={() => { setActiveStep(2); startTimer(); }}
        />
      )}

      {/* Step 2 & 3: Benchmark & Rating */}
      {(activeStep === 2 || activeStep === 3) && (
        <>
          {activeStep === 3 && (
            <Button variant="outlined" onClick={handleBack} sx={{ mb: 2 }}>
              Back
            </Button>
          )}
          <SpeedWarning />
          <ProgressBar
            current={progressValue}
            total={totalImages}
            label={`Progress: ${progressValue} / ${totalImages}`}
          />
          <Card>
            <Box sx={{ p: 2, bgcolor: "#fff3e0", textAlign: "center" }}>
              <Typography variant="h6">
                {activeStep === 2
                  ? "Benchmark"
                  : `Image ${currentImageIndex + 1} of ${imagesToRate.length}`}
              </Typography>
              {/* Global Prompt */}
              {configPrompt && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1, fontStyle: "italic" }}
                >
                  Task: "{globalPrompt}"
                </Typography>
              )}
              {/* Image-specific Prompt */}
              <Typography
                variant="body1"
                color="primary.main"
                sx={{ mt: 1, fontWeight: "medium" }}
              >
                "{imagePrompt}"
              </Typography>
            </Box>
            <CardMedia
              component="img"
              image={currentImg.src}
              sx={{ objectFit: "contain", height: "auto", maxHeight: "60vh" }}
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
                disabled={isLocked}
                onClick={() => handleNext(activeStep === 2)}
                sx={{
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(0,0,0,0.12)",
                    color: "rgba(0,0,0,0.26)",
                  },
                }}
              >
                {isLocked
                  ? "Please Slow Down..."
                  : activeStep === 3 &&
                    currentImageIndex === imagesToRate.length - 1
                  ? "Finish"
                  : "Next"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Step 4: Done */}
      {activeStep === 4 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5">Success!</Typography>
          <Button
            sx={{ mt: 2 }}
            variant="contained"
            onClick={() => navigate("/mode-results")}
          >
            View Results
          </Button>
        </Paper>
      )}
    </Container>
  );
}