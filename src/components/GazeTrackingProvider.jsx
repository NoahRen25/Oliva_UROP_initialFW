import React, { createContext, useContext } from 'react';
import useGazeTracker from '../hooks/useGazeTracker';
import GazeDebugOverlay from './GazeDebugOverlay';

const GazeTrackingContext = createContext(null);

export function useGazeTracking() {
  const context = useContext(GazeTrackingContext);
  if (!context) {
    throw new Error('useGazeTracking must be used within a GazeTrackingProvider');
  }
  return context;
}

export default function GazeTrackingProvider({ children, debugMode = true }) {
  const gazeTracker = useGazeTracker({ debugMode });

  return (
    <GazeTrackingContext.Provider value={{ ...gazeTracker, debugMode }}>
      {children}
      {debugMode && <GazeDebugOverlay />}
    </GazeTrackingContext.Provider>
  );
}
