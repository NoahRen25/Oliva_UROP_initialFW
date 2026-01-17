import React from "react";
import { useResults } from "../Results";
import { Container, Typography, Paper, Box, Chip, Table, TableHead, TableRow, TableCell, TableBody, Button, IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

export default function RankedResult() {
  const { rankedSessions, deleteRankedSession, clearRanked } = useResults();

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
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
                <IconButton color="error" onClick={() => deleteRankedSession(i)}><DeleteIcon /></IconButton>
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
            </Paper>
          )
        })
      )}
    </Container>
  );
}