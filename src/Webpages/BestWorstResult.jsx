import React from "react";
import { useResults } from "../Results";
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
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ResultsHeader from "../components/ResultsHeader";
import ExportCSVButton from "../components/ExportCSVButton";
import StatsSummary from "../components/StatsSummary";

export default function BestWorstResult() {
  // # coded by denis comments, simdenis@mit.edu
  const { bestWorstSessions, deleteBestWorstSession, clearBestWorst } =
    useResults();

  const extractStats = (session) => {
    const dataPoints = [];
    session.trials.forEach((trial) => {
      dataPoints.push({ name: trial.bestName, value: 1 });
      dataPoints.push({ name: trial.worstName, value: 0 });
    });
    return dataPoints;
  };

  const prepareData = (sessionsToExport) => {
    const flatData = [];
    sessionsToExport.forEach((session) => {
      session.trials.forEach((trial) => {
        flatData.push({
          "User ID": session.username,
          Timestamp: new Date(session.timestamp).toLocaleString(),
          "Trial ID": trial.trialId,
          Prompt: trial.prompt,
          Best: trial.bestName,
          Worst: trial.worstName,
          "Response Time (s)": trial.responseTime,
        });
      });
    });
    return flatData;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <ResultsHeader
        title="Best-Worst Results"
        hasData={bestWorstSessions.length > 0}
        onClear={clearBestWorst}
      />

      <Box sx={{ mb: 2 }}>
        {bestWorstSessions.length > 0 && (
          <ExportCSVButton
            data={prepareData(bestWorstSessions)}
            filename={`All_BestWorst_Results_${
              new Date().toISOString().split("T")[0]
            }.csv`}
            label="Export All"
          />
        )}
      </Box>

      <Paper sx={{ p: 2 }}>
        {bestWorstSessions.length === 0 ? (
          <Typography sx={{ p: 2 }}>
            No best-worst sessions recorded yet.
          </Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell>
                  <strong>User ID</strong>
                </TableCell>
                <TableCell>
                  <strong>Trial</strong>
                </TableCell>
                <TableCell>
                  <strong>Best</strong>
                </TableCell>
                <TableCell>
                  <strong>Worst</strong>
                </TableCell>
                <TableCell>
                  <strong>Prompt</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Action</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bestWorstSessions.map((session) =>
                session.trials.map((trial, j) => (
                  <TableRow key={`${session.id}-${j}`}>
                    {j === 0 && (
                      <TableCell
                        rowSpan={session.trials.length}
                        sx={{ fontWeight: "bold", verticalAlign: "top" }}
                      >
                        {session.username}
                      </TableCell>
                    )}
                    <TableCell>ID: {trial.trialId}</TableCell>
                    <TableCell sx={{ color: "green", fontWeight: "bold" }}>
                      {trial.bestName}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {trial.worstName}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 400 }}>
                      {trial.prompt}
                    </TableCell>
                    {j === 0 && (
                      <TableCell
                        rowSpan={session.trials.length}
                        align="center"
                        sx={{ verticalAlign: "top" }}
                      >
                        <ExportCSVButton
                          variant="icon"
                          data={prepareData([session])}
                          filename={`BestWorst_User_${session.username}.csv`}
                          label="Export Session"
                        />
                        <IconButton
                          color="error"
                          onClick={() =>
                            deleteBestWorstSession(session.id, session.username)
                          }
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <StatsSummary sessions={bestWorstSessions} dataExtractor={extractStats} />
    </Container>
  );
}
