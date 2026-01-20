import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useResults } from "../Results";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Paper,
  CardActionArea,
} from "@mui/material";

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

  const [step, setStep] = useState(0); // States: Username, rating
  const [username, setUsername] = useState("");
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [selectedSide, setSelectedSide] = useState(null); // 'left' or 'right'
  const [choices, setChoices] = useState([]); // Stores { pairId, winner: 'left'|'right', winnerName }
  const [isFinished, setIsFinished] = useState(false);
  const hasAnnouncedWelcome = useRef(false);

  useEffect(() => {
    if(isFinished) return;
    if (step === 0) {
      if (!hasAnnouncedWelcome.current) {
        announce("Welcome to Pairwise Comparison. Please enter your User ID to begin.");
        hasAnnouncedWelcome.current = true;
      } else {
        hasAnnouncedWelcome.current = false;
      }
    } else if (step === 1) {
      const currentPrompt = PAIRS[currentPairIndex].prompt;
      announce(`Pair ${currentPairIndex + 1}. Which image is better given the prompt: ${currentPrompt}`);
    }
  }, [step, currentPairIndex, announce, isFinished, isAnnouncing]);
  const handleNext = () => {
    const currentPair = PAIRS[currentPairIndex];
    const choiceData = {
      pairId: currentPair.id,
      winnerSide: selectedSide,
      winnerName:
        selectedSide === "left" ? currentPair.left.alt : currentPair.right.alt,
      loserName:
        selectedSide === "left" ? currentPair.right.alt : currentPair.left.alt,
    };

    const newChoices = [...choices, choiceData];
    setChoices(newChoices);
    setSelectedSide(null);

    if (currentPairIndex < PAIRS.length - 1) {
      setCurrentPairIndex(currentPairIndex + 1);
    } else {
    setIsFinished(true); 
    window.speechSynthesis.cancel();
      addPairwiseSession(username, newChoices);
      navigate("/pairwise-result");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
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
            onClick={() => setStep(1)}
            disabled={!/^\d+$/.test(username)}
          >
            Start Comparison
          </Button>
        </Paper>
      ) : (
        <Box>
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
            <Button
              variant="contained"
              size="large"
              disabled={!selectedSide}
              onClick={handleNext}
            >
              {currentPairIndex === PAIRS.length - 1
                ? "Submit All"
                : "Next Pair"}
            </Button>
          </Box>
        </Box>
      )}
    </Container>
  );
}
