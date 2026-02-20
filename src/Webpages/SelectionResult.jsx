import React from "react";
import { useResults } from "../Results";
import {
  Container, Typography, Paper, Table, TableBody, TableCell,
  TableHead, TableRow, Box, Chip, IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ResultsHeader from "../components/ResultsHeader";
import ExportCSVButton from "../components/ExportCSVButton";

export default function SelectionResult() {
  const { selectionSessions, deleteSelectionSession, clearSelection } = useResults();

  const csvData = selectionSessions.flatMap((s) =>
    s.selections.map((sel) => ({
      Username: s.username,
      Timestamp: s.timestamp,
      TaskPrompt: s.prompt,
      Image: sel.imageName,
      ImagePrompt: sel.imagePrompt || "",
      Selected: sel.selected ? "Yes" : "No",
    }))
  );

  return (
    <Container maxWidth="md" sx={{ mt: 2 }}>
      <ResultsHeader
        title="Selection Results"
        hasData={selectionSessions.length > 0}
        onClear={clearSelection}
      />

      {selectionSessions.length > 0 && (
        <ExportCSVButton data={csvData} filename="selection_results.csv" label="Export All" />
      )}

      <Paper sx={{ p: 2 }}>
        {selectionSessions.length === 0 ? (
          <Typography sx={{ p: 2 }}>No selection sessions yet.</Typography>
        ) : (
          selectionSessions.map((session) => {
            const selCount = session.selections.filter((s) => s.selected).length;
            const total = session.selections.length;

            return (
              <Box
                key={session.id}
                sx={{ mb: 4, border: "1px solid #ddd", p: 2, borderRadius: 2 }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="h6" color="primary">
                    User: {session.username}
                  </Typography>
                  <IconButton color="error" onClick={() => deleteSelectionSession(session.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Prompt: "{session.prompt}" — {selCount}/{total} selected
                </Typography>

                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                      <TableCell><strong>Image</strong></TableCell>
                      <TableCell><strong>Image Prompt</strong></TableCell>
                      <TableCell align="center"><strong>Selected</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {session.selections.map((sel, j) => (
                      <TableRow key={j}>
                        <TableCell sx={{ fontSize: "0.8rem" }}>{sel.imageName}</TableCell>
                        <TableCell sx={{ fontSize: "0.75rem", maxWidth: 300 }}>
                          {sel.imagePrompt}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={sel.selected ? "Yes" : "No"}
                            size="small"
                            color={sel.selected ? "primary" : "default"}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            );
          })
        )}
      </Paper>
    </Container>
  );
}