import React from "react";
import { Slider } from "@mui/material";

export default function ScoreSlider({
  value,
  setValue,
  onInteraction,
  size = "medium",
}) {
  const handleChange = (e, v) => {
    setValue(v);
    if (onInteraction) onInteraction();
  };

  return (
    <Slider
      value={value}
      onChange={handleChange}
      step={1}
      marks
      min={1}
      max={5}
      size={size}
    />
  );
}
