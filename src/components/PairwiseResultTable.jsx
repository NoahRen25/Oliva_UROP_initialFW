import React from "react";
import {
  Table, TableBody, TableCell, TableHead, TableRow, Box,
} from "@mui/material";
import ExportCSVButton from "./ExportCSVButton";
import SessionMetadata from "./SessionMetadata";
import PageTranscriptCell, { PageTranscriptHeader, AudioDownloadCell, AudioDownloadHeader } from "./PageTranscriptCell";

/**
 * PairwiseResultTable — Shared table for both image and video pairwise results.
 *
 * Props:
 *   sessions     — array of pairwise sessions
 *   prepareData  — function to flatten sessions for CSV
 *   filenamePrefix — e.g. "Pairwise" or "Video_Pairwise"
 */
export default function PairwiseResultTable({ sessions, prepareData, filenamePrefix = "Pairwise" }) {
  return (
    <>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
            <TableCell><strong>User ID</strong></TableCell>
            <TableCell><strong>Pair</strong></TableCell>
            <TableCell><strong>Winner</strong></TableCell>
            <TableCell><strong>Loser</strong></TableCell>
            <PageTranscriptHeader />
            <AudioDownloadHeader />
            <TableCell align="center"><strong>Action</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) =>
            session.choices.map((choice, j) => (
              <TableRow key={`${session.id}-${j}`}>
                {j === 0 && (
                  <TableCell
                    rowSpan={session.choices.length}
                    sx={{ fontWeight: "bold", verticalAlign: "top" }}
                  >
                    {session.username}
                  </TableCell>
                )}
                <TableCell>{choice.pairId}</TableCell>
                <TableCell sx={{ color: "green", fontWeight: "bold" }}>
                  {choice.winnerName}
                </TableCell>
                <TableCell sx={{ color: "text.secondary" }}>
                  {choice.loserName}
                </TableCell>
                <PageTranscriptCell
                  pageKey={choice.pairId}
                  transcripts={session.pageTranscripts}
                  audioUrls={session.pageAudioUrls}
                  label={`Pair ${choice.pairId}`}
                />
                <AudioDownloadCell
                  pageKey={choice.pairId}
                  audioUrls={session.pageAudioUrls}
                  label={`Pair_${choice.pairId}`}
                />
                {j === 0 && (
                  <TableCell
                    rowSpan={session.choices.length}
                    align="center"
                    sx={{ verticalAlign: "top" }}
                  >
                    <ExportCSVButton
                      variant="icon"
                      data={prepareData([session])}
                      filename={`${filenamePrefix}_User_${session.username}.csv`}
                      label="Export Session"
                    />
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {sessions.length > 0 && (
        <Box sx={{ p: 1 }}>
          {sessions.map((session) => (
            <SessionMetadata key={session.id} metadata={session.metadata} />
          ))}
        </Box>
      )}
    </>
  );
}