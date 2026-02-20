import React, { useState } from "react";
import { Box, Typography, Button, Alert, Paper } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { GRID_DEFINITIONS } from "../data/gridConstants";

export default function ConfigSelectionScreen({
  onConfigLoaded,
  ready,
  countInRange,
}) {
  const [error, setError] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [available, setAvailable] = useState(0);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let config = {};

        if (file.name.toLowerCase().endsWith(".json")) {
          const json = JSON.parse(content);
          config = {
            layout: json.layout,
            count: json.count,
            minScore: json.minScore,
            maxScore: json.maxScore,
            prompt: json.prompt || "Rate how interesting this image would be to a general population",
            // Parse showRating, default to true if missing
            showRating: json.showRating !== undefined ? json.showRating : true 
          };
        } else if (file.name.toLowerCase().endsWith(".csv")) {
           const rows = content.trim().split("\n");
           const values = rows[1].split(","); 
           config = {
             layout: values[0].trim(),
             count: parseInt(values[1], 10),
             minScore: parseFloat(values[2]),
             maxScore: parseFloat(values[3]),
             showRating: true, // Default true for CSVs,
             prompt: "hi"
           };
        } else {
          throw new Error("Use .json or .csv");
        }

        if (!config.layout || !config.count) throw new Error("Missing layout/count");
        if (!GRID_DEFINITIONS[config.layout]) throw new Error(`Unknown layout: ${config.layout}`);

        const range = [config.minScore || 0, config.maxScore || 1];
        const availableCount = countInRange(range[0], range[1]);
        
        setFileData({ ...config, range });
        setAvailable(availableCount);
        setError(null);

      } catch (err) {
        setError(err.message);
        setFileData(null);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Box sx={{ p: 3, bgcolor: "background.paper", borderRadius: 2, boxShadow: 1, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>Upload Session Configuration</Typography>
      <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} sx={{ mb: 3 }}>
        Select File <input type="file" hidden accept=".json,.csv" onChange={handleFileUpload} />
      </Button>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {fileData && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, textAlign: 'left' }}>
          <Typography><strong>Layout:</strong> {fileData.layout}</Typography>
          <Typography><strong>Range:</strong> {fileData.range[0]} - {fileData.range[1]}</Typography>
          <Typography><strong>Count:</strong> {fileData.count}</Typography>
          <Typography><strong>Show Rating Text:</strong> {fileData.showRating ? "Yes" : "No"}</Typography>
          <Typography><strong>Show Prompt:</strong> {fileData.prompt}</Typography>
          <Typography color={available < fileData.count ? "error" : "success.main"}>
            <strong>Available:</strong> {available}
          </Typography>
        </Paper>
      )}

      <Button
        variant="contained" fullWidth size="large"
        disabled={!fileData || available < fileData.count || !ready}
        onClick={() => onConfigLoaded(fileData)}
      >
        Start Rating Session
      </Button>
    </Box>
  );
}