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
  Box,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DevicesIcon from "@mui/icons-material/Devices";
import ResultsHeader from "../components/ResultsHeader";
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

export default function IndividualResult() {
  const { individualSessions } = useResults();

  const extractData = (session) => {
    if (!session || !session.scores) return [];
    return session.scores.map((s) => ({
      name: s.imageName || "Unknown",
      value: s.score || 0,
    }));
  };

  return (
    <Container maxWidth="md" sx={{ mt: 2 }}>
      <ResultsHeader
        title="Individual Results"
        hasData={individualSessions.length > 0}
      />

      {individualSessions.length === 0 ? (
        <Typography>No ratings submitted yet.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#eee" }}>
                <TableCell><strong>User ID</strong></TableCell>
                <TableCell><strong>Image</strong></TableCell>
                <TableCell align="right"><strong>Score</strong></TableCell>
                <TableCell align="right"><strong>Time (s)</strong></TableCell>
                <TableCell align="right"><strong>Moves</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {individualSessions.map((session) => {
                // imageId 0 is the benchmark
                const nonBenchmark = session.scores.filter(
                  (s) => s.imageId !== 0 && s.imageId !== "0"
                );
                const hasScores = nonBenchmark.length > 0;

                const avgScore = hasScores
                  ? (
                      nonBenchmark.reduce((a, b) => a + (b.score || 0), 0) /
                      nonBenchmark.length
                    ).toFixed(2)
                  : "N/A";
                const avgTime = hasScores
                  ? (
                      nonBenchmark.reduce(
                        (a, b) => a + parseFloat(b.timeSpent || 0),
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
                  <React.Fragment key={session.id}>
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
                        <TableCell sx={{ wordBreak: 'break-all', fontSize: '0.8rem' }}>
                          {score.imageName}
                        </TableCell>
                        <TableCell align="right">{score.score}</TableCell>
                        <TableCell align="right">{score.timeSpent}</TableCell>
                        <TableCell align="right">
                          {score.interactionCount || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: "#fafafa" }}>
                      <TableCell
                        colSpan={2}
                        sx={{ fontWeight: "bold", color: "#1976d2" }}
                      >
                        Session Average (No BM)
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", color: "#1976d2" }}>
                        {avgScore}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", color: "#1976d2" }}>
                        {avgTime}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: "bold", color: "#1976d2" }}>
                        {avgMoves}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={5} sx={{ py: 0, px: 1 }}>
                        <SessionMetadata metadata={session.metadata} />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        sx={{ bgcolor: "#f1f1f1", height: "8px", p: 0 }}
                      />
                    </TableRow>
                  </React.Fragment>
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
