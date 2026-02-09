import React from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { computeSessionAverages } from "./ComputeSessionAverages";

export default function ResultsSessionCard({ session, onDelete }) {
  const { avgScore, avgTime, avgMoves } = computeSessionAverages(session);

  return (
    <Box sx={{ mb: 4, border: "1px solid #ddd", p: 2, borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6" color="primary" gutterBottom>
          User ID: {session.username}
        </Typography>
        <IconButton color="error" onClick={onDelete}>
          <DeleteIcon />
        </IconButton>
      </Box>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: "#f5f5f5" }}>
            <TableCell>
              <strong>Image</strong>
            </TableCell>
            <TableCell align="right">
              <strong>Score</strong>
            </TableCell>
            <TableCell align="right">
              <strong>Moves</strong>
            </TableCell>
            <TableCell align="right">
              <strong>Mem Score</strong>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {(session.scores || []).map((s, j) => (
            <TableRow key={j}>
              <TableCell>{s.imageName || s.imageId}</TableCell>
              <TableCell align="right">{s.score}</TableCell>
              <TableCell align="right">{s.interactionCount || 0}</TableCell>
              <TableCell align="right">
                {typeof s.memorabilityScore === "number"
                  ? s.memorabilityScore.toFixed(3)
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

        <TableFooter>
          <TableRow sx={{ bgcolor: "#fafafa" }}>
            <TableCell sx={{ fontWeight: "bold" }}>Avg</TableCell>
            <TableCell
              align="right"
              sx={{ fontWeight: "bold", color: "primary.main" }}
            >
              {avgScore}
            </TableCell>
            <TableCell
              align="right"
              sx={{ fontWeight: "bold", color: "primary.main" }}
            >
              {avgMoves}
            </TableCell>
            <TableCell />
          </TableRow>
          <TableRow sx={{ bgcolor: "#fafafa" }}>
            <TableCell sx={{ fontWeight: "bold" }}>Avg Time (s)</TableCell>
            <TableCell
              align="right"
              sx={{ fontWeight: "bold", color: "primary.main" }}
            >
              {avgTime}s
            </TableCell>
            <TableCell />
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </Box>
  );
}
