import React from "react";
import { useResults } from "../Results";
import { Container, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Button, Box, IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

export default function PairwiseResult() {
  const { pairwiseSessions, deletePairwiseSession, clearPairwise } = useResults();

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
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
              {pairwiseSessions.map((session, i) => (
                session.choices.map((choice, j) => (
                  <TableRow key={`${i}-${j}`}>
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
                        <IconButton color="error" onClick={() => deletePairwiseSession(i)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Container>
  );
}