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
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DevicesIcon from "@mui/icons-material/Devices";
import ResultsHeader from "../components/ResultsHeader";
import ExportCSVButton from "../components/ExportCSVButton";
import StatsSummary from "../components/StatsSummary";

function SessionMetadata({ metadata }) {
  if (!metadata) return null;
  return (
    <Accordion disableGutters sx={{ boxShadow: 'none', '&:before': { display: 'none' }, bgcolor: 'transparent' }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 32, px: 1, '& .MuiAccordionSummary-content': { my: 0.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <DevicesIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">Session Info</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1, pt: 0, pb: 1 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          <Chip label={metadata.browser} size="small" variant="outlined" />
          <Chip label={metadata.platform} size="small" variant="outlined" />
          <Chip label={`Window: ${metadata.screenSize}`} size="small" variant="outlined" />
          <Chip label={`Screen: ${metadata.screenResolution}`} size="small" variant="outlined" />
          <Chip label={`${metadata.pixelRatio}x DPR`} size="small" variant="outlined" />
          {metadata.isMobile && <Chip label="Mobile" size="small" color="info" />}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}

export default function PairwiseResult() {
  const { pairwiseSessions } = useResults();
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
      </Box>
      <Paper sx={{ p: 2 }}>
        {pairwiseSessions.length === 0 ? (
          <Typography sx={{ p: 2 }}>
            No pairwise sessions recorded yet.
          </Typography>
        ) : (
          <>
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
                    <TableCell>{choice.pairId}</TableCell>
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
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {pairwiseSessions.length > 0 && (
            <Box sx={{ p: 1 }}>
              {pairwiseSessions.map((session) => (
                <SessionMetadata key={session.id} metadata={session.metadata} />
              ))}
            </Box>
          )}
          </>
        )}
      </Paper>
      <StatsSummary
        sessions={pairwiseSessions}
        dataExtractor={extractPairwiseStats}
      />
    </Container>
  );
}
