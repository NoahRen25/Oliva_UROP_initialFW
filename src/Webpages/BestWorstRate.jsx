import React, { useState } from "react";
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
  Paper,
} from "@mui/material";
import UsernameEntry from "../components/UsernameEntry";
import ProgressBar from "../components/ProgressBar";
import { getImageUrl } from "../utils/supabaseImageUrl";
import { preloadImages } from "../utils/preloadImages";

const demoImg = (filename) => getImageUrl("demo-images", filename);

// # coded by denis comments, simdenis@mit.edu
const TRIALS = [
  {
    id: 1,
    prompt:
      "Surreal image of the United States flag and the flags of the five permanent members of the UN Security Council planted on the surface of the moon.",
    images: [
      { id: "bw1a", src: demoImg("GPTMoonFlags.png"), alt: "GPT Moon" },
      { id: "bw1b", src: demoImg("FluxMoonFlags.png"), alt: "Flux Moon" },
      { id: "bw1c", src: demoImg("NanoMoonFlags.png"), alt: "Nano Moon" },
      { id: "bw1d", src: demoImg("FluxFlag.png"), alt: "Flux Flag" },
    ],
  },
  {
    id: 2,
    prompt:
      "Image of a cargo ship sailing at sea, various nautical flags displayed along with the national flag of Panama.",
    images: [
      { id: "bw2a", src: demoImg("GPTShip.png"), alt: "GPT Ship" },
      { id: "bw2b", src: demoImg("FluxShip.png"), alt: "Flux Ship" },
      { id: "bw2c", src: demoImg("NanoShip.png"), alt: "Nano Ship" },
      { id: "bw2d", src: demoImg("FluxFlag.png"), alt: "Flux Flag" },
    ],
  },
  {
    id: 3,
    prompt:
      "Photorealistic image of a row of ten world flags waving in the wind, clear blue sky, 8k.",
    images: [
      { id: "bw3a", src: demoImg("GPTFlag.png"), alt: "GPT Flag" },
      { id: "bw3b", src: demoImg("FluxFlag.png"), alt: "Flux Flag" },
      { id: "bw3c", src: demoImg("NanoFlag.png"), alt: "Nano Flag" },
      { id: "bw3d", src: demoImg("GPTMoonFlags.png"), alt: "GPT Moon" },
    ],
  },
];

export default function BestWorstRate() {
  const navigate = useNavigate();
  const { addBestWorstSession } = useResults();

  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0);
  const [bestId, setBestId] = useState(null);
  const [worstId, setWorstId] = useState(null);
  const [trialResults, setTrialResults] = useState([]);
  const [startTime, setStartTime] = useState(null);

  // Preload all trial images on mount
  useEffect(() => {
    preloadImages(TRIALS.flatMap((t) => t.images.map((img) => img.src)));
  }, []);

  const startTrialTimer = () => setStartTime(performance.now());

  const handleStart = () => {
    setStep(1);
    setCurrentTrialIndex(0);
    setTrialResults([]);
    setBestId(null);
    setWorstId(null);
    startTrialTimer();
  };

  const handleSelectBest = (id) => {
    setBestId(id);
    if (id === worstId) setWorstId(null);
  };

  const handleSelectWorst = (id) => {
    setWorstId(id);
    if (id === bestId) setBestId(null);
  };

  const handleNext = () => {
    const trial = TRIALS[currentTrialIndex];
    const timeSpent = (performance.now() - startTime) / 1000;

    const bestImage = trial.images.find((img) => img.id === bestId);
    const worstImage = trial.images.find((img) => img.id === worstId);

    const entry = {
      trialId: trial.id,
      prompt: trial.prompt,
      bestId,
      bestName: bestImage ? bestImage.alt : "",
      worstId,
      worstName: worstImage ? worstImage.alt : "",
      responseTime: timeSpent.toFixed(2),
    };

    const updated = [...trialResults, entry];
    setTrialResults(updated);
    setBestId(null);
    setWorstId(null);

    if (currentTrialIndex < TRIALS.length - 1) {
      setCurrentTrialIndex((prev) => prev + 1);
      startTrialTimer();
    } else {
      addBestWorstSession(username, updated);
      setStep(2);
    }
  };

  const currentTrial = TRIALS[currentTrialIndex];
  const canContinue = bestId && worstId && bestId !== worstId;

  const handleBack = () => {
    if (currentTrialIndex === 0) return;
    setTrialResults((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setBestId(last.bestId || null);
      setWorstId(last.worstId || null);
      return prev.slice(0, -1);
    });
    setCurrentTrialIndex((idx) => Math.max(0, idx - 1));
    startTrialTimer();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      {step === 1 && (
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={currentTrialIndex === 0}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
      )}
      {step === 1 && (
        <ProgressBar
          current={currentTrialIndex + 1}
          total={TRIALS.length}
          label={`Trial ${currentTrialIndex + 1} of ${TRIALS.length}`}
        />
      )}

      {step === 0 && (
        <UsernameEntry
          title="Best-Worst (MaxDiff) Image Rating"
          username={username}
          setUsername={setUsername}
          onStart={handleStart}
          validationRegex={/^\d+$/}
        />
      )}

      {step === 1 && (
        <Box>
          <Typography variant="h5" align="center" gutterBottom>
            Pick the best and worst images for the prompt
          </Typography>
          <Typography align="center" sx={{ mb: 2 }}>
            {currentTrial.prompt}
          </Typography>
          <Box
            sx={{
              display: "grid",
              justifyContent: "center",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 3,
            }}
          >
            {currentTrial.images.map((img) => {
              const isBest = bestId === img.id;
              const isWorst = worstId === img.id;
              return (
                <Card
                  key={img.id}
                  sx={{
                    border: isBest
                      ? "3px solid #2e7d32"
                      : isWorst
                      ? "3px solid #d32f2f"
                      : "1px solid #eee",
                    transition: "0.2s",
                  }}
                >
                  <CardMedia
                    component="img"
                    image={img.src}
                    sx={{ objectFit: "contain", height: "30vh" }}
                  />
                  <CardContent sx={{ textAlign: "center" }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {img.alt}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                      <Button
                        variant={isBest ? "contained" : "outlined"}
                        color="success"
                        fullWidth
                        onClick={() => handleSelectBest(img.id)}
                      >
                        Best
                      </Button>
                      <Button
                        variant={isWorst ? "contained" : "outlined"}
                        color="error"
                        fullWidth
                        onClick={() => handleSelectWorst(img.id)}
                      >
                        Worst
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Button
              variant="contained"
              size="large"
              disabled={!canContinue}
              onClick={handleNext}
            >
              {currentTrialIndex === TRIALS.length - 1
                ? "Submit All"
                : "Next Trial"}
            </Button>
          </Box>
        </Box>
      )}

      {step === 2 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5">Success!</Typography>
          <Button
            sx={{ mt: 2 }}
            variant="contained"
            onClick={() => navigate("/best-worst-result")}
          >
            View Results
          </Button>
        </Paper>
      )}
    </Container>
  );
}
