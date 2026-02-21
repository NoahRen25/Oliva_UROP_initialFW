import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebGazer } from '../utils/WebGazerContext';
import {
  Container, Paper, Typography, Button, Box,
} from '@mui/material';

export default function CalibrationGate({ children }) {
  const navigate = useNavigate();
  const { isCalibrated, isInitialized, initWebGazer, error } = useWebGazer();

  if (isCalibrated) {
    return <>{children}</>;
  }

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
