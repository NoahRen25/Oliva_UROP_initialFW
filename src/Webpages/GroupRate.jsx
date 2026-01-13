import React, { useState } from "react";
import { useResults } from "../Results";
import { useNavigate } from "react-router-dom";
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
  Slider,
  Paper,
} from "@mui/material";

const BENCHMARK_IMAGE = {
  id: "b1",
  src: "/src/images/GPTShip.png",
  alt: "Benchmark",
};
const GROUP_IMAGES = [
  { id: "g1", src: "/src/images/Flux2.png", alt: "Flux2" },
  { id: "g2", src: "/src/images/GPT-Image15.png", alt: "Gpt-15" },
  { id: "g3", src: "/src/images/GPT5.2.png", alt: "GPT5.2" },
  { id: "g4", src: "/src/images/NanoBananaPro.png", alt: "Nano" },
];

export default function GroupRate() {
  const navigate = useNavigate();
  const { addGroupSession } = useResults();

  // States: Username, Benchmark, Grid ranking
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [benchmarkRating, setBenchmarkRating] = useState(3);
  const [ratings, setRatings] = useState({ g1: 3, g2: 3, g3: 3, g4: 3 });
  const [startTime, setStartTime] = useState(null);
  const startTimer = () => setStartTime(performance.now())
  const handleStart = () => {
    setStep(1)
    startTimer()
  }
  const handleBenchmark = () => {
    const timeSpent = (performance.now() - startTime) / 1000 //ms -> s again
    setBenchmarkTime(timeSpent);
    setStep(2)
    startTimer();
  }
  const handleSubmit = () => {
    const gridTimeSpent = (performance.now() - startTime) / 1000 //ms -> s again
    const formattedScores = [
      {
        imageId: BENCHMARK_IMAGE.id,
        imageName: "Benchmark",
        score: benchmarkRating,
      },
      ...GROUP_IMAGES.map((img) => ({
        imageId: img.id,
        imageName: img.alt,
        score: ratings[img.id],
        timeSpent: (gridTimeSpent / 4).toFixed(2)
      })),
    ];

    addGroupSession(username, formattedScores);
    navigate("/group-result");
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {step === 0 && (
        <Paper sx={{ p: 4, maxWidth: 500, mx: "auto", textAlign: "center" }}>
          <Typography variant="h4">Group Evaluation</Typography>
          <TextField
            fullWidth
            sx={{ my: 3 }}
            label="User ID"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button variant="contained" onClick={() => handleStart()}>
            Start
          </Button>
        </Paper>
      )}

      {step === 1 && (
        <Box sx={{ maxWidth: 600, mx: "auto" }}>
          <Typography variant="h5" align="center" gutterBottom>
            Step 1: Rate on a scale of 1-5
          </Typography>
          <Card>
            <CardMedia
              component="img"
              height="350"
              image={BENCHMARK_IMAGE.src}
            />
            <CardContent>
            <Typography align="center">Score: {benchmarkRating}</Typography>
              <Slider
                value={benchmarkRating}
                onChange={(e, v) => setBenchmarkRating(v)}
                step={1}
                marks
                min={1}
                max={5}
                valueLabelDisplay="auto"
              />
              <Button
                variant="contained"
                color="warning"
                fullWidth
                onClick={() => setStep(2)}
              >
                Next: View Image Grid
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}

      {step === 2 && (
        <>
          <Typography variant="h5" align="center" gutterBottom>
            Step 2: Rate each image on a scale of 1-5
          </Typography>
          <Grid container spacing={2}>
            {GROUP_IMAGES.map((img) => (
              <Grid item xs={6} key={img.id}>
                <Card>
                  <CardMedia component="img" height="200" image={img.src} />
                  <CardContent sx={{ p: 1 }}>
                  <Typography align="center">Score: {ratings[img.id]}</Typography>
                    <Slider
                      size="small"
                      value={ratings[img.id]}
                      onChange={(e, v) =>
                        setRatings({ ...ratings, [img.id]: v })
                      }
                      step={1}
                      min={1}
                      max={5}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
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
