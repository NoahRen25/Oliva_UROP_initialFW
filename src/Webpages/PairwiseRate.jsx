import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useResults } from "../Results";
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
} from "@mui/material";
import UsernameEntry from "../components/UsernameEntry";
import ProgressBar from "../components/ProgressBar";
import { getPairwiseBatch } from "../utils/ImageLoader";

export default function PairwiseRate() {
  const navigate = useNavigate();
  const { addPairwiseSession, announce, isAnnouncing } = useResults();

  const [pairs, setPairs] = useState([]);
  const [step, setStep] = useState(0); 
  const [username, setUsername] = useState("");
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [selectedSide, setSelectedSide] = useState(null); 
  const [choices, setChoices] = useState([]); 
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    setPairs(getPairwiseBatch(5));
  }, []);

  useEffect(() => {
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    if (isFinished || pairs.length === 0) return;
    if (step === 0) {
      announce("Welcome to Pairwise Comparison. Please enter your User ID to begin.");
    } else if (step === 1) {
      const currentPrompt = pairs[currentPairIndex].prompt;
      announce(`Pair ${currentPairIndex + 1}. Which image is better given the prompt: ${currentPrompt}`);
    }
  }, [step, currentPairIndex, announce, isFinished, pairs]);

  const handleNext = () => {
    const currentPair = pairs[currentPairIndex];
    const choiceData = {
      pairId: currentPairIndex + 1,
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
      navigate("/pairwise-result");
    }
  };

  if (pairs.length === 0) return null;

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      {step === 1 && (
        <ProgressBar
          current={currentPairIndex}
          total={pairs.length}
          label={`Pair ${currentPairIndex + 1} of ${pairs.length}`}
        />
      )}
      {step === 0 ? (
        <UsernameEntry
          title="Pairwise Image Rating"
          username={username}
          setUsername={setUsername}
          onStart={() => setStep(1)}
          validationRegex={/^\d+$/}
        />
      ) : (
        <Box>
          <Typography variant="h5" align="center" gutterBottom>
            Pair {currentPairIndex + 1} of {pairs.length}: Which image is better given the prompt:
          </Typography>
          <Typography align="center">
            {pairs[currentPairIndex].prompt}
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
              },
              gap: 3,
            }}
          >
            {/* LEFT IMAGE */}
            <Card sx={{ border: selectedSide === "left" ? "4px solid #1976d2" : "none", transition: "0.2s" }}>
              <CardActionArea onClick={() => setSelectedSide("left")}>
                <CardMedia
                  component="img"
                  image={pairs[currentPairIndex].left.src}
                  sx={{ objectFit: "contain", height: "55vh" }}
                />
              </CardActionArea>
            </Card>

            {/* RIGHT IMAGE */}
            <Card sx={{ border: selectedSide === "right" ? "4px solid #1976d2" : "none", transition: "0.2s" }}>
              <CardActionArea onClick={() => setSelectedSide("right")}>
                <CardMedia
                  component="img"
                  image={pairs[currentPairIndex].right.src}
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
        </Box>
      )}
    </Container>
  );
}