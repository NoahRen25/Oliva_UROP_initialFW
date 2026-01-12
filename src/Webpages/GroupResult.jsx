import React from "react";
import { useResults } from "../Results";
import { Container, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Box } from "@mui/material";

export default function GroupResult() {
  const { groupSessions } = useResults();

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Group Grid Results</Typography>
      <Paper sx={{ p: 2 }}>
        {groupSessions.map((session, i) => (
          <Box key={i} sx={{ mb: 4, border: '1px solid #ddd', p: 2, borderRadius: 2 }}>
            <Typography variant="h6" color="primary">User ID: {session.username}</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>Image</TableCell><TableCell>Score</TableCell></TableRow></TableHead>
              <TableBody>
                {session.scores.map((s, j) => (
                  <TableRow key={j}>
                    <TableCell>{s.imageName}</TableCell>
                    <TableCell>{s.score}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        ))}
        {groupSessions.length === 0 && <Typography>No group ratings yet.</Typography>}
      </Paper>
    </Container>
  );
}