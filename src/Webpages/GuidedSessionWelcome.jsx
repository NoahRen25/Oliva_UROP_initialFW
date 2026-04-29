import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Paper, Typography, Box, Button, Divider,
  TextField, Alert,
} from "@mui/material";
import LooksOneIcon from "@mui/icons-material/LooksOne";
import LooksTwoIcon from "@mui/icons-material/LooksTwo";
import Looks3Icon from "@mui/icons-material/Looks3";
import Looks4Icon from "@mui/icons-material/Looks4";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { buildGuidedUploadConfig } from "../utils/guidedFlow";

function FormatRow({ icon, title, body }) {
  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", mb: 2 }}>
      <Box sx={{ color: "#1a237e", display: "flex", alignItems: "center", pt: 0.25 }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {body}
        </Typography>
      </Box>
    </Box>
  );
}

export default function GuidedSessionWelcome() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const handleBegin = () => {
    if (!/^\d+$/.test(username.trim())) {
      setError("Please enter a numeric participant ID.");
      return;
    }
    const uploadConfig = buildGuidedUploadConfig(username.trim());
    navigate("/webgazer-calibration", {
      state: { uploadConfig, returnTo: uploadConfig.route },
    });
  };

  return (
    <Container maxWidth="md" sx={{ mt: { xs: 4, md: 6 }, mb: 6 }}>
      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a237e", mb: 1 }}>
          Thank you for participating!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          You'll be rating images in a variety of formats. The whole session
          takes about <strong>15–20 minutes</strong>. Please find a quiet spot
          where you can sit comfortably without interruption.
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          What you'll do
        </Typography>

        <FormatRow
          icon={<LooksOneIcon />}
          title="Individual Rating — 10 images"
          body="You'll see one image at a time and rate each one on a 1–5 scale."
        />
        <FormatRow
          icon={<LooksTwoIcon />}
          title="Pairwise Comparison — 10 pairs"
          body="Two images appear side-by-side; you pick the one that better matches the prompt."
        />
        <FormatRow
          icon={<Looks3Icon />}
          title="Ranked Comparison — 10 groups"
          body="Three images per group — drag them into order from best to worst."
        />
        <FormatRow
          icon={<Looks4Icon />}
          title="Group Rating — 2 grids of 3×3"
          body="Two pages of 8 images (3×3 grid with the center cell removed); rate each one on a 1–5 scale."
        />

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", mb: 3 }}>
          <VisibilityIcon sx={{ color: "#1a237e", mt: 0.5 }} />
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Eye-tracking calibration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Before the rating begins, we calibrate the eye tracker. You'll
              click a series of dots while looking directly at them. Please
              allow camera access when prompted, and start the calibration when
              you're ready.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Participant ID
          </Typography>
          <TextField
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") handleBegin(); }}
            placeholder="Numeric participant ID"
            size="small"
            fullWidth
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
          />
          {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        </Box>

        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<PlayArrowIcon />}
          onClick={handleBegin}
          sx={{ py: 1.5, fontSize: "1.1rem", borderRadius: 2, bgcolor: "#1a237e" }}
        >
          Start Calibration
        </Button>
      </Paper>
    </Container>
  );
}
