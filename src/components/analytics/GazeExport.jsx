import React from "react";
import { Paper, Typography, Box, Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import Papa from "papaparse";
import { flattenForExport } from "../../utils/gazeTransforms";

const monoFont = "'JetBrains Mono', monospace";

function downloadCSV(filename, csvString) {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function GazeExport({ gazeSessions }) {
  if (!gazeSessions || gazeSessions.length === 0) return null;

  const handleExport = (level, label) => {
    const rows = flattenForExport(gazeSessions, level);

    if (rows.length === 0) {
      alert(`No ${label} data to export.`);
      return;
    }

    const csv = Papa.unparse(rows);
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(`gaze-${level}-${date}.csv`, csv);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography
        sx={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 600,
          fontSize: "1rem",
          mb: 2,
        }}
      >
        Export Gaze Data
      </Typography>

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={() => handleExport("session", "session")}
          sx={{
            fontFamily: monoFont,
            fontSize: "0.75rem",
            textTransform: "none",
          }}
        >
          Sessions (CSV)
        </Button>

        <Button
          variant="outlined"
          size="small"
          onClick={() => handleExport("image", "per-image")}
          sx={{
            fontFamily: monoFont,
            fontSize: "0.7rem",
            textTransform: "none",
          }}
        >
          Per-Image (CSV)
        </Button>

        <Button
          variant="outlined"
          size="small"
          onClick={() => handleExport("coordinates", "coordinates")}
          sx={{
            fontFamily: monoFont,
            fontSize: "0.7rem",
            textTransform: "none",
          }}
        >
          Raw Coordinates (CSV)
        </Button>
      </Box>
    </Paper>
  );
}
