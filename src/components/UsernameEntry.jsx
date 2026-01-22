import React from "react";
import { Paper, Typography, TextField, Button } from "@mui/material";

export default function UsernameEntry({ 
  title, 
  username, 
  setUsername, 
  onStart, 
  validationRegex = /^.+$/ // Default: not empty
}) {
  const isValid = validationRegex.test(username);

  return (
    <Paper sx={{ p: 4, maxWidth: 500, mx: "auto", textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>{title}</Typography>
      <TextField 
        fullWidth 
        sx={{ my: 3 }} 
        label="User ID" 
        value={username} 
        onChange={(e) => setUsername(e.target.value)} 
      />
      <Button 
        variant="contained" 
        onClick={onStart} 
        disabled={!isValid}
      >
        Start
      </Button>
    </Paper>
  );
}