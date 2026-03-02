import React, { useRef, useEffect } from 'react';
import { CardMedia } from '@mui/material';
import { useGazeTracking } from './GazeTrackingProvider';

export default function GazeTrackedImage({ imageId, ...props }) {
  const ref = useRef(null);
  const { registerImage, unregisterImage, debugMode } = useGazeTracking();

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

  const debugSx = debugMode ? { ...props.sx, transition: 'box-shadow 0.15s ease-in-out' } : props.sx;

  return <CardMedia ref={ref} {...props} sx={debugSx} />;
}
