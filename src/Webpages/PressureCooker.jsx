import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useResults } from "../Results";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardMedia,
  CardContent,
  Paper,
  CardActionArea,
} from "@mui/material";

const PAIRS = [
  {
    id: 1,
    left: { src: "/src/images/GPTMoonFlags.png", alt: "GPT Moon" },
    right: { src: "/src/images/FluxMoonFlags.png", alt: "Flux Moon" },
    prompt:
      "Surreal image of the United States flag and the flags of the five permanent members of the UN Security Council planted on the surface of the moon.",
  },
  {
    id: 2,
    left: { src: "/src/images/GPTShip.png", alt: "GPT Ship" },
    right: { src: "/src/images/FluxShip.png", alt: "Flux Ship" },
    prompt:
      "Image of a cargo ship sailing at sea, various nautical flags displayed along with the national flag of Panama.",
  },
  {
    id: 3,
    left: { src: "/src/images/GPTFlag.png", alt: "GPT Flag" },
    right: { src: "/src/images/FluxFlag.png", alt: "Flux Flag" },
    prompt:
      "Photorealistic image of a row of ten world flags waving in the wind, clear blue sky, 8k.",
  },
  {
    id: 4,
    left: { src: "/src/images/NanoMoonFlags.png", alt: "Nano Moon" },
    right: { src: "/src/images/GPTMoonFlags.png", alt: "GPT Moon" },
    prompt:
      "Surreal image of flags planted on the surface of the moon, Earth visible in the distance.",
  },
  {
    id: 5,
    left: { src: "/src/images/NanoShip.png", alt: "Nano Ship" },
    right: { src: "/src/images/FluxShip.png", alt: "Flux Ship" },
    prompt:
      "Cargo ship sailing at sea with nautical flags, realistic ocean waves.",
  },
  {
    id: 6,
    left: { src: "/src/images/NanoFlag.png", alt: "Nano Flag" },
    right: { src: "/src/images/FluxFlag.png", alt: "Flux Flag" },
    prompt:
      "Row of world flags waving in the wind, accurate flag colors and patterns.",
  },
];

const TIMER_DURATION = 3000; // 3 seconds in ms

export default function PressureCooker() {
  const navigate = useNavigate();
  const { addPressureCookerSession } = useResults();

  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [choices, setChoices] = useState([]);

  // Pressure Cooker specific state
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [showTooSlow, setShowTooSlow] = useState(false);
  const [bestStreak, setBestStreak] = useState(0);

  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isActiveRef = useRef(false);

  // Start/reset the timer
  const startTimer = useCallback(() => {
    startTimeRef.current = performance.now();
    isActiveRef.current = true;
    setTimeLeft(TIMER_DURATION);
    setShowTooSlow(false);
  }, []);

  // Timer loop using requestAnimationFrame
  useEffect(() => {
    if (step !== 1) return;

    const tick = (now) => {
      if (!isActiveRef.current) return;

      const elapsed = now - startTimeRef.current;
      const remaining = Math.max(0, TIMER_DURATION - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        // Time ran out!
        isActiveRef.current = false;
        setShowTooSlow(true);
        setStreak(0);

        // Move to next pair after showing TOO SLOW
        setTimeout(() => {
          if (currentPairIndex < PAIRS.length - 1) {
            setCurrentPairIndex((prev) => prev + 1);
            startTimer();
          } else {
            // End of pairs
            finishSession([...choices, {
              pairId: PAIRS[currentPairIndex].id,
              winnerSide: null,
              winnerName: "TIMEOUT",
              loserName: "TIMEOUT",
              responseTime: TIMER_DURATION,
            }]);
          }
        }, 1000);
        return;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    startTimer();
    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      isActiveRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [step, currentPairIndex]);

  // Keyboard controls
  useEffect(() => {
    if (step !== 1 || showTooSlow) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        handleSelection("left");
      } else if (e.key === "ArrowRight") {
        handleSelection("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, currentPairIndex, showTooSlow]);

  const finishSession = (finalChoices) => {
    addPressureCookerSession(username, finalChoices, Math.max(bestStreak, streak));
    navigate("/pairwise-result");
  };

  const handleSelection = (side) => {
    if (!isActiveRef.current || showTooSlow) return;

    isActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const currentPair = PAIRS[currentPairIndex];
    const responseTime = TIMER_DURATION - timeLeft;

    const choiceData = {
      pairId: currentPair.id,
      winnerSide: side,
      winnerName: side === "left" ? currentPair.left.alt : currentPair.right.alt,
      loserName: side === "left" ? currentPair.right.alt : currentPair.left.alt,
      responseTime: Math.round(responseTime),
    };

    const newChoices = [...choices, choiceData];
    setChoices(newChoices);

    const newStreak = streak + 1;
    setStreak(newStreak);
    if (newStreak > bestStreak) {
      setBestStreak(newStreak);
    }

    if (currentPairIndex < PAIRS.length - 1) {
      setCurrentPairIndex((prev) => prev + 1);
    } else {
      finishSession(newChoices);
    }
  };

  const progress = (timeLeft / TIMER_DURATION) * 100;
  const isUrgent = timeLeft < 1000;
  const isStreakHigh = streak >= 5;

  return (
    <Container maxWidth="lg" sx={{ mt: 2, position: "relative" }}>
      {step === 0 ? (
        <Paper sx={{ p: 4, maxWidth: 500, mx: "auto", textAlign: "center" }}>
          <Typography variant="h4" gutterBottom sx={{ color: "#d32f2f", fontWeight: "bold" }}>
            🔥 Pressure Cooker Mode
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
            You have 3 seconds to choose! Build your streak by making quick decisions.
            Use <strong>Arrow Keys</strong> (← Left, → Right) or click to select.
          </Typography>
          <TextField
            label="User ID (Numeric)"
            fullWidth
            sx={{ mb: 3 }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Button
            variant="contained"
            color="error"
            size="large"
            onClick={() => setStep(1)}
            disabled={!/^\d+$/.test(username)}
          >
            Start Challenge
          </Button>
        </Paper>
      ) : (
        <Box sx={{ position: "relative" }}>
          {/* Progress Bar */}
          <Box
            sx={{
              position: "fixed",
              top: 64,
              left: 0,
              right: 0,
              height: 8,
              backgroundColor: "#e0e0e0",
              zIndex: 1200,
            }}
          >
            <Box
              sx={{
                height: "100%",
                width: `${progress}%`,
                backgroundColor: isUrgent ? "#d32f2f" : "#4caf50",
                transition: "background-color 0.3s",
              }}
            />
          </Box>

          {/* Streak Badge */}
          <Box
            sx={{
              position: "fixed",
              top: 80,
              right: 20,
              zIndex: 1200,
              backgroundColor: isStreakHigh ? "#ff9800" : "#1976d2",
              color: "white",
              padding: "8px 16px",
              borderRadius: 2,
              fontWeight: "bold",
              fontSize: "1.2rem",
              boxShadow: 3,
              animation: isStreakHigh ? "shake 0.5s infinite, glow 1s infinite alternate" : "none",
              "@keyframes shake": {
                "0%, 100%": { transform: "translateX(0)" },
                "25%": { transform: "translateX(-3px)" },
                "75%": { transform: "translateX(3px)" },
              },
              "@keyframes glow": {
                "0%": { boxShadow: "0 0 5px #ff9800, 0 0 10px #ff9800" },
                "100%": { boxShadow: "0 0 20px #ff9800, 0 0 30px #ff9800" },
              },
            }}
          >
            🔥 Streak: {streak}
          </Box>

          {/* Timer Display */}
          <Box
            sx={{
              position: "fixed",
              top: 80,
              left: 20,
              zIndex: 1200,
              backgroundColor: isUrgent ? "#d32f2f" : "#424242",
              color: "white",
              padding: "8px 16px",
              borderRadius: 2,
              fontWeight: "bold",
              fontSize: "1.5rem",
              fontFamily: "monospace",
              boxShadow: 3,
              animation: isUrgent ? "pulse 0.3s infinite" : "none",
              "@keyframes pulse": {
                "0%, 100%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.05)" },
              },
            }}
          >
            {(timeLeft / 1000).toFixed(1)}s
          </Box>

          {/* TOO SLOW Overlay */}
          {showTooSlow && (
            <Box
              sx={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(211, 47, 47, 0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1300,
                animation: "fadeIn 0.2s",
                "@keyframes fadeIn": {
                  "0%": { opacity: 0 },
                  "100%": { opacity: 1 },
                },
              }}
            >
              <Typography
                variant="h1"
                sx={{
                  color: "white",
                  fontWeight: "bold",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                  animation: "zoomIn 0.3s",
                  "@keyframes zoomIn": {
                    "0%": { transform: "scale(0.5)", opacity: 0 },
                    "100%": { transform: "scale(1)", opacity: 1 },
                  },
                }}
              >
                TOO SLOW!
              </Typography>
            </Box>
          )}

          {/* Pair Info */}
          <Typography variant="h6" align="center" gutterBottom sx={{ mt: 2 }}>
            Pair {currentPairIndex + 1} of {PAIRS.length}
          </Typography>
          <Typography align="center" sx={{ mb: 2, color: "text.secondary", fontSize: "0.9rem" }}>
            {PAIRS[currentPairIndex].prompt}
          </Typography>
          <Typography align="center" sx={{ mb: 2, fontWeight: "bold" }}>
            ← Left Arrow | Right Arrow →
          </Typography>

          {/* Image Cards */}
          <Box
            sx={{
              display: "flex",
              gap: 4,
              justifyContent: "center",
              alignItems: "stretch",
              flexWrap: "wrap",
            }}
          >
            {/* LEFT IMAGE */}
            <Card
              sx={{
                flex: "1 1 400px",
                maxWidth: 500,
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: 8,
                },
              }}
            >
              <CardActionArea onClick={() => handleSelection("left")} disabled={showTooSlow}>
                <CardMedia
                  component="img"
                  height="350"
                  image={PAIRS[currentPairIndex].left.src}
                  sx={{ objectFit: "contain", backgroundColor: "#f5f5f5" }}
                />
                <CardContent sx={{ backgroundColor: "#e3f2fd" }}>
                  <Typography align="center" fontWeight="bold">
                    ← {PAIRS[currentPairIndex].left.alt}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>

            {/* VS Divider */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  color: "#d32f2f",
                }}
              >
                VS
              </Typography>
            </Box>

            {/* RIGHT IMAGE */}
            <Card
              sx={{
                flex: "1 1 400px",
                maxWidth: 500,
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "pointer",
                "&:hover": {
                  transform: "scale(1.02)",
                  boxShadow: 8,
                },
              }}
            >
              <CardActionArea onClick={() => handleSelection("right")} disabled={showTooSlow}>
                <CardMedia
                  component="img"
                  height="350"
                  image={PAIRS[currentPairIndex].right.src}
                  sx={{ objectFit: "contain", backgroundColor: "#f5f5f5" }}
                />
                <CardContent sx={{ backgroundColor: "#fff3e0" }}>
                  <Typography align="center" fontWeight="bold">
                    {PAIRS[currentPairIndex].right.alt} →
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Box>
        </Box>
      )}
    </Container>
  );
}
