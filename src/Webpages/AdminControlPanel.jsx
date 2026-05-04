import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Container, Paper, Typography, Box, Button, Divider, Switch,
  TextField, IconButton, Alert, MenuItem, Select, FormControl,
  InputLabel, CircularProgress, Stack, Chip,
  ToggleButtonGroup, ToggleButton,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SaveIcon from "@mui/icons-material/Save";
import ImageIcon from "@mui/icons-material/Image";
import VideocamIcon from "@mui/icons-material/Videocam";
import { useAuth } from "../utils/AuthContext";
import {
  loadModeConfig, saveModeConfig, normalizeSteps,
  DEFAULT_STEPS, DEFAULT_MEDIA_MODE, MODE_DEFINITIONS,
} from "../services/modeConfig";
import { LAYOUT_OPTIONS } from "../data/gridConstants";

export default function AdminControlPanel() {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const [steps, setSteps] = useState(null);
  const [mediaMode, setMediaMode] = useState(DEFAULT_MEDIA_MODE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadModeConfig()
      .then((cfg) => {
        if (cancelled) return;
        setMediaMode(cfg.mediaMode);
        setSteps(cfg.steps);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const enabledCount = useMemo(
    () => (steps || []).filter((s) => s.enabled !== false).length,
    [steps]
  );

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const updateStep = (i, patch) => {
    setSteps((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s))
    );
    setFeedback(null);
  };

  const move = (i, dir) => {
    setSteps((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setFeedback(null);
  };

  const handleMediaModeChange = (_e, value) => {
    if (!value) return;
    setMediaMode(value);
    setSteps((prev) => normalizeSteps(prev, value));
    setFeedback(null);
  };

  const reset = () => {
    setMediaMode(DEFAULT_MEDIA_MODE);
    setSteps(normalizeSteps(DEFAULT_STEPS, DEFAULT_MEDIA_MODE));
    setFeedback({ severity: "info", message: "Reverted to defaults (not yet saved)." });
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const cleaned = await saveModeConfig(steps, mediaMode, user?.email ?? null);
      setMediaMode(cleaned.mediaMode);
      setSteps(cleaned.steps);
      setFeedback({ severity: "success", message: "Saved. Participants will see this configuration on their next session." });
    } catch (err) {
      setFeedback({ severity: "error", message: err.message || "Failed to save configuration." });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !steps) {
    return (
      <Container maxWidth="md" sx={{ mt: 6, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Paper sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "#1a237e", mb: 1 }}>
          Control Panel
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure which rating modes participants see in the guided session,
          their order, and per-mode settings. Changes apply to all participants
          (including unauthenticated users) on their next session.
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            p: 2,
            mb: 3,
            borderRadius: 2,
            bgcolor: "#f5f7ff",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Media type
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Switch the entire session between still images and videos.
            </Typography>
          </Box>
          <ToggleButtonGroup
            value={mediaMode}
            exclusive
            onChange={handleMediaModeChange}
            size="small"
            color="primary"
          >
            <ToggleButton value="image">
              <ImageIcon fontSize="small" sx={{ mr: 1 }} /> Images
            </ToggleButton>
            <ToggleButton value="video">
              <VideocamIcon fontSize="small" sx={{ mr: 1 }} /> Videos
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip
            label={`${enabledCount} of ${steps.length} modes enabled`}
            color={enabledCount > 0 ? "primary" : "default"}
            variant="outlined"
          />
          <Chip
            label={mediaMode === "video" ? "Video session" : "Image session"}
            color={mediaMode === "video" ? "error" : "info"}
            variant="outlined"
            icon={mediaMode === "video" ? <VideocamIcon /> : <ImageIcon />}
          />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {steps.map((step, i) => (
          <StepRow
            key={step.kind}
            step={step}
            index={i}
            total={steps.length}
            onMove={(dir) => move(i, dir)}
            onChange={(patch) => updateStep(i, patch)}
          />
        ))}

        {feedback && (
          <Alert severity={feedback.severity} sx={{ mt: 2 }}>
            {feedback.message}
          </Alert>
        )}

        <Box sx={{ display: "flex", gap: 1, mt: 3, justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={reset}
            disabled={saving}
          >
            Reset to defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || enabledCount === 0}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

function StepRow({ step, index, total, onMove, onChange }) {
  const def = MODE_DEFINITIONS[step.kind];
  if (!def) return null;
  const enabled = step.enabled !== false;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        py: 2,
        borderBottom: "1px solid",
        borderColor: "divider",
        opacity: enabled ? 1 : 0.55,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <IconButton
          size="small"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          aria-label="Move up"
        >
          <ArrowUpwardIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          aria-label="Move down"
        >
          <ArrowDownwardIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ minWidth: 140 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {def.label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Step {index + 1}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, display: "flex", gap: 2, flexWrap: "wrap" }}>
        {def.fields.includes("count") && (
          <TextField
            label={countLabel(step.kind)}
            type="number"
            size="small"
            value={step.count ?? ""}
            onChange={(e) => onChange({ count: clampCount(e.target.value) })}
            disabled={!enabled}
            inputProps={{ min: 1, max: 100 }}
            sx={{ width: 140 }}
          />
        )}
        {def.fields.includes("pageCount") && (
          <TextField
            label="Pages"
            type="number"
            size="small"
            value={step.pageCount ?? ""}
            onChange={(e) => onChange({ pageCount: clampCount(e.target.value) })}
            disabled={!enabled}
            inputProps={{ min: 1, max: 20 }}
            sx={{ width: 100 }}
          />
        )}
        {def.fields.includes("layoutId") && (
          <FormControl size="small" sx={{ minWidth: 180 }} disabled={!enabled}>
            <InputLabel>Format</InputLabel>
            <Select
              label="Format"
              value={step.layoutId ?? ""}
              onChange={(e) => onChange({ layoutId: e.target.value })}
            >
              {LAYOUT_OPTIONS.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <Switch
        checked={enabled}
        onChange={(e) => onChange({ enabled: e.target.checked })}
        inputProps={{ "aria-label": `Enable ${def.label}` }}
      />
    </Box>
  );
}

function countLabel(kind) {
  switch (kind) {
    case "individual": return "Items";
    case "pairwise": return "Pairs";
    case "ranked": return "Groups";
    default: return "Count";
  }
}

function clampCount(raw) {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1) return 1;
  if (n > 100) return 100;
  return n;
}
