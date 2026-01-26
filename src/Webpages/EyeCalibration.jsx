import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import HomeIcon from "@mui/icons-material/Home";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";

import useWebGazer from "../hooks/useWebGazer";
import CalibrationGrid from "../components/calibration/CalibrationGrid";
import AccuracyTest from "../components/calibration/AccuracyTest";

const ACCURACY_THRESHOLD = 70;

export default function EyeCalibration() {
  const navigate = useNavigate();
  const {
    isInitialized,
    isLoading,
    error,
    prediction,
    initWebGazer,
    recordCalibrationPoint,
    clearCalibration,
    showVideo,
    endWebGazer,
  } = useWebGazer();

  // Steps: 0=intro, 1=camera, 2=calibration, 3=accuracy test, 4=results
  const [step, setStep] = useState(0);
  const [accuracy, setAccuracy] = useState(null);

  const handleStartCalibration = async () => {
    setStep(1);
    await initWebGazer();
  };

  const handleCameraReady = () => {
    showVideo(false);
    setStep(2);
  };

  const handleCalibrationComplete = useCallback(() => {
    setStep(3);
  }, []);

  const handleAccuracyComplete = useCallback((result) => {
    setAccuracy(result);
    setStep(4);
  }, []);

  const handleRecalibrate = () => {
    clearCalibration();
    setAccuracy(null);
    setStep(2);
  };

  const handleClearAndRecalibrate = () => {
    clearCalibration();
    setAccuracy(null);
    setStep(0);
  };

  const handleReturnHome = () => {
    endWebGazer();
    navigate("/");
  };

  const isAccuracyGood = accuracy !== null && accuracy >= ACCURACY_THRESHOLD;

  // Step 0: Introduction
  if (step === 0) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <VisibilityIcon sx={{ fontSize: 80, color: "#00bcd4", mb: 2 }} />
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Eye Tracking Calibration
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
            This process will calibrate the eye tracking system for accurate
            gaze detection. You will need to:
          </Typography>
          <Box sx={{ textAlign: "left", mb: 3, pl: 4 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              1. Grant camera permission
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              2. Position your face in the camera view
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              3. Click 9 calibration points (5 times each)
            </Typography>
            <Typography variant="body2">
              4. Complete a 5-second accuracy test
            </Typography>
          </Box>
          <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
            For best results, ensure good lighting and keep your head relatively
            still during calibration.
          </Alert>
          <Button
            variant="contained"
            size="large"
            onClick={handleStartCalibration}
            sx={{ backgroundColor: "#00bcd4" }}
          >
            Start Calibration
          </Button>
        </Paper>
      </Container>
    );
  }

  // Step 1: Camera Permission / Loading
  if (step === 1) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          {isLoading ? (
            <>
              <CircularProgress size={60} sx={{ mb: 3, color: "#00bcd4" }} />
              <Typography variant="h5" gutterBottom>
                Initializing Camera...
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please allow camera access when prompted
              </Typography>
            </>
          ) : error ? (
            <>
              <WarningIcon sx={{ fontSize: 60, color: "#f44336", mb: 2 }} />
              <Typography variant="h5" gutterBottom color="error">
                Camera Error
              </Typography>
              <Typography variant="body2" sx={{ mb: 3 }}>
                {error}
              </Typography>
              <Button variant="outlined" onClick={() => setStep(0)}>
                Try Again
              </Button>
            </>
          ) : isInitialized ? (
            <>
              <CheckCircleIcon sx={{ fontSize: 60, color: "#4caf50", mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Camera Ready
              </Typography>
              <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
                Your camera is working. The video preview is shown in the corner.
                Position yourself so your face is clearly visible.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleCameraReady}
                sx={{ backgroundColor: "#4caf50" }}
              >
                Continue to Calibration
              </Button>
            </>
          ) : null}
        </Paper>
      </Container>
    );
  }

  // Step 2: Calibration Grid
  if (step === 2) {
    return (
      <CalibrationGrid
        onCalibrationComplete={handleCalibrationComplete}
        onRecordPoint={recordCalibrationPoint}
      />
    );
  }

  // Step 3: Accuracy Test
  if (step === 3) {
    return (
      <AccuracyTest
        prediction={prediction}
        onTestComplete={handleAccuracyComplete}
      />
    );
  }

  // Step 4: Results
  if (step === 4) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          {isAccuracyGood ? (
            <CheckCircleIcon sx={{ fontSize: 80, color: "#4caf50", mb: 2 }} />
          ) : (
            <WarningIcon sx={{ fontSize: 80, color: "#ff9800", mb: 2 }} />
          )}

          <Typography variant="h4" gutterBottom fontWeight="bold">
            Calibration {isAccuracyGood ? "Complete" : "Needs Improvement"}
          </Typography>

          <Box
            sx={{
              my: 3,
              p: 3,
              borderRadius: 2,
              backgroundColor: isAccuracyGood ? "#e8f5e9" : "#fff3e0",
            }}
          >
            <Typography
              variant="h2"
              fontWeight="bold"
              sx={{ color: isAccuracyGood ? "#4caf50" : "#ff9800" }}
            >
              {accuracy}%
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Accuracy Score
            </Typography>
          </Box>

          {isAccuracyGood ? (
            <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
              Your eye tracking is calibrated and ready to use. The calibration
              data has been saved for future sessions.
            </Typography>
          ) : (
            <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
              The accuracy is below {ACCURACY_THRESHOLD}%. For better results,
              try recalibrating with improved lighting or head position.
            </Typography>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {!isAccuracyGood && (
              <Button
                variant="contained"
                size="large"
                startIcon={<RefreshIcon />}
                onClick={handleRecalibrate}
                sx={{ backgroundColor: "#ff9800" }}
              >
                Recalibrate
              </Button>
            )}

            <Button
              variant={isAccuracyGood ? "contained" : "outlined"}
              size="large"
              startIcon={<HomeIcon />}
              onClick={handleReturnHome}
              sx={isAccuracyGood ? { backgroundColor: "#4caf50" } : {}}
            >
              Return to Home
            </Button>

            <Button
              variant="text"
              size="small"
              onClick={handleClearAndRecalibrate}
              sx={{ color: "text.secondary" }}
            >
              Clear Calibration Data & Start Over
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return null;
}
