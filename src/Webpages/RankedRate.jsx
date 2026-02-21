import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useResults } from "../Results";
import {
  Container, Typography, Box, Button, Grid, Card, CardMedia,
  CardContent, MenuItem, Select, FormControl, InputLabel, Alert,
} from "@mui/material";
import UsernameEntry from "../components/UsernameEntry";
import ProgressBar from "../components/ProgressBar";
import ModeInstructionScreen from "../components/ModeInstructionScreen";
import { getRankedBatch } from "../utils/ImageLoader";
import { preloadImages } from "../utils/preloadImages";
import GazeTrackingProvider, { useGazeTracking } from "../components/GazeTrackingProvider";
import GazeTrackedImage from "../components/GazeTrackedImage";
import CalibrationGate from "../components/CalibrationGate";
import { saveGazeSession } from "../utils/gazeStorage";

function RankedRateInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig || null;

  const { addRankedSession, setActivePrompt } = useResults();
  const { startSession, getGazeData } = useGazeTracking();

  const [step, setStep] = useState(uploadConfig ? 1 : 0);
  const [username, setUsername] = useState(uploadConfig?.username || "");
  const [rankGroups, setRankGroups] = useState([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [error, setError] = useState("");
  const [currentRanks, setCurrentRanks] = useState({ img0: "", img1: "", img2: "" });
  const [allRankings, setAllRankings] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  const groupCount = uploadConfig?.count || 3;
  const configPrompt = uploadConfig?.prompt || null;

  useEffect(() => {
    const batch = getRankedBatch(groupCount);
    setRankGroups(batch);
    preloadImages(batch.flatMap((g) => g.images.map((img) => img.src)));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setActivePrompt(null);
    };
  }, [setActivePrompt]);

  // Update activePrompt on group change
  useEffect(() => {
    if (isFinished || rankGroups.length === 0 || step !== 2) {
      setActivePrompt(null);
      return;
    }
    const prompt = configPrompt || rankGroups[currentGroupIndex].prompt;
    setActivePrompt(prompt);
  }, [step, currentGroupIndex, rankGroups, configPrompt, isFinished, setActivePrompt]);

  const handleChange = (key) => (e) => {
    setCurrentRanks({ ...currentRanks, [key]: e.target.value });
    setError("");
  };

  const handleNextGroup = () => {
    const values = Object.values(currentRanks);
    if (values.includes("")) {
      setError("Please assign a rank to every image.");
      return;
    }
    if (new Set(values).size !== values.length) {
      setError("Each image must have a unique rank (1st, 2nd, 3rd).");
      return;
    }

    const currentGroup = rankGroups[currentGroupIndex];
    const groupResults = currentGroup.images.map((img, idx) => ({
      groupId: currentGroupIndex + 1,
      groupPrompt: configPrompt || currentGroup.prompt,
      imageId: img.id,
      imageName: img.filename,
      rank: currentRanks[`img${idx}`],
    }));

    const updated = [...allRankings, ...groupResults];

    if (currentGroupIndex < rankGroups.length - 1) {
      setAllRankings(updated);
      setCurrentGroupIndex(currentGroupIndex + 1);
      setCurrentRanks({ img0: "", img1: "", img2: "" });
    } else {
      setIsFinished(true);
      window.speechSynthesis.cancel();
      addRankedSession(username, updated);
      saveGazeSession(Date.now().toString(), "ranked", username, getGazeData());
      navigate("/mode-results");
    }
  };

  if (rankGroups.length === 0) return null;
  
  const activeGroup = rankGroups[currentGroupIndex];
  const globalPrompt = configPrompt || "Rank these images";
  const imagePrompt = activeGroup?.prompt || "";

  const handleBackGroup = () => {
    if (currentGroupIndex === 0) return;
    const prevGroup = rankGroups[currentGroupIndex - 1];
    const prevResults = allRankings.filter((r) => r.groupId === currentGroupIndex);
    const remaining = allRankings.filter((r) => r.groupId !== currentGroupIndex);
    const rankMap = new Map(prevResults.map((r) => [r.imageId, r.rank]));
    setAllRankings(remaining);
    setCurrentGroupIndex((i) => Math.max(0, i - 1));
    setCurrentRanks({
      img0: rankMap.get(prevGroup.images[0].id) ?? "",
      img1: rankMap.get(prevGroup.images[1].id) ?? "",
      img2: rankMap.get(prevGroup.images[2].id) ?? "",
    });
    setError("");
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      {/* Step 0: Username */}
      {step === 0 && (
        <UsernameEntry
          title="Ranked Image Rating"
          username={username}
          setUsername={setUsername}
          onStart={() => setStep(1)}
          validationRegex={/^\d+$/}
        />
      )}

      {/* Step 1: Instructions */}
      {step === 1 && (
        <ModeInstructionScreen
          mode="ranked"
          prompt={configPrompt || "Per-group prompts will be shown"}
          onNext={() => { setStep(2); startSession(); }}
        />
      )}

      {/* Step 2: Ranking */}
      {step === 2 && (
        <>
          <Button
            variant="outlined"
            onClick={handleBackGroup}
            disabled={currentGroupIndex === 0}
            sx={{ mb: 2 }}
          >
            Back
          </Button>
          <ProgressBar
            current={currentGroupIndex}
            total={rankGroups.length}
            label={`Group ${currentGroupIndex + 1} of ${rankGroups.length}`}
          />

          <Typography variant="h4" align="center" gutterBottom>
            Ranking {currentGroupIndex + 1} of {rankGroups.length}
          </Typography>
          
          {/* Global Prompt */}
          {configPrompt && (
            <Typography
              variant="body1"
              align="center"
              sx={{ mb: 1, fontStyle: "italic", color: "text.secondary" }}
            >
              Task: "{globalPrompt}"
            </Typography>
          )}
          
          {/* Image-specific Prompt */}
          <Typography
            variant="h6"
            align="center"
            sx={{ mb: 4, color: "primary.main", fontWeight: "medium" }}
          >
            "{imagePrompt}"
          </Typography>

          <Box
            sx={{
              display: "grid",
              justifyContent: "center",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            {activeGroup.images.map((img, index) => (
              <Grid item xs={12} md={4} key={img.id}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <GazeTrackedImage
                    imageId={img.id}
                    component="img"
                    image={img.src}
                    sx={{ objectFit: "contain", height: "30vh" }}
                  />
                  <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
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

          <Box sx={{ maxWidth: 400, mx: "auto", mt: 4, pb: 5 }}>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Button variant="contained" size="large" fullWidth onClick={handleNextGroup}>
              {currentGroupIndex === rankGroups.length - 1
                ? "Submit All Rankings"
                : "Next Page"}
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}

export default function RankedRate() {
  return (
    <CalibrationGate>
      <GazeTrackingProvider>
        <RankedRateInner />
      </GazeTrackingProvider>
    </CalibrationGate>
  );
}