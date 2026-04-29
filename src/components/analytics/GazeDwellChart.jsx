import React from "react";
import { Paper, Typography } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const truncate = (str, max = 20) =>
  str && str.length > max ? str.slice(0, max) + "\u2026" : str;

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: "#1e1e2e",
        border: "1px solid #333",
        borderRadius: 6,
        padding: "8px 12px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.72rem",
        color: "#e0e0e0",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.imageId}</div>
      <div>Dwell: {d.dwellTime.toFixed(2)}s</div>
      <div>Entries: {d.entries}</div>
      <div>Exits: {d.exits}</div>
    </div>
  );
};

export default function GazeDwellChart({ data }) {
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
        Per-Image Dwell Time
      </Typography>

      {!data || data.length === 0 ? (
        <Typography
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.75rem",
            color: "text.secondary",
            py: 4,
            textAlign: "center",
          }}
        >
          No dwell time data available.
        </Typography>
      ) : (
        <ResponsiveContainer
          width="100%"
          height={Math.max(200, data.length * 40)}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <XAxis
              type="number"
              label={{
                value: "Dwell Time (s)",
                position: "insideBottom",
                offset: -2,
                style: {
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.7rem",
                  fill: "#999",
                },
              }}
              tick={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.68rem",
              }}
            />
            <YAxis
              dataKey="imageId"
              type="category"
              width={150}
              tick={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.65rem",
              }}
              tickFormatter={(v) => truncate(v, 22)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="dwellTime" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill="#5b8ef0" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}
