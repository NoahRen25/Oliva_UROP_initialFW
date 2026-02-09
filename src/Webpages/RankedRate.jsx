import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useResults } from "../Results";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
} from "@mui/material";
import UsernameEntry from "../components/UsernameEntry";
import ProgressBar from "../components/ProgressBar";
import { getRankedBatch } from "../utils/ImageLoader";
import { preloadImages } from "../utils/preloadImages";

export default function RankedRate() {
  const navigate = useNavigate();
  const { addRankedSession, announce } = useResults();

  const [step, setStep] = useState(0); 
  const [username, setUsername] = useState("");
  const [rankGroups, setRankGroups] = useState([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [error, setError] = useState("");
  const [currentRanks, setCurrentRanks] = useState({ img0: "", img1: "", img2: "" });
  const [allRankings, setAllRankings] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const batch = getRankedBatch(3);
    setRankGroups(batch);
    preloadImages(batch.flatMap((g) => g.images.map((img) => img.src)));
  }, []);

  useEffect(() => {
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => {
    if (isFinished || rankGroups.length === 0) return;
    if (step === 0) {
      announce("Welcome to Ranked Comparison. Please enter your User ID to begin.");
    } else if (step === 1) {
      const currentPrompt = rankGroups[currentGroupIndex].prompt;
      announce(`Ranking ${currentGroupIndex + 1}. Rank these images given the prompt: ${currentPrompt}`);
    }
  }, [step, currentGroupIndex, announce, isFinished, rankGroups]);

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
    const uniqueValues = new Set(values);
    if (uniqueValues.size !== values.length) {
      setError("Each image must have a unique rank (1st, 2nd, 3rd).");
      return;
    }

    const currentGroup = rankGroups[currentGroupIndex];
    const groupResults = currentGroup.images.map((img, index) => ({
      groupId: currentGroupIndex + 1,
      groupPrompt: currentGroup.prompt,
      imageId: img.id,
      imageName: img.filename,
      rank: currentRanks[`img${index}`],
    }));

    const updatedTotalRankings = [...allRankings, ...groupResults];

    if (currentGroupIndex < rankGroups.length - 1) {
      setAllRankings(updatedTotalRankings);
      setCurrentGroupIndex(currentGroupIndex + 1);
      setCurrentRanks({ img0: "", img1: "", img2: "" });
    } else {
      setIsFinished(true);
      window.speechSynthesis.cancel();
      addRankedSession(username, updatedTotalRankings);
      navigate("/ranked-result");
    }
  };

  if (rankGroups.length === 0) return null;
  const activeGroup = rankGroups[currentGroupIndex];

  const handleBackGroup = () => {
    if (currentGroupIndex === 0) return;
    const prevGroup = rankGroups[currentGroupIndex - 1];
    const prevGroupResults = allRankings.filter(
      (r) => r.groupId === prevGroup.groupId
    );
    const remaining = allRankings.filter(
      (r) => r.groupId !== prevGroup.groupId
    );
    const rankMap = new Map(prevGroupResults.map((r) => [r.imageId, r.rank]));
    setAllRankings(remaining);
    setCurrentGroupIndex((idx) => Math.max(0, idx - 1));
    setCurrentRanks({
      img0: rankMap.get(prevGroup.images[0].id) ?? "",
      img1: rankMap.get(prevGroup.images[1].id) ?? "",
      img2: rankMap.get(prevGroup.images[2].id) ?? "",
    });
    setError("");
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      {step === 1 && (
        <Button
          variant="outlined"
          onClick={handleBackGroup}
          disabled={currentGroupIndex === 0}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
      )}
      {step === 1 && (
        <ProgressBar
          current={currentGroupIndex}
          total={rankGroups.length}
          label={`Group ${currentGroupIndex + 1} of ${rankGroups.length}`}
        />
      )}
      {step === 0 ? (
        <UsernameEntry
          title="Ranked Image Rating"
          username={username}
          setUsername={setUsername}
          onStart={() => setStep(1)}
          validationRegex={/^\d+$/}
        />
      ) : (
        <>
          <Typography variant="h4" align="center" gutterBottom>
            Ranking {currentGroupIndex + 1} of {rankGroups.length}
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Prompt: {activeGroup.prompt}
          </Typography>

          <Box sx={{ display: "grid", justifyContent: "center", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
            {activeGroup.images.map((img, index) => (
              <Grid item xs={12} md={4} key={img.id}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <CardMedia component="img" image={img.src} sx={{ objectFit: "contain", height: "30vh" }} />
                  <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel>Rank</InputLabel>
                      <Select value={currentRanks[`img${index}`]} label="Rank" onChange={handleChange(`img${index}`)}>
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
              {currentGroupIndex === rankGroups.length - 1 ? "Submit All Rankings" : "Next Page"}
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}
