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
  Button,
  Box,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import ResultsHeader from "../components/ResultsHeader";
import ExportCSVButton from "../components/ExportCSVButton";
import StatsSummary from "../components/StatsSummary";

export default function PairwiseResult() {
  const { pairwiseSessions, deletePairwiseSession, clearPairwise } =
    useResults();
  const extractPairwiseStats = (session) => {
    const dataPoints = [];

    session.choices.forEach((choice) => {
      dataPoints.push({
        name: choice.winnerName,
        value: 1,
      });
      dataPoints.push({
        name: choice.loserName,
        value: 0,
      });
    });

    return dataPoints;
  };
  const prepareData = (sessionsToExport) => {
    const flatData = [];
    sessionsToExport.forEach((session) => {
      session.choices.forEach((choice) => {
        flatData.push({
          "User ID": session.username,
          Timestamp: new Date(session.timestamp).toLocaleString(),
          "Pair ID": choice.pairId,
          Winner: choice.winnerName,
          Loser: choice.loserName,
          "Winning Side": choice.winnerSide,
        });
      });
    });
    return flatData;
  };
  return (
    <Container maxWidth="md" sx={{ mt: 2 }}>
      <ResultsHeader
        title="Pairwise Results"
        hasData={pairwiseSessions.length > 0}
        onClear={clearPairwise}
      />
      <Box>
        {pairwiseSessions.length > 0 && (
          <ExportCSVButton
            data={prepareData(pairwiseSessions)}
            filename={`All_Pairwise_Results_${
              new Date().toISOString().split("T")[0]
            }.csv`}
            label="Export All"
          />
        )}
        {pairwiseSessions.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweepIcon />}
            onClick={clearPairwise}
          >
            Clear History
          </Button>
        )}
      </Box>
      <Paper sx={{ p: 2 }}>
        {pairwiseSessions.length === 0 ? (
          <Typography sx={{ p: 2 }}>
            No pairwise sessions recorded yet.
          </Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                <TableCell>
                  <strong>User ID</strong>
                </TableCell>
                <TableCell>
                  <strong>Pair</strong>
                </TableCell>
                <TableCell>
                  <strong>Winner</strong>
                </TableCell>
                <TableCell>
                  <strong>Loser</strong>
                </TableCell>
                <TableCell align="center">
                  <strong>Action</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pairwiseSessions.map((session) =>
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
                    <TableCell>ID: {choice.pairId}</TableCell>
                    <TableCell sx={{ color: "green", fontWeight: "bold" }}>
                      {choice.winnerName}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {choice.loserName}
                    </TableCell>

                    {j === 0 && (
                      <TableCell
                        rowSpan={session.choices.length}
                        align="center"
                        sx={{ verticalAlign: "top" }}
                      >
                        <ExportCSVButton
                          variant="icon"
                          data={prepareData([session])}
                          filename={`Pairwise_User_${session.username}.csv`}
                          label="Export Session"
                        />
                        <IconButton
                          color="error"
                          onClick={() =>
                            deletePairwiseSession(session.id, session.username)
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
      <StatsSummary
        sessions={pairwiseSessions}
        dataExtractor={extractPairwiseStats}
      />
    </Container>
  );
}
