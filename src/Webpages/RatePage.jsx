import React, { useState } from "react";
import { Container, FormControl, InputLabel, Select, MenuItem, Box, Typography, Paper } from "@mui/material";
import LayoutRatingFlow from "../components/LayoutRatingFlow"; // Your existing unified flow
import { LAYOUT_OPTIONS } from "../data/gridConstants";

export default function RatePage() {
  const [layout, setLayout] = useState("2x2");

  return (
    <Box>
      {/* Dropdown Header */}
      <Container maxWidth="sm" sx={{ mt: 4, mb: 2 }}>
        <Paper elevation={3} sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
           <Typography variant="h6">Select Format:</Typography>
           <FormControl fullWidth size="small">
            <InputLabel>Layout</InputLabel>
            <Select
              value={layout}
              label="Layout"
              onChange={(e) => setLayout(e.target.value)}
            >
              {LAYOUT_OPTIONS.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
        {/* Note: 'key' prop causes component to refresh when changes r made
      */}
        <LayoutRatingFlow 
        key={layout} 
        mode="manual" 
        layoutId={layout} 
      />
      </Container>

    </Box>
  );
}