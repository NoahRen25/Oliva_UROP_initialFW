import React from "react";
import {
  Table, TableBody, TableCell, TableHead, TableRow,
  TableFooter, Box, Typography, IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ExportCSVButton from "./ExportCSVButton";
import { RecordingCell, RecordingHeader } from "./PageTranscriptCell";

const COLOR_A = "#1976d2";
const COLOR_B = "#9c27b0";

/**
 * Computes average for a numeric field across an array of score objects.
 */
function avg(scores, field, fallback = "N/A") {
  if (!scores || scores.length === 0) return fallback;
  const sum = scores.reduce((acc, s) => acc + (Number(s[field]) || 0), 0);
  return (sum / scores.length).toFixed(2);
}

/**
 * GridResultTable — Shared result table for grid-based rating sessions.
 *
 * Props:
 *   sessions        — array of session objects (each has .scores, .username, etc.)
 *   onDelete        — (sessionId, username) => void
 *   csvPrefix       — filename prefix for exports
 *   pageSize        — images per page (for coloring sequence alternation)
 *   showTimeColumn  — whether to show Avg Time footer row (LayoutResults has it, Combo doesn't)
 *   csvMapper       — (session) => csvData array for per-session export
 */
export default function GridResultTable({
  sessions,
  onDelete,
  csvPrefix = "grid",
  pageSize = 8,
  showTimeColumn = false,
  csvMapper,
}) {
  return sessions.map((session) => {
    const mainScores = (session.scores || []).filter((s) => s.imageId !== "b1");
    const hasScores = mainScores.length > 0;

    const avgScore = avg(mainScores, "score");
    const avgMoves = avg(mainScores, "interactionCount");
    const avgTime = showTimeColumn ? avg(mainScores, "timeSpent") : null;

    const perSessionCsv = csvMapper
      ? csvMapper(session)
      : session.scores.map((s) => ({
          Username: session.username,
          Image: s.imageName,
          Position: s.position,
          Score: s.score,
          Moves: s.interactionCount,
          ClickOrder: s.clickOrder || "-",
        }));

    return (
      <Box
        key={session.id}
        sx={{ mb: 4, border: "1px solid #ddd", p: 2, borderRadius: 2 }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="h6" color="primary">
            User ID: {session.username}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <ExportCSVButton
              variant="icon"
              data={perSessionCsv}
              filename={`${csvPrefix}_${session.username}.csv`}
              label="Export Session"
            />
            {onDelete && (
              <IconButton
                color="error"
                onClick={() => onDelete(session.id, session.username)}
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Table */}
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5" }}>
              <TableCell><strong>Image</strong></TableCell>
              <TableCell align="center"><strong>Pos</strong></TableCell>
              <TableCell align="right"><strong>Score</strong></TableCell>
              <TableCell align="right"><strong>Moves</strong></TableCell>
              <TableCell align="center"><strong>Sequence</strong></TableCell>
                <RecordingHeader />
            </TableRow>
          </TableHead>
          <TableBody>
            {session.scores.map((s, j) => {
              const pagePart = (s.position || "P1").split(":")[0];
              const pageNum = parseInt(pagePart.replace("P", ""), 10) || 1;
              const seqColor = pageNum % 2 !== 0 ? COLOR_A : COLOR_B;

              return (
                <TableRow key={j}>
                  <TableCell>{s.imageName}</TableCell>
                  <TableCell
                    align="center"
                    sx={{ color: "text.secondary", fontSize: "0.85rem" }}
                  >
                    {s.position}
                  </TableCell>
                  <TableCell align="right">{s.score}</TableCell>
                  <TableCell align="right">{s.interactionCount || 0}</TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: "bold", color: seqColor }}
                  >
                    {s.clickOrder || "-"}
                  </TableCell>
                  <RecordingCell
                    pageKey={pageNum}
                    audioUrls={session.pageAudioUrls}
                    label={`Page_${pageNum}`}
                  />
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow sx={{ bgcolor: "#fafafa" }}>
              <TableCell sx={{ fontWeight: "bold" }}>Avg</TableCell>
              <TableCell />
              <TableCell align="right" sx={{ fontWeight: "bold", color: "primary.main" }}>
                {avgScore}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold", color: "primary.main" }}>
                {avgMoves}
              </TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
            </TableRow>
            {avgTime && (
              <TableRow sx={{ bgcolor: "#fafafa" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Avg Time (s)</TableCell>
                <TableCell />
                <TableCell align="right" sx={{ fontWeight: "bold", color: "primary.main" }}>
                  {avgTime}s
                </TableCell>
                <TableCell colSpan={4} />
              </TableRow>
            )}
          </TableFooter>
        </Table>
      </Box>
    );
  });
}