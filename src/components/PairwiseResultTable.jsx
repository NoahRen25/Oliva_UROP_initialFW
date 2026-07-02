/**
 * PairwiseResultTable.jsx — Shared results table for pairwise sessions
 * (image and video variants): one row per choice showing winner/loser,
 * per-page recording playback, per-session CSV export and delete. Used by
 * PairwiseResult / VideoPairwiseResult / ModeResultsPage.
 */
import React from "react";
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box, Paper,
} from "@mui/material";
import ExportCSVButton from "./ExportCSVButton";
import SessionMetadata from "./SessionMetadata";
import { RecordingCell, RecordingHeader } from "./pageTranscriptCell";

export default function PairwiseResultTable({ sessions, prepareData, filenamePrefix = "Pairwise" }) {
  return (
    <Paper elevation={1} sx={{ width: "100%", bgcolor: "white", overflow: "hidden" }}>
      <Table sx={{ width: "100%", tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "10%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "28%" }} />
          <col style={{ width: "28%" }} />
          <col style={{ width: "14%" }} />
          <col style={{ width: "12%" }} />
        </colgroup>
        <TableHead>
          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
            <TableCell><strong>User ID</strong></TableCell>
            <TableCell><strong>Pair</strong></TableCell>
            <TableCell><strong>Winner</strong></TableCell>
            <TableCell><strong>Loser</strong></TableCell>
            <RecordingHeader />
            <TableCell align="center"><strong>Action</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) =>
            (session.choices || []).map((choice, j) => (
              <TableRow key={`${session.id}-${j}`}>
                {j === 0 && (
                  <TableCell rowSpan={session.choices.length} sx={{ fontWeight: "bold", verticalAlign: "top" }}>
                    {session.username}
                  </TableCell>
                )}
                <TableCell>{choice.pairId}</TableCell>
                <TableCell sx={{ color: "green", fontWeight: "bold", wordBreak: "break-word" }}>
                  {choice.winnerName}
                </TableCell>
                <TableCell sx={{ color: "text.secondary", wordBreak: "break-word" }}>
                  {choice.loserName}
                </TableCell>
                <RecordingCell pageKey={choice.pairId} audioUrls={session.pageAudioUrls} label={`Pair_${choice.pairId}`} />
                {j === 0 && (
                  <TableCell rowSpan={session.choices.length} align="center" sx={{ verticalAlign: "top" }}>
                    <ExportCSVButton variant="icon" data={prepareData([session])} filename={`${filenamePrefix}_User_${session.username}.csv`} label="Export Session" />
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {sessions.length > 0 && (
        <Box sx={{ p: 1 }}>
          {sessions.map((s) => <SessionMetadata key={s.id} metadata={s.metadata} />)}
        </Box>
      )}
    </Paper>
  );
}