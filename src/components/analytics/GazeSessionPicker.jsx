import React, { useMemo } from "react";
import { Box, FormControl, InputLabel, Select, MenuItem } from "@mui/material";

export default function GazeSessionPicker({
  gazeSessions,
  selectedMode,
  setSelectedMode,
  selectedSessionId,
  setSelectedSessionId,
}) {
  const uniqueModes = useMemo(() => {
    const modes = new Set();
    for (const s of gazeSessions || []) {
      if (s.mode) modes.add(s.mode);
    }
    return Array.from(modes).sort();
  }, [gazeSessions]);

  const filteredSessions = useMemo(() => {
    if (!gazeSessions) return [];
    if (!selectedMode) return gazeSessions;
    return gazeSessions.filter((s) => s.mode === selectedMode);
  }, [gazeSessions, selectedMode]);

  const handleModeChange = (e) => {
    setSelectedMode(e.target.value);
    setSelectedSessionId("");
  };

  const handleSessionChange = (e) => {
    setSelectedSessionId(e.target.value);
  };

  const monoSx = {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.78rem",
  };

  const labelSx = {
    fontFamily: "'Syne', sans-serif",
  };

  return (
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
      {/* Mode dropdown */}
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel sx={labelSx}>Mode</InputLabel>
        <Select
          value={selectedMode}
          label="Mode"
          onChange={handleModeChange}
          sx={monoSx}
        >
          <MenuItem value="" sx={monoSx}>
            All
          </MenuItem>
          {uniqueModes.map((mode) => (
            <MenuItem key={mode} value={mode} sx={monoSx}>
              {mode}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Session dropdown */}
      <FormControl size="small" sx={{ minWidth: 280 }}>
        <InputLabel sx={labelSx}>Session</InputLabel>
        <Select
          value={selectedSessionId}
          label="Session"
          onChange={handleSessionChange}
          sx={monoSx}
        >
          <MenuItem value="" sx={monoSx}>
            All Sessions (Aggregate)
          </MenuItem>
          {filteredSessions.map((s) => (
            <MenuItem key={s.sessionId} value={s.sessionId} sx={monoSx}>
              {s.username || "unknown"} &mdash;{" "}
              {new Date(s.startTime).toLocaleString()}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
