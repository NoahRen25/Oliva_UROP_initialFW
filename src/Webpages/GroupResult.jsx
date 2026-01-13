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
  TableFooter 
} from "@mui/material";

export default function GroupResult() {
  const { groupSessions } = useResults();
  
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Group Grid Results</Typography>
      <Paper sx={{ p: 2 }}>
        {groupSessions.map((session, i) => {
          const mainScores = session.scores.filter(s => s.imageId !== "b1");
          const hasScores = mainScores.length > 0;
          
         
          const avgScore = hasScores 
            ? (mainScores.reduce((sum, s) => sum + s.score, 0) / mainScores.length).toFixed(2) 
            : "N/A";
          const avgTime = hasScores 
            ? (mainScores.reduce((sum, s) => sum + (parseFloat(s.timeSpent) || 0), 0) / mainScores.length).toFixed(2) 
            : "N/A";
          return (
            <Box key={i} sx={{ mb: 4, border: '1px solid #ddd', p: 2, borderRadius: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                User ID: {session.username}
              </Typography>
              
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell><strong>Image</strong></TableCell>
                    <TableCell align="right"><strong>Score</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {session.scores.map((s, j) => (
                    <TableRow key={j}>
                      <TableCell>
                        {s.imageName} {s.imageId === 0 && <small>(Benchmark)</small>}
                      </TableCell>
                      <TableCell align="right">{s.score}</TableCell>
                      {/* Time Cell removed from here */}
                    </TableRow>
                  ))}
                </TableBody>
                
                <TableFooter>
                  {/* Row 1: Score Average */}
                  <TableRow sx={{ bgcolor: '#fafafa' }}>
                    <TableCell sx={{ fontWeight: 'bold', fontStyle: 'italic' }}>
                      Average Score (Excl. Benchmark)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {avgScore}
                    </TableCell>
                  </TableRow>

                  {/* Row 2: Total/Avg Time Only */}
                  <TableRow sx={{ bgcolor: '#fafafa' }}>
                    <TableCell sx={{ fontWeight: 'bold', fontStyle: "italic" }}>
                      Average Time per Image (s)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {avgTime}s
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </Box>
          );
        })}
        {groupSessions.length === 0 && <Typography>No group ratings yet.</Typography>}
      </Paper>
    </Container>
  );
}