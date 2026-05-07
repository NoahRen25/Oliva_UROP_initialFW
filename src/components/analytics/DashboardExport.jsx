import React from "react";
import { Paper, Typography, Box, Button } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import Papa from "papaparse";

const monoFont = "'JetBrains Mono', monospace";

function flattenSession(session, mode) {
  const rows = [];

  if (session.scores) {
    for (const sc of session.scores) {
      rows.push({
        mode,
        sessionId: session.id,
        username: session.username || "",
        timestamp: session.timestamp || "",
        imageId: sc.imageId ?? sc.id ?? "",
        imageName: sc.filename || sc.imageName || "",
        score: sc.score ?? sc.rating ?? "",
        timeSpent: sc.timeSpent ?? "",
      });
    }
  } else if (session.choices) {
    for (const c of session.choices) {
      rows.push({
        mode,
        sessionId: session.id,
        username: session.username || "",
        timestamp: session.timestamp || "",
        imageA: c.imageA || c.leftImage || "",
        imageB: c.imageB || c.rightImage || "",
        chosen: c.chosen || c.winner || "",
        timeSpent: c.timeSpent ?? "",
      });
    }
  } else if (session.rankings) {
    for (const r of session.rankings) {
      rows.push({
        mode,
        sessionId: session.id,
        username: session.username || "",
        timestamp: session.timestamp || "",
        imageName: r.imageName || r.filename || "",
        rank: r.rank ?? "",
      });
    }
  } else if (session.trials) {
    for (const t of session.trials) {
      rows.push({
        mode,
        sessionId: session.id,
        username: session.username || "",
        timestamp: session.timestamp || "",
        best: t.best || "",
        worst: t.worst || "",
        images: (t.images || []).join("; "),
        timeSpent: t.timeSpent ?? "",
      });
    }
  } else if (session.selections) {
    for (const s of session.selections) {
      rows.push({
        mode,
        sessionId: session.id,
        username: session.username || "",
        timestamp: session.timestamp || "",
        imageName: s.imageName || "",
        selected: s.selected ? "Yes" : "No",
      });
    }
  } else {
    rows.push({
      mode,
      sessionId: session.id,
      username: session.username || "",
      timestamp: session.timestamp || "",
    });
  }

  return rows;
}

function downloadCSV(filename, csvString) {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DashboardExport({ allSessions }) {
  if (!allSessions) return null;

  const handleExportAll = () => {
    const modeEntries = [
      { key: "individualSessions", mode: "individual" },
      { key: "groupSessions", mode: "group" },
      { key: "fixedSessions", mode: "fixed" },
      { key: "pairwiseSessions", mode: "pairwise" },
      { key: "rankedSessions", mode: "ranked" },
      { key: "selectionSessions", mode: "selection" },
    ];

    const allRows = [];
    for (const { key, mode } of modeEntries) {
      const sessions = allSessions[key] || [];
      for (const session of sessions) {
        allRows.push(...flattenSession(session, mode));
      }
    }

    if (allRows.length === 0) {
      alert("No session data to export.");
      return;
    }

    const csv = Papa.unparse(allRows);
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(`analytics-export-${date}.csv`, csv);
  };

  const handleExportMode = (key, mode) => {
    const sessions = allSessions[key] || [];
    const rows = [];
    for (const session of sessions) {
      rows.push(...flattenSession(session, mode));
    }

    if (rows.length === 0) {
      alert(`No ${mode} data to export.`);
      return;
    }

    const csv = Papa.unparse(rows);
    const date = new Date().toISOString().slice(0, 10);
    downloadCSV(`${mode}-export-${date}.csv`, csv);
  };

  const modes = [
    { key: "individualSessions", label: "Individual", mode: "individual" },
    { key: "groupSessions", label: "Group", mode: "group" },
    { key: "fixedSessions", label: "Fixed", mode: "fixed" },
    { key: "pairwiseSessions", label: "Pairwise", mode: "pairwise" },
    { key: "rankedSessions", label: "Ranked", mode: "ranked" },
    { key: "selectionSessions", label: "Selection", mode: "selection" },
  ];

  // Only show modes that have data
  const activeModes = modes.filter(({ key }) => (allSessions[key] || []).length > 0);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography
        sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "1rem", mb: 2 }}
      >
        Export Data
      </Typography>

      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExportAll}
          sx={{
            fontFamily: monoFont,
            fontSize: "0.75rem",
            textTransform: "none",
          }}
        >
          Export All (CSV)
        </Button>

        {activeModes.map(({ key, label, mode }) => (
          <Button
            key={key}
            variant="outlined"
            size="small"
            onClick={() => handleExportMode(key, mode)}
            sx={{
              fontFamily: monoFont,
              fontSize: "0.7rem",
              textTransform: "none",
            }}
          >
            {label}
          </Button>
        ))}
      </Box>
    </Paper>
  );
}
