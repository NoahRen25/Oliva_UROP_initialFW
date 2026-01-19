import React from "react";
import { useResults } from "../Results";
import { Container, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Box, TableFooter, Button, IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

export default function GroupResult() {
  const { groupSessions, deleteGroupSession, clearGroup } = useResults();
  
  return (
    <Container maxWidth="md" sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Group Grid Results</Typography>
        {groupSessions.length > 0 && (
          <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={clearGroup}>
            Clear History
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 2 }}>
        {groupSessions.length === 0 ? <Typography>No group ratings yet.</Typography> : 
          groupSessions.map((session, i) => {
            const mainScores = session.scores.filter(s => s.imageId !== "b1");
            const hasScores = mainScores.length > 0;
            const avgScore = hasScores ? (mainScores.reduce((sum, s) => sum + s.score, 0) / mainScores.length).toFixed(2) : "N/A";
            const avgTime = hasScores ? (mainScores.reduce((sum, s) => sum + (parseFloat(s.timeSpent) || 0), 0) / mainScores.length).toFixed(2) : "N/A";
            const avgMoves = hasScores ? (mainScores.reduce((sum, s) => sum + (s.interactionCount || 0), 0) / mainScores.length).toFixed(1) : "N/A";

            return (
              <Box key={i} sx={{ mb: 4, border: '1px solid #ddd', p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" color="primary" gutterBottom>User ID: {session.username}</Typography>
                  <IconButton color="error" onClick={() => deleteGroupSession(i)}><DeleteIcon /></IconButton>
                </Box>
                
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell><strong>Image</strong></TableCell>
                      <TableCell align="right"><strong>Score</strong></TableCell>
                      <TableCell align="right"><strong>Moves</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {session.scores.map((s, j) => (
                      <TableRow key={j}>
                        <TableCell>{s.imageName} {s.imageId === "b1" && <small>(Benchmark)</small>}</TableCell>
                        <TableCell align="right">{s.score}</TableCell>
                        <TableCell align="right">{s.interactionCount || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Avg (Excl. BM)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{avgScore}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{avgMoves}</TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: '#fafafa' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Avg Time (s)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{avgTime}s</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              </Box>
            );
          })}
      </Paper>
    </Container>
  );
}