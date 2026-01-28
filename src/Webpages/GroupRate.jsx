import React, { useState, useEffect } from "react";
import { useResults } from "../Results";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Slider,
} from "@mui/material";
import ScoreSlider from "../components/ScoreSlider";
import UsernameEntry from "../components/UsernameEntry";
import { getGroupBatch, getIndividualBatch } from "../utils/ImageLoader";

export default function GroupRate() {
  const navigate = useNavigate();
  const { addGroupSession } = useResults();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  
  const [benchmarkImage, setBenchmarkImage] = useState(null);
  const [groupData, setGroupData] = useState(null);
  
  const [benchmarkRating, setBenchmarkRating] = useState(3);
  const [ratings, setRatings] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [sliderMoves, setSliderMoves] = useState({});

  useEffect(() => {
    //1 benchmark + 4 for group
    const bench = getIndividualBatch(1)[0];
    const group = getGroupBatch(1)[0];
    
    setBenchmarkImage(bench);
    setGroupData(group);

    // Initialize ratings and moves
    const initialRanks = {};
    const initialMoves = { b1: 0 };
    group.images.forEach((img) => {
      initialRanks[img.id] = 3;
      initialMoves[img.id] = 0;
    });
    setRatings(initialRanks);
    setSliderMoves(initialMoves);
  }, []);

  const handleStart = () => {
    setStep(1);
    setStartTime(performance.now());
  };

  const handleSubmit = () => {
    const totalTime = (performance.now() - startTime) / 1000;
    const formattedScores = [
      {
        imageId: "benchmark",
        imageName: benchmarkImage.filename,
        score: benchmarkRating,
        interactionCount: sliderMoves["b1"],
      },
      ...groupData.images.map((img) => ({
        imageId: img.id,
        imageName: img.filename,
        score: ratings[img.id],
        timeSpent: (totalTime / 5).toFixed(2),
        interactionCount: sliderMoves[img.id],
      })),
    ];
    addGroupSession(username, formattedScores);
    navigate("/group-result");
  };

  const trackMove = (id) =>
    setSliderMoves((prev) => ({ ...prev, [id]: prev[id] + 1 }));

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setStartTime(performance.now());
    }
  };

  if (!benchmarkImage || !groupData) return null;

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      {step === 2 && (
        <Button variant="outlined" onClick={handleBack} sx={{ mb: 2 }}>
          Back
        </Button>
      )}
      {step === 0 && (
        <UsernameEntry
          title="Group Image Rating"
          username={username}
          setUsername={setUsername}
          onStart={handleStart}
        />
      )}
      {step === 1 && (
        <Box sx={{ maxWidth: 600, mx: "auto" }}>
          <Typography variant="h5" align="center" gutterBottom>
            Step 1: Rate Benchmark
          </Typography>
          <Typography variant="h5" align="center" gutterBottom>
            Category: {benchmarkImage.category}
          </Typography>
          <Card>
            <CardMedia
              component="img"
              height="350"
              image={benchmarkImage.src}
              sx={{ objectFit: "contain" }}
            />
            <CardContent>
              <Typography align="center">Score: {benchmarkRating}</Typography>
              <Slider
                value={benchmarkRating}
                step={1}
                marks
                min={1}
                max={5}
                onChange={(e, v) => {
                  setBenchmarkRating(v);
                  setSliderMoves((prev) => ({ ...prev, b1: prev.b1 + 1 }));
                }}
              />
              <Button
                variant="contained"
                color="warning"
                fullWidth
                onClick={() => setStep(2)}
              >
                Next
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}
      {step === 2 && (
        <>
          <Typography variant="h5" align="center" gutterBottom>
            Step 2: Rate Image Grid (Category: {groupData.category})
          </Typography>
          <Typography variant="h5" align="center" gutterBottom fontWeight="fontWeightBold">
          Category: {benchmarkImage.category}
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
                xl: "repeat(2, 1fr)",
              },
              gap: 3,
            }}
          >
            {groupData.images.map((img) => (
              <Grid item xs={6} key={img.id}>
                <Card>
                  <CardMedia
                    component="img"
                    image={img.src}
                    sx={{ objectFit: "contain", height: "30vh", width: "100%" }}
                  />
                  <CardContent sx={{ p: 1 }}>
                    <Typography align="center">
                      Score: {ratings[img.id]}
                    </Typography>
                    <ScoreSlider
                      size="small"
                      value={ratings[img.id]}
                      setValue={(v) =>
                        setRatings((prev) => ({ ...prev, [img.id]: v }))
                      }
                      onInteraction={() => trackMove(img.id)}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Box>
          <Button
            sx={{ mt: 4 }}
            variant="contained"
            size="large"
            fullWidth
            onClick={handleSubmit}
          >
            Submit All Results
          </Button>
        </>
      )}
    </Container>
  );
}
