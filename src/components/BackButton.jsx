import React, { useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function BackButton({ label = "Go Back", fallbackPath = "/" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoBack = useCallback(() => {
    // Check if there's history to go back to
    // window.history.length > 2 because initial page load counts as 1-2 entries
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      // No history, navigate to fallback (home)
      navigate(fallbackPath);
    }
  }, [navigate, fallbackPath]);

  return (
    <Box sx={{ mb: 2 }}>
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={handleGoBack}
      >
        {label}
      </Button>
    </Box>
  );
}
