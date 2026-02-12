import React, { useMemo } from "react";
import { useResults } from "../Results";
import {
  Container, Typography, Grid, Paper, List, ListItem, ListItemText,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Box, Chip, LinearProgress, Accordion, AccordionSummary, AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { median, standardDeviation, scoreDistribution, detectOutliers } from "../utils/statsUtils";

const SCORE_COLORS = {
  1: "#ef5350",
  2: "#ff7043",
  3: "#ffa726",
  4: "#66bb6a",
  5: "#42a5f5",
};

export default function CombinedResult() {
  const { individualSessions, groupSessions, pairwiseSessions, rankedSessions } = useResults();

  // --- Session-level stats helper (kept from original) ---
  const getStats = (scores) => {
    const mainImages = scores.filter(s => s.imageId !== 0 && s.imageId !== "b1");
    if (mainImages.length === 0) return { avgScore: "N/A", avgTime: "N/A", avgMoves: "N/A" };
    const totalScore = mainImages.reduce((a, b) => a + b.score, 0);
    const totalTime = mainImages.reduce((a, b) => a + (parseFloat(b.timeSpent) || 0), 0);
    const totalMoves = mainImages.reduce((a, b) => a + (b.interactionCount || 0), 0);
    return {
      avgScore: (totalScore / mainImages.length).toFixed(1),
      avgTime: (totalTime / mainImages.length).toFixed(2),
      avgMoves: (totalMoves / mainImages.length).toFixed(1),
    };
  };

  // --- 3a. Per-Image Aggregated Stats (Individual + Group) ---
  const perImageStats = useMemo(() => {
    const imageMap = {};
    const allSessions = [...individualSessions, ...groupSessions];
    allSessions.forEach((session) => {
      (session.scores || []).forEach((s) => {
        if (s.imageId === 0 || s.imageId === "b1") return;
        const name = s.imageName || `Image ${s.imageId}`;
        if (!imageMap[name]) imageMap[name] = [];
        imageMap[name].push(s.score);
      });
    });

    return Object.entries(imageMap)
      .map(([name, scores]) => {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        return {
          name,
          count: scores.length,
          mean: mean.toFixed(2),
          median: median(scores).toFixed(2),
          stdDev: standardDeviation(scores).toFixed(2),
          min: Math.min(...scores),
          max: Math.max(...scores),
          distribution: scoreDistribution(scores),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [individualSessions, groupSessions]);

  // --- 3c. Outlier detection ---
  const individualOutliers = useMemo(
    () => detectOutliers(individualSessions, "individual").filter((s) => s.outlierReasons.length > 0),
    [individualSessions]
  );
  const groupOutliers = useMemo(
    () => detectOutliers(groupSessions, "group").filter((s) => s.outlierReasons.length > 0),
    [groupSessions]
  );
  const pairwiseOutliers = useMemo(
    () => detectOutliers(pairwiseSessions, "pairwise").filter((s) => s.outlierReasons.length > 0),
    [pairwiseSessions]
  );
  const allOutliers = [...individualOutliers.map(s => ({ ...s, mode: "Individual" })),
                        ...groupOutliers.map(s => ({ ...s, mode: "Group" })),
                        ...pairwiseOutliers.map(s => ({ ...s, mode: "Pairwise" }))];

  // --- 3d. Pairwise win rates ---
  const pairwiseWinRates = useMemo(() => {
    const winMap = {};
    const appearMap = {};
    pairwiseSessions.forEach((session) => {
      (session.choices || []).forEach((choice) => {
        const winner = choice.winnerName;
        const loser = choice.loserName;
        if (winner) {
          winMap[winner] = (winMap[winner] || 0) + 1;
          appearMap[winner] = (appearMap[winner] || 0) + 1;
        }
        if (loser) {
          appearMap[loser] = (appearMap[loser] || 0) + 1;
        }
      });
    });
    return Object.entries(appearMap)
      .map(([name, total]) => ({
        name,
        wins: winMap[name] || 0,
        total,
        winRate: (((winMap[name] || 0) / total) * 100).toFixed(1),
      }))
      .sort((a, b) => parseFloat(b.winRate) - parseFloat(a.winRate));
  }, [pairwiseSessions]);

  // --- 3d. Ranked average rank ---
  const rankedAvgRanks = useMemo(() => {
    const rankMap = {};
    rankedSessions.forEach((session) => {
      (session.rankings || []).forEach((item) => {
        const name = item.imageName || `Image ${item.imageId}`;
        if (!rankMap[name]) rankMap[name] = [];
        rankMap[name].push(item.rank);
      });
    });
    return Object.entries(rankMap)
      .map(([name, ranks]) => ({
        name,
        count: ranks.length,
        avgRank: (ranks.reduce((a, b) => a + b, 0) / ranks.length).toFixed(2),
      }))
      .sort((a, b) => parseFloat(a.avgRank) - parseFloat(b.avgRank));
  }, [rankedSessions]);

  // --- Check if outlier session ---
  const outlierIds = new Set(allOutliers.map((s) => s.id));

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Typography variant="h3" align="center" gutterBottom>Combined Analytics</Typography>

      {/* ===== Per-Session Summaries (original layout, enhanced with outlier chips) ===== */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, bgcolor: "#e3f2fd" }}>
            <Typography variant="h5" gutterBottom>Individual Sessions ({individualSessions.length})</Typography>
            <List>
              {individualSessions.map((s, i) => {
                const stats = getStats(s.scores);
                const isOutlier = outlierIds.has(s.id);
                return (
                  <ListItem key={i} sx={{ bgcolor: "white", mb: 1, borderRadius: 1, border: isOutlier ? "2px solid #ff9800" : "none" }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {`User: ${s.username}`}
                          {isOutlier && <Chip icon={<WarningAmberIcon />} label="Flagged" size="small" color="warning" />}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" display="block">Avg Score: <strong>{stats.avgScore}</strong></Typography>
                          <Typography component="span" variant="body2" display="block">Avg Time: <strong>{stats.avgTime}s</strong></Typography>
                          <Typography component="span" variant="body2" display="block">Avg Moves: <strong>{stats.avgMoves}</strong></Typography>
                        </>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 2, bgcolor: "#f3e5f5" }}>
            <Typography variant="h5" gutterBottom>Group Sessions ({groupSessions.length})</Typography>
            <List>
              {groupSessions.map((s, i) => {
                const stats = getStats(s.scores);
                const isOutlier = outlierIds.has(s.id);
                return (
                  <ListItem key={i} sx={{ bgcolor: "white", mb: 1, borderRadius: 1, border: isOutlier ? "2px solid #ff9800" : "none" }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {`User: ${s.username}`}
                          {isOutlier && <Chip icon={<WarningAmberIcon />} label="Flagged" size="small" color="warning" />}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" display="block">Avg Score: <strong>{stats.avgScore}</strong></Typography>
                          <Typography component="span" variant="body2" display="block">Avg Time: <strong>{stats.avgTime}s</strong></Typography>
                          <Typography component="span" variant="body2" display="block">Avg Moves: <strong>{stats.avgMoves}</strong></Typography>
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

      {/* ===== 3a. Per-Image Aggregated Stats Table ===== */}
      {perImageStats.length > 0 && (
        <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
          <Typography variant="h5" gutterBottom>Per-Image Statistics (Individual + Group)</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#eee" }}>
                  <TableCell><strong>Image</strong></TableCell>
                  <TableCell align="right"><strong>Count</strong></TableCell>
                  <TableCell align="right"><strong>Mean</strong></TableCell>
                  <TableCell align="right"><strong>Median</strong></TableCell>
                  <TableCell align="right"><strong>Std Dev</strong></TableCell>
                  <TableCell align="right"><strong>Min</strong></TableCell>
                  <TableCell align="right"><strong>Max</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {perImageStats.map((img) => (
                  <TableRow key={img.name}>
                    <TableCell>{img.name}</TableCell>
                    <TableCell align="right">{img.count}</TableCell>
                    <TableCell align="right">{img.mean}</TableCell>
                    <TableCell align="right">{img.median}</TableCell>
                    <TableCell align="right">{img.stdDev}</TableCell>
                    <TableCell align="right">{img.min}</TableCell>
                    <TableCell align="right">{img.max}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ===== 3b. Score Distribution Histograms ===== */}
      {perImageStats.length > 0 && (
        <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
          <Typography variant="h5" gutterBottom>Score Distributions</Typography>
          <Grid container spacing={2}>
            {perImageStats.map((img) => {
              const total = img.count;
              return (
                <Grid item xs={12} md={6} key={img.name}>
                  <Box sx={{ p: 1.5, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>{img.name}</Typography>
                    {[1, 2, 3, 4, 5].map((score) => {
                      const count = img.distribution[score];
                      const pct = total > 0 ? (count / total) * 100 : 0;
                      return (
                        <Box key={score} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                          <Typography variant="caption" sx={{ width: 16, textAlign: "right" }}>{score}</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                              flex: 1, height: 12, borderRadius: 1, bgcolor: "#eee",
                              "& .MuiLinearProgress-bar": { bgcolor: SCORE_COLORS[score] },
                            }}
                          />
                          <Typography variant="caption" sx={{ width: 40, textAlign: "right" }}>{pct.toFixed(0)}%</Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      )}

      {/* ===== 3d. Pairwise Win Rates ===== */}
      {pairwiseWinRates.length > 0 && (
        <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
          <Typography variant="h5" gutterBottom>Pairwise Win Rates ({pairwiseSessions.length} sessions)</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#eee" }}>
                  <TableCell><strong>Image</strong></TableCell>
                  <TableCell align="right"><strong>Wins</strong></TableCell>
                  <TableCell align="right"><strong>Appearances</strong></TableCell>
                  <TableCell align="right"><strong>Win Rate</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pairwiseWinRates.map((img) => (
                  <TableRow key={img.name}>
                    <TableCell>{img.name}</TableCell>
                    <TableCell align="right">{img.wins}</TableCell>
                    <TableCell align="right">{img.total}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={parseFloat(img.winRate)}
                          sx={{ width: 60, height: 8, borderRadius: 1 }}
                        />
                        {img.winRate}%
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ===== 3d. Ranked Average Ranks ===== */}
      {rankedAvgRanks.length > 0 && (
        <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
          <Typography variant="h5" gutterBottom>Ranked Average Rank ({rankedSessions.length} sessions)</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#eee" }}>
                  <TableCell><strong>Image</strong></TableCell>
                  <TableCell align="right"><strong>Times Ranked</strong></TableCell>
                  <TableCell align="right"><strong>Avg Rank</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rankedAvgRanks.map((img, i) => (
                  <TableRow key={img.name}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {i === 0 && <Chip label="#1" size="small" color="success" />}
                        {img.name}
                      </Box>
                    </TableCell>
                    <TableCell align="right">{img.count}</TableCell>
                    <TableCell align="right">{img.avgRank}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ===== 3c. Flagged Sessions ===== */}
      {allOutliers.length > 0 && (
        <Paper elevation={3} sx={{ p: 2, mb: 4, bgcolor: "#fff8e1" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <WarningAmberIcon color="warning" />
            <Typography variant="h5">Flagged Sessions ({allOutliers.length})</Typography>
          </Box>
          {allOutliers.map((s, i) => (
            <Accordion key={i} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Chip label={s.mode} size="small" variant="outlined" />
                  <Typography>User: {s.username}</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {s.outlierReasons.map((reason, j) => (
                  <Typography key={j} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    &bull; {reason}
                  </Typography>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
        </Paper>
      )}

      {/* Empty state */}
      {individualSessions.length === 0 && groupSessions.length === 0 &&
       pairwiseSessions.length === 0 && rankedSessions.length === 0 && (
        <Typography align="center" color="text.secondary" sx={{ mt: 4 }}>
          No sessions recorded yet. Complete a rating session to see analytics here.
        </Typography>
      )}
    </Container>
  );
}
