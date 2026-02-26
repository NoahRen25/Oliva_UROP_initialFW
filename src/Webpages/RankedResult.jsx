import React from "react";
import { useResults } from "../Results";
import {
  Table, TableHead, TableRow, TableCell, TableBody, Chip, Box,
} from "@mui/material";
import ResultsPageShell from "../components/ResultsPageShell";
import SessionMetadata from "../components/SessionMetadata";
import ExportCSVButton from "../components/ExportCSVButton";
import PageTranscriptCell, { PageTranscriptHeader, AudioDownloadCell, AudioDownloadHeader } from "../components/PageTranscriptCell";

const prepareData = (sessions) => {
  const flat = [];
  sessions.forEach((s) => {
    [...s.rankings].sort((a, b) => (a.groupId !== b.groupId ? a.groupId - b.groupId : a.rank - b.rank))
      .forEach((item) => {
        flat.push({
          "User ID": s.username, Timestamp: new Date(s.timestamp).toLocaleString(),
          "Group ID": item.groupId, "Image Name": item.imageName,
          Rank: item.rank, "Group Prompt": item.groupPrompt,
        });
      });
  });
  return flat;
};

export default function RankedResult() {
  const { rankedSessions } = useResults();

  const extractData = (session) =>
    session.rankings.map((r) => ({ name: r.imageName, value: r.rank }));

  return (
    <ResultsPageShell
      title="Ranked Results"
      sessions={rankedSessions}
      csvData={prepareData(rankedSessions)}
      csvFilename={`All_Ranked_Results_${new Date().toISOString().split("T")[0]}.csv`}
      dataExtractor={extractData}
      emptyMessage="No ranked sessions recorded yet."
    >
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
            <TableCell><strong>User ID</strong></TableCell>
            <TableCell><strong>Group</strong></TableCell>
            <TableCell><strong>Image</strong></TableCell>
            <TableCell><strong>Rank</strong></TableCell>
            <PageTranscriptHeader />
                <AudioDownloadHeader />
            <TableCell align="center"><strong>Export</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rankedSessions.map((session) => {
            const sorted = [...session.rankings].sort(
              (a, b) => (a.groupId !== b.groupId ? a.groupId - b.groupId : a.rank - b.rank)
            );
            return sorted.map((item, j) => (
              <TableRow key={`${session.id}-${j}`}>
                {j === 0 && (
                  <TableCell rowSpan={sorted.length} sx={{ fontWeight: "bold", verticalAlign: "top", borderRight: "1px solid #eee" }}>
                    {session.username}
                  </TableCell>
                )}
                <TableCell>{item.groupId}</TableCell>
                <TableCell>{item.imageName}</TableCell>
                <TableCell>
                  <Chip label={`#${item.rank}`} size="small" color={item.rank === 1 ? "success" : item.rank === 2 ? "primary" : "default"} />
                </TableCell>
                <PageTranscriptCell pageKey={item.groupId} transcripts={session.pageTranscripts} audioUrls={session.pageAudioUrls} label={`Group ${item.groupId}`} />
                <AudioDownloadCell pageKey={item.groupId} audioUrls={session.pageAudioUrls} label={`Group_${item.groupId}`} />
                {j === 0 && (
                  <TableCell rowSpan={sorted.length} align="center" sx={{ verticalAlign: "top", borderLeft: "1px solid #eee" }}>
                    <ExportCSVButton variant="icon" data={prepareData([session])} filename={`Ranked_User_${session.username}.csv`} label="Export Session" />
                  </TableCell>
                )}
              </TableRow>
            ));
          })}
        </TableBody>
      </Table>
      {rankedSessions.length > 0 && (
        <Box sx={{ p: 1 }}>
          {rankedSessions.map((s) => <SessionMetadata key={s.id} metadata={s.metadata} />)}
        </Box>
      )}
    </ResultsPageShell>
  );
}