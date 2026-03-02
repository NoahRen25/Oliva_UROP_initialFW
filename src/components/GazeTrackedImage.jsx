import React, { useRef, useEffect } from 'react';
import { CardMedia } from '@mui/material';
import { useGazeTracking } from './GazeTrackingProvider';

export default function GazeTrackedImage({ imageId, sx, ...props }) {
  const ref = useRef(null);
  const { registerImage, unregisterImage, currentlyGazedId, debugEnabled } = useGazeTracking();

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

  const debugSx = debugEnabled
    ? {
        outline: currentlyGazedId === imageId
          ? '4px solid rgba(0, 200, 0, 0.7)'
          : '4px solid rgba(200, 0, 0, 0.3)',
        outlineOffset: '-4px',
        transition: 'outline-color 0.15s ease',
      }
    : {};

  return <CardMedia ref={ref} sx={{ ...sx, ...debugSx }} {...props} />;
}
