import React from "react";
import { Link } from "react-router-dom";
import { Box, Button, Container, Typography } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

export default function Home() {
  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 8, md: 16 }, textAlign: "center" }}>
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        OlivaGroupFW
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 6 }}>
        Image Rating Research Platform
      </Typography>
      <Box>
        <Button
          component={Link}
          to="/rate/upload"
          variant="contained"
          size="large"
          startIcon={<PlayArrowIcon />}
          sx={{ px: 6, py: 2, fontSize: "1.25rem", borderRadius: 3 }}
        >
          Start Rating
        </Button>
      </Box>
    </Container>
  );
}
