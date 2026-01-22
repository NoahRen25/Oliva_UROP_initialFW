import React from "react";
import { Box, Typography, Button } from "@mui/material";
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

export default function ResultsHeader({ title, hasData, onClear, clearLabel = "Clear History" }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{title}</Typography>
      {hasData && (
        <Button variant="outlined" color="error" startIcon={<DeleteSweepIcon />} onClick={onClear}>
          {clearLabel}
        </Button>
      )}
    </Box>
  );
}