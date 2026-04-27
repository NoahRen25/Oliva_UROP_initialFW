import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";

import { getGazeSessions } from "../utils/gazeStorage";
import {
  buildDwellChart,
  buildGazeTimeline,
} from "../utils/gazeTransforms";

import GazeSessionPicker from "../components/analytics/GazeSessionPicker";
import GazeKPICards from "../components/analytics/GazeKPICards";
import GazeDwellChart from "../components/analytics/GazeDwellChart";
import GazeTimeline from "../components/analytics/GazeTimeline";
import GazeHeatmap from "../components/analytics/GazeHeatmap";
import GazeExport from "../components/analytics/GazeExport";

export default function GazeAnalyticsSection() {
  const [gazeSessions, setGazeSessions] = useState(() => getGazeSessions());
  const [selectedMode, setSelectedMode] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");

  // Re-read whenever the page regains focus, in case a new session just landed
  useEffect(() => {
    const refresh = () => setGazeSessions(getGazeSessions());
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const filteredSessions = useMemo(() => {
    if (!selectedMode) return gazeSessions;
    return gazeSessions.filter((s) => s.mode === selectedMode);
  }, [gazeSessions, selectedMode]);

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return gazeSessions.find((s) => String(s.sessionId) === String(selectedSessionId)) || null;
  }, [gazeSessions, selectedSessionId]);

  const dwellData = useMemo(
    () => buildDwellChart(selectedSession || filteredSessions),
    [selectedSession, filteredSessions]
  );

  const timelineData = useMemo(
    () => (selectedSession ? buildGazeTimeline(selectedSession) : null),
    [selectedSession]
  );

  if (gazeSessions.length === 0) {
    return (
      <Box sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          No gaze sessions recorded yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Complete a rating session with eye tracking enabled to see analytics here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <GazeSessionPicker
        gazeSessions={gazeSessions}
        selectedMode={selectedMode}
        setSelectedMode={setSelectedMode}
        selectedSessionId={selectedSessionId}
        setSelectedSessionId={setSelectedSessionId}
      />

      <GazeKPICards
        gazeSessions={filteredSessions}
        selectedSessionId={selectedSessionId}
      />

      <GazeHeatmap
        gazeSession={selectedSession}
        gazeSessions={filteredSessions}
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        <GazeDwellChart data={dwellData} />
        {timelineData && <GazeTimeline data={timelineData} />}
      </Box>

      <GazeExport gazeSessions={filteredSessions} />
    </Box>
  );
}
