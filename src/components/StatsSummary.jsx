import React, { useMemo } from 'react';
import { Box, Typography, Paper, Grid, Divider, Tooltip } from '@mui/material';
import { calculateStats } from '../utils/StatsUtils'; // Adjust path as needed

const HistogramBar = ({ label, count, maxCount, color }) => {
  const heightPercent = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mx: 0.5, flex: 1 }}>
      <Tooltip title={`Count: ${count}`}>
        <Box 
          sx={{ 
            width: '100%', 
            height: '60px', 
            display: 'flex', 
            alignItems: 'flex-end',
            bgcolor: '#f5f5f5',
            borderRadius: 1,
            overflow: 'hidden'
          }}
        >
          <Box 
            sx={{ 
              width: '100%', 
              height: `${Math.max(heightPercent, 5)}%`, // min height 5% for visibility
              bgcolor: color,
              transition: 'height 0.5s'
            }} 
          />
        </Box>
      </Tooltip>
      <Typography variant="caption" sx={{ mt: 0.5 }}>{label}</Typography>
    </Box>
  );
};

export default function StatsSummary({ sessions, dataExtractor, type = "score" }) {
  // dataExtractor: function that takes a session and returns array of { name, value }

  const statsData = useMemo(() => {
    const map = {};
    const allValues = [];

    sessions.forEach(session => {
      const items = dataExtractor(session);
      items.forEach(item => {
        if (!map[item.name]) map[item.name] = [];
        // Parse value to float to ensure math works
        const val = parseFloat(item.value);
        if(!isNaN(val)) {
            map[item.name].push(val);
            allValues.push(val);
        }
      });
    });

    const results = Object.keys(map).map(key => ({
      name: key,
      ...calculateStats(map[key])
    }));

    const totalStats = calculateStats(allValues);

    return { results, totalStats };
  }, [sessions, dataExtractor]);

  if (sessions.length === 0) return null;

  const renderCard = (title, stats, isTotal = false) => {
    // Determine labels for histogram based on type
    const histKeys = Object.keys(stats.histogram).sort((a,b) => parseFloat(a) - parseFloat(b));
    const maxFreq = Math.max(...Object.values(stats.histogram));

    return (
      <Grid item xs={12} md={6} lg={4} key={title}>
        <Paper 
            elevation={isTotal ? 6 : 2} 
            sx={{ 
                p: 2, 
                height: '100%', 
                border: isTotal ? '2px solid #1976d2' : '1px solid #eee',
                bgcolor: isTotal ? '#e3f2fd' : 'white'
            }}
        >
          <Typography variant="h6" gutterBottom color={isTotal ? "primary" : "text.primary"} sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
          
          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid item xs={4}><Typography variant="caption" display="block">Mean</Typography><strong>{stats.mean}</strong></Grid>
            <Grid item xs={4}><Typography variant="caption" display="block">Median</Typography><strong>{stats.median}</strong></Grid>
            <Grid item xs={4}><Typography variant="caption" display="block">StdDev</Typography><strong>{stats.stdDev}</strong></Grid>
          </Grid>

          <Divider sx={{ mb: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'flex-end', height: '80px', mt: 2 }}>
            {histKeys.map(key => (
               <HistogramBar 
                 key={key} 
                 label={key} 
                 count={stats.histogram[key]} 
                 maxCount={maxFreq} 
                 color={isTotal ? "#1976d2" : "#66bb6a"}
               />
            ))}
          </Box>
           <Typography variant="caption" align="center" display="block" sx={{mt:1, fontStyle:'italic'}}>
             Distribution (n={stats.count})
           </Typography>
        </Paper>
      </Grid>
    );
  };

  return (
    <Box sx={{ mt: 5 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>Statistical Analysis</Typography>
      <Grid container spacing={3}>
        {/* Total Summary First */}
        {renderCard("TOTAL (All Images)", statsData.totalStats, true)}
        {/* Individual Images */}
        {statsData.results.map(r => renderCard(r.name, r))}
      </Grid>
    </Box>
  );
}