import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useResults } from "../Results";
import {
  Container, Typography, Box, Button, Card, CardMedia, CardActionArea,
} from "@mui/material";
import UsernameEntry from "../components/UsernameEntry";
import ProgressBar from "../components/ProgressBar";
import ModeInstructionScreen from "../components/ModeInstructionScreen";
import { getPairwiseBatch } from "../utils/ImageLoader";
import { preloadImages } from "../utils/preloadImages";

export default function PairwiseRate() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig || null;

  const { addPairwiseSession, setActivePrompt } = useResults();

  const [pairs, setPairs] = useState([]);
  const [step, setStep] = useState(uploadConfig ? 1 : 0);
  const [username, setUsername] = useState(uploadConfig?.username || "");
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [selectedSide, setSelectedSide] = useState(null);
  const [choices, setChoices] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  const pairCount = uploadConfig?.count || 5;
  const configPrompt = uploadConfig?.prompt || null;

  useEffect(() => {
    const batch = getPairwiseBatch(pairCount);
    setPairs(batch);
    preloadImages(batch.flatMap((p) => [p.left.src, p.right.src]));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setActivePrompt(null);
    };
  }, [setActivePrompt]);

  // Update activePrompt on pair change
  useEffect(() => {
    if (isFinished || pairs.length === 0 || step !== 2) {
      setActivePrompt(null);
      return;
    }
    const prompt = configPrompt || pairs[currentPairIndex].prompt;
    setActivePrompt(prompt);
  }, [step, currentPairIndex, pairs, configPrompt, isFinished, setActivePrompt]);

  const handleNext = () => {
    const currentPair = pairs[currentPairIndex];
    const choiceData = {
      pairId: currentPairIndex + 1,
      prompt: configPrompt || currentPair.prompt,
      winnerSide: selectedSide,
      winnerName: selectedSide === "left" ? currentPair.left.filename : currentPair.right.filename,
      loserName: selectedSide === "left" ? currentPair.right.filename : currentPair.left.filename,
    };

    const newChoices = [...choices, choiceData];
    setChoices(newChoices);
    setSelectedSide(null);

    if (currentPairIndex < pairs.length - 1) {
      setCurrentPairIndex(currentPairIndex + 1);
    } else {
      setIsFinished(true);
      window.speechSynthesis.cancel();
      addPairwiseSession(username, newChoices);
      navigate("/mode-results");
    }
  };

  if (pairs.length === 0) return null;

  const handleBack = () => {
    if (currentPairIndex === 0) return;
    setChoices((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setSelectedSide(last.winnerSide || null);
      return prev.slice(0, -1);
    });
    setCurrentPairIndex((idx) => Math.max(0, idx - 1));
  };

  const currentPair = pairs[currentPairIndex];
  const globalPrompt = configPrompt || "Select the better image";
  const imagePrompt = currentPair?.prompt || "";

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      {/* Step 0: Username */}
      {step === 0 && (
        <UsernameEntry
          title="Pairwise Image Rating"
          username={username}
          setUsername={setUsername}
          onStart={() => setStep(1)}
          validationRegex={/^\d+$/}
        />
      )}

      {/* Step 1: Instructions */}
      {step === 1 && (
        <ModeInstructionScreen
          mode="pairwise"
          prompt={configPrompt || "Per-pair prompts will be shown"}
          onNext={() => setStep(2)}
        />
      )}

      {/* Step 2: Pairs */}
      {step === 2 && (
        <>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={currentPairIndex === 0}
            sx={{ mb: 2 }}
          >
            Back
          </Button>
          <ProgressBar
            current={currentPairIndex}
            total={pairs.length}
            label={`Pair ${currentPairIndex + 1} of ${pairs.length}`}
          />

          <Typography variant="h5" align="center" gutterBottom>
            Pair {currentPairIndex + 1} of {pairs.length}
          </Typography>
          
          {/* Global Prompt */}
          {configPrompt && (
            <Typography
              align="center"
              sx={{ mb: 1, fontStyle: "italic", color: "text.secondary" }}
            >
              Task: "{globalPrompt}"
            </Typography>
          )}
          
          {/* Image-specific Prompt */}
          <Typography
            align="center"
            sx={{ mb: 2, color: "primary.main", fontWeight: "medium" }}
          >
            "{imagePrompt}"
          </Typography>

          <Box
            sx={{
              mt: 2,
              display: "grid",
              justifyContent: "center",
              height: "65vh",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 3,
            }}
          >
            <Card
              sx={{
                border: selectedSide === "left" ? "4px solid #1976d2" : "none",
                transition: "0.2s",
              }}
            >
              <CardActionArea onClick={() => setSelectedSide("left")}>
                <CardMedia
                  component="img"
                  image={currentPair.left.src}
                  sx={{ objectFit: "contain", height: "55vh" }}
                />
              </CardActionArea>
            </Card>
            <Card
              sx={{
                border: selectedSide === "right" ? "4px solid #1976d2" : "none",
                transition: "0.2s",
              }}
            >
              <CardActionArea onClick={() => setSelectedSide("right")}>
                <CardMedia
                  component="img"
                  image={currentPair.right.src}
                  sx={{ objectFit: "contain", height: "55vh" }}
                />
              </CardActionArea>
            </Card>
          </Box>

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Button
              variant="contained"
              size="large"
              disabled={!selectedSide}
              onClick={handleNext}
            >
              {currentPairIndex === pairs.length - 1 ? "Submit All" : "Next Pair"}
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}