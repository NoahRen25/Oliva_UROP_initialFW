import React, { createContext, useContext, useEffect } from 'react';
import useGazeTracker from '../hooks/useGazeTracker';

const GazeTrackingContext = createContext(null);

export function useGazeTracking() {
  const context = useContext(GazeTrackingContext);
  if (!context) {
    throw new Error('useGazeTracking must be used within a GazeTrackingProvider');
  }
  return context;
}

/**
 * useGazePage — declarative wrapper around startPage/endPage.
 *
 * Pass the current `pageKey` and `format` while the user is on a page
 * (e.g. "ranked-3", "best-worst-4"). When pageKey changes the previous
 * page is flushed (image bounding boxes captured at that moment) and a
 * new page begins. Pass null/undefined pageKey to disable.
 */
export function useGazePage(pageKey, format) {
  const ctx = useContext(GazeTrackingContext);
  useEffect(() => {
    if (!ctx) return;
    if (pageKey == null) return;
    ctx.startPage(pageKey, format);
    return () => {
      ctx.endPage();
    };
  }, [ctx, pageKey, format]);
}

export default function GazeTrackingProvider({ children }) {
  const gazeTracker = useGazeTracker();

  return (
    <GazeTrackingContext.Provider value={gazeTracker}>
      {children}
    </GazeTrackingContext.Provider>
  );
}
