import React from "react";
import {
  Box, Typography, Button, Paper, Card, CardContent,
  Slider, Select, MenuItem, FormControl, InputLabel,
} from "@mui/material";

// ——— Instruction text per mode ———
const INSTRUCTIONS = {
  individual: {
    title: "Individual Rating",
    body: `You will see images one at a time. For each image, a prompt describing the intended scene is shown above.

Rate each image on a scale of 1–5 based on how well it matches the prompt and its overall quality.

The first image is a benchmark to familiarize you with the task. Your benchmark rating is still recorded.

Use the READ PROMPT button in the top bar at any time to hear the current prompt read aloud.`,
  },
  pairwise: {
    title: "Pairwise Comparison",
    body: `You will see two images side by side, both generated from the same text prompt.

Your task is to select which image better represents the prompt. Click on the image you prefer – the chosen image gets a blue border.

The prompt is displayed above each pair. Use the READ PROMPT button in the top bar to hear it read aloud.`,
  },
  ranked: {
    title: "Ranked Comparison",
    body: `You will see three images generated from the same text prompt.

Rank them from 1st (best) to 3rd by how well they match the prompt and their visual quality.

Each image must receive a unique rank. The prompt is shown above each group.`,
  },
  selection: {
    title: "Image Selection",
    body: `You will see a grid of images along with a task prompt.

Your job is to click on every image that matches the prompt. Selected images get a blue border and a checkmark.

Click an image again to deselect it. When finished, press Submit.`,
  },
};

// ——— Shared placeholder box ———
const Placeholder = ({ height = "14vh", label }) => (
  <Box
    sx={{
      height,
      width: "100%",
      bgcolor: "#f0f0f0",
      borderRadius: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#bbb",
      fontSize: "1.2rem",
      fontWeight: "bold",
      border: "2px dashed #ddd",
    }}
  >
    {label || "–"}
  </Box>
);

// ——— Individual mock ———
const IndividualPreview = () => (
  <Card sx={{ maxWidth: 360, mx: "auto", pointerEvents: "none" }}>
    <Box sx={{ p: 1.5, bgcolor: "#fff3e0", textAlign: "center" }}>
      <Typography variant="subtitle2">Benchmark</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
        "A row of world flags waving..."
      </Typography>
    </Box>
    <Box sx={{ p: 1 }}>
      <Placeholder height="18vh" label="Image" />
    </Box>
    <CardContent sx={{ textAlign: "center", pt: 1 }}>
      <Typography variant="caption">Rating: 3</Typography>
      <Slider defaultValue={3} min={1} max={5} step={1} marks size="small" sx={{ mt: 0.5 }} disabled />
      <Button variant="contained" size="small" fullWidth disabled sx={{ mt: 1 }}>
        Next
      </Button>
    </CardContent>
  </Card>
);

// ——— Pairwise mock ———
const PairwisePreview = () => (
  <Box>
    <Typography variant="body2" align="center" sx={{ mb: 1, fontStyle: "italic", color: "text.secondary" }}>
      "Surreal image of flags on the moon..."
    </Typography>
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
      <Card sx={{ border: "4px solid #1976d2", pointerEvents: "none" }}>
        <Box sx={{ p: 1 }}>
          <Placeholder height="12vh" label="Image A" />
        </Box>
        <Typography variant="caption" align="center" display="block" sx={{ pb: 1 }}>
          ← Selected
        </Typography>
      </Card>
      <Card sx={{ border: "4px solid transparent", pointerEvents: "none" }}>
        <Box sx={{ p: 1 }}>
          <Placeholder height="12vh" label="Image B" />
        </Box>
        <Typography variant="caption" align="center" display="block" sx={{ pb: 1, color: "text.disabled" }}>
          Click to select
        </Typography>
      </Card>
    </Box>
    <Box sx={{ textAlign: "center", mt: 1.5 }}>
      <Button variant="contained" size="small" disabled>Next Pair</Button>
    </Box>
  </Box>
);

// ——— Ranked mock ———
const RankedPreview = () => (
  <Box>
    <Typography variant="body2" align="center" sx={{ mb: 1, fontStyle: "italic", color: "text.secondary" }}>
      "Cargo ship with nautical flags..."
    </Typography>
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
      {[1, 2, 3].map((n) => (
        <Card key={n} sx={{ pointerEvents: "none" }}>
          <Box sx={{ p: 0.5 }}>
            <Placeholder height="10vh" label={`Image ${n}`} />
          </Box>
          <CardContent sx={{ py: 1, px: 0.5, "&:last-child": { pb: 1 } }}>
            <FormControl fullWidth size="small" disabled>
              <InputLabel sx={{ fontSize: "0.75rem" }}>Rank</InputLabel>
              <Select
                value={n === 1 ? 1 : n === 2 ? 3 : ""}
                label="Rank"
                sx={{ fontSize: "0.75rem" }}
              >
                <MenuItem value={1}>1st (Best)</MenuItem>
                <MenuItem value={2}>2nd</MenuItem>
                <MenuItem value={3}>3rd</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      ))}
    </Box>
    <Box sx={{ textAlign: "center", mt: 1.5 }}>
      <Button variant="contained" size="small" disabled>Submit All Rankings</Button>
    </Box>
  </Box>
);

// ——— Selection mock ———
const SelectionPreview = () => (
  <Box>
    <Paper sx={{ p: 1, mb: 1.5, textAlign: "center", bgcolor: "#fff3e0" }}>
      <Typography variant="caption" color="text.secondary">Task Prompt</Typography>
      <Typography variant="body2">"Select all images showing flags"</Typography>
    </Paper>
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
      {[1, 2, 3, 4, 5, 6].map((n) => {
        const isSel = n === 2 || n === 5;
        return (
          <Card
            key={n}
            sx={{
              border: isSel ? "3px solid #1976d2" : "3px solid transparent",
              position: "relative",
              pointerEvents: "none",
            }}
          >
            <Placeholder height="7vh" label={n} />
            {isSel && (
              <Box
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  bgcolor: "#1976d2",
                  color: "white",
                  borderRadius: "50%",
                  width: 18,
                  height: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.65rem",
                  fontWeight: "bold",
                }}
              >
                ✓
              </Box>
            )}
          </Card>
        );
      })}
    </Box>
    <Box sx={{ textAlign: "center", mt: 1.5 }}>
      <Button variant="contained" size="small" disabled>Submit Selections (2 selected)</Button>
    </Box>
  </Box>
);

// ——— Preview picker ———
const PREVIEWS = {
  individual: IndividualPreview,
  pairwise: PairwisePreview,
  ranked: RankedPreview,
  selection: SelectionPreview,
};

// ——— Main component ———
export default function ModeInstructionScreen({ mode, prompt, onNext }) {
  const info = INSTRUCTIONS[mode] || INSTRUCTIONS.individual;
  const Preview = PREVIEWS[mode] || PREVIEWS.individual;

  return (
    <Box sx={{ width: "90%", mx: "auto", mt: 4, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>{info.title}</Typography>
      <Typography variant="h5" gutterBottom>Instructions</Typography>

      <Paper sx={{ p: 3, mb: 4, textAlign: "left" }}>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          {info.body}
        </Typography>
      </Paper>

      {prompt && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: "#fff3e0" }}>
          <Typography variant="subtitle2" color="text.secondary">
            Task Prompt
          </Typography>
          <Typography variant="h6" color="primary.main">
            {prompt}
          </Typography>
        </Paper>
      )}

      {/* Visual mock */}
      <Paper
        variant="outlined"
        sx={{ p: 2.5, mb: 4, bgcolor: "#fafafa", borderRadius: 2 }}
      >
        <Typography
          variant="overline"
          display="block"
          sx={{ mb: 1.5, color: "text.secondary", letterSpacing: 1 }}
        >
          Preview – What you will see
        </Typography>
        <Preview />
      </Paper>

      <Button variant="contained" size="large" fullWidth onClick={onNext} sx={{ mb: 6 }}>
        Start
      </Button>
    </Box>
  );
}