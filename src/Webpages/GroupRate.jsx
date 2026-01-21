import React, { useState } from "react";
import { useResults } from "../Results";
import { useNavigate } from "react-router-dom";
import { Container, Typography, Box, TextField, Button, Grid, Card, CardMedia, CardContent, Slider, Paper } from "@mui/material";

const BENCHMARK_IMAGE = { id: "b1", src: "/src/images/GPTShip.png", alt: "Benchmark" };
const GROUP_IMAGES = [
  { id: "g1", src: "/src/images/FluxShip.png", alt: "Flux2" },
  { id: "g2", src: "/src/images/GPTShip.png", alt: "Gpt-15" },
  { id: "g3", src: "/src/images/NanoShip.png", alt: "GPT5.2" },
  { id: "g4", src: "/src/images/NanoFlag.png", alt: "Nano" },
];

export default function GroupRate() {
  const navigate = useNavigate();
  const { addGroupSession } = useResults();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [benchmarkRating, setBenchmarkRating] = useState(3);
  const [ratings, setRatings] = useState({ g1: 3, g2: 3, g3: 3, g4: 3 });
  const [startTime, setStartTime] = useState(null);
  const [sliderMoves, setSliderMoves] = useState({ b1: 0, g1: 0, g2: 0, g3: 0, g4: 0 });
  const [isFinished, setIsFinished] = useState(false);
  const hasAnnouncedWelcome = useRef(false);
  const startTimer = () => setStartTime(performance.now());
  const handleStart = () => { setStep(1); startTimer(); };


  //ends speech when navigating off page
  useEffect(() => {
   
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);
  //actual tts
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
  const handleSubmit = () => {
    const totalTime = (performance.now() - startTime) / 1000;
    const formattedScores = [
      { imageId: BENCHMARK_IMAGE.id, imageName: "Benchmark", score: benchmarkRating, interactionCount: sliderMoves["b1"] },
      ...GROUP_IMAGES.map((img) => ({
        imageId: img.id, imageName: img.alt, score: ratings[img.id],
        timeSpent: (totalTime / 5).toFixed(2), interactionCount: sliderMoves[img.id]
      })),
    ];
    addGroupSession(username, formattedScores);
    navigate("/group-result");
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      {step === 0 && (
        <Paper sx={{ p: 4, maxWidth: 500, mx: "auto", textAlign: "center" }}>
          <Typography variant="h4">Group Evaluation</Typography>
          <TextField fullWidth sx={{ my: 3 }} label="User ID" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Button variant="contained" onClick={handleStart}>Start</Button>
        </Paper>
      )}
      {step === 1 && (
        <Box sx={{ maxWidth: 600, mx: "auto" }}>
          <Typography variant="h5" align="center" gutterBottom>Step 1: Rate Benchmark</Typography>
          <Card>
            <CardMedia component="img" height="350" image={BENCHMARK_IMAGE.src} sx={{objectFit:"contain"}}/>
            <CardContent>
              <Typography align="center">Score: {benchmarkRating}</Typography>
              <Slider value={benchmarkRating} step={1} marks min={1} max={5} onChange={(e, v) => { setBenchmarkRating(v); setSliderMoves(prev => ({...prev, b1: prev.b1 + 1})); }} />
              <Button variant="contained" color="warning" fullWidth onClick={() => setStep(2)}>Next</Button>
            </CardContent>
          </Card>
        </Box>
      )}
      {step === 2 && (
        <>
          <Typography variant="h5" align="center" gutterBottom>Step 2: Rate Image Grid</Typography>
          <Box
        sx={{
          display: "grid",
          justifyContent: "center",
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
            {GROUP_IMAGES.map((img) => (
              <Grid item xs={6} key={img.id}>
                <Card>
                  {/*Note for below: 30vh is if the dimensions on images aren't guaranteed same dimensions -- if they are, change to height: "auto" */}
                  <CardMedia component="img" image={img.src} sx={{objectFit: "contain", height: "30vh", width: "100%"}}/>
                  <CardContent sx={{ p: 1 }}>
                    <Typography align="center">Score: {ratings[img.id]}</Typography>
                    <Slider size="small" value={ratings[img.id]} step={1} min={1} max={5} onChange={(e, v) => { setRatings({ ...ratings, [img.id]: v }); setSliderMoves(prev => ({...prev, [img.id]: prev[img.id] + 1})); }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Box>
          <Button sx={{ mt: 4 }} variant="contained" size="large" fullWidth onClick={handleSubmit}>Submit All Results</Button>
        </>
      )}
    </Container>
  );
}