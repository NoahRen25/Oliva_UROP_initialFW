import React, { useState } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";

export default function UsernameEntry({
  title,
  username,
  setUsername,
  onStart,
  validationRegex = /^.+$/, // default: not empty
}) {
  const isValid = validationRegex.test(username);
  const [consentAccepted, setConsentAccepted] = useState(false);

  return (
    <Paper sx={{ p: 4, maxWidth: 500, mx: "auto", textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>
      <TextField
        fullWidth
        sx={{ my: 3 }}
        label="User ID"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Box sx={{ textAlign: "left", mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Consent notice
        </Typography>
        <Typography variant="body2" color="text.secondary">
          By continuing, you consent to participate in this study and allow us
          to collect your responses and interaction data for research purposes.
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom>
          Privacy note
        </Typography>
        <Typography variant="body2" color="text.secondary">
          We store your responses, timestamps, and any provided identifiers.
          Data is stored in this application’s local storage and/or the project
          database. We retain data for the duration of the study unless you
          request deletion.
        </Typography>
      </Box>
      <FormControlLabel
        sx={{ mb: 2, justifyContent: "center" }}
        control={
          <Checkbox
            checked={consentAccepted}
            onChange={(e) => setConsentAccepted(e.target.checked)}
          />
        }
        label="I have read and agree"
      />
      <Button
        variant="contained"
        onClick={onStart}
        disabled={!isValid || !consentAccepted}
      >
        Start
      </Button>
    </Paper>
  );
}
