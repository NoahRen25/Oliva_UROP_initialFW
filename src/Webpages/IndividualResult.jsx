import React from "react";
import { useResults } from "../Results";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from "@mui/material";
import ResultsPageShell from "../components/ResultsPageShell";
import SessionMetadata from "../components/SessionMetadata";
import { RecordingCell, RecordingHeader } from "../components/PageTranscriptCell";

function SessionAvgRow({ scores }) {
  const main = scores.filter((s) => s.imageId !== 0 && s.imageId !== "0");
  if (main.length === 0) return null;
  const avg = (arr, fn) => (arr.reduce((a, b) => a + fn(b), 0) / arr.length).toFixed(2);
  return (
    <TableRow sx={{ bgcolor: "#fafafa" }}>
      <TableCell colSpan={2} sx={{ fontWeight: "bold", color: "#1976d2" }}>
        Session Average (No BM)
      </TableCell>
      <TableCell align="right" sx={{ fontWeight: "bold", color: "#1976d2" }}>
        {avg(main, (s) => s.score || 0)}
      </TableCell>
      <TableCell align="right" sx={{ fontWeight: "bold", color: "#1976d2" }}>
        {avg(main, (s) => parseFloat(s.timeSpent) || 0)}
      </TableCell>
      <TableCell align="right" sx={{ fontWeight: "bold", color: "#1976d2" }}>
        {avg(main, (s) => s.interactionCount || 0)}
      </TableCell>
      <TableCell />
    </TableRow>
  );
}

export default function IndividualResult() {
  const { individualSessions } = useResults();

  const extractData = (session) =>
    (session.scores || []).map((s) => ({ name: s.imageName || "Unknown", value: s.score || 0 }));

  return (
    <ResultsPageShell
      title="Individual Results"
      sessions={individualSessions}
      dataExtractor={extractData}
      emptyMessage="No ratings submitted yet."
    >
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "#eee" }}>
              <TableCell><strong>User ID</strong></TableCell>
              <TableCell><strong>Image</strong></TableCell>
              <TableCell align="right"><strong>Score</strong></TableCell>
              <TableCell align="right"><strong>Time (s)</strong></TableCell>
              <TableCell align="right"><strong>Moves</strong></TableCell>
                <RecordingHeader />
            </TableRow>
          </TableHead>
          <TableBody>
            {individualSessions.map((session) => (
              <React.Fragment key={session.id}>
                {session.scores.map((score, idx) => (
                  <TableRow key={`${session.id}-${idx}`}>
                    {idx === 0 && (
                      <TableCell rowSpan={session.scores.length} sx={{ verticalAlign: "top", fontWeight: "bold" }}>
                        {session.username}
                      </TableCell>
                    )}
                    <TableCell sx={{ wordBreak: "break-all", fontSize: "0.8rem" }}>{score.imageName}</TableCell>
                    <TableCell align="right">{score.score}</TableCell>
                    <TableCell align="right">{score.timeSpent}</TableCell>
                    <TableCell align="right">{score.interactionCount || 0}</TableCell>
                    <RecordingCell
                      pageKey={idx + 1}
                      audioUrls={session.pageAudioUrls}
                      label={`Image_${idx + 1}`}
                    />
                  </TableRow>
                ))}
                <SessionAvgRow scores={session.scores} />
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 0, px: 1 }}>
                    <SessionMetadata metadata={session.metadata} />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={6} sx={{ bgcolor: "#f1f1f1", height: "8px", p: 0 }} />
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </ResultsPageShell>
  );
}