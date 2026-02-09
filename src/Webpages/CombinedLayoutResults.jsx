import React from "react";
import { useResults } from "../Results";
import {
  Container,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

const LAYOUTS = [
  { id: "2x2", label: "2×2" },
  { id: "4x1", label: "4×1" },
  { id: "3x3", label: "3×3" },
  { id: "3x3-small", label: "3×3 Small" },
  { id: "3x3-no-center", label: "3×3 No Center" },
  { id: "4x4", label: "4×4" },
];

const getStats = (scores) => {
  const mainImages = (scores || []).filter(
    (s) => s.imageId !== 0 && s.imageId !== "b1"
  );

  if (mainImages.length === 0)
    return { avgScore: "N/A", avgTime: "N/A", avgMoves: "N/A" };

  const totalScore = mainImages.reduce((a, b) => a + (Number(b.score) || 0), 0);
  const totalTime = mainImages.reduce(
    (a, b) => a + (parseFloat(b.timeSpent) || 0),
    0
  );
  const totalMoves = mainImages.reduce(
    (a, b) => a + (b.interactionCount || 0),
    0
  );

  return {
    avgScore: (totalScore / mainImages.length).toFixed(1),
    avgTime: (totalTime / mainImages.length).toFixed(2),
    avgMoves: (totalMoves / mainImages.length).toFixed(1),
  };
};

export default function CombinedLayoutsResults() {
  const { groupSessionsByLayout, getGroupSessions } = useResults();

  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      <Typography variant="h3" align="center" gutterBottom>
        Combined Analytics by Layout
      </Typography>

      <Grid container spacing={3}>
        {LAYOUTS.map((layout) => {
          const sessions = getGroupSessions(layout.id);

          return (
            <Grid item xs={12} sm={6} md={4} lg={2} key={layout.id}>
              <Paper elevation={3} sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                <Typography variant="h6" gutterBottom>
                  {layout.label} ({sessions.length})
                </Typography>

                <List>
                  {sessions.map((s, i) => {
                    const stats = getStats(s.scores);
                    return (
                      <ListItem
                        key={i}
                        sx={{ bgcolor: "white", mb: 1, borderRadius: 1 }}
                      >
                        <ListItemText
                          primary={`User: ${s.username}`}
                          secondary={
                            <>
                              <Typography
                                component="span"
                                variant="body2"
                                display="block"
                              >
                                Avg Score: <strong>{stats.avgScore}</strong>
                              </Typography>
                              <Typography
                                component="span"
                                variant="body2"
                                display="block"
                              >
                                Avg Time: <strong>{stats.avgTime}s</strong>
                              </Typography>
                              <Typography
                                component="span"
                                variant="body2"
                                display="block"
                              >
                                Avg Moves: <strong>{stats.avgMoves}</strong>
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    );
                  })}

                  {sessions.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No sessions yet.
                    </Typography>
                  )}
                </List>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}
