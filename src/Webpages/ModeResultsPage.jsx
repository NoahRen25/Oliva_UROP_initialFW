import React, { useState } from "react";
import {
  Container, FormControl, Select, MenuItem, Box, Typography
} from "@mui/material";
import IndividualResult from "./IndividualResult";
import PairwiseResult from "./PairwiseResult";
import RankedResult from "./RankedResult";
import BestWorstResult from "./BestWorstResult";
import SelectionResult from "./SelectionResult";
import BackButton from "../components/BackButton";

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
    <Box>
      <Container maxWidth="xl" sx={{ py: 6, px: { xs: 2, sm: 3 } }}>
        <BackButton />
        <Box
          sx={{
            mb: 5,
            opacity: 0,
            animation: "fadeUp 0.6s ease-out 0.1s both",
            "@keyframes fadeUp": {
              from: { opacity: 0, transform: "translateY(16px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          <Typography
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.68rem",
              letterSpacing: "0.2em",
              color: "text.secondary",
              textTransform: "uppercase",
              mb: 1.5,
            }}
          >
            Mode Results
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              flexDirection: { xs: "column", sm: "row" },
              gap: 2,
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.5rem" },
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              {currentLabel}
            </Typography>
            <Box sx={{ minWidth: 220 }}>
              <FormControl fullWidth size="small">
                <Select value={view} onChange={(e) => setView(e.target.value)}>
                  {MODES.map((m) => (
                    <MenuItem key={m.id} value={m.id}>{m.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            opacity: 0,
            animation: "fadeUp 0.5s ease-out 0.2s both",
            "@keyframes fadeUp": {
              from: { opacity: 0, transform: "translateY(16px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          {renderView()}
        </Box>
      </Container>
    </Box>
  );
}