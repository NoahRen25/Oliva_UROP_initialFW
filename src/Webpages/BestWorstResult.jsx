import React from "react";
import { useResults } from "../Results";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import ResultsPageShell from "../components/ResultsPageShell";
import ExportCSVButton from "../components/ExportCSVButton";
import { RecordingCell, RecordingHeader } from "../components/PageTranscriptCell";

const prepareData = (sessions) =>
  sessions.flatMap((s) =>
    s.trials.map((t) => ({
      "User ID": s.username, Timestamp: new Date(s.timestamp).toLocaleString(),
      "Trial ID": t.trialId, Prompt: t.prompt, Best: t.bestName,
      Worst: t.worstName, "Response Time (s)": t.responseTime,
    }))
  );

export default function BestWorstResult() {
  const { bestWorstSessions } = useResults();

  const extractStats = (session) => {
    const pts = [];
    session.trials.forEach((t) => {
      pts.push({ name: t.bestName, value: 1 });
      pts.push({ name: t.worstName, value: 0 });
    });
    return pts;
  };

  return (
    <ResultsPageShell
      title="Best-Worst Results"
      sessions={bestWorstSessions}
      csvData={prepareData(bestWorstSessions)}
      csvFilename={`All_BestWorst_Results_${new Date().toISOString().split("T")[0]}.csv`}
      dataExtractor={extractStats}
      emptyMessage="No best-worst sessions recorded yet."
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
            <TableCell><strong>User ID</strong></TableCell>
            <TableCell><strong>Trial</strong></TableCell>
            <TableCell><strong>Best</strong></TableCell>
            <TableCell><strong>Worst</strong></TableCell>
            <TableCell><strong>Prompt</strong></TableCell>
                <RecordingHeader />
            <TableCell align="center"><strong>Export</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bestWorstSessions.map((session) =>
            session.trials.map((trial, j) => (
              <TableRow key={`${session.id}-${j}`}>
                {j === 0 && (
                  <TableCell rowSpan={session.trials.length} sx={{ fontWeight: "bold", verticalAlign: "top" }}>
                    {session.username}
                  </TableCell>
                )}
                <TableCell>ID: {trial.trialId}</TableCell>
                <TableCell sx={{ color: "green", fontWeight: "bold" }}>{trial.bestName}</TableCell>
                <TableCell sx={{ color: "text.secondary" }}>{trial.worstName}</TableCell>
                <TableCell sx={{ maxWidth: 400 }}>{trial.prompt}</TableCell>
                <RecordingCell pageKey={trial.trialId} audioUrls={session.pageAudioUrls} label={`Trial_${trial.trialId}`} />
                {j === 0 && (
                  <TableCell rowSpan={session.trials.length} align="center" sx={{ verticalAlign: "top" }}>
                    <ExportCSVButton variant="icon" data={prepareData([session])} filename={`BestWorst_User_${session.username}.csv`} label="Export Session" />
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </ResultsPageShell>
  );
}