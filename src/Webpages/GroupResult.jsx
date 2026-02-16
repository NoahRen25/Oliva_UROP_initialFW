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
  TableFooter,
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

export default function GroupResult() {
  const { groupSessions } = useResults();
  const extractData = (session) => {
    return session.scores.map((s) => ({
      name: s.imageName,
      value: s.score,
    }));
  };
  return (
    <Container maxWidth="md" sx={{ mt: 2 }}>
      <ResultsHeader
        title="Group Results"
        hasData={groupSessions.length > 0}
      />

      <Paper sx={{ p: 2 }}>
        {groupSessions.length === 0 ? (
          <Typography>No group ratings yet.</Typography>
        ) : (
          groupSessions.map((session) => {
            const mainScores = session.scores.filter((s) => s.imageId !== "b1");
            const hasScores = mainScores.length > 0;
            const avgScore = hasScores
              ? (
                  mainScores.reduce((sum, s) => sum + s.score, 0) /
                  mainScores.length
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
                    (sum, s) => sum + (s.interactionCount || 0),
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
                </Box>

                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell>
                        <strong>Image</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Score</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>Moves</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {session.scores.map((s, j) => (
                      <TableRow key={j}>
                        <TableCell>
                          {s.imageName}{" "}
                          {s.imageId === "b1" && <small>(Benchmark)</small>}
                        </TableCell>
                        <TableCell align="right">{s.score}</TableCell>
                        <TableCell align="right">
                          {s.interactionCount || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow sx={{ bgcolor: "#fafafa" }}>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Avg (Excl. BM)
                      </TableCell>
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
                <SessionMetadata metadata={session.metadata} />
              </Box>
            );
          })
        )}
      </Paper>
      <StatsSummary sessions={groupSessions} dataExtractor={extractData} />
    </Container>
  );
}
