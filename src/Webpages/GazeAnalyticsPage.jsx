import React, { useState, useMemo } from "react";
import { Container, Typography, Box } from "@mui/material";
import { getGazeSessions } from "../utils/gazeStorage";
import {
  buildGazeOverview,
  buildDwellChart,
  buildGazeTimeline,
} from "../utils/gazeTransforms";
import GazeSessionPicker from "../components/analytics/GazeSessionPicker";
import GazeKPICards from "../components/analytics/GazeKPICards";
import GazeDwellChart from "../components/analytics/GazeDwellChart";
import GazeTimeline from "../components/analytics/GazeTimeline";
import GazeHeatmap from "../components/analytics/GazeHeatmap";
import GazeExport from "../components/analytics/GazeExport";
import BackButton from "../components/BackButton";

export default function GazeAnalyticsPage() {
  const [selectedMode, setSelectedMode] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const gazeSessions = useMemo(() => getGazeSessions(), []);

  const filteredSessions = useMemo(() => {
    if (!selectedMode) return gazeSessions;
    return gazeSessions.filter((s) => s.mode === selectedMode);
  }, [gazeSessions, selectedMode]);

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) return null;
    return gazeSessions.find((s) => s.sessionId === selectedSessionId) || null;
  }, [gazeSessions, selectedSessionId]);

  const dwellData = useMemo(
    () => buildDwellChart(selectedSession || filteredSessions),
    [selectedSession, filteredSessions]
  );

  const timelineData = useMemo(
    () => (selectedSession ? buildGazeTimeline(selectedSession) : null),
    [selectedSession]
  );

  const isEmpty = gazeSessions.length === 0;

  return (
    <Box>
      <Container maxWidth="xl" sx={{ py: 6, px: { xs: 2, sm: 3 } }}>
        <BackButton />

        {/* Page Header */}
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
            Gaze Analytics
          </Typography>
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
            Eye Tracking{" "}
            <Box
              component="span"
              sx={{ color: "text.secondary", fontWeight: 400 }}
            >
              Analysis
            </Box>
          </Typography>
        </Box>

        {isEmpty ? (
          <Box
            sx={{
              py: 10,
              textAlign: "center",
              opacity: 0,
              animation: "fadeUp 0.5s ease-out 0.2s both",
              "@keyframes fadeUp": {
                from: { opacity: 0, transform: "translateY(16px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 600,
                fontSize: "1.25rem",
                color: "text.secondary",
                mb: 1,
              }}
            >
              No gaze sessions recorded yet
            </Typography>
            <Typography
              sx={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.75rem",
                color: "text.secondary",
              }}
            >
              Complete some sessions with eye tracking enabled to see gaze analytics here.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              opacity: 0,
              animation: "fadeUp 0.5s ease-out 0.2s both",
              "@keyframes fadeUp": {
                from: { opacity: 0, transform: "translateY(16px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            {/* Session Picker */}
            <GazeSessionPicker
              gazeSessions={gazeSessions}
              selectedMode={selectedMode}
              setSelectedMode={setSelectedMode}
              selectedSessionId={selectedSessionId}
              setSelectedSessionId={setSelectedSessionId}
            />

            {/* KPI Cards */}
            <GazeKPICards
              gazeSessions={filteredSessions}
              selectedSessionId={selectedSessionId}
            />

            {/* Dwell Chart + Timeline side-by-side */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
              }}
            >
              <GazeDwellChart data={dwellData} />
              <GazeTimeline data={timelineData} />
            </Box>

            {/* Heatmap (full width) */}
            <GazeHeatmap
              gazeSession={selectedSession}
              gazeSessions={gazeSessions}
            />

            {/* Export */}
            <GazeExport gazeSessions={gazeSessions} />
          </Box>
        )}
      </Container>
    </Box>
  );
}
