import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useResults } from "../Results";
import {
  Typography,
  Container,
  Button,
  Card,
  CardContent,
  CardMedia,
  Paper,
  Box
} from "@mui/material";
import ScoreSlider from "../components/ScoreSlider";
import UsernameEntry from "../components/UsernameEntry";
import ProgressBar from "../components/ProgressBar";
import { getIndividualBatch } from "../utils/ImageLoader";
import SpeedWarning from "../components/SpeedWarning";

export default function IndividualRate() {
  const navigate = useNavigate();
  const { addIndividualSession, checkEngagement, setShowSpeedWarning, resetEngagement } = useResults();
  
  const [activeStep, setActiveStep] = useState(0);
  const [username, setUsername] = useState("");
  const [imagesToRate, setImagesToRate] = useState([]);
  const [benchmarkImage, setBenchmarkImage] = useState(null);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentRating, setCurrentRating] = useState(3);
  const [scores, setScores] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const batch = getIndividualBatch(6); 
    setBenchmarkImage(batch[0]);
    setImagesToRate(batch.slice(1));
  }, []);

  const startTimer = () => {
    setStartTime(performance.now());
    setInteractionCount(0);
  };
  
  const handleStart = () => {
    setActiveStep(1);
    startTimer();
  };

  const totalImages = 6; 
  const progressValue =
    activeStep === 1 ? 0 : activeStep === 2 ? currentImageIndex + 1 : totalImages;
    useEffect(() => {
      const batch = getIndividualBatch(6); 
      setBenchmarkImage(batch[0]);
      setImagesToRate(batch.slice(1));
      
      resetEngagement(); 
    }, []);
    const handleNext = (isBenchmark = false) => {
      if (isLocked) return;
      
      const timeSpent = (performance.now() - startTime) / 1000;
      const img = isBenchmark ? benchmarkImage : imagesToRate[currentImageIndex];
      
      const newScore = {
        imageId: img.id,
        imageName: img.filename, 
        prompt: img.prompt,
        score: currentRating,
        timeSpent: Number(timeSpent.toFixed(2)),
        interactionCount,
      };
      
      const updatedScores = [...scores, newScore];
      setScores(updatedScores);
      setCurrentRating(3);
  
      const stepIndex = isBenchmark ? 0 : currentImageIndex + 1;
      const currentTimes = updatedScores.map(s => s.timeSpent);
      
      const isSafeToProceed = checkEngagement(currentTimes, stepIndex);
      
      if (!isSafeToProceed) {
        setIsLocked(true);
    
        setTimeout(() => {
          setIsLocked(false);
          setShowSpeedWarning(false); 
        }, 2000);
  
        return; 
      }
    
      
      if (isBenchmark) {
        setActiveStep(2);
      } else if (currentImageIndex < imagesToRate.length - 1) {
        setCurrentImageIndex(currentImageIndex + 1);
      } else {
        addIndividualSession(username, updatedScores);
        setActiveStep(3);
      }
      startTimer();
    };

  const incrementMoves = () => setInteractionCount((prev) => prev + 1);

  if (!benchmarkImage || imagesToRate.length === 0) return null;

  const currentImg = activeStep === 1 ? benchmarkImage : imagesToRate[currentImageIndex];

  const handleBack = () => {
    if (activeStep !== 2) return;

    setScores((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setCurrentRating(last.score ?? 3);
      return prev.slice(0, -1);
    });

    if (currentImageIndex > 0) {
      setCurrentImageIndex((idx) => Math.max(0, idx - 1));
    } else {
      setActiveStep(1);
    }
    setInteractionCount(0);
    startTimer();
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      {activeStep === 2 && (
        <Button variant="outlined" onClick={handleBack} sx={{ mb: 2 }}>
          Back
        </Button>
      )}
      <SpeedWarning />
      {activeStep > 0 && activeStep < 3 && (
        <ProgressBar
          current={progressValue}
          total={totalImages}
          label={`Progress: ${progressValue} / ${totalImages}`}
        />
      )}
      {activeStep === 0 && (
        <UsernameEntry
          title="Individual Image Rating"
          username={username}
          setUsername={setUsername}
          onStart={handleStart}
        />
      )}
      {(activeStep === 1 || activeStep === 2) && (
        <Card>
          <Box sx={{ p: 2, bgcolor: "#fff3e0", textAlign: "center" }}>
            <Typography variant="h6">
              {activeStep === 1 ? "Benchmark" : `Image ${currentImageIndex + 1} of 5`}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
              "{currentImg.prompt}"
            </Typography>
          </Box>
          <CardMedia
            component="img"
            image={currentImg.src}
            sx={{ objectFit: "contain", height: "auto", maxHeight: "60vh" }}
          />
          <CardContent sx={{ textAlign: "center" }}>
            <Typography>Rating: {currentRating}</Typography>
            <ScoreSlider
              value={currentRating}
              setValue={setCurrentRating}
              onInteraction={incrementMoves}
            />
<Button
  variant="contained"
  fullWidth
  
  disabled={isLocked} 
  onClick={() => handleNext(activeStep === 1)}

  sx={{
    "&.Mui-disabled": {
      backgroundColor: "rgba(0, 0, 0, 0.12)", 
      color: "rgba(0, 0, 0, 0.26)"
    }
  }}
>
  {isLocked 
    ? "Please Slow Down..." 
    : (activeStep === 2 && currentImageIndex === imagesToRate.length - 1 ? "Finish" : "Next")}
</Button>
          </CardContent>
        </Card>
      )}
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
