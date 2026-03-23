import React, { useEffect, useState, useMemo } from "react";
import {
  BrowserRouter as Router, Routes, Route, Link, useLocation,
} from "react-router-dom";
import {
  AppBar, Toolbar, Button, Typography, ThemeProvider, createTheme,
  CssBaseline, Box, Tooltip, IconButton,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

import { ResultsProvider, useResults } from "./Results";
import { WebGazerProvider, useWebGazer } from "./utils/WebGazerContext";
import VoiceRecorder from "./components/VoiceRecorder";
import TranscriptHistory from "./Webpages/TranscriptHistory";
import ReadPromptButton from "./components/ReadPromptButton";

import Home from "./Webpages/Home";
import IndividualRate from "./Webpages/IndividualRate";
import PairwiseRate from "./Webpages/PairwiseRate";
import RankedRate from "./Webpages/RankedRate";
import BestWorstRate from "./Webpages/BestWorstRate";
import SelectionRate from "./Webpages/SelectionRate";
import PressureCooker from "./Webpages/PressureCooker";
import WebGazerCalibration from "./Webpages/WebGazerCalibration";
import WebGazerGazeTest from "./Webpages/WebGazerGazeTest";
import DatasetManager from "./Webpages/DatasetManager";
import ResultsPage from "./Webpages/ResultsPage";
import ModeResultsPage from "./Webpages/ModeResultsPage";
import LayoutRatingFlow from "./components/LayoutRatingFlow";
import UnifiedUploadPage from "./Webpages/UnifiedUploadPage";
import ComboRatingFlow from "./Webpages/ComboRatingFlow";
import ComboResultsPage from "./Webpages/ComboResultsPage";
import PrivacySettings from "./Webpages/PrivacySettings";
import ConsentModal from "./components/ConsentModal";
import AnalyticsDashboard from "./Webpages/AnalyticsDashboard";

function createAppTheme(mode) {
  const dark = mode === "dark";
  return createTheme({
    palette: {
      mode,
      background: {
        default: dark ? "#0b0b14" : "#f2f1ed",
        paper:   dark ? "#11111e" : "#ffffff",
      },
      primary:   { main: dark ? "#5b8ef0" : "#2d62d4" },
      secondary: { main: dark ? "#34d399" : "#1a9e6e" },
      divider: dark ? "#1d1d30" : "#dde0eb",
      text: {
        primary:   dark ? "#dde1f4" : "#0d0d1a",
        secondary: dark ? "#636880" : "#757896",
      },
    },
    typography: {
      fontFamily: "'Syne', sans-serif",
      h3: { fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1 },
      h5: { fontWeight: 700, letterSpacing: "-0.01em" },
      h6: { fontWeight: 600 },
    },
    shape: { borderRadius: 4 },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: dark
              ? "rgba(11, 11, 20, 0.88)"
              : "rgba(242, 241, 237, 0.88)",
            backdropFilter: "blur(16px)",
            borderBottom: `1px solid ${dark ? "#1d1d30" : "#dde0eb"}`,
            boxShadow: "none",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: dark ? "#11111e" : "#ffffff",
            border: `1px solid ${dark ? "#1d1d30" : "#e4e6f0"}`,
            boxShadow: "none",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 500,
          },
        },
      },
    },
  });
}

function NavigationWrapper({ mode, toggleMode }) {
  const { addTranscript, consentGiven, acceptConsent } = useResults();
  const dark = mode === "dark";
  const dotColor = dark ? "rgba(91,142,240,0.12)" : "rgba(45,98,212,0.07)";

  return (
    <Router>
      <ConsentModal open={!consentGiven} onAccept={acceptConsent} />
      <WebGazerAutoStop />
      <AppBar position="fixed" color="default" elevation={0}>
        <Toolbar sx={{ gap: 0.5, minHeight: "60px !important" }}>
          {/* Brand */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexGrow: 1 }}>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: "primary.main",
              boxShadow: dark ? "0 0 10px #5b8ef0" : "none",
            }} />
            <Typography sx={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "0.95rem",
              letterSpacing: "-0.01em",
              color: "text.primary",
              lineHeight: 1,
            }}>
              Oliva Group
            </Typography>
            <Typography sx={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.12em",
              color: "text.secondary",
              textTransform: "uppercase",
              lineHeight: 1,
              mt: "1px",
            }}>
              · Image Rating
            </Typography>
          </Box>

          {/* Theme toggle */}
          <Tooltip title={dark ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton
              onClick={toggleMode}
              size="small"
              sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
            >
              {dark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <ReadPromptButton />
          <VoiceRecorder onSave={(text, dur) => addTranscript(text, dur)} />
          <Button
            startIcon={<HistoryEduIcon />}
            component={Link}
            to="/transcripts"
            size="small"
            sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
          >
            History
          </Button>
          <Button
            startIcon={<HomeIcon />}
            component={Link}
            to="/"
            size="small"
            sx={{ color: "text.secondary", "&:hover": { color: "text.primary" } }}
          >
            Home
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{
        paddingTop: "60px",
        minHeight: "100vh",
        backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
      }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/transcripts" element={<TranscriptHistory />} />

          {/* Results */}
          <Route path="/grid-results" element={<ResultsPage />} />
          <Route path="/mode-results" element={<ModeResultsPage />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />

          {/* Rating Flows */}
          <Route path="/rate/upload" element={<UnifiedUploadPage />} />
          <Route path="/rate/grid" element={<LayoutRatingFlow mode="upload" />} />
          <Route path="/individual-rate" element={<IndividualRate />} />
          <Route path="/pairwise-rate" element={<PairwiseRate />} />
          <Route path="/selection-rate" element={<SelectionRate />} />
          <Route path="/ranked-rate" element={<RankedRate />} />
          <Route path="/best-worst-rate" element={<BestWorstRate />} />
          <Route path="/combo-rate" element={<ComboRatingFlow />} />
          <Route path="/pressure-cooker" element={<PressureCooker />} />

          {/* Tools */}
          <Route path="/webgazer-calibration" element={<WebGazerCalibration />} />
          <Route path="/webgazer-gaze-test" element={<WebGazerGazeTest />} />
          <Route path="/dataset-manager" element={<DatasetManager />} />
          <Route path="/rate" element={<LayoutRatingFlow mode="manual" />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/combo-results" element={<ComboResultsPage />} />
          <Route path="/privacy" element={<PrivacySettings />} />
        </Routes>
      </Box>
    </Router>
  );
}

function WebGazerAutoStop() {
  const location = useLocation();
  const { endWebGazer, isInitialized } = useWebGazer();

  useEffect(() => {
    if (!location.pathname.startsWith("/webgazer") && isInitialized) {
      endWebGazer();
    }
  }, [location.pathname, endWebGazer, isInitialized]);

  return null;
}

export default function App() {
  const [mode, setMode] = useState(
    () => localStorage.getItem("theme-mode") || "dark"
  );

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme-mode", next);
      return next;
    });
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ResultsProvider>
        <WebGazerProvider>
          <NavigationWrapper mode={mode} toggleMode={toggleMode} />
        </WebGazerProvider>
      </ResultsProvider>
    </ThemeProvider>
  );
}
