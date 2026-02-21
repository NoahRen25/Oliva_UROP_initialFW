import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Box, Typography, Button, Alert, Paper
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import UsernameEntry from "../components/UsernameEntry";
import { GRID_DEFINITIONS } from "../data/gridConstants";
import { useMemImages } from "../data/UseMemImages";

// Non-grid rating types
const RATING_TYPES = ["individual", "pairwise", "ranked", "selection"];
// All valid types (grid layouts + rating modes)
const ALL_TYPES = [...RATING_TYPES, ...Object.keys(GRID_DEFINITIONS)];

export default function UnifiedUploadPage() {
  const navigate = useNavigate();
  const { ready, countInRange } = useMemImages();

  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);
  const [available, setAvailable] = useState(0);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        
        // Default to "2x2" grid if no type/layout specified
        const type = json.type || json.layout || "2x2";
        
        if (!ALL_TYPES.includes(type)) {
          throw new Error(`Unknown type: "${type}". Valid: ${ALL_TYPES.join(", ")}`);
        }

        const parsed = {
          type,
          count: parseInt(json.count, 10) || 5,
          prompt: json.prompt || "Rate this image",
          minScore: parseFloat(json.minScore) || 0,
          maxScore: parseFloat(json.maxScore) || 1,
          showRating: json.showRating !== undefined ? json.showRating : true,
          rankMode: json.rankMode || "select",
        };

        // For grid types, count available images in range
        if (GRID_DEFINITIONS[type]) {
          setAvailable(countInRange(parsed.minScore, parsed.maxScore));
        }

        setConfig(parsed);
        setError(null);
      } catch (err) {
        setError(err.message);
        setConfig(null);
      }
    };
    reader.readAsText(file);
  };

  const handleStart = () => {
    const state = { uploadConfig: { ...config, username } };

    // Check if it's a grid type
    if (GRID_DEFINITIONS[config.type]) {
      // Navigate to the grid rating flow
      navigate("/rate/grid", { state });
    } else {
      // Navigate to the specific rating mode
      navigate(`/${config.type}-rate`, { state });
    }
  };

  const isGrid = config && !!GRID_DEFINITIONS[config.type];
  const canStart = config && ready && (!isGrid || available >= config.count);

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      {step === 0 ? (
        <UsernameEntry
          title="Upload Configuration"
          username={username}
          setUsername={setUsername}
          onStart={() => setStep(1)}
        />
      ) : (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Upload Session Config
          </Typography>
          <Button
            component="label"
            variant="outlined"
            startIcon={<CloudUploadIcon />}
            sx={{ mb: 3 }}
          >
            Select JSON File
            <input type="file" hidden accept=".json" onChange={handleFileUpload} />
          </Button>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {config && (
            <Paper variant="outlined" sx={{ p: 2, mb: 3, textAlign: "left" }}>
              <Typography><strong>Type:</strong> {config.type}</Typography>
              <Typography><strong>Count:</strong> {config.count}</Typography>
              <Typography><strong>Prompt:</strong> {config.prompt}</Typography>
              {config.type === "ranked" && (
                <Typography><strong>Rank Mode:</strong> {config.rankMode === "swap" ? "Swap (Drag & Drop)" : "Select (Dropdown)"}</Typography>
              )}
              {isGrid && (
                <>
                  <Typography>
                    <strong>Score Range:</strong> {config.minScore} – {config.maxScore}
                  </Typography>
                  <Typography color={available < config.count ? "error" : "success.main"}>
                    <strong>Available:</strong> {available}
                  </Typography>
                  <Typography>
                    <strong>Show Rating:</strong> {config.showRating ? "Yes" : "No"}
                  </Typography>
                </>
              )}
            </Paper>
          )}

          <Button
            variant="contained" fullWidth size="large"
            disabled={!canStart} onClick={handleStart}
          >
            Start Session
          </Button>
        </Paper>
      )}
    </Container>
  );
}