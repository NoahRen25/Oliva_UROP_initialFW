import React, { useState } from "react";
import {
  Container, FormControl, Select, MenuItem, Box, Typography
} from "@mui/material";
import CombinedLayoutResults from "./CombinedLayoutResults";
import LayoutResultsPage from "./LayoutResultsPage";
import ComboResultsPage from "./ComboResultsPage";
import { LAYOUT_OPTIONS } from "../data/gridConstants";
import BackButton from "../components/BackButton";

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
            Grid Results
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
            <Box sx={{ minWidth: 260 }}>
              <FormControl fullWidth size="small">
                <Select value={view} onChange={(e) => setView(e.target.value)}>
                  <MenuItem value="combined" sx={{ fontWeight: "bold", color: "primary.main" }}>
                    Combined Overview
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