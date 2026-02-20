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

export default function ComboResultsPage() {
  const { fixedSessions, deleteFixedSession, clearFixedSessions } = useResults();

  const COLOR_A = "#1976d2"; // Primary Blue
  const COLOR_B = "#9c27b0"; // Secondary Purple

  // Prepare ALL data for bulk CSV export
  const csvData = fixedSessions.flatMap(session => 
    session.scores.map(s => ({
      Username: session.username,
      Protocol: "Combo",
      Timestamp: session.timestamp,
      Image: s.imageName,
      Position: s.position,
      Score: s.score,
      Moves: s.interactionCount,
      ClickOrder: s.clickOrder || "-",
    }))
  );

  // Helper for the StatsSummary component
  const extractData = (session) => {
    return (session.scores || []).map((s) => ({
      name: s.imageName,
      value: s.score,
    }));
  };

  return (
    <Container maxWidth="md" sx={{ mt: 2 }}>
      <ResultsHeader
        title="Combo Protocol Results"
        hasData={fixedSessions.length > 0}
        onClear={clearFixedSessions}
      />
      
      <ExportCSVButton data={csvData} filename="combo_results_all.csv" label="Download All" />

      <Paper sx={{ p: 2 }}>
        {fixedSessions.length === 0 ? (
          <Typography>No combo ratings yet.</Typography>
        ) : (
          fixedSessions.map((session) => {
            const hasScores = session.scores.length > 0;
            
            // Prepare single session CSV data
            const individualCsvData = session.scores.map((s) => ({
              Username: session.username,
              Image: s.imageName,
              Position: s.position,
              Score: s.score,
              Moves: s.interactionCount,
              ClickOrder: s.clickOrder || "-",
            }));

            // Calculate Session Averages
            const avgScore = hasScores
              ? (
                  session.scores.reduce(
                    (sum, s) => sum + (Number(s.score) || 0),
                    0
                  ) / session.scores.length
                ).toFixed(2)
              : "N/A";

            const avgMoves = hasScores
              ? (
                  session.scores.reduce(
                    (sum, s) => sum + (Number(s.interactionCount) || 0),
                    0
                  ) / session.scores.length
                ).toFixed(1)
              : "N/A";

            return (
              <Box
                key={session.id}
                sx={{ mb: 4, border: "1px solid #ddd", p: 2, borderRadius: 2 }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6" color="primary">
                    User ID: {session.username}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <ExportCSVButton 
                        variant="icon" 
                        data={individualCsvData} 
                        filename={`combo_${session.username}.csv`}
                        label="Export Session"
                    />
                    <IconButton
                        color="error"
                        onClick={() => deleteFixedSession(session.id)}
                    >
                        <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell><strong>Image</strong></TableCell>
                      <TableCell align="center"><strong>Pos</strong></TableCell>
                      <TableCell align="right"><strong>Score</strong></TableCell>
                      <TableCell align="right"><strong>Moves</strong></TableCell>
                      <TableCell align="center"><strong>Sequence</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {session.scores.map((s, j) => {
                      // Extract Page Number from Position string "P1:(1,1)" for coloring
                      // Format is consistent from ComboRatingFlow
                      const pagePart = s.position.split(':')[0]; // "P1"
                      const pageNum = parseInt(pagePart.replace('P', ''), 10);
                      
                      // Odd pages = Color A, Even pages = Color B
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
                            <TableCell align="right">
                            {s.interactionCount || 0}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold', color: seqColor}}>
                            {s.clickOrder || "-"}
                            </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                  <TableFooter>
                    <TableRow sx={{ bgcolor: "#fafafa" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>Avg</TableCell>
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
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              </Box>
            );
          })
        )}
      </Paper>

      <StatsSummary sessions={fixedSessions} dataExtractor={extractData} />
    </Container>
  );
}