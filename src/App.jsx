import React, { useEffect } from "react";
import {
  BrowserRouter as Router, Routes, Route, Link, useLocation,
} from "react-router-dom";
import {
  AppBar, Toolbar, Button, Typography, ThemeProvider, createTheme,
  CssBaseline, Box,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";

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

const lightTheme = createTheme({
  palette: { mode: "light", background: { default: "#f5f5f5" } },
});

function NavigationWrapper() {
  const { addTranscript, isAnnouncing, toggleAnnouncing, consentGiven, acceptConsent } = useResults();

  return (
    <Router>
      <ConsentModal open={!consentGiven} onAccept={acceptConsent} />
      <WebGazerAutoStop />
      <AppBar position="fixed" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            OlivaGroupFW
          </Typography>
          {/* ReadPromptButton replaces the announce toggle */}
          <ReadPromptButton />
          <VoiceRecorder onSave={(text, dur) => addTranscript(text, dur)} />
          <Button
            startIcon={<HistoryEduIcon />}
            component={Link}
            to="/transcripts"
            color="inherit"
            sx={{ mr: 1 }}
          >
            History
          </Button>
          <Button
            startIcon={<HomeIcon />}
            component={Link}
            to="/"
            color="inherit"
          >
            Home
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ paddingTop: "80px", minHeight: "100vh" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/transcripts" element={<TranscriptHistory />} />

          {/* Results */}
          <Route path="/grid-results" element={<ResultsPage />} />
          <Route path="/mode-results" element={<ModeResultsPage />} />

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

const KEEP_WEBGAZER_ROUTES = [
  '/webgazer',
  '/individual-rate',
  '/pairwise-rate',
  '/ranked-rate',
  '/best-worst-rate',
  '/selection-rate',
  '/rate',
  '/combo-rate',
  '/pressure-cooker',
];

function WebGazerAutoStop() {
  const location = useLocation();
  const { endWebGazer, isInitialized } = useWebGazer();

  useEffect(() => {
    const shouldKeep = KEEP_WEBGAZER_ROUTES.some(route =>
      location.pathname.startsWith(route)
    );
    if (!shouldKeep && isInitialized) {
      endWebGazer();
    }
  }, [location.pathname, endWebGazer, isInitialized]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <ResultsProvider>
        <WebGazerProvider>
          <NavigationWrapper />
        </WebGazerProvider>
      </ResultsProvider>
    </ThemeProvider>
  );
}