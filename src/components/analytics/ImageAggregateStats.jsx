import React, { useState, useMemo } from "react";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Box,
  Chip,
} from "@mui/material";

const monoFont = "'JetBrains Mono', monospace";

const columns = [
  { id: "imageName", label: "Image", numeric: false },
  { id: "totalRatings", label: "Ratings", numeric: true },
  { id: "meanScore", label: "Mean", numeric: true },
  { id: "medianScore", label: "Median", numeric: true },
  { id: "stdDev", label: "Std Dev", numeric: true },
  { id: "modes", label: "Modes", numeric: false },
];

function descendingComparator(a, b, orderBy) {
  const av = a[orderBy];
  const bv = b[orderBy];
  if (bv < av) return -1;
  if (bv > av) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export default function ImageAggregateStats({ data }) {
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("totalRatings");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.filter((row) => row.imageName.toLowerCase().includes(q));
  }, [data, search]);

  const sorted = useMemo(
    () => [...filtered].sort(getComparator(order, orderBy)),
    [filtered, order, orderBy]
  );

  const handleSort = (col) => {
    const isAsc = orderBy === col && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(col);
  };

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography
          sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "1rem", mb: 2 }}
        >
          Image Statistics
        </Typography>
        <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
          No image-level data available. Image stats are computed from individual, group, and fixed
          sessions that include numeric scores.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography
          sx={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: "1rem" }}
        >
          Image Statistics
          <Typography
            component="span"
            sx={{
              fontFamily: monoFont,
              fontSize: "0.68rem",
              color: "text.secondary",
              ml: 1,
            }}
          >
            ({data.length} images)
          </Typography>
        </Typography>
        <TextField
          size="small"
          placeholder="Search images..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            width: 220,
            "& .MuiInputBase-input": {
              fontFamily: monoFont,
              fontSize: "0.78rem",
            },
          }}
        />
      </Box>

      <TableContainer sx={{ maxHeight: 400 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  sortDirection={orderBy === col.id ? order : false}
                  sx={{
                    fontFamily: monoFont,
                    fontSize: "0.62rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "text.secondary",
                    bgcolor: "background.paper",
                  }}
                >
                  {col.id !== "modes" ? (
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : "asc"}
                      onClick={() => handleSort(col.id)}
                      sx={{
                        "& .MuiTableSortLabel-icon": { fontSize: "0.85rem" },
                      }}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((row) => (
              <TableRow key={row.imageName} hover>
                <TableCell
                  sx={{
                    fontFamily: monoFont,
                    fontSize: "0.75rem",
                    maxWidth: 200,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    borderColor: "divider",
                  }}
                  title={row.imageName}
                >
                  {row.imageName}
                </TableCell>
                <TableCell sx={{ fontFamily: monoFont, fontSize: "0.75rem", borderColor: "divider" }}>
                  {row.totalRatings}
                </TableCell>
                <TableCell sx={{ fontFamily: monoFont, fontSize: "0.75rem", borderColor: "divider" }}>
                  {row.meanScore}
                </TableCell>
                <TableCell sx={{ fontFamily: monoFont, fontSize: "0.75rem", borderColor: "divider" }}>
                  {row.medianScore}
                </TableCell>
                <TableCell sx={{ fontFamily: monoFont, fontSize: "0.75rem", borderColor: "divider" }}>
                  {row.stdDev}
                </TableCell>
                <TableCell sx={{ borderColor: "divider" }}>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                    {row.modes.map((m) => (
                      <Chip
                        key={m}
                        label={m}
                        size="small"
                        variant="outlined"
                        sx={{
                          fontFamily: monoFont,
                          fontSize: "0.6rem",
                          height: 20,
                          borderColor: "divider",
                        }}
                      />
                    ))}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  sx={{ textAlign: "center", fontFamily: monoFont, fontSize: "0.78rem", color: "text.secondary", py: 3 }}
                >
                  No images match "{search}"
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
