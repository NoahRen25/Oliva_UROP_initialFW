import React from "react";
import { Box, Card, Typography, Slider } from "@mui/material";
import GazeTrackedImage from './GazeTrackedImage';

export default function ImageGrid({ 
  images, 
  ratings, 
  setRatings, 
  trackMove, 
  columns, 
  imageHeight, 
  removeCenter,
  showRating = true // New Prop, defaults to true
}) {
  
  const handleSliderChange = (id, value) => {
    setRatings((prev) => ({ ...prev, [id]: value }));
  };

  const handleSliderCommitted = (id) => {
    trackMove(id); 
  };

  const gridSlots = React.useMemo(() => {
    if (removeCenter && columns === 3) {
      const copy = [...images];
      copy.splice(4, 0, null);
      return copy;
    }
    return images;
  }, [images, removeCenter, columns]);

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        alignItems: "start",
      }}
    >
      {gridSlots.map((img, index) => (
        <Box key={img ? img.id : `spacer-${index}`}>
          {img ? (
            <Card sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <GazeTrackedImage
                imageId={img.id}
                component="img"
                image={img.path.startsWith("http") ? img.path : `/${img.path}`}
                sx={{
                  height: imageHeight || "25vh",
                  width: "100%",
                  objectFit: "contain",
                  bgcolor: '#f0f0f0',
                  borderRadius: 1
                }}
              />
              <Box sx={{ px: 1, mt: 1 }}>
                {/* CONDITIONAL RENDERING HERE */}
                {showRating && (
                  <Typography variant="caption" color="text.secondary" align="center" display="block">
                    Rating: {ratings[img.id] ?? 5}
                  </Typography>
                )}
                
                <Slider
                  value={ratings[img.id] ?? 5}
                  min={1}
                  max={10}
                  step={1}
                  marks
                  onChange={(e, val) => handleSliderChange(img.id, val)}
                  onChangeCommitted={() => handleSliderCommitted(img.id)}
                />
              </Box>
            </Card>
          ) : (
            <Box sx={{ height: imageHeight || "25vh" }} />
          )}
        </Box>
      ))}
    </Box>
  );
}