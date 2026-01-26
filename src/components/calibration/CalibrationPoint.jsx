import React, { useCallback, memo } from "react";
import { Box } from "@mui/material";

const CalibrationPoint = memo(function CalibrationPoint({
  id,
  pixelX,
  pixelY,
  clickCount,
  isComplete,
  isVisible,
  onClick,
}) {
  // Use pre-calculated pixel positions instead of getBoundingClientRect()
  const handleClick = useCallback(() => {
    if (!isComplete && onClick) {
      onClick(id, pixelX, pixelY);
    }
  }, [id, pixelX, pixelY, isComplete, onClick]);

  if (!isVisible) return null;

  // Opacity increases with clicks: 0.2 -> 1.0 over 5 clicks
  const opacity = 0.2 + clickCount * 0.16;
  const backgroundColor = isComplete ? "#ffeb3b" : "#f44336";

  return (
    <Box
      onClick={handleClick}
      sx={{
        position: "absolute",
        left: pixelX,
        top: pixelY,
        transform: "translate(-50%, -50%)",
        zIndex: 10001,
        width: 40,
        height: 40,
        borderRadius: "50%",
        backgroundColor,
        opacity,
        cursor: isComplete ? "default" : "pointer",
        // Removed transitions for snappier response
        boxShadow: isComplete
          ? "0 0 10px 3px rgba(255, 235, 59, 0.6)"
          : "0 2px 8px rgba(0,0,0,0.3)",
        "&:hover": isComplete
          ? {}
          : {
              transform: "translate(-50%, -50%) scale(1.1)",
              boxShadow: "0 0 15px rgba(244, 67, 54, 0.5)",
            },
        "&:active": isComplete
          ? {}
          : {
              transform: "translate(-50%, -50%) scale(0.95)",
            },
      }}
    />
  );
});

export default CalibrationPoint;
