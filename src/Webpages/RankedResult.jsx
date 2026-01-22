import React from "react";
import { useResults } from "../Results";
import { Container, Typography, Paper, Box, Chip, Table, TableHead, TableRow, TableCell, TableBody, Button, IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ResultsHeader from "../components/ResultsHeader";
import ExportCSVButton from "../components/ExportCSVButton";
import StatsSummary from "../components/StatsSummary";

export default function RankedResult() {
  const { rankedSessions, deleteRankedSession, clearRanked } = useResults();
  const extractData = (session) => {
    return session.rankings.map(r => ({
        name: r.imageName,
        value: r.rank
    }));
  };
  const prepareRankedData = (sessionsToExport) => {
    const flatData = [];
    sessionsToExport.forEach(session => {
        //ranking sort
        const sortedRankings = [...session.rankings].sort((a, b) => {
            if (a.groupId !== b.groupId) return a.groupId - b.groupId;
            return a.rank - b.rank;
        });

        sortedRankings.forEach(item => {
            flatData.push({
                "User ID": session.username,
                "Timestamp": new Date(session.timestamp).toLocaleString(),
                "Group ID": item.groupId,
                "Image Name": item.imageName,
                "Rank": item.rank,
                "Group Prompt": item.groupPrompt
            });
        });
    });
    return flatData;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <ResultsHeader 
        title="Ranked Results" 
        hasData={rankedSessions.length > 0} 
        onClear={clearRanked}
      />
      
      <Box sx={{ mb: 2 }}>
        {rankedSessions.length > 0 && (
            <ExportCSVButton 
                data={prepareRankedData(rankedSessions)}
                filename={`All_Ranked_Results_${new Date().toISOString().split('T')[0]}.csv`}
                label="Export All"
            />
        )}
      </Box>

      <Paper sx={{ p: 2 }}>
        {rankedSessions.length === 0 ? (
           <Typography sx={{ p: 2 }}>No ranked sessions recorded yet.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>User ID</strong></TableCell>
                <TableCell><strong>Group</strong></TableCell>
                <TableCell><strong>Image</strong></TableCell>
                <TableCell><strong>Rank</strong></TableCell>
                <TableCell align="center"><strong>Action</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rankedSessions.map((session, i) => {
                // Sort the rankings for display
                const sorted = [...session.rankings].sort((a, b) => {
                  if (a.groupId !== b.groupId) return a.groupId - b.groupId;
                  return a.rank - b.rank;
                });

                return sorted.map((item, j) => (
                  <TableRow key={`${session.id}-${j}`}>
                    {j === 0 && (
                      <TableCell 
                        rowSpan={sorted.length} 
                        sx={{ fontWeight: 'bold', verticalAlign: 'top', borderRight: '1px solid #eee' }}
                      >
                        {session.username}
                        {/*time if wanted below */}
                        {/* <Typography variant="caption" display="block" color="text.secondary">
                             {new Date(session.timestamp).toLocaleTimeString()}
                        </Typography> */}
                      </TableCell>
                    )}

                    <TableCell>{item.groupId}</TableCell>
                    <TableCell>{item.imageName}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`#${item.rank}`} 
                        size="small" 
                        color={item.rank === 1 ? "success" : item.rank === 2 ? "primary" : "default"} 
                      />
                    </TableCell>

                    {j === 0 && (
                      <TableCell 
                        rowSpan={sorted.length} 
                        align="center" 
                        sx={{ verticalAlign: 'top', borderLeft: '1px solid #eee' }}
                      >
                        <ExportCSVButton 
                            variant="icon"
                            data={prepareRankedData([session])}
                            filename={`Ranked_User_${session.username}.csv`}
                            label="Export Session"
                        />
                        <IconButton 
                            color="error" 
                            onClick={() => deleteRankedSession(session.id, session.username)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ));
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
      <StatsSummary 
            sessions={rankedSessions} 
            dataExtractor={extractData} 
        />
    </Container>
  );
}