/**
 * GuidedSessionWelcome.jsx — "/start": the participant's entry into a
 * guided session. Loads the active mode_config, describes each upcoming
 * step in plain language, collects the participant ID, then routes to
 * WebGazer calibration with the guided uploadConfig chain
 * (buildGuidedUploadConfig) in location.state.
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Paper, Typography, Box, Button, Divider,
  TextField, Alert,
} from "@mui/material";
import LooksOneIcon from "@mui/icons-material/LooksOne";
import LooksTwoIcon from "@mui/icons-material/LooksTwo";
import Looks3Icon from "@mui/icons-material/Looks3";
import Looks4Icon from "@mui/icons-material/Looks4";
import Looks5Icon from "@mui/icons-material/Looks5";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { buildGuidedUploadConfig } from "../utils/guidedFlow";
import { loadModeConfig } from "../services/modeConfig";
import { getGridConfig } from "../data/gridConstants";

const STEP_ICONS = [LooksOneIcon, LooksTwoIcon, Looks3Icon, Looks4Icon, Looks5Icon];

function describeStep(step, mediaMode) {
  const isVideo = mediaMode === "video";
  const noun = isVideo ? "video" : "image";
  const nounPlural = isVideo ? "videos" : "images";
  switch (step.kind) {
    case "individual":
      return {
        title: `Individual Rating — ${step.count} ${nounPlural}`,
        body: isVideo
          ? "You'll watch one video at a time and rate each on a 1–5 scale once it finishes."
          : "You'll see one image at a time and rate each one on a 1–5 scale.",
      };
    case "pairwise":
      return {
        title: `Pairwise Comparison — ${step.count} pairs`,
        body: isVideo
          ? "Two videos play side-by-side; pick the one that better matches the prompt."
          : "Two images appear side-by-side; you pick the one that better matches the prompt.",
      };
    case "ranked":
      return {
        title: `Ranked Comparison — ${step.count} groups`,
        body: isVideo
          ? `Three ${nounPlural} per group — watch each, then drag them into order from best to worst.`
          : "Three images per group — drag them into order from best to worst.",
      };
    case "group-grid": {
      const cfg = getGridConfig(step.layoutId);
      return {
        title: `Group Rating — ${step.pageCount} grids of ${cfg.pageSize} ${nounPlural}`,
        body: isVideo
          ? `Each page shows a ${step.layoutId} layout of videos; rate every ${noun} on a 1–5 scale.`
          : `Each page shows a ${step.layoutId} layout; rate every image on a 1–5 scale.`,
      };
    }
    default:
      return null;
  }
}

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
  const [starting, setStarting] = useState(false);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadModeConfig().then((cfg) => {
      if (!cancelled) setConfig(cfg);
    });
    return () => { cancelled = true; };
  }, []);

  const steps = config?.steps || [];
  const mediaMode = config?.mediaMode || "image";
  const activeSteps = steps.filter((s) => s.enabled !== false);

  const handleBegin = async () => {
    if (!/^\d+$/.test(username.trim())) {
      setError("Please enter a numeric participant ID.");
      return;
    }
    setStarting(true);
    const latest = config ?? (await loadModeConfig());
    const uploadConfig = buildGuidedUploadConfig(
      username.trim(),
      latest.steps,
      latest.mediaMode,
    );
    if (!uploadConfig) {
      setStarting(false);
      setError("No rating modes are enabled. Ask an admin to enable at least one mode.");
      return;
    }
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
          You'll be rating {mediaMode === "video" ? "videos" : "images"} in a variety of formats. The whole session
          takes about <strong>15–20 minutes</strong>. Please find a quiet spot
          where you can sit comfortably without interruption.
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          What you'll do
        </Typography>

        {activeSteps.map((step, i) => {
          const info = describeStep(step, mediaMode);
          if (!info) return null;
          const Icon = STEP_ICONS[i] || LooksOneIcon;
          return (
            <FormatRow
              key={`${step.kind}-${i}`}
              icon={<Icon />}
              title={info.title}
              body={info.body}
            />
          );
        })}

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
          disabled={starting}
          sx={{ py: 1.5, fontSize: "1.1rem", borderRadius: 2, bgcolor: "#1a237e" }}
        >
          {starting ? "Loading…" : "Start Calibration"}
        </Button>
      </Paper>
    </Container>
  );
}
