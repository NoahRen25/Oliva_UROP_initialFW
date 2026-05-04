import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useResults } from "../Results";
import {
  Typography, Container, Button, Card, CardContent, Paper, Box
} from "@mui/material";
import ScoreSlider from "../components/ScoreSlider";
import UsernameEntry from "../components/UsernameEntry";
import ProgressBar from "../components/ProgressBar";
import ModeInstructionScreen from "../components/ModeInstructionScreen";
import PromptDisplay from "../components/PromptDisplay";
import { getIndividualBatch } from "../utils/ImageLoader";
import SpeedWarning from "../components/SpeedWarning";
import { preloadImages } from "../utils/preloadImages";
import collectPageTranscripts from "../utils/collectPageTranscripts";
import GazeTrackingProvider, { useGazeTracking, useGazePage } from "../components/GazeTrackingProvider";
import GazeTrackedImage from "../components/GazeTrackedImage";
import { nextGuidedNavigation } from "../utils/guidedFlow";
import CalibrationGate from "../components/CalibrationGate";
import GuidedProgress from "../components/GuidedProgress";
import { saveGazeSession } from "../utils/gazeStorage";
import useAutoVoiceRecording from "../hooks/useAutoVoiceRecording";


function IndividualRateInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig || null;

  const {
    addIndividualSession, checkEngagement, setShowSpeedWarning,
    resetEngagement, setActivePrompt, setCurrentRatingPage,
  } = useResults();
  const { startSession, getGazeData, tagImageOnPage } = useGazeTracking();

  // step 0 = username (skipped in guided), 1 = instructions, 2 = rating, 3 = done
  const [activeStep, setActiveStep] = useState(uploadConfig ? 1 : 0);
  const [username, setUsername] = useState(uploadConfig?.username || "");
  const [imagesToRate, setImagesToRate] = useState([]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentRating, setCurrentRating] = useState(3);
  const [scores, setScores] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const imageCount = uploadConfig?.count || 10;
  const configPrompt = uploadConfig?.prompt || null;

  useEffect(() => {
    const batch = getIndividualBatch(imageCount);
    setImagesToRate(batch);
    preloadImages(batch.map((img) => img.src));
    resetEngagement();
  }, []);

  // Cleanup activePrompt and currentRatingPage on unmount
  useEffect(() => {
    return () => {
      setActivePrompt(null);
      setCurrentRatingPage(null);
    };
  }, [setActivePrompt, setCurrentRatingPage]);

  useAutoVoiceRecording(activeStep === 2);

  const startTimer = () => {
    setStartTime(performance.now());
    setInteractionCount(0);
  };

  const totalImages = imageCount;
  const progressValue = activeStep === 2 ? currentImageIndex + 1 : 0;

  // Update activePrompt on image change
  useEffect(() => {
    if (activeStep === 2 && imagesToRate[currentImageIndex]) {
      const img = imagesToRate[currentImageIndex];
      setActivePrompt(configPrompt || img.prompt);
      setCurrentRatingPage(currentImageIndex + 1);
    } else {
      setActivePrompt(null);
    }
  }, [activeStep, currentImageIndex, imagesToRate, configPrompt, setActivePrompt, setCurrentRatingPage]);

  const handleNext = () => {
    if (isLocked) return;

    const timeSpent = (performance.now() - startTime) / 1000;
    const img = imagesToRate[currentImageIndex];

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

    const stepIndex = currentImageIndex + 1;
    const currentTimes = updatedScores.map((s) => s.timeSpent);
    const isSafeToProceed = checkEngagement(currentTimes, stepIndex);

    if (!isSafeToProceed) {
      setIsLocked(true);
      setTimeout(() => { setIsLocked(false); setShowSpeedWarning(false); }, 2000);
      return;
    }

    if (currentImageIndex < imagesToRate.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      const { transcripts: pageTranscripts, audioUrls: pageAudioUrls } = collectPageTranscripts();
      addIndividualSession(username, updatedScores, { pageTranscripts, pageAudioUrls });
      saveGazeSession(Date.now().toString(), "individual", username, getGazeData());
      if (uploadConfig?.guided) {
        const next = nextGuidedNavigation(uploadConfig);
        navigate(next.route, {
          state: next.uploadConfig ? { uploadConfig: next.uploadConfig } : undefined,
        });
        return;
      }
      setActiveStep(3);
    }
    startTimer();
  };

  const incrementMoves = () => setInteractionCount((prev) => prev + 1);

  const currentImg = imagesToRate[currentImageIndex] || null;
  const pageKey =
    activeStep === 2 && currentImg ? `image-${currentImageIndex + 1}` : null;
  useGazePage(pageKey, "individual-1");

  useEffect(() => {
    if (activeStep === 2 && currentImg) {
      tagImageOnPage(currentImg.id, currentImg.filename || currentImg.alt);
    }
  }, [activeStep, currentImg, tagImageOnPage]);

  if (imagesToRate.length === 0) return null;
  const globalPrompt = configPrompt || "Rate this image";
  const imagePrompt = currentImg ? currentImg.prompt : "";

  const handleBack = () => {
    if (activeStep !== 2 || currentImageIndex === 0) return;
    setScores((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setCurrentRating(last.score ?? 3);
      return prev.slice(0, -1);
    });
    setCurrentImageIndex((idx) => Math.max(0, idx - 1));
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
          onNext={() => { setActiveStep(2); startTimer(); startSession(); }}
        />
      )}

      {/* Step 2: Rating */}
      {activeStep === 2 && currentImg && (
        <>
          {currentImageIndex > 0 && (
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
                {`Image ${currentImageIndex + 1} of ${imagesToRate.length}`}
              </Typography>
              <PromptDisplay
                globalPrompt={configPrompt ? globalPrompt : null}
                itemPrompt={imagePrompt}
              />
            </Box>
            <GazeTrackedImage
              imageId={currentImg.id}
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
                onClick={handleNext}
                sx={{
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(0,0,0,0.12)",
                    color: "rgba(0,0,0,0.26)",
                  },
                }}
              >
                {isLocked
                  ? "Please Slow Down..."
                  : currentImageIndex === imagesToRate.length - 1
                  ? "Finish"
                  : "Next"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Step 3: Done */}
      {activeStep === 3 && (
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

export default function IndividualRate() {
  return (
    <>
      <GuidedProgress />
      <CalibrationGate>
        <GazeTrackingProvider>
          <IndividualRateInner />
        </GazeTrackingProvider>
      </CalibrationGate>
    </>
  );
}
