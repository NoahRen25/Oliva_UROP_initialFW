import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Button,
  Typography,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Tooltip,
  IconButton,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver";
import VoiceOverOffIcon from "@mui/icons-material/VoiceOverOff";

import { ResultsProvider, useResults } from "./Results";
import VoiceRecorder from "./components/VoiceRecorder";
import TranscriptHistory from "./Webpages/TranscriptHistory";

import Home from "./Webpages/Home";
import CombinedResult from "./Webpages/CombinedResult";
import GroupResult from "./Webpages/GroupResult";
import GroupRate from "./Webpages/GroupRate";
import IndividualRate from "./Webpages/IndividualRate";
import IndividualResult from "./Webpages/IndividualResult";
import PairwiseRate from "./Webpages/PairwiseRate";
import RankedRate from "./Webpages/RankedRate";
import PairwiseResult from "./Webpages/PairwiseResult";
import RankedResult from "./Webpages/RankedResult";
import PressureCooker from "./Webpages/PressureCooker";
import EyeCalibration from "./Webpages/EyeCalibration";
import GazeTest from "./Webpages/GazeTest";

const lightTheme = createTheme({
  palette: { mode: "light", background: { default: "#f5f5f5" } },
});

function NavigationWrapper() {
  const { addTranscript, isAnnouncing, toggleAnnouncing } = useResults();

  return (
    <Router>
      <AppBar position="fixed" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            OlivaGroupFW
          </Typography>
          <Tooltip
            title={isAnnouncing ? "Turn Announcer Off" : "Turn Announcer On"}
          >
            <IconButton
              onClick={toggleAnnouncing}
              color={isAnnouncing ? "primary" : "default"}
              sx={{ mr: 2 }}
            >
              {isAnnouncing ? <RecordVoiceOverIcon /> : <VoiceOverOffIcon />}
            </IconButton>
          </Tooltip>
          <VoiceRecorder
            onSave={(text, duration) => addTranscript(text, duration)}
          />

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
            Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ paddingTop: "80px", minHeight: "100vh" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/transcripts" element={<TranscriptHistory />} />
          <Route path="/combined-result" element={<CombinedResult />} />
          <Route path="/group-result" element={<GroupResult />} />
          <Route path="/group-rate" element={<GroupRate />} />
          <Route path="/individual-result" element={<IndividualResult />} />
          <Route path="/individual-rate" element={<IndividualRate />} />
          <Route path="/pairwise-rate" element={<PairwiseRate />} />
          <Route path="/ranked-rate" element={<RankedRate />} />
          <Route path="/pairwise-result" element={<PairwiseResult />} />
          <Route path="/ranked-result" element={<RankedResult />} />
          <Route path="/pressure-cooker" element={<PressureCooker />} />
          <Route path="/eye-calibration" element={<EyeCalibration />} />
          <Route path="/gaze-test" element={<GazeTest />} />
        </Routes>
      </Box>
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <ResultsProvider>
        <NavigationWrapper />
      </ResultsProvider>
    </ThemeProvider>
  );
}
