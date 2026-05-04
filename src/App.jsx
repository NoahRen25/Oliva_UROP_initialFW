import React, { useEffect, useRef } from "react";
import {
  BrowserRouter as Router, Routes, Route, Link, useLocation,
} from "react-router-dom";
import {
  AppBar, Toolbar, Typography, ThemeProvider, createTheme,
  CssBaseline, Box,
} from "@mui/material";

import { ResultsProvider, useResults } from "./Results";
import { WebGazerProvider, useWebGazer } from "./utils/WebGazerContext";
import { AuthProvider } from "./utils/AuthContext";
import LoginButton from "./components/LoginButton";
import AdminMenu from "./components/AdminMenu";
import VoiceRecorder from "./components/VoiceRecorder";
import TranscriptHistory from "./Webpages/TranscriptHistory";
import ResearcherView from "./Webpages/ResearcherView";
import Home from "./Webpages/Home";
import IndividualRate from "./Webpages/IndividualRate";
import PairwiseRate from "./Webpages/PairwiseRate";
import RankedRate from "./Webpages/RankedRate";
import BestWorstRate from "./Webpages/BestWorstRate";
import SelectionRate from "./Webpages/SelectionRate";
import VideoPairwiseRate from "./Webpages/VideoPairwiseRate";
import VideoIndividualRate from "./Webpages/VideoIndividualRate";
import VideoRankedRate from "./Webpages/VideoRankedRate";
import VideoGroupGridRate from "./Webpages/VideoGroupGridRate";
import WebGazerCalibration from "./Webpages/WebGazerCalibration";
import WebGazerGazeTest from "./Webpages/WebGazerGazeTest";
import ResultsPage from "./Webpages/ResultsPage";
import ModeResultsPage from "./Webpages/ModeResultsPage";
import LayoutRatingFlow from "./components/LayoutRatingFlow";
import UnifiedUploadPage from "./Webpages/UnifiedUploadPage";
import ComboRatingFlow from "./Webpages/ComboRatingFlow";
import ComboResultsPage from "./Webpages/ComboResultsPage";
import PrivacySettings from "./Webpages/PrivacySettings";
import ConsentModal from "./components/ConsentModal";
import SimulatedSession from "./Webpages/SimulatedSession";
import SetPassword from "./Webpages/SetPassword";
import GuidedSessionWelcome from "./Webpages/GuidedSessionWelcome";
import GroupGridRate from "./Webpages/GroupGridRate";
import ThankYouPage from "./Webpages/ThankYouPage";
import AdminControlPanel from "./Webpages/AdminControlPanel";

const lightTheme = createTheme({
  palette: { mode: "light", background: { default: "#f5f5f5" } },
});

function NavigationWrapper() {
  const { consentGiven, acceptConsent, addTranscript } = useResults();

  const pendingPageTranscriptsRef = useRef({});
  const pendingPageAudioRef = useRef({});
  const pendingPageAudioBlobsRef = useRef({});

  useEffect(() => {
    window.__pendingPageTranscripts = pendingPageTranscriptsRef;
    window.__pendingPageAudio = pendingPageAudioRef;
    window.__pendingPageAudioBlobs = pendingPageAudioBlobsRef;
  }, []);

  return (
    <Router>
      <ConsentModal open={!consentGiven} onAccept={acceptConsent} />
      <WebGazerAutoStop />
      <WebGazerVideoToggle />
      <FloatingVoiceRecorder onSave={(text, dur) => addTranscript(text, dur)} />
      <AppBar position="fixed" color="default" elevation={1}>
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              fontWeight: "bold",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            OlivaGroupFW
          </Typography>
          <AdminMenu />
          <LoginButton />
        </Toolbar>
      </AppBar>

      <Box sx={{ paddingTop: "80px", minHeight: "100vh" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/start" element={<GuidedSessionWelcome />} />
          <Route path="/group-grid-rate" element={<GroupGridRate />} />
          <Route path="/thank-you" element={<ThankYouPage />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/transcripts" element={<TranscriptHistory />} />

          {/* Results */}
          <Route path="/grid-results" element={<ResultsPage />} />
          <Route path="/mode-results" element={<ModeResultsPage />} />

          {/* Rating Flows */}
          <Route path="/rate/upload" element={<UnifiedUploadPage />} />
          <Route path="/rate/grid" element={<LayoutRatingFlow mode="upload" />} />
          <Route path="/individual-rate" element={<IndividualRate />} />
          <Route path="/pairwise-rate" element={<PairwiseRate />} />
          <Route path="/video-pairwise-rate" element={<VideoPairwiseRate />} />
          <Route path="/video-individual-rate" element={<VideoIndividualRate />} />
          <Route path="/video-ranked-rate" element={<VideoRankedRate />} />
          <Route path="/video-group-grid-rate" element={<VideoGroupGridRate />} />
          <Route path="/selection-rate" element={<SelectionRate />} />
          <Route path="/ranked-rate" element={<RankedRate />} />
          <Route path="/best-worst-rate" element={<BestWorstRate />} />
          <Route path="/combo-rate" element={<ComboRatingFlow />} />

          {/* Tools */}
          <Route path="/webgazer-calibration" element={<WebGazerCalibration />} />
          <Route path="/webgazer-gaze-test" element={<WebGazerGazeTest />} />
          <Route path="/rate" element={<LayoutRatingFlow mode="manual" />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/combo-results" element={<ComboResultsPage />} />
          <Route path="/privacy" element={<PrivacySettings />} />
          <Route path="/researcher" element={<ResearcherView />} />
          <Route path="/researcher/simulate" element={<SimulatedSession />} />
          <Route path="/admin/control-panel" element={<AdminControlPanel />} />
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
  '/group-grid-rate',
  '/video-individual-rate',
  '/video-pairwise-rate',
  '/video-ranked-rate',
  '/video-group-grid-rate',
];

function FloatingVoiceRecorder({ onSave }) {
  const location = useLocation();
  const onRatingRoute = KEEP_WEBGAZER_ROUTES.some((r) =>
    location.pathname.startsWith(r)
  );
  if (!onRatingRoute) return null;
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1300,
        backgroundColor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        borderRadius: 999,
        boxShadow: 3,
        px: 1.5,
        py: 0.5,
      }}
    >
      <VoiceRecorder onSave={onSave} />
    </Box>
  );
}

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

// Show the webcam preview only on calibration / gaze-test pages; hide it
// once the user reaches a rating page so it doesn't sit in the corner.
const SHOW_VIDEO_ROUTES = ['/webgazer-calibration', '/webgazer-gaze-test'];

function WebGazerVideoToggle() {
  const location = useLocation();
  const { showVideo, isInitialized } = useWebGazer();

  useEffect(() => {
    if (!isInitialized) return;
    const shouldShow = SHOW_VIDEO_ROUTES.some(route =>
      location.pathname.startsWith(route)
    );
    showVideo(shouldShow);
  }, [location.pathname, showVideo, isInitialized]);

  return null;
}

export default function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <AuthProvider>
        <ResultsProvider>
          <WebGazerProvider>
            <NavigationWrapper />
          </WebGazerProvider>
        </ResultsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
