import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container, Paper, Typography, Box, Button, CircularProgress,
} from "@mui/material";
import { useWebGazer } from "../utils/WebGazerContext";

const POINT_DURATION_MS = 1500;
const ERROR_THRESHOLD_PX = 100;
const SAMPLE_INTERVAL_MS = 50;

const TARGET_POSITIONS = [
  { xPct: 0.5, yPct: 0.5, label: "center" },
  { xPct: 0.15, yPct: 0.2, label: "top-left" },
  { xPct: 0.85, yPct: 0.2, label: "top-right" },
  { xPct: 0.15, yPct: 0.8, label: "bottom-left" },
  { xPct: 0.85, yPct: 0.8, label: "bottom-right" },
];

export default function CalibrationCheck() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig ?? null;
  const nextRoute = uploadConfig?.route ?? "/";

  const { currentGaze, isTracking } = useWebGazer();
  const gazeRef = useRef(currentGaze);
  useEffect(() => { gazeRef.current = currentGaze; }, [currentGaze]);

  const [phase, setPhase] = useState("running");
  const [pointIndex, setPointIndex] = useState(0);
  const [meanError, setMeanError] = useState(null);
  const errorsRef = useRef([]);

  useEffect(() => {
    if (!uploadConfig) {
      navigate("/", { replace: true });
      return;
    }
    if (!isTracking) {
      navigate(nextRoute, { state: { uploadConfig }, replace: true });
    }
  }, [uploadConfig, isTracking, navigate, nextRoute]);

  useEffect(() => {
    if (phase !== "running") return;
    if (pointIndex >= TARGET_POSITIONS.length) {
      const errs = errorsRef.current;
      const mean = errs.length ? errs.reduce((a, b) => a + b, 0) / errs.length : 0;
      setMeanError(mean);
      if (mean <= ERROR_THRESHOLD_PX) {
        setPhase("passed");
        const t = setTimeout(() => {
          navigate(nextRoute, { state: { uploadConfig }, replace: true });
        }, 800);
        return () => clearTimeout(t);
      }
      setPhase("failed");
      return;
    }

    const target = TARGET_POSITIONS[pointIndex];
    const targetX = window.innerWidth * target.xPct;
    const targetY = window.innerHeight * target.yPct;
    const samples = [];

    const sampler = setInterval(() => {
      const g = gazeRef.current;
      if (g?.x != null && g?.y != null) {
        const dx = g.x - targetX;
        const dy = g.y - targetY;
        samples.push(Math.hypot(dx, dy));
      }
    }, SAMPLE_INTERVAL_MS);

    const advance = setTimeout(() => {
      clearInterval(sampler);
      if (samples.length > 0) {
        const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
        errorsRef.current.push(avg);
      }
      setPointIndex((i) => i + 1);
    }, POINT_DURATION_MS);

    return () => {
      clearInterval(sampler);
      clearTimeout(advance);
    };
  }, [phase, pointIndex, navigate, nextRoute, uploadConfig]);

  const handleRecalibrate = () => {
    navigate("/webgazer-calibration", {
      state: { uploadConfig, returnTo: nextRoute },
      replace: true,
    });
  };

  const handleContinue = () => {
    navigate(nextRoute, { state: { uploadConfig }, replace: true });
  };

  if (phase === "running" && pointIndex < TARGET_POSITIONS.length) {
    const target = TARGET_POSITIONS[pointIndex];
    return (
      <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.85)", zIndex: 1400 }}>
        <Box sx={{ position: "absolute", top: 24, left: 0, right: 0, textAlign: "center" }}>
          <Typography color="white" variant="body2">
            Quick gaze check — look at each dot ({pointIndex + 1} / {TARGET_POSITIONS.length})
          </Typography>
        </Box>
        <Box
          sx={{
            position: "absolute",
            left: `calc(${target.xPct * 100}% - 12px)`,
            top: `calc(${target.yPct * 100}% - 12px)`,
            width: 24,
            height: 24,
            borderRadius: "50%",
            bgcolor: "#ff5252",
            boxShadow: "0 0 16px rgba(255,82,82,0.8)",
            animation: "pulse-dot 1s ease-in-out infinite",
          }}
        />
        <style>{`@keyframes pulse-dot{0%,100%{transform:scale(1)}50%{transform:scale(1.4)}}`}</style>
      </Box>
    );
  }

  if (phase === "passed") {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Looks good — continuing…</Typography>
          {meanError != null && (
            <Typography variant="caption" color="text.secondary">
              mean error {Math.round(meanError)} px
            </Typography>
          )}
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          Eye tracker accuracy looks low
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          mean error {meanError != null ? Math.round(meanError) : "—"} px
          (threshold {ERROR_THRESHOLD_PX} px)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Recalibrating takes about 30 seconds and improves the data we collect.
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Button variant="contained" onClick={handleRecalibrate}>
            Recalibrate
          </Button>
          <Button variant="outlined" onClick={handleContinue}>
            Continue anyway
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
