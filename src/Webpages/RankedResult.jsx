import React from "react";
import { useResults } from "../Results";
import { Container, Typography, Paper, Box, Chip } from "@mui/material";

export default function RankedResult() {
  const { rankedSessions } = useResults();

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Ranked Results</Typography>
      
      {rankedSessions.length === 0 ? (
         <Typography>No ranked sessions recorded yet.</Typography>
      ) : (
        rankedSessions.map((session, i) => {
          // sort the rankings for this user by Rank (1, 2, 3)
          const sorted = [...session.rankings].sort((a, b) => a.rank - b.rank);
          
          return (
            <Paper key={i} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" color="primary" gutterBottom>
                User ID: {session.username}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {sorted.map((item) => (
                  <Chip 
                    key={item.imageId}
                    label={`#${item.rank}: ${item.imageName}`}
                    color={item.rank === 1 ? "success" : item.rank === 2 ? "primary" : "default"}
                    sx={{ p: 2, fontSize: '1rem' }}
                  />
                ))}
              </Box>
            </Paper>
          )
        })
      )}
    </Container>
  );
}