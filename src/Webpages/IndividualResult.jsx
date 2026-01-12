import React from "react";
import { useResults } from "../Results";
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";

export default function IndividualResult() {
  const { individualSessions } = useResults();

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>Individual Results</Typography>
      
      {individualSessions.length === 0 ? (
        <Typography>No ratings submitted yet.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#eee' }}>
                <TableCell><strong>User ID</strong></TableCell>
                <TableCell><strong>Image</strong></TableCell>
                <TableCell align="right"><strong>Score</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {individualSessions.map((session, sessionIdx) => (
                // Determine how many rows this user spans
                <React.Fragment key={sessionIdx}>
                  {session.scores.map((score, scoreIdx) => (
                    <TableRow key={`${sessionIdx}-${scoreIdx}`}>
                      {/* Only show Username on the first row of their group */}
                      {scoreIdx === 0 && (
                        <TableCell rowSpan={session.scores.length} sx={{ verticalAlign: 'top', fontWeight: 'bold' }}>
                           {session.username}
                        </TableCell>
                      )}
                      <TableCell>{score.imageName}</TableCell>
                      <TableCell align="right">{score.score}</TableCell>
                    </TableRow>
                  ))}
                  {/* Divider row */}
                  <TableRow><TableCell colSpan={3} sx={{ bgcolor: '#f9f9f9', height: '10px', p:0 }} /></TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
}