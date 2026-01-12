import React from "react";
import { useResults } from "../Results";
import { Container, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

export default function PairwiseResult() {
  const { pairwiseSessions } = useResults();

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Pairwise Results</Typography>
      <Paper sx={{ p: 2 }}>
        {pairwiseSessions.length === 0 ? (
          <Typography sx={{ p: 2 }}>No pairwise sessions recorded yet.</Typography>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>User ID</strong></TableCell>
                <TableCell><strong>Pair ID</strong></TableCell>
                <TableCell><strong>Winner (Chosen)</strong></TableCell>
                <TableCell><strong>Loser</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pairwiseSessions.map((session, i) => (
                session.choices.map((choice, j) => (
                  <TableRow key={`${i}-${j}`}>
                    {j === 0 ? (
                      <TableCell rowSpan={session.choices.length} sx={{ fontWeight: 'bold' }}>
                        {session.username}
                      </TableCell>
                    ) : null}
                    <TableCell>Pair {choice.pairId}</TableCell>
                    <TableCell sx={{ color: 'green', fontWeight: 'bold' }}>{choice.winnerName}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{choice.loserName}</TableCell>
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