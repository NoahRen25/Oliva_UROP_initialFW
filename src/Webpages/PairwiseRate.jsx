import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useResults } from "../Results";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardMedia,
  CardContent,
  Paper,
  CardActionArea,
} from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import ProgressIndicator from "../components/ProgressIndicator";
import useKeyboardShortcuts from "../components/useKeyboardShortcuts";
import CompletionSummary from "../components/CompletionSummary";

const PAIRS = [
  {
    id: 1,
    left: { src: "/src/images/GPTMoonFlags.png", alt: "GPT Moon" },
    right: { src: "/src/images/NanoMoonFlags.png", alt: "Flux Moon" },
    prompt:
      "Surreal image of the United States flag and the flags of the five permanent members of the UN Security Council (China, France, United Kingdom, Russia) planted on the surface of the moon, low gravity environment, Earth visible in the distance, accurate flag representations, dramatic lighting.",
  },
  {
    id: 2,
    left: { src: "/src/images/GPTShip.png", alt: "GPT Ship" },
    right: { src: "/src/images/NanoShip.png", alt: "Flux Ship" },
    prompt:
      "Image of a cargo ship sailing at sea, various nautical flags displayed along with the national flag of Panama, realistic ocean waves, clear sky, accurate flag designs and arrangements, ship details.",
  },
  {
    id: 3,
    left: { src: "/src/images/GPTFlag.png", alt: "GPT Flag" },
    right: { src: "/src/images/NanoFlag.png", alt: "Flux Flag" },
    prompt:
      "Photorealistic image of a row of ten world flags waving in the wind, including the flags of Canada, Japan, Brazil, Germany, India, South Africa, Australia, Russia, and Italy, clear blue sky, accurate flag colors and patterns, 8k.",
  },
];

export default function PairwiseRate() {
  const navigate = useNavigate();
  const { addPairwiseSession, announce, isAnnouncing } = useResults();

  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [selectedSide, setSelectedSide] = useState(null);
  const [choices, setChoices] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [history, setHistory] = useState([]);
  const hasAnnouncedWelcome = useRef(false);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if(isFinished) return;
    if (step === 0) {
      announce("Welcome to Pairwise Comparison. Please enter your User ID to begin.");
    } else if (step === 1) {
      const currentPrompt = PAIRS[currentPairIndex].prompt;
      announce(`Pair ${currentPairIndex + 1}. Which image is better given the prompt: ${currentPrompt}`);
    }
  }, [step, currentPairIndex, announce, isFinished, isAnnouncing]);

  const handleStart = () => {
    setStep(1);
    setSessionStartTime(performance.now());
  };

  const handleNext = () => {
    if (!selectedSide) return;

    const currentPair = PAIRS[currentPairIndex];
    const choiceData = {
      pairId: currentPair.id,
      winnerSide: selectedSide,
      winnerName:
        selectedSide === "left" ? currentPair.left.alt : currentPair.right.alt,
      loserName:
        selectedSide === "left" ? currentPair.right.alt : currentPair.left.alt,
    };

    // Save current state to history
    setHistory(prev => [...prev, {
      currentPairIndex,
      selectedSide,
      choices,
    }]);

    const newChoices = [...choices, choiceData];
    setChoices(newChoices);
    setSelectedSide(null);

    if (currentPairIndex < PAIRS.length - 1) {
      setCurrentPairIndex(currentPairIndex + 1);
    } else {
      setIsFinished(true);
      window.speechSynthesis.cancel();
      addPairwiseSession(username, newChoices);
      setStep(2);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setCurrentPairIndex(lastState.currentPairIndex);
    setSelectedSide(lastState.selectedSide);
    setChoices(lastState.choices);
    setHistory(prev => prev.slice(0, -1));
  };

  const canUndo = history.length > 0 && step === 1;
  const canNext = selectedSide !== null && step === 1;

  useKeyboardShortcuts({
    onSelectLeft: step === 1 ? () => setSelectedSide("left") : null,
    onSelectRight: step === 1 ? () => setSelectedSide("right") : null,
    onNext: canNext ? handleNext : null,
    onUndo: canUndo ? handleUndo : null,
    enabled: step === 1,
  });

  const stats = useMemo(() => {
    if (step !== 2) return null;
    const totalTime = sessionStartTime ? (performance.now() - sessionStartTime) / 1000 : 0;
    return { itemsRated: choices.length, totalTime };
  }, [step, choices, sessionStartTime]);

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      {step === 1 && (
        <ProgressIndicator
          current={currentPairIndex + 1}
          total={PAIRS.length}
          label="Pair"
        />
      )}

      {step === 0 ? (
        <Paper sx={{ p: 4, maxWidth: 500, mx: "auto", textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            Pairwise Comparison
          </Typography>
          <TextField
            label="User ID (Numeric)"
            fullWidth
            sx={{ mb: 3 }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleStart}
            disabled={!/^\d+$/.test(username)}
          >
            Start Comparison
          </Button>
        </Paper>
      ) : step === 1 ? (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" align="center" gutterBottom>
            Pair {currentPairIndex + 1} of {PAIRS.length}: Which image is better
            given the prompt:
          </Typography>
          <Typography align="center">
            {PAIRS[currentPairIndex].prompt}
          </Typography>
          <Box
            sx={{
              mt: 2,
              display: "grid",
              justifyContent: "center",
              height: "65vh",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(2, 1fr)",
                lg: "repeat(2, 1fr)",
                xl: "repeat(2, 1fr)",
              },
              gap: 3,
            }}
          >
            {/* LEFT IMAGE */}
            <Card
              sx={{
                border:
                  selectedSide === "left" ? "4px solid #1976d2" : "none",
                transform: selectedSide === "left" ? "scale(1)" : "scale(1)",
                transition: "0.2s",
              }}
            >
              <CardActionArea onClick={() => setSelectedSide("left")}>
                <CardMedia
                  component="img"
                  image={PAIRS[currentPairIndex].left.src}
                  sx={{objectFit: "contain", height: "55vh"}}
                />
                <CardContent>
                  <Typography align="center">
                    {PAIRS[currentPairIndex].left.alt}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>

            {/* RIGHT IMAGE */}
            <Card
              sx={{
                border:
                  selectedSide === "right" ? "4px solid #1976d2" : "none",
                transform: selectedSide === "right" ? "scale(1)" : "scale(1)",
                transition: "0.2s",
              }}
            >
              <CardActionArea onClick={() => setSelectedSide("right")}>
                <CardMedia
                  component="img"
                  image={PAIRS[currentPairIndex].right.src}
                  sx={{objectFit: "contain", padding: 0, margin: 0, height: "55vh"}}
                />
                <CardContent>
                  <Typography align="center">
                    {PAIRS[currentPairIndex].right.alt}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", maxWidth: 400, mx: "auto" }}>
              <Button
                variant="outlined"
                startIcon={<UndoIcon />}
                onClick={handleUndo}
                disabled={!canUndo}
                sx={{ flex: 1 }}
              >
                Undo
              </Button>
              <Button
                variant="contained"
                size="large"
                disabled={!selectedSide}
                onClick={handleNext}
                sx={{ flex: 2 }}
              >
                {currentPairIndex === PAIRS.length - 1
                  ? "Submit All"
                  : "Next Pair"}
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
              Keyboard: Arrow Left/Right to select | Enter to next | Backspace to undo
            </Typography>
          </Box>
        </Box>
      ) : (
        stats && (
          <CompletionSummary
            itemsRated={stats.itemsRated}
            totalTime={stats.totalTime}
            resultPath="/pairwise-result"
            ratePath="/pairwise-rate"
          />
        )
      )}
    </Container>
  );
}
