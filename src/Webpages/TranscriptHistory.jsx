import React, { useState } from 'react';
import { Container, Typography, Paper, Grid, Box, Button, Chip, TextField, InputAdornment } from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import TimerIcon from '@mui/icons-material/Timer';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import { useResults } from '../Results';
import ResultsHeader from '../components/ResultsHeader';
import ExportCSVButton from '../components/ExportCSVButton';

const TranscriptHistory = () => {
  const { transcripts = [], clearTranscripts, delTranscript } = useResults();
  const [searchQuery, setSearchQuery] = useState("");

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return m > 0 ? `${m}m ${rs}s` : `${rs}s`;
  };

  // filtering
  const filteredTranscripts = transcripts.filter(t => 
    t.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
<ResultsHeader 
        title="Recording History" 
        hasData={transcripts.length > 0} 
        onClear={clearTranscripts} 
        clearLabel="Clear History"
      />
<ExportCSVButton 
                    data={transcripts}
                    filename={`Transcripts_${new Date().toISOString().split('T')[0]}.csv`}
                    label="Export CSV"
                />
      {/* Search Bar */}
      {transcripts.length > 0 && (
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search within transcripts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 4, bgcolor: 'white' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      )}

      {filteredTranscripts.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center', bgcolor: '#fafafa', border: '1px dashed #ccc' }}>
          <Typography color="text.secondary">
            {transcripts.length === 0 ? "No recordings found." : "No matches for your search."}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredTranscripts.map((item) => (
            <Grid item xs={12} key={item.id} sx={{width: "100%"}}>
              <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box sx={{ bgcolor: '#e3f2fd', p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{item.timestamp}</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip icon={<TimerIcon />} label={formatDuration(item.duration)} size="small" color="secondary" variant="outlined" />
                    <Chip label={`${item.length} chars`} size="small" color="primary" variant="outlined" />
                    <Chip label="Delete" icon={<DeleteIcon />} color="error" onClick={() => delTranscript(item.id, item.timestamp)}/>
                  </Box>
                </Box>
                <Box sx={{ p: 3, maxHeight: '200px', overflowY: 'auto' }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{item.text}</Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default TranscriptHistory;