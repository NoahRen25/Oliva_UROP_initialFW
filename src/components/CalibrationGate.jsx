import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebGazer } from '../utils/WebGazerContext';
import {
  Container, Paper, Typography, Button, Box, CircularProgress,
} from '@mui/material';

export default function CalibrationGate({ children }) {
  const navigate = useNavigate();
  const { isCalibrated, isInitialized, isTracking, initWebGazer, error } = useWebGazer();

  // Auto-initialize WebGazer when calibrated but not yet initialized
  useEffect(() => {
    if (isCalibrated && !isInitialized) {
      initWebGazer();
    }
  }, [isCalibrated, isInitialized, initWebGazer]);

  // Calibrated and actively tracking → render children
  if (isCalibrated && isTracking) {
    return <>{children}</>;
  }

  // Calibrated but still initializing → show loading
  if (isCalibrated) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Initializing Eye Tracker...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please allow camera access if prompted.
          </Typography>
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Paper>
      </Container>
    );
  }

  // Not calibrated → prompt user to calibrate
  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Eye Tracking Calibration Required
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Before starting the rating session, you need to calibrate the eye
          tracker. This ensures accurate gaze data collection.
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/webgazer-calibration')}
          >
            Go to Calibration
          </Button>
          {!isInitialized && (
            <Button
              variant="outlined"
              onClick={initWebGazer}
            >
              Initialize WebGazer
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
