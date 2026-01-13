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
} from "@mui/material";

export default function IndividualResult() {
  const { individualSessions } = useResults();

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Individual Results
      </Typography>

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
              </TableRow>
            </TableHead>
            <TableBody>
              {individualSessions.map((session, sessionIdx) => {
                //calc avgs excl benchmark image 
                const nonBenchmarkScores = session.scores.filter(
                  (s) => s.imageId !== 0
                );

                // 2. Calculate averages only if there are main images rated
                const hasScores = nonBenchmarkScores.length > 0;
                const avgScore = hasScores
                  ? (
                      nonBenchmarkScores.reduce((a, b) => a + b.score, 0) /
                      nonBenchmarkScores.length
                    ).toFixed(2)
                  : "N/A";

                const avgTime = hasScores
                  ? (
                      nonBenchmarkScores.reduce(
                        (a, b) => a + parseFloat(b.timeSpent),
                        0
                      ) / nonBenchmarkScores.length
                    ).toFixed(2)
                  : "N/A";
                  const avgMoves = hasScores
                  ? (
                      nonBenchmarkScores.reduce(
                        (a, b) => a + (b.interactionCount || 0),
                        0
                      ) / nonBenchmarkScores.length
                    ).toFixed(1)
                  : "N/A";
                // Determine how many rows this user spans
                return (
                  <React.Fragment key={sessionIdx}>
                    {session.scores.map((score, scoreIdx) => (
                      <TableRow key={`${sessionIdx}-${scoreIdx}`}>
                        {/* Only show Username on the first row of their group */}
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
                        <TableCell align="right">{score.interactionCount || 0}</TableCell>
                      </TableRow>
                    ))}
                    <TableCell></TableCell>
                    <TableCell sx={{ fontWeight: "bold", color: "#1976d2" }}>
                      Session Average (No benchmark)
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
                    <TableCell align="right" sx={{ fontWeight: "bold", color: "#1976d2" }}>
                        {avgMoves}
                        </TableCell>
                    {/* Divider row */}
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        sx={{ bgcolor: "#f9f9f9", height: "10px", p: 0 }}
                      />
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
            <TableFooter></TableFooter>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}
