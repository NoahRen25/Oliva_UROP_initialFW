import React, { createContext, useContext } from 'react';
import useGazeTracker from '../hooks/useGazeTracker';

const GazeTrackingContext = createContext(null);

export function useGazeTracking() {
  const context = useContext(GazeTrackingContext);
  if (!context) {
    throw new Error('useGazeTracking must be used within a GazeTrackingProvider');
  }
  return context;
}

export default function GazeTrackingProvider({ children }) {
  const gazeTracker = useGazeTracker();

  return (
    <GazeTrackingContext.Provider value={gazeTracker}>
      {children}
    </GazeTrackingContext.Provider>
  );
}
