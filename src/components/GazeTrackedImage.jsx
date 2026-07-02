/**
 * GazeTrackedImage.jsx — Drop-in replacement for MUI <CardMedia> that
 * registers its DOM element with the surrounding GazeTrackingProvider under
 * `imageId`, so useGazeTracker can hit-test gaze coordinates against it.
 * Unregisters on unmount. Use this instead of CardMedia for any image whose
 * gaze data should be recorded.
 */
import React, { useRef, useEffect } from 'react';
import { CardMedia } from '@mui/material';
import { useGazeTracking } from './GazeTrackingProvider';

export default function GazeTrackedImage({ imageId, ...props }) {
  const ref = useRef(null);
  const { registerImage, unregisterImage } = useGazeTracking();

  useEffect(() => {
    if (ref.current && imageId) {
      registerImage(imageId, ref.current);
    }
    return () => {
      if (imageId) {
        unregisterImage(imageId);
      }
    };
  }, [imageId, registerImage, unregisterImage]);

  return <CardMedia ref={ref} {...props} />;
}
