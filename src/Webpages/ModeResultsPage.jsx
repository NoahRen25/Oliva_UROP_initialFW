import React, { useState } from "react";
import {
  Container, FormControl, Select, MenuItem, Box, Typography, Paper
} from "@mui/material";
import IndividualResult from "./IndividualResult";
import PairwiseResult from "./PairwiseResult";
import RankedResult from "./RankedResult";
import BestWorstResult from "./BestWorstResult";
import SelectionResult from "./SelectionResult";

const MODES = [
  { id: "individual", label: "Individual" },
  { id: "pairwise",   label: "Pairwise" },
  { id: "ranked",     label: "Ranked" },
  { id: "best-worst", label: "Best-Worst" },
  { id: "selection",  label: "Selection" },
];

export default function ModeResultsPage() {
  const [view, setView] = useState("individual");

  const renderView = () => {
    switch (view) {
      case "individual": return <IndividualResult />;
      case "pairwise":   return <PairwiseResult />;
      case "ranked":     return <RankedResult />;
      case "best-worst": return <BestWorstResult />;
      case "selection":  return <SelectionResult />;
      default:           return <IndividualResult />;
    }
  };

  const currentLabel = MODES.find((m) => m.id === view)?.label || view;

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
        <Typography variant="h5">Mode Results: {currentLabel}</Typography>
        <Box sx={{ minWidth: 220 }}>
          <FormControl fullWidth size="small">
            <Select value={view} onChange={(e) => setView(e.target.value)}>
              {MODES.map((m) => (
                <MenuItem key={m.id} value={m.id}>{m.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>
      <Box>{renderView()}</Box>
    </Container>
  );
}