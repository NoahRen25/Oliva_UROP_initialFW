import React from "react";
import { useResults } from "../Results";
import {
  Container,
  Typography,
  Paper,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";

export default function PrivacySettings() {
  const {
    individualSessions,
    groupSessions,
    pairwiseSessions,
    rankedSessions,
    selectionSessions,
    pressureCookerSessions,
    transcripts,
    clearIndividual,
    clearGroup,
    clearPairwise,
    clearRanked,
    clearSelection,
    clearPressureCooker,
    clearTranscripts,
    consentGiven,
    consentTimestamp,
    revokeConsent,
    clearAllData,
  } = useResults();

  const dataCategories = [
    { label: "Individual Sessions", count: individualSessions.length, onClear: clearIndividual },
    { label: "Group Sessions", count: groupSessions.length, onClear: clearGroup },
    { label: "Pairwise Sessions", count: pairwiseSessions.length, onClear: clearPairwise },
    { label: "Ranked Sessions", count: rankedSessions.length, onClear: clearRanked },
    { label: "Selection Sessions", count: selectionSessions.length, onClear: clearSelection },
    { label: "Pressure Cooker Sessions", count: pressureCookerSessions.length, onClear: clearPressureCooker },
    { label: "Voice Transcripts", count: transcripts.length, onClear: clearTranscripts },
  ];

  const totalDataCount = dataCategories.reduce((sum, cat) => sum + cat.count, 0);

  const formatDate = (isoString) => {
    if (!isoString) return "Unknown";
    return new Date(isoString).toLocaleString();
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <PrivacyTipIcon sx={{ fontSize: 40, color: "primary.main" }} />
          <Typography variant="h4" fontWeight="bold">
            Privacy Settings
          </Typography>
        </Box>

        {/* Consent Status */}
        <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Consent Status
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            {consentGiven ? (
              <>
                <CheckCircleIcon color="success" />
                <Typography color="success.main">Consent given</Typography>
                <Chip label={`Since: ${formatDate(consentTimestamp)}`} size="small" />
              </>
            ) : (
              <>
                <WarningIcon color="warning" />
                <Typography color="warning.main">No consent on record</Typography>
              </>
            )}
          </Box>
          {consentGiven && (
            <Button
              variant="outlined"
              color="warning"
              size="small"
              onClick={revokeConsent}
            >
              Revoke Consent
            </Button>
          )}
        </Paper>

        {/* Data Overview */}
        <Typography variant="h6" gutterBottom>
          Your Data ({totalDataCount} total items)
        </Typography>

        <List>
          {dataCategories.map((category) => (
            <React.Fragment key={category.label}>
              <ListItem>
                <ListItemText
                  primary={category.label}
                  secondary={`${category.count} item${category.count !== 1 ? "s" : ""}`}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={category.onClear}
                    disabled={category.count === 0}
                  >
                    Clear
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>

        {/* Delete All Data */}
        <Box sx={{ mt: 4, p: 3, bgcolor: "#ffebee", borderRadius: 2 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Danger Zone
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This will permanently delete all your data and revoke your consent. This action cannot be undone.
          </Typography>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={clearAllData}
            disabled={totalDataCount === 0 && !consentGiven}
          >
            Delete All My Data
          </Button>
        </Box>

        {/* Privacy Policy */}
        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" gutterBottom>
          Privacy Policy
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          All data is stored locally in your browser and never leaves your device.
        </Alert>
        <Typography variant="body2" color="text.secondary" paragraph>
          This application stores the following data locally:
        </Typography>
        <Box component="ul" sx={{ pl: 2, color: "text.secondary" }}>
          <li>
            <Typography variant="body2">User IDs you provide when starting sessions</Typography>
          </li>
          <li>
            <Typography variant="body2">Rating scores, rankings, and pairwise choices</Typography>
          </li>
          <li>
            <Typography variant="body2">Timestamps of when you completed each session</Typography>
          </li>
          <li>
            <Typography variant="body2">Interaction metrics (slider movements, response times)</Typography>
          </li>
          <li>
            <Typography variant="body2">Voice transcripts from the voice recorder feature</Typography>
          </li>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph sx={{ mt: 2 }}>
          No data is transmitted to any server. All processing happens in your browser.
          You can delete your data at any time using the controls above.
        </Typography>
      </Paper>
    </Container>
  );
}