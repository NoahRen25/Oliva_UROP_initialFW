import React from "react";
import { useResults } from "../Results";
import { Container, Typography, Grid, Paper, List, ListItem, ListItemText } from "@mui/material";

export default function CombinedResult() {
  const { individualSessions, groupSessions } = useResults();

  const getStats = (scores) => {
    // Filter out benchmarks (handles both ID: 0 and ID: "b1")
    const mainImages = scores.filter(s => s.imageId !== 0 && s.imageId !== "b1");
    
    if (mainImages.length === 0) return { avgScore: "N/A", avgTime: "N/A" };

    const totalScore = mainImages.reduce((a, b) => a + b.score, 0);
    const totalTime = mainImages.reduce((a, b) => a + (parseFloat(b.timeSpent) || 0), 0);

    return {
      avgScore: (totalScore / mainImages.length).toFixed(1),
      avgTime: (totalTime / mainImages.length).toFixed(2)
    };
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" align="center" gutterBottom>Combined Analytics</Typography>
      
      <Grid container spacing={4}>
        {/* Individual Column */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, bgcolor: '#e3f2fd' }}>
            <Typography variant="h5" gutterBottom>Individual Sessions ({individualSessions.length})</Typography>
            <List>
              {individualSessions.map((s, i) => {
                const stats = getStats(s.scores); // Calculate once per user
                return (
                  <ListItem key={i} sx={{ bgcolor: 'white', mb: 1, borderRadius: 1 }}>
                    <ListItemText 
                      primary={`User: ${s.username}`} 
                      secondary={
                        <>
                          <Typography component="span" variant="body2" display="block">
                            Avg Score: <strong>{stats.avgScore}</strong>
                          </Typography>
                          <Typography component="span" variant="body2" display="block">
                            Avg Time: <strong>{stats.avgTime}s</strong>
                          </Typography>
                        </>
                      } 
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Grid>

        {/* Group Column */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, bgcolor: '#f3e5f5' }}>
            <Typography variant="h5" gutterBottom>Group Sessions ({groupSessions.length})</Typography>
            <List>
              {groupSessions.map((s, i) => {
                const stats = getStats(s.scores); // Calculate once per user
                return (
                  <ListItem key={i} sx={{ bgcolor: 'white', mb: 1, borderRadius: 1 }}>
                    <ListItemText 
                      primary={`User: ${s.username}`} 
                      secondary={
                        <>
                          <Typography component="span" variant="body2" display="block">
                            Avg Score: <strong>{stats.avgScore}</strong>
                          </Typography>
                          <Typography component="span" variant="body2" display="block">
                            Avg Time: <strong>{stats.avgTime}s</strong>
                          </Typography>
                        </>
                      } 
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}