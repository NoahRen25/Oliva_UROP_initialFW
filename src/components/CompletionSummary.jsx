import React from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Typography, Box, Button, Divider } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ReplayIcon from "@mui/icons-material/Replay";
import HomeIcon from "@mui/icons-material/Home";

export default function CompletionSummary({
  itemsRated,
  averageScore,
  totalTime,
  resultPath,
  ratePath,
  title = "Session Complete!",
}) {
  const navigate = useNavigate();

  const formatTime = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  return (
    <Paper sx={{ p: 4, textAlign: "center", maxWidth: 500, mx: "auto" }}>
      <CheckCircleIcon sx={{ fontSize: 64, color: "#4caf50", mb: 2 }} />
      <Typography variant="h4" gutterBottom fontWeight="bold">
        {title}
      </Typography>

      <Box sx={{ my: 3 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight="bold" color="primary">
              {itemsRated}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Items Rated
            </Typography>
          </Box>
          {averageScore !== undefined && (
            <Box>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {averageScore.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Score
              </Typography>
            </Box>
          )}
          {totalTime !== undefined && (
            <Box>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {formatTime(totalTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Time
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {resultPath && (
          <Button
            variant="contained"
            size="large"
            startIcon={<VisibilityIcon />}
            onClick={() => navigate(resultPath)}
            fullWidth
          >
            View Results
          </Button>
        )}
        {ratePath && (
          <Button
            variant="outlined"
            size="large"
            startIcon={<ReplayIcon />}
            onClick={() => navigate(ratePath)}
            fullWidth
          >
            Rate Again
          </Button>
        )}
        <Button
          variant="text"
          size="large"
          startIcon={<HomeIcon />}
          onClick={() => navigate("/")}
          fullWidth
        >
          Go Home
        </Button>
      </Box>
    </Paper>
  );
}
