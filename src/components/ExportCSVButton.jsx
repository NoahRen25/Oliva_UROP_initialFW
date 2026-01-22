import React from 'react';
import { Button, IconButton, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

export default function ExportCSVButton({ 
  data, 
  filename = 'export.csv', 
  headers = [], 
  variant = 'contained', // 'contained' (big button) or 'icon' (small row button)
  label = 'Export CSV' 
}) {

  const downloadCSV = () => {
    if (!data || data.length === 0) {
      alert("No data to export");
      return;
    }

    // 1. Determine Headers (if not provided, extract from first object)
    const csvHeaders = headers.length > 0 ? headers : Object.keys(data[0]);

    // 2. Convert Data to CSV String
    const csvRows = [
        csvHeaders.join(','), // Header Row
        ...data.map(row => {
            return csvHeaders.map(fieldName => {
                // Handle null/undefined
                let val = row[fieldName] === null || row[fieldName] === undefined ? '' : row[fieldName];
                // Convert to string
                val = val.toString();
                // Escape quotes and wrap in quotes if it contains comma, newline, or quote
                if (val.search(/("|,|\n)/g) >= 0) {
                    val = `"${val.replace(/"/g, '""')}"`;
                }
                return val;
            }).join(',');
        })
    ];

    const csvString = csvRows.join('\r\n');

    // 3. Trigger Download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  if (variant === 'icon') {
    return (
      <Tooltip title={label}>
        <IconButton color="primary" onClick={downloadCSV}>
          <FileDownloadIcon />
        </IconButton>
      </Tooltip>
    );
  }

  return (
    <Button 
        variant="contained" 
        color="success" 
        startIcon={<DownloadIcon />} 
        onClick={downloadCSV}
        sx={{ mr: 1 }}
    >
      {label}
    </Button>
  );
}