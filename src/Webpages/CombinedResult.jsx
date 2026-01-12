import React from "react";
import { useResults } from "../Results";
import { Container, Typography, Grid, Paper, List, ListItem, ListItemText } from "@mui/material";

export default function CombinedResult() {
  const { individualSessions, groupSessions } = useResults();

  const calcAvg = (scores) => (scores.reduce((a, b) => a + b.score, 0) / scores.length).toFixed(1);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" align="center" gutterBottom>Combined Analytics</Typography>
      
      <Grid container spacing={4}>
        {/* Individual Column */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, bgcolor: '#e3f2fd' }}>
            <Typography variant="h5" gutterBottom>Individual Sessions ({individualSessions.length})</Typography>
            <List>
              {individualSessions.map((s, i) => (
                <ListItem key={i} sx={{ bgcolor: 'white', mb: 1, borderRadius: 1 }}>
                  <ListItemText 
                    primary={`User: ${s.username}`} 
                    secondary={`Avg Score: ${calcAvg(s.scores)} | Images Rated: ${s.scores.length}`} 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Group Column */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, bgcolor: '#f3e5f5' }}>
            <Typography variant="h5" gutterBottom>Group Sessions ({groupSessions.length})</Typography>
            <List>
              {groupSessions.map((s, i) => (
                <ListItem key={i} sx={{ bgcolor: 'white', mb: 1, borderRadius: 1 }}>
                  <ListItemText 
                    primary={`User: ${s.username}`} 
                    secondary={`Avg Score: ${calcAvg(s.scores)} | Grid Completed`} 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}