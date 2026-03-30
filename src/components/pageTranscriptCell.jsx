import React, { useState } from "react";
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  TableCell,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";


export default function PageTranscriptCell({ pageKey, transcripts, label }) {
  const [open, setOpen] = useState(false);

  const text = transcripts?.[pageKey] || "";
  const hasText = text.trim().length > 0;
  const hasAnyTranscripts = transcripts && Object.keys(transcripts).length > 0;

  // if session has no transcripts, show disabled mic
  if (!hasAnyTranscripts) {
    return (
      <TableCell align="center">
        <Tooltip title="No recording for this session">
          <MicOffIcon sx={{ fontSize: 18, color: "action.disabled" }} />
        </Tooltip>
      </TableCell>
    );
  }

  return (
    <TableCell align="center">
      <Tooltip title={hasText ? "View transcript" : "No speech recorded for this page"}>
        <IconButton
          size="small"
          onClick={() => setOpen(true)}
          sx={{
            color: hasText ? "primary.main" : "action.disabled",
          }}
        >
          {hasText ? <MicIcon sx={{ fontSize: 18 }} /> : <MicOffIcon sx={{ fontSize: 18 }} />}
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MicIcon color="primary" />
          <Typography variant="h6">
            {label || `Page ${pageKey} Transcript`}
          </Typography>
          <Chip
            label={hasText ? `${text.split(/\s+/).length} words` : "Empty"}
            size="small"
            color={hasText ? "primary" : "default"}
            sx={{ ml: "auto" }}
          />
        </DialogTitle>

        <DialogContent>
          {hasText ? (
            <Box
              sx={{
                p: 2,
                bgcolor: "#f5f5f5",
                borderRadius: 2,
                maxHeight: 300,
                overflowY: "auto",
                fontFamily: "inherit",
              }}
            >
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                {text}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
              No speech was recorded during this page/step.
            </Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </TableCell>
  );
}

export function PageTranscriptHeader() {
  return (
    <TableCell align="center">
      <Tooltip title="Voice transcripts recorded during each page">
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
          <MicIcon sx={{ fontSize: 16 }} />
          <strong>Audio</strong>
        </Box>
      </Tooltip>
    </TableCell>
  );
}