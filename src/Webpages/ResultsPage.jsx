import React, { useState } from "react";
import { Container, FormControl, Select, MenuItem, Box, Typography, Paper } from "@mui/material";
import CombinedLayoutResults from "./CombinedLayoutResults"; // Your existing file
import LayoutResultsPage from "./LayoutResultsPage"; // Your existing file
import { LAYOUT_OPTIONS } from "../data/gridConstants";

export default function ResultsPage() {
  // Default to 'combined', or a specific layout if you prefer
  const [view, setView] = useState("combined");

  const currentLabel = LAYOUT_OPTIONS.find(l => l.id === view)?.label || view;

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      {/* Control Bar */}
      <Paper sx={{ p: 2, mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5">
          {view === "combined" ? "Analytics Dashboard" : `Results: ${currentLabel}`}
        </Typography>
        
        <Box sx={{ minWidth: 200 }}>
          <FormControl fullWidth size="small">
            <Select
              value={view}
              onChange={(e) => setView(e.target.value)}
              displayEmpty
            >
              <MenuItem value="combined" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                📊 Combined Overview
              </MenuItem>
              <MenuItem disabled>──────────</MenuItem>
              {LAYOUT_OPTIONS.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.label} Results
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Conditional Rendering */}
      <Box>
        {view === "combined" ? (
          <CombinedLayoutResults />
        ) : (
          <LayoutResultsPage 
            key={view} 
            layoutId={view} 
            title={`Results for ${currentLabel}`} 
          />
        )}
      </Box>
    </Container>
  );
}