import React, { useMemo, useState, useEffect } from "react";
import { Container, Typography, Box, CircularProgress } from "@mui/material";
import { useResults } from "../Results";
import {
  computeOverviewMetrics,
  buildSessionTimeline,
  buildModeBreakdown,
  buildImageAggregates,
  buildQualityReport,
} from "../utils/dashboardTransforms";

import OverviewMetrics from "../components/analytics/OverviewMetrics";
import SessionsTimeline from "../components/analytics/SessionsTimeline";
import ModeBreakdown from "../components/analytics/ModeBreakdown";
import DataQualityPanel from "../components/analytics/DataQualityPanel";
import ImageAggregateStats from "../components/analytics/ImageAggregateStats";
import DashboardExport from "../components/analytics/DashboardExport";
import BackButton from "../components/BackButton";

export default function AnalyticsDashboard() {
  const {
    individualSessions,
    groupSessions,
    fixedSessions,
    pairwiseSessions,
    rankedSessions,
    bestWorstSessions,
    selectionSessions,
    pressureCookerSessions,
  } = useResults();

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHydrated(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const sessionData = useMemo(
    () => ({
      individualSessions,
      groupSessions,
      fixedSessions,
      pairwiseSessions,
      rankedSessions,
      bestWorstSessions,
      selectionSessions,
      pressureCookerSessions,
    }),
    [
      individualSessions,
      groupSessions,
      fixedSessions,
      pairwiseSessions,
      rankedSessions,
      bestWorstSessions,
      selectionSessions,
      pressureCookerSessions,
    ]
  );

  const metrics = useMemo(() => computeOverviewMetrics(sessionData), [sessionData]);
  const timeline = useMemo(() => buildSessionTimeline(sessionData), [sessionData]);
  const modeBreakdown = useMemo(() => buildModeBreakdown(sessionData), [sessionData]);
  const imageAggregates = useMemo(() => buildImageAggregates(sessionData), [sessionData]);
  const qualityReport = useMemo(() => buildQualityReport(sessionData), [sessionData]);

  const isEmpty = metrics.totalSessions === 0;

  if (!hydrated) {
    return (
      <Box>
        <Container maxWidth="xl" sx={{ py: 6, px: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }

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
            Analytics Dashboard
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
            Session{" "}
            <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>
              Overview
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
              No sessions recorded yet
            </Typography>
            <Typography
              sx={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.75rem",
                color: "text.secondary",
              }}
            >
              Complete some rating sessions to see analytics here.
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
            {/* KPI Cards */}
            <OverviewMetrics metrics={metrics} />

            {/* Timeline + Quality side-by-side on larger screens */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
                gap: 3,
              }}
            >
              <SessionsTimeline data={timeline} />
              <DataQualityPanel report={qualityReport} />
            </Box>

            {/* Mode Breakdown */}
            <ModeBreakdown data={modeBreakdown} />

            {/* Image Stats */}
            <ImageAggregateStats data={imageAggregates} />

            {/* Export */}
            <DashboardExport allSessions={sessionData} />
          </Box>
        )}
      </Container>
    </Box>
  );
}
