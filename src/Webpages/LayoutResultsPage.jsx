import React from "react";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Box,
  TableFooter,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useResults } from "../Results";
import ResultsHeader from "../components/ResultsHeader";
import StatsSummary from "../components/StatsSummary";
import ExportCSVButton from "../components/ExportCSVButton";
import PageTranscriptCell, { PageTranscriptHeader } from "../components/PageTranscriptCell";

export default function LayoutResultsPage({ layoutId, title }) {
  const { getGroupSessions, deleteGroupSessionForLayout, clearGroupForLayout } =
    useResults();


  
  const sessions = getGroupSessions(layoutId);
  const COLOR_A = "#1976d2"; // Primary Blue
  const COLOR_B = "#9c27b0"; // Secondary Purple
  const csvData = sessions.flatMap(session => 
    session.scores.map(s => ({
      Username: session.username,
      Layout: layoutId,
      Timestamp: session.timestamp,
      Image: s.imageName,
      Position: s.position,
      Score: s.score,
      Moves: s.interactionCount,
      ClickOrder: s.clickOrder || "-",
      TimeSpent: s.timeSpent,
    }))
  );
  const extractData = (session) => {
    return (session.scores || []).map((s) => ({
      name: s.imageName || s.imageId,
      value: s.score,
    }));
  };

  return (
    <Container maxWidth="md" sx={{ mt: 2 }}>
      <ResultsHeader
        title={title}
        hasData={sessions.length > 0}
        onClear={() => clearGroupForLayout(layoutId)}
      />
<ExportCSVButton data={csvData} filename={`${layoutId}_results.csv`} label="Download All" />
      <Paper sx={{ p: 2 }}>
        {sessions.length === 0 ? (
          <Typography>No group ratings yet for {layoutId}.</Typography>
        ) : (
          sessions.map((session) => {
            const pageSize = session.meta?.grid?.pageSize || 4;
            
            const mainScores = (session.scores || []).filter((s) => s.imageId !== "b1");
            const individualCsvData = session.scores.map((s) => ({
              Username: session.username,
              Image: s.imageName,
              Position: s.position,
              Score: s.score,
              Moves: s.interactionCount,
              ClickOrder: s.clickOrder || "-",
              TimeSpent: s.timeSpent,
            }));
            const hasScores = mainScores.length > 0;

            const avgScore = hasScores
              ? (
                  mainScores.reduce(
                    (sum, s) => sum + (Number(s.score) || 0),
                    0
                  ) / mainScores.length
                ).toFixed(2)
              : "N/A";

            const avgTime = hasScores
              ? (
                  mainScores.reduce(
                    (sum, s) => sum + (parseFloat(s.timeSpent) || 0),
                    0
                  ) / mainScores.length
                ).toFixed(2)
              : "N/A";

            const avgMoves = hasScores
              ? (
                  mainScores.reduce(
                    (sum, s) => sum + (Number(s.interactionCount) || 0),
                    0
                  ) / mainScores.length
                ).toFixed(1)
              : "N/A";

            return (
              <Box
                key={session.id}
                sx={{ mb: 4, border: "1px solid #ddd", p: 2, borderRadius: 2 }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    User ID: {session.username}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                  <ExportCSVButton 
                    variant="icon" 
                    data={individualCsvData} 
                    filename={`${layoutId}_${session.username}.csv`}
                    label="Export Session"
                  />
                  
                  <IconButton
                    color="error"
                    onClick={() => deleteGroupSessionForLayout(layoutId, session.id, session.username)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
                </Box>

                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell>
                        <strong>Image</strong>
                      </TableCell>
                      <TableCell align="center">
                        <strong>Pos</strong>
                      </TableCell>{" "}
                      {/* New Column */}
                      <TableCell align="right">
                        <strong>Score</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Moves</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Sequence</strong>
                      </TableCell>
                      <PageTranscriptHeader />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {session.scores.map((s, j) => {
                      const pageIndex = Math.floor(j / pageSize);
                      const seqColor = pageIndex % 2 === 0 ? COLOR_A : COLOR_B;
                      return (
                      <TableRow key={j}>
                        <TableCell>{s.imageName}</TableCell>
                        <TableCell
                          align="center"
                          sx={{ color: "text.secondary", fontSize: "0.85rem" }}
                        >
                          {s.position}
                        </TableCell>
                        <TableCell align="right" >{s.score}</TableCell>
                        <TableCell align="right">
                          {s.interactionCount || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', color: seqColor}}>
                          {s.clickOrder || "-"}
                        </TableCell>
                        <PageTranscriptCell
                          pageKey={parseInt((s.position || "P1").split(":")[0].replace("P", ""), 10) || 1}
                          transcripts={session.pageTranscripts}
                          label={`Page ${(s.position || "P1").split(":")[0]}`}
                        />
                      </TableRow>
                      );
          })}
                  </TableBody>
                  <TableFooter>
                    <TableRow sx={{ bgcolor: "#fafafa" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Avg
                      </TableCell>
                      <TableCell />
                      <TableCell
                        align="right"
                        sx={{ fontWeight: "bold", color: "primary.main" }}
                      >
                        {avgScore}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: "bold", color: "primary.main" }}
                      >
                        {avgMoves}
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: "#fafafa" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Avg Time (s)
                      </TableCell>
                      <TableCell />
                      <TableCell
                        align="right"
                        sx={{ fontWeight: "bold", color: "primary.main" }}
                      >
                        
                        {avgTime}s
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              </Box>
            );
          })
        )}
      </Paper>

      <StatsSummary sessions={sessions} dataExtractor={extractData} />
    </Container>
  );
}