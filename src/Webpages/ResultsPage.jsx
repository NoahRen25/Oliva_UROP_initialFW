import React, { useState } from "react";
import {
  Container, FormControl, Select, MenuItem, Box, Typography, Paper
} from "@mui/material";
import CombinedLayoutResults from "./CombinedLayoutResults";
import LayoutResultsPage from "./LayoutResultsPage";
import ComboResultsPage from "./ComboResultsPage";
import { LAYOUT_OPTIONS } from "../data/gridConstants";

export default function ResultsPage() {
  const [view, setView] = useState("combined");

  const renderView = () => {
    switch (view) {
      case "combined": return <CombinedLayoutResults />;
      case "combo":    return <ComboResultsPage />;
      default: {
        const opt = LAYOUT_OPTIONS.find((l) => l.id === view);
        return (
          <LayoutResultsPage
            key={view}
            layoutId={view}
            title={`Results: ${opt?.label || view}`}
          />
        );
      }
    }
  };

  const currentLabel =
    view === "combined" ? "Combined Overview"
    : view === "combo" ? "Combo Protocol"
    : LAYOUT_OPTIONS.find((l) => l.id === view)?.label || view;

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Paper
        sx={{
          p: 2, mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h5">
          {view === "combined" ? "Grid Results Dashboard" : `Grid Results: ${currentLabel}`}
        </Typography>

        <Box sx={{ minWidth: 260 }}>
          <FormControl fullWidth size="small">
            <Select value={view} onChange={(e) => setView(e.target.value)}>
              <MenuItem value="combined" sx={{ fontWeight: "bold", color: "primary.main" }}>
                📊 Combined Overview
              </MenuItem>

              <MenuItem disabled sx={{ fontSize: "0.8rem", opacity: 0.6 }}>
                ── Grid Layouts ──
              </MenuItem>
              {LAYOUT_OPTIONS.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  {opt.label}
                </MenuItem>
              ))}

              <MenuItem disabled sx={{ fontSize: "0.8rem", opacity: 0.6 }}>
                ── Protocols ──
              </MenuItem>
              <MenuItem value="combo">Combo Protocol (33)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Box>{renderView()}</Box>
    </Container>
  );
}