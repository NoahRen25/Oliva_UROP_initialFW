// src/Webpages/IndividualRate.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useResults } from "../Results";
import {
  Typography,
  Container,
  Box,
  TextField,
  Button,
  Slider,
  Card,
  CardContent,
  CardMedia,
  Paper,
  Divider,
} from "@mui/material";

const BENCHMARK_IMAGE = {
  id: 0,
  src: "/src/images/GPTShip.png",
  alt: "Benchmark Calibration",
};

const IMAGES_TO_RATE = [
  { id: 1, src: "/src/images/Flux2.png", alt: "Flux2" },
  { id: 2, src: "/src/images/GPT-Image15.png", alt: "GPT-15" },
  { id: 3, src: "/src/images/GPT5.2_diff_viewpoint.png", alt: "GPT5.2_diff" },
  { id: 4, src: "/src/images/GPT5.2.png", alt: "GPT5.2" },
  { id: 5, src: "/src/images/NanoBananaPro.png", alt: "Nano" },
];

export default function IndividualRate() {
  const navigate = useNavigate();
  const { addIndividualSession } = useResults();

  // 0: Username, 1: Benchmark, 2: Main Loop, 3: Submit/rating
  const [activeStep, setActiveStep] = useState(0);
  const [username, setUsername] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentRating, setCurrentRating] = useState(3);
  const [scores, setScores] = useState([]);

  const handleNext = (isBenchmark = false) => {
    const img = isBenchmark
      ? BENCHMARK_IMAGE
      : IMAGES_TO_RATE[currentImageIndex];
    const newScore = {
      imageId: img.id,
      imageName: img.alt,
      score: currentRating,
    };
    const updatedScores = [...scores, newScore];
    setScores(updatedScores);
    setCurrentRating(3); 
    //move between the states
    if (isBenchmark) {
      setActiveStep(2); 
    } else if (currentImageIndex < IMAGES_TO_RATE.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      addIndividualSession(username, updatedScores);
      setActiveStep(3); 
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      {/* First state, username */}
      {activeStep === 0 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Individual Evaluation
          </Typography>
          <TextField
            fullWidth
            label="User ID"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Button variant="contained" onClick={() => setActiveStep(1)}>
            Start
          </Button>
        </Paper>
      )}

      {/* Second state, benchmark */}
      {activeStep === 1 && (
        <Card>
          <Typography
            variant="h6"
            sx={{ p: 2, textAlign: "center", bgcolor: "#fff3e0" }}
          >
           Benchmark: Rate the image on a scale of 1-5
          </Typography>
          <CardMedia component="img" height="300" image={BENCHMARK_IMAGE.src} />
          <CardContent sx={{ textAlign: "center" }}>
            <Typography align="center">Rating: {currentRating}</Typography>
            <Slider
              value={currentRating}
              onChange={(e, v) => setCurrentRating(v)}
              step={1}
              marks
              min={1}
              max={5}
            />
            <Button
              variant="contained"
              color="warning"
              fullWidth
              onClick={() => handleNext(true)}
            >
              Submit Benchmark & Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Third state, image cycle */}
      {activeStep === 2 && (
        <Card>
          <Typography
            variant="h6"
            sx={{ p: 2, textAlign: "center", bgcolor: "#fff3e0" }}
          >
           Image {currentImageIndex + 1} of {IMAGES_TO_RATE.length}: Rate the image on a scale of 1-5
          </Typography>
          <CardMedia
            component="img"
            height="300"
            image={IMAGES_TO_RATE[currentImageIndex].src}
          />
          <CardContent sx={{ textAlign: "center" }}>
            <Typography>Rating: {currentRating} </Typography>
            <Slider
              value={currentRating}
              onChange={(e, v) => setCurrentRating(v)}
              step={1}
              marks
              min={1}
              max={5}
            />
            <Button
              variant="contained"
              onClick={() => handleNext(false)}
              fullWidth
            >
              {currentImageIndex === 4 ? "Finish" : "Next Image"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Fourth state, result */}
      {activeStep === 3 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5">Success!</Typography>
          <Button
            sx={{ mt: 2 }}
            variant="contained"
            onClick={() => navigate("/individual-result")}
          >
            View Results
          </Button>
        </Paper>
      )}
    </Container>
  );
}
