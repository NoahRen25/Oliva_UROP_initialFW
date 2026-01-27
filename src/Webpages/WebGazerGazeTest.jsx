import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import TuneIcon from '@mui/icons-material/Tune';
import { useWebGazer } from '../utils/WebGazerContext';

export default function WebGazerGazeTest() {
  const navigate = useNavigate();
  const {
    isInitialized,
    isCalibrated,
    isTracking,
    currentGaze,
    error,
    initWebGazer,
    pauseTracking,
    resumeTracking,
    showPredictionPoint,
    clearCalibration,
  } = useWebGazer();

  const [isLoading, setIsLoading] = useState(true);
  const [showBuiltInPoint, setShowBuiltInPoint] = useState(false);
  const gazePointRef = useRef(null);

  // Initialize WebGazer on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await initWebGazer();
      setIsLoading(false);
    };
    init();
  }, [initWebGazer]);

  // Update gaze point position smoothly
  useEffect(() => {
    if (gazePointRef.current && currentGaze.x !== null && currentGaze.y !== null) {
      // Clamp values to viewport
      const x = Math.max(0, Math.min(window.innerWidth - 20, currentGaze.x));
      const y = Math.max(0, Math.min(window.innerHeight - 20, currentGaze.y));
      gazePointRef.current.style.left = `${x}px`;
      gazePointRef.current.style.top = `${y}px`;
    }
  }, [currentGaze]);

  // Toggle WebGazer's built-in prediction point
  const toggleBuiltInPoint = useCallback(() => {
    setShowBuiltInPoint((prev) => {
      showPredictionPoint(!prev);
      return !prev;
    });
  }, [showPredictionPoint]);

  // Handle recalibrate
  const handleRecalibrate = useCallback(() => {
    navigate('/webgazer-calibration');
  }, [navigate]);

  // Handle clear data
  const handleClearData = useCallback(() => {
    if (window.confirm('This will clear all calibration data. You will need to recalibrate. Continue?')) {
      clearCalibration();
      navigate('/webgazer-calibration');
    }
  }, [clearCalibration, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          gap: 3,
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6">Loading Eye Tracker...</Typography>
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

  // Not calibrated warning
  if (!isCalibrated && isInitialized) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Eye tracker needs calibration for accurate results.
        </Alert>
        <Button
          variant="contained"
          startIcon={<TuneIcon />}
          onClick={handleRecalibrate}
          size="large"
        >
          Go to Calibration
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ position: 'relative', minHeight: 'calc(100vh - 80px)' }}>
      {/* Gaze Point Visualization */}
      {currentGaze.x !== null && currentGaze.y !== null && (
        <Box
          ref={gazePointRef}
          sx={{
            position: 'fixed',
            width: 30,
            height: 30,
            borderRadius: '50%',
            backgroundColor: 'rgba(244, 67, 54, 0.7)',
            border: '3px solid #d32f2f',
            boxShadow: '0 0 20px rgba(244, 67, 54, 0.5)',
            pointerEvents: 'none',
            zIndex: 9999,
            transform: 'translate(-50%, -50%)',
            transition: 'left 0.05s ease-out, top 0.05s ease-out',
          }}
        />
      )}

      {/* Control Panel */}
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          top: 100,
          right: 20,
          zIndex: 100,
          p: 3,
          borderRadius: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          minWidth: 280,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <CenterFocusStrongIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight="bold">
            Gaze Test
          </Typography>
        </Box>

        {/* Status */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Status
          </Typography>
          <Chip
            label={isTracking ? 'Tracking Active' : 'Paused'}
            color={isTracking ? 'success' : 'warning'}
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Gaze Coordinates */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Gaze Coordinates
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 2,
            }}
          >
            <Paper
              variant="outlined"
              sx={{ p: 1.5, textAlign: 'center', borderRadius: 2 }}
            >
              <Typography variant="caption" color="text.secondary">
                X Position
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {currentGaze.x !== null ? Math.round(currentGaze.x) : '—'}
              </Typography>
            </Paper>
            <Paper
              variant="outlined"
              sx={{ p: 1.5, textAlign: 'center', borderRadius: 2 }}
            >
              <Typography variant="caption" color="text.secondary">
                Y Position
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {currentGaze.y !== null ? Math.round(currentGaze.y) : '—'}
              </Typography>
            </Paper>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Controls */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            variant={isTracking ? 'outlined' : 'contained'}
            startIcon={isTracking ? <PauseIcon /> : <PlayArrowIcon />}
            onClick={isTracking ? pauseTracking : resumeTracking}
            fullWidth
          >
            {isTracking ? 'Pause' : 'Resume'}
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRecalibrate}
            fullWidth
          >
            Recalibrate
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClearData}
            fullWidth
          >
            Clear Data
          </Button>
        </Box>
      </Paper>

      {/* Instructions overlay */}
      <Paper
        elevation={2}
        sx={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          p: 2,
          borderRadius: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography variant="body2" color="text.secondary" textAlign="center">
          The <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>red dot</span> follows your gaze.
          Look at different parts of the screen to test accuracy.
        </Typography>
      </Paper>
    </Box>
  );
}
