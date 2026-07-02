/**
 * SessionsTimeline.jsx — Stacked recharts area chart of sessions per day,
 * colored by rating mode — the "activity over time" view of the analytics
 * dashboard (data from dashboardTransforms.buildSessionsTimeline).
 */
import React from "react";
import { Paper, Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MODE_COLORS = {
  individual: "#5b8ef0",
  group: "#06b6d4",
  fixed: "#84cc16",
  pairwise: "#34d399",
  ranked: "#fb923c",
  selection: "#f472b6",
};

const MODE_LABELS = {
  individual: "Individual",
  group: "Group",
  fixed: "Fixed",
  pairwise: "Pairwise",
  ranked: "Ranked",
  selection: "Selection",
};

export default function SessionsTimeline({ data }) {
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
          Sessions Over Time
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
          No session timeline data available yet.
        </Typography>
      </Paper>
    );
  }

  // Determine which modes actually have data
  const activeModes = Object.keys(MODE_COLORS).filter((mode) =>
    data.some((d) => d[mode] > 0)
  );

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
        Sessions Over Time
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <defs>
            {activeModes.map((mode) => (
              <linearGradient
                key={mode}
                id={`grad-${mode}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={MODE_COLORS[mode]}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={MODE_COLORS[mode]}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
          <XAxis
            dataKey="date"
            tick={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              fill: theme.palette.text.secondary,
            }}
            stroke={theme.palette.divider}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              fill: theme.palette.text.secondary,
            }}
            stroke={theme.palette.divider}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: dark ? "#1a1a2e" : "#ffffff",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 6,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
            }}
            labelStyle={{ color: theme.palette.text.primary, fontWeight: 600 }}
            itemStyle={{ padding: "2px 0" }}
          />
          {activeModes.map((mode) => (
            <Area
              key={mode}
              type="monotone"
              dataKey={mode}
              name={MODE_LABELS[mode]}
              stackId="1"
              stroke={MODE_COLORS[mode]}
              fill={`url(#grad-${mode})`}
              strokeWidth={1.5}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
        {activeModes.map((mode) => (
          <Box key={mode} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "2px",
                bgcolor: MODE_COLORS[mode],
              }}
            />
            <Typography
              sx={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.65rem",
                color: "text.secondary",
              }}
            >
              {MODE_LABELS[mode]}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
