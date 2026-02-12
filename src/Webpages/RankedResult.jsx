import React from "react";
import { useResults } from "../Results";
import { Container, Typography, Paper, Box, Chip, Table, TableHead, TableRow, TableCell, TableBody, Button, IconButton, Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
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

export default function RankedResult() {
  const { rankedSessions, deleteRankedSession, clearRanked } = useResults();

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Ranked Results</Typography>
        {rankedSessions.length > 0 && (
          <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={clearRanked}>
             Clear History
          </Button>
        )}
      </Box>

      {rankedSessions.length === 0 ? (
         <Typography>No ranked sessions recorded yet.</Typography>
      ) : (
        rankedSessions.map((session, i) => {
          const sorted = [...session.rankings].sort((a, b) => {
            if (a.groupId !== b.groupId) return a.groupId - b.groupId;
            return a.rank - b.rank;
          });

          return (
            <Paper key={i} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="primary">User ID: {session.username}</Typography>
                <IconButton color="error" onClick={() => deleteRankedSession(session.id, session.username)}><DeleteIcon /></IconButton>
              </Box>

              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#eee' }}>
                    <TableCell>Group</TableCell>
                    <TableCell>Image</TableCell>
                    <TableCell>Rank</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sorted.map((item, j) => (
                    <TableRow key={j}>
                      <TableCell>{item.groupId}</TableCell>
                      <TableCell>{item.imageName}</TableCell>
                      <TableCell>
                        <Chip label={`#${item.rank}`} size="small" color={item.rank === 1 ? "success" : item.rank === 2 ? "primary" : "default"} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <SessionMetadata metadata={session.metadata} />
            </Paper>
          )
        })
      )}
    </Container>
  );
}
