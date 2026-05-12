import React from "react";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
} from "@mui/material";
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
  group: "#06b6d4",
  fixed: "#84cc16",
  pairwise: "#34d399",
  ranked: "#fb923c",
  selection: "#f472b6",
};

const monoFont = "'JetBrains Mono', monospace";

export default function ModeBreakdown({ data }) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography
          sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "1rem", mb: 2 }}
        >
          Mode Breakdown
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
          No mode data available yet.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography
        sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "1rem", mb: 2 }}
      >
        Mode Breakdown
      </Typography>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
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
            allowDecimals={false}
            tick={{
              fontSize: 11,
              fontFamily: monoFont,
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
              fontFamily: monoFont,
              fontSize: 12,
            }}
          />
          <Bar dataKey="sessions" name="Sessions" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.key}
                fill={MODE_COLORS[entry.key] || theme.palette.primary.main}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Stats Table */}
      <TableContainer sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {["Mode", "Sessions", "Ratings", "Avg/Session", "Mean", "Std Dev", "Outliers"].map(
                (h) => (
                  <TableCell
                    key={h}
                    sx={{
                      fontFamily: monoFont,
                      fontSize: "0.65rem",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "text.secondary",
                      borderColor: "divider",
                    }}
                  >
                    {h}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.key}>
                <TableCell
                  sx={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.82rem",
                    borderColor: "divider",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "2px",
                        bgcolor: MODE_COLORS[row.key] || "primary.main",
                      }}
                    />
                    {row.mode}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontFamily: monoFont, fontSize: "0.78rem", borderColor: "divider" }}>
                  {row.sessions}
                </TableCell>
                <TableCell sx={{ fontFamily: monoFont, fontSize: "0.78rem", borderColor: "divider" }}>
                  {row.totalRatings}
                </TableCell>
                <TableCell sx={{ fontFamily: monoFont, fontSize: "0.78rem", borderColor: "divider" }}>
                  {row.avgRatingsPerSession}
                </TableCell>
                <TableCell sx={{ fontFamily: monoFont, fontSize: "0.78rem", borderColor: "divider" }}>
                  {row.meanScore != null ? row.meanScore : "--"}
                </TableCell>
                <TableCell sx={{ fontFamily: monoFont, fontSize: "0.78rem", borderColor: "divider" }}>
                  {row.stdDev != null ? row.stdDev : "--"}
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: monoFont,
                    fontSize: "0.78rem",
                    borderColor: "divider",
                    color: row.outlierCount > 0 ? "#fb923c" : "text.secondary",
                    fontWeight: row.outlierCount > 0 ? 600 : 400,
                  }}
                >
                  {row.outlierCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
