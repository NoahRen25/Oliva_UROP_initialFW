import React from "react";
import { useResults } from "../Results";
import { Container, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, IconButton, Accordion, AccordionSummary, AccordionDetails, Chip } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DevicesIcon from '@mui/icons-material/Devices';

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
  const { pairwiseSessions, deletePairwiseSession, clearPairwise } = useResults();

  return (
    <Container maxWidth="md" sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Pairwise Results</Typography>
        {pairwiseSessions.length > 0 && (
          <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={clearPairwise}>
            Clear History
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 2 }}>
        {pairwiseSessions.length === 0 ? (
          <Typography sx={{ p: 2 }}>No pairwise sessions recorded yet.</Typography>
        ) : (
          pairwiseSessions.map((session) => (
            <Box key={session.id} sx={{ mb: 3, border: '1px solid #ddd', borderRadius: 2, overflow: 'hidden' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell><strong>User ID</strong></TableCell>
                    <TableCell><strong>Pair</strong></TableCell>
                    <TableCell><strong>Winner</strong></TableCell>
                    <TableCell><strong>Loser</strong></TableCell>
                    <TableCell align="center"><strong>Action</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {session.choices.map((choice, j) => (
                    <TableRow key={`${session.id}-${j}`}>
                      {j === 0 && (
                        <TableCell rowSpan={session.choices.length} sx={{ fontWeight: 'bold', verticalAlign: 'top' }}>
                          {session.username}
                        </TableCell>
                      )}
                      <TableCell>ID: {choice.pairId}</TableCell>
                      <TableCell sx={{ color: 'green', fontWeight: 'bold' }}>{choice.winnerName}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{choice.loserName}</TableCell>
                      {j === 0 && (
                        <TableCell rowSpan={session.choices.length} align="center" sx={{ verticalAlign: 'top' }}>
                          <IconButton color="error" onClick={() => deletePairwiseSession(session.id, session.username)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Box sx={{ px: 1, pb: 1 }}>
                <SessionMetadata metadata={session.metadata} />
              </Box>
            </Box>
          ))
        )}
      </Paper>
    </Container>
  );
}
