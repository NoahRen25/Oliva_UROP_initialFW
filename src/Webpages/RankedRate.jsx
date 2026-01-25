import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useResults } from "../Results";
import {
  Container, Typography, Box, TextField, Button, Grid, Card,
  CardMedia, CardContent, Paper, MenuItem, Select, FormControl, InputLabel, Alert
} from "@mui/material";
import UndoIcon from "@mui/icons-material/Undo";
import ProgressIndicator from "../components/ProgressIndicator";
import CompletionSummary from "../components/CompletionSummary";

const RANK_GROUPS = [
  {
    groupId: 1,
    images: [
      { id: 'r1a', src: "/src/images/GPTMoonFlags.png", alt: "GPT Moon" },
      { id: 'r1b', src: "/src/images/FluxMoonFlags.png", alt: "Flux Moon" },
      { id: 'r1c', src: "/src/images/NanoMoonFlags.png", alt: "Nano Moon" }
    ],
    prompt: "Surreal image of the United States flag and the flags of the five permanent members of the UN Security Council (China, France, United Kingdom, Russia) planted on the surface of the moon, low gravity environment, Earth visible in the distance, accurate flag representations, dramatic lighting."
  },
  {
    groupId: 2,
    images: [
      { id: 'r2a', src: "/src/images/GPTShip.png", alt: "GPT Ship" },
      { id: 'r2b', src: "/src/images/FluxShip.png", alt: "Flux Ship" },
      { id: 'r2c', src: "/src/images/NanoShip.png", alt: "Nano Ship" }
    ],
    prompt:
      "Image of a cargo ship sailing at sea, various nautical flags displayed along with the national flag of Panama, realistic ocean waves, clear sky, accurate flag designs and arrangements, ship details.",
  },
  {
    groupId: 3,
    images: [
      { id: 'r3a', src: "/src/images/GPTFlag.png", alt: "GPT Flag" },
      { id: 'r3b', src: "/src/images/FluxFlag.png", alt: "Flux Flag" },
      { id: 'r3c', src: "/src/images/NanoFlag.png", alt: "Nano Flag" }
    ],
    prompt:
      "Photorealistic image of a row of ten world flags waving in the wind, including the flags of Canada, Japan, Brazil, Germany, India, South Africa, Australia, Russia, and Italy, clear blue sky, accurate flag colors and patterns, 8k.",
  }
];

export default function RankedRate() {
  const navigate = useNavigate();
  const { addRankedSession, announce, isAnnouncing } = useResults();

  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [error, setError] = useState("");
  const [currentRanks, setCurrentRanks] = useState({ img0: '', img1: '', img2: '' });
  const [allRankings, setAllRankings] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [history, setHistory] = useState([]);
  const hasAnnouncedWelcome = useRef(false);

  const handleChange = (key) => (e) => {
    setCurrentRanks({ ...currentRanks, [key]: e.target.value });
    setError("");
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if(isFinished) return;
    if (step === 0) {
      announce("Welcome to Ranked Comparison. Please enter your User ID to begin.");
    } else if (step === 1) {
      const currentPrompt = RANK_GROUPS[currentGroupIndex].prompt;
      announce(`Ranking ${currentGroupIndex + 1}. Rank these images in terms of quality, given the prompt: ${currentPrompt}`);
    }
  }, [step, currentGroupIndex, announce, isFinished, isAnnouncing]);

  const handleStart = () => {
    setStep(1);
    setSessionStartTime(performance.now());
  };

  const handleNextGroup = () => {
    const values = Object.values(currentRanks);

    if (values.includes('')) {
      setError("Please assign a rank to every image.");
      return;
    }
    const uniqueValues = new Set(values);
    if (uniqueValues.size !== values.length) {
      setError("Each image must have a unique rank (1st, 2nd, 3rd).");
      return;
    }

    // Save current state to history
    setHistory(prev => [...prev, {
      currentGroupIndex,
      currentRanks,
      allRankings,
    }]);

    const currentGroup = RANK_GROUPS[currentGroupIndex];
    const groupResults = currentGroup.images.map((img, index) => ({
      groupId: currentGroup.groupId,
      groupPrompt: currentGroup.prompt,
      imageId: img.id,
      imageName: img.alt,
      rank: currentRanks[`img${index}`]
    }));

    const updatedTotalRankings = [...allRankings, ...groupResults];

    if (currentGroupIndex < RANK_GROUPS.length - 1) {
      setAllRankings(updatedTotalRankings);
      setCurrentGroupIndex(currentGroupIndex + 1);
      setCurrentRanks({ img0: '', img1: '', img2: '' });
    } else {
      setIsFinished(true);
      window.speechSynthesis.cancel();
      addRankedSession(username, updatedTotalRankings);
      setStep(2);
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setCurrentGroupIndex(lastState.currentGroupIndex);
    setCurrentRanks(lastState.currentRanks);
    setAllRankings(lastState.allRankings);
    setHistory(prev => prev.slice(0, -1));
    setError("");
  };

  const canUndo = history.length > 0 && step === 1;

  const stats = useMemo(() => {
    if (step !== 2) return null;
    const totalTime = sessionStartTime ? (performance.now() - sessionStartTime) / 1000 : 0;
    return { itemsRated: RANK_GROUPS.length, totalTime };
  }, [step, sessionStartTime]);

  const activeGroup = RANK_GROUPS[currentGroupIndex];

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      {step === 1 && (
        <ProgressIndicator
          current={currentGroupIndex + 1}
          total={RANK_GROUPS.length}
          label="Ranking"
        />
      )}

      {step === 0 ? (
        <Paper sx={{ p: 4, maxWidth: 500, mx: "auto", textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>Ranked Evaluation</Typography>
          <TextField
            label="User ID (Numeric)" fullWidth sx={{ mb: 3 }}
            value={username} onChange={(e) => setUsername(e.target.value)}
          />
          <Button
            variant="contained"
            onClick={handleStart}
            disabled={!/^\d+$/.test(username)}
          >
            Start Ranking
          </Button>
        </Paper>
      ) : step === 1 ? (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Ranking {currentGroupIndex + 1} of {RANK_GROUPS.length}: Rank the images based on which best suits the following prompt
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Prompt: {activeGroup.prompt}
          </Typography>

          <Box
            sx={{
              display: "grid",
              justifyContent: "center",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(3, 1fr)",
                xl: "repeat(4s, 1fr)",
              },
              gap: 3,
            }}
          >
            {activeGroup.images.map((img, index) => (
              <Grid item xs={12} md={4} key={img.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia component="img" image={img.src} alt={img.alt} sx={{objectFit: "contain", height: "30vh"}}/>
                  <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>{img.alt}</Typography>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel>Rank</InputLabel>
                      <Select
                        value={currentRanks[`img${index}`]}
                        label="Rank"
                        onChange={handleChange(`img${index}`)}
                      >
                        <MenuItem value={1}>1st (Best)</MenuItem>
                        <MenuItem value={2}>2nd</MenuItem>
                        <MenuItem value={3}>3rd</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Box>

          <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4, pb: 5 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<UndoIcon />}
                onClick={handleUndo}
                disabled={!canUndo}
                sx={{ flex: 1 }}
              >
                Undo
              </Button>
              <Button variant="contained" size="large" onClick={handleNextGroup} sx={{ flex: 2 }}>
                {currentGroupIndex === RANK_GROUPS.length - 1 ? "Submit All Rankings" : "Next Page"}
              </Button>
            </Box>
          </Box>
        </Box>
      ) : (
        stats && (
          <CompletionSummary
            itemsRated={stats.itemsRated}
            totalTime={stats.totalTime}
            resultPath="/ranked-result"
            ratePath="/ranked-rate"
            title="Rankings Complete!"
          />
        )
      )}
    </Container>
  );
}
