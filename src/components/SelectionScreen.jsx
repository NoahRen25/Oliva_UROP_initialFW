import React from "react";
import { Box, Typography, Slider, TextField } from "@mui/material";

export default function SelectionScreen({
  range,
  setRange,
  count,
  setCount,
  availableCount,
  pageSize,
}) {
  const handleSliderChange = (event, newValue) => {
    setRange(newValue);
  };

  return (
    <>

      <Typography gutterBottom>
        Memorability Range: <strong>{range[0].toFixed(2)} - {range[1].toFixed(2)}</strong>
      </Typography>
      
      <Slider
        value={range}
        onChange={handleSliderChange}
        valueLabelDisplay="auto"
        min={0}
        max={1}
        step={0.01}
        sx={{ mb: 4 }}
      />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Typography color="text.secondary">
          Images matching criteria: <strong>{availableCount}</strong>
        </Typography>
      </Box>

      <TextField
        label="Number of images to rate"
        type="number"
        fullWidth
        value={count}
        onChange={(e) => setCount((e.target.value))}
        helperText={`Maximum available: ${availableCount}`}
        InputProps={{ inputProps: {max: availableCount, step: pageSize} }}
      />
      </>
  );
}