import React from "react";
import { Container, Paper, Typography, Box } from "@mui/material";
import ResultsHeader from "./ResultsHeader";
import ExportCSVButton from "./ExportCSVButton";
import StatsSummary from "./StatsSummary";

/**
 * ResultsPageShell — The shared layout for every results page:
 *   ResultsHeader + ExportCSVButton + Paper wrapper + StatsSummary
 *
 * Props:
 *   title       — page title
 *   sessions    — array of sessions (used for hasData check and stats)
 *   csvData     — flattened CSV export data
 *   csvFilename — export filename
 *   onClear     — optional clear all handler
 *   dataExtractor — function for StatsSummary (session → [{name, value}])
 *   children    — the table or content to render inside the Paper
 *   emptyMessage — message when no data (default: "No sessions recorded yet.")
 *   showStats   — whether to show StatsSummary (default: true)
 */
export default function ResultsPageShell({
  title,
  sessions = [],
  csvData,
  csvFilename,
  onClear,
  dataExtractor,
  children,
  emptyMessage = "No sessions recorded yet.",
  showStats = true,
}) {
  const hasData = sessions.length > 0;

  return (
    <Container maxWidth="md" sx={{ mt: 2 }}>
      <ResultsHeader title={title} hasData={hasData} onClear={onClear} />

      <Box>
        {hasData && csvData && (
          <ExportCSVButton
            data={csvData}
            filename={csvFilename || `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`}
            label="Export All"
          />
        )}
      </Box>

      <Paper sx={{ p: 2 }}>
        {!hasData ? (
          <Typography sx={{ p: 2 }}>{emptyMessage}</Typography>
        ) : (
          children
        )}
      </Paper>

      {showStats && hasData && dataExtractor && (
        <StatsSummary sessions={sessions} dataExtractor={dataExtractor} />
      )}
    </Container>
  );
}