/**
 * GazeAnalyticsSection.jsx — The gaze-analytics dashboard (embedded as a
 * tab of the researcher/results views, not its own route). Fetches all
 * gaze_sessions rows, offers mode/session filtering (GazeSessionPicker),
 * and lays out the KPI cards, dwell chart, per-session timeline, in-image
 * heatmaps, page-format explorer, and CSV export panels.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";

import { fetchGazeSessions } from "../services/supabaseResults";
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
import PageFormatExplorer from "../components/analytics/PageFormatExplorer";

export default function GazeAnalyticsSection() {
  const [gazeSessions, setGazeSessions] = useState([]);
  const [selectedMode, setSelectedMode] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const refresh = () => fetchGazeSessions().then(setGazeSessions);

  useEffect(() => {
    refresh();
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

      <PageFormatExplorer gazeSessions={filteredSessions} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3 }}>
        <GazeDwellChart data={dwellData} />
        {timelineData && <GazeTimeline data={timelineData} />}
      </Box>

      <GazeExport gazeSessions={filteredSessions} />
    </Box>
  );
}
