/**
 * WebGazerCalibration.jsx — "/webgazer-calibration": click-based 9-point
 * eye-tracker calibration (5 clicks per point on a 3×3 grid). Initializes
 * WebGazer, records calibration through WebGazerContext (persisted to
 * localStorage), then continues to `returnTo`/the guided uploadConfig
 * route — this is the first stop of every guided session.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  LinearProgress,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useWebGazer } from '../utils/WebGazerContext';

// 9-point calibration grid positions (percentage-based)
// Perfect 3x3 symmetrical grid: 10%/50%/90% on both axes
const CALIBRATION_POINTS = [
  { id: 1, x: 10, y: 10 },   // Top-left
  { id: 2, x: 50, y: 10 },   // Top-center
  { id: 3, x: 90, y: 10 },   // Top-right
  { id: 4, x: 10, y: 50 },   // Middle-left
  { id: 5, x: 50, y: 50 },   // Center
  { id: 6, x: 90, y: 50 },   // Middle-right
  { id: 7, x: 10, y: 90 },   // Bottom-left
  { id: 8, x: 50, y: 90 },   // Bottom-center
  { id: 9, x: 90, y: 90 },   // Bottom-right
];

const CLICKS_PER_POINT = 5;

export default function WebGazerCalibration() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo ?? null;
  const uploadConfig = location.state?.uploadConfig ?? null;
  const {
    isInitialized,
    isCalibrated,
    error,
    initWebGazer,
    recordCalibrationPoint,
    completeCalibration,
    clearCalibration,
    showPredictionPoint,
  } = useWebGazer();

  const [calibrationData, setCalibrationData] = useState(
    CALIBRATION_POINTS.map((pt) => ({ ...pt, clicks: 0 }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activePoint, setActivePoint] = useState(null);
  const [showDoneDialog, setShowDoneDialog] = useState(false);

  // Calculate progress
  const totalClicks = calibrationData.reduce((sum, pt) => sum + pt.clicks, 0);
  const totalRequired = CALIBRATION_POINTS.length * CLICKS_PER_POINT;
  const progress = (totalClicks / totalRequired) * 100;
  const completedPoints = calibrationData.filter((pt) => pt.clicks >= CLICKS_PER_POINT).length;
  const isComplete = completedPoints === CALIBRATION_POINTS.length;

  // Initialize WebGazer on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await initWebGazer();
      showPredictionPoint(false);
      setIsLoading(false);
    };
    init();
  }, [initWebGazer, showPredictionPoint]);

  // Handle calibration point click
  const handlePointClick = useCallback(
    (pointId, event) => {
      const point = calibrationData.find((pt) => pt.id === pointId);
      if (!point || point.clicks >= CLICKS_PER_POINT) return;

      // Use clientX/Y for accurate screen position recording
      // This is more accurate than bounding rect center, especially on high-DPI displays
      // Also accounts for the exact spot where the user clicked
      const x = event.clientX;
      const y = event.clientY;
      recordCalibrationPoint(x, y);

      // Update local state
      setCalibrationData((prev) =>
        prev.map((pt) =>
          pt.id === pointId ? { ...pt, clicks: pt.clicks + 1 } : pt
        )
      );

      // Visual feedback
      setActivePoint(pointId);
      setTimeout(() => setActivePoint(null), 150);
    },
    [calibrationData, recordCalibrationPoint]
  );

  // Reset calibration
  const handleRestart = useCallback(() => {
    clearCalibration();
    setCalibrationData(CALIBRATION_POINTS.map((pt) => ({ ...pt, clicks: 0 })));
  }, [clearCalibration]);

  const handleContinue = useCallback(() => {
    completeCalibration();
    setShowDoneDialog(true);
  }, [completeCalibration]);

  const handleDialogContinue = useCallback(() => {
    setShowDoneDialog(false);
    navigate('/webgazer-gaze-test', { state: { uploadConfig, returnTo } });
  }, [navigate, uploadConfig, returnTo]);

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '70vh',
            gap: 3,
          }}
        >
          <CircularProgress size={60} />
          <Typography variant="h6">Initializing Eye Tracker...</Typography>
          <Typography variant="body2" color="text.secondary">
            Please allow camera access when prompted
          </Typography>
        </Box>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ position: 'relative', minHeight: 'calc(100vh - 80px)', p: 2 }}>
      {/* Header with instructions and progress */}
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          top: 130,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          p: 3,
          borderRadius: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          minWidth: 350,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <VisibilityIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight="bold">
            Eye Tracking Calibration
          </Typography>
        </Box>

        <Typography variant="body1" sx={{ mb: 2 }}>
          Click each dot <strong>{CLICKS_PER_POINT} times</strong> while looking directly at it
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress: {completedPoints} / {CALIBRATION_POINTS.length} points
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRestart}
            size="small"
          >
            Restart
          </Button>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={handleContinue}
            disabled={!isComplete}
            size="small"
          >
            Continue to Test
          </Button>
        </Box>
      </Paper>

      <Dialog open={showDoneDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Calibration Done!</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            On the next screen you'll see a red dot tracking your gaze. A small
            amount of drift is normal — eye tracking is rarely perfectly precise.
            <Box component="ul" sx={{ pl: 3, my: 1.5 }}>
              <li>
                If the dot follows your gaze reasonably well, click{' '}
                <strong>Continue</strong> in the bottom right to proceed.
              </li>
              <li>
                Only click <strong>Re-do Calibration</strong> in the bottom
                left if the tracking is <em>wildly</em> inaccurate (e.g. the
                dot is stuck in one spot, or in a completely different region
                from where you're looking).
              </li>
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleDialogContinue}>
            Go to Test Screen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Calibration Points Grid — hidden while the done dialog is open */}
      {!showDoneDialog && calibrationData.map((point) => {
        const isPointComplete = point.clicks >= CLICKS_PER_POINT;
        const isActive = activePoint === point.id;
        const clickProgress = point.clicks / CLICKS_PER_POINT;

        return (
          <Box
            key={point.id}
            onClick={(e) => handlePointClick(point.id, e)}
            sx={{
              position: 'fixed',
              left: `${point.x}%`,
              top: `${point.y}%`,
              transform: 'translate(-50%, -50%)',
              width: isActive ? 35 : 50,
              height: isActive ? 35 : 50,
              borderRadius: '50%',
              backgroundColor: isPointComplete
                ? '#4caf50'
                : `rgba(33, 150, 243, ${0.4 + clickProgress * 0.6})`,
              border: `3px solid ${isPointComplete ? '#2e7d32' : '#1976d2'}`,
              cursor: isPointComplete ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              zIndex: 10000,
              boxShadow: isActive
                ? '0 0 20px rgba(33, 150, 243, 0.8)'
                : '0 4px 12px rgba(0,0,0,0.2)',
              '&:hover': {
                transform: isPointComplete
                  ? 'translate(-50%, -50%)'
                  : 'translate(-50%, -50%) scale(1.1)',
                boxShadow: isPointComplete
                  ? '0 4px 12px rgba(0,0,0,0.2)'
                  : '0 0 25px rgba(33, 150, 243, 0.6)',
              },
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              }}
            >
              {isPointComplete ? '✓' : point.clicks}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
