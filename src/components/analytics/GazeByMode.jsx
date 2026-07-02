/**
 * GazeByMode.jsx — Recharts bar chart comparing gaze behavior across rating
 * modes (individual/pairwise/ranked/…): session counts and average dwell
 * per mode, using the byMode data from gazeTransforms.buildGazeOverview.
 */
import React from "react";
import { Paper, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const MODE_COLORS = {
  individual: "#5b8ef0",
  pairwise: "#34d399",
  ranked: "#fb923c",
  selection: "#f472b6",
  combo: "#84cc16",
  grid: "#06b6d4",
};

const monoFont = "'JetBrains Mono', monospace";

function GazeTooltip({ active, payload, dark, dividerColor }) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0].payload;
  return (
    <div
      style={{
        backgroundColor: dark ? "#1a1a2e" : "#ffffff",
        border: `1px solid ${dividerColor}`,
        borderRadius: 6,
        fontFamily: monoFont,
        fontSize: 12,
        padding: "8px 12px",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{entry.mode}</div>
      <div>Avg Dwell: {entry.avgDwellTimeSec}s</div>
      <div>Sessions: {entry.sessions}</div>
      <div>Avg Entries: {Number(entry.avgEntries).toFixed(1)}</div>
    </div>
  );
}

export default function GazeByMode({ data }) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography
          sx={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
            fontSize: "1rem",
            mb: 2,
          }}
        >
          Gaze by Mode
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
          No gaze data by mode available yet.
        </Typography>
      </Paper>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    avgDwellTimeSec: (d.avgDwellTime / 1000).toFixed(1),
  }));

  return (
    <Paper sx={{ p: 3 }}>
      <Typography
        sx={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 600,
          fontSize: "1rem",
          mb: 2,
        }}
      >
        Gaze by Mode
      </Typography>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
        >
          <XAxis
            dataKey="mode"
            tick={{
              fontSize: 11,
              fontFamily: monoFont,
              fill: theme.palette.text.secondary,
            }}
            stroke={theme.palette.divider}
            tickLine={false}
          />
          <YAxis
            tick={{
              fontSize: 11,
              fontFamily: monoFont,
              fill: theme.palette.text.secondary,
            }}
            stroke={theme.palette.divider}
            tickLine={false}
          />
          <Tooltip
            content={
              <GazeTooltip
                dark={dark}
                dividerColor={theme.palette.divider}
              />
            }
          />
          <Bar
            dataKey="avgDwellTimeSec"
            name="Avg Dwell (s)"
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.mode}
                fill={MODE_COLORS[entry.mode] || theme.palette.primary.main}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
