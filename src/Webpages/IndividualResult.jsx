import React from "react";
import { useResults } from "../Results";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableFooter,
  Button,
  Box,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import ResultsHeader from "../components/ResultsHeader";
import StatsSummary from "../components/StatsSummary";

export default function IndividualResult() {
  const { individualSessions, deleteIndividualSession, clearIndividual } =
    useResults();

  const extractData = (session) => {
    return session.scores.map((s) => ({
      name: s.imageName,
      value: s.score,
    }));
  };
  return (
    <Container maxWidth="md" sx={{ mt: 2 }}>
      <ResultsHeader
        title="Individual Results"
        hasData={individualSessions.length > 0}
        onClear={clearIndividual}
      />

      {individualSessions.length === 0 ? (
        <Typography>No ratings submitted yet.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#eee" }}>
                <TableCell>
                  <strong>User ID</strong>
                </TableCell>
                <TableCell>
                  <strong>Image</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Score</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Time (s)</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>Moves</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Action</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {individualSessions.map((session) => {
                const nonBenchmark = session.scores.filter(
                  (s) => s.imageId !== 0
                );
                const hasScores = nonBenchmark.length > 0;

                const avgScore = hasScores
                  ? (
                      nonBenchmark.reduce((a, b) => a + b.score, 0) /
                      nonBenchmark.length
                    ).toFixed(2)
                  : "N/A";
                const avgTime = hasScores
                  ? (
                      nonBenchmark.reduce(
                        (a, b) => a + parseFloat(b.timeSpent),
                        0
                      ) / nonBenchmark.length
                    ).toFixed(2)
                  : "N/A";
                const avgMoves = hasScores
                  ? (
                      nonBenchmark.reduce(
                        (a, b) => a + (b.interactionCount || 0),
                        0
                      ) / nonBenchmark.length
                    ).toFixed(1)
                  : "N/A";

                return (
                  <>
                    {session.scores.map((score, scoreIdx) => (
                      <TableRow key={`${session.id}-${scoreIdx}`}>
                        {scoreIdx === 0 && (
                          <TableCell
                            rowSpan={session.scores.length}
                            sx={{ verticalAlign: "top", fontWeight: "bold" }}
                          >
                            {session.username}
                          </TableCell>
                        )}
                        <TableCell>{score.imageName}</TableCell>
                        <TableCell align="right">{score.score}</TableCell>
                        <TableCell align="right">{score.timeSpent}</TableCell>
                        <TableCell align="right">
                          {score.interactionCount || 0}
                        </TableCell>
                        {scoreIdx === 0 && (
                          <TableCell
                            rowSpan={session.scores.length}
                            align="center"
                          >
                            <IconButton
                              color="error"
                              onClick={() =>
                                deleteIndividualSession(
                                  session.id,
                                  session.username
                                )
                              }
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: "#fafafa" }}>
                      <TableCell
                        colSpan={2}
                        sx={{ fontWeight: "bold", color: "#1976d2" }}
                      >
                        Session Average (No BM)
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: "bold", color: "#1976d2" }}
                      >
                        {avgScore}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: "bold", color: "#1976d2" }}
                      >
                        {avgTime}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: "bold", color: "#1976d2" }}
                      >
                        {avgMoves}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        sx={{ bgcolor: "#f1f1f1", height: "8px", p: 0 }}
                      />
                    </TableRow>
                  </>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <StatsSummary sessions={individualSessions} dataExtractor={extractData} />
    </Container>
  );
}
