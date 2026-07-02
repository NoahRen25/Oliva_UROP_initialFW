/**
 * ThankYouPage.jsx — "/thank-you": end-of-guided-session confirmation
 * screen with a Return Home button. nextGuidedNavigation routes here after
 * the last step.
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { Container, Paper, Typography, Button, Box } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HomeIcon from "@mui/icons-material/Home";

export default function ThankYouPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 6, md: 10 }, mb: 6 }}>
      <Paper sx={{ p: 5, borderRadius: 3, textAlign: "center" }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 80, color: "#2e7d32", mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a237e", mb: 1 }}>
          Thank you!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Your responses have been recorded. We really appreciate you taking
          the time to participate — the data you just provided helps us
          understand how people perceive and compare AI-generated images.
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={() => navigate("/")}
            sx={{ bgcolor: "#1a237e" }}
          >
            Return Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
