import React, { useEffect, useMemo, useState } from "react";
import {
  Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, Chip, Divider,
} from "@mui/material";
import { collectPageFormats, buildPageHeatmap } from "../../utils/gazeTransforms";
import PageHeatmap from "./PageHeatmap";

/**
 * PageFormatExplorer — lets the researcher pick a page format
 * (e.g. "ranked-3", "best-worst-4") and see the aggregate viewport-level
 * heatmap across all sessions for that format, with squares marking
 * where each image appeared on the page.
 */
export default function PageFormatExplorer({ gazeSessions }) {
  const formats = useMemo(() => collectPageFormats(gazeSessions), [gazeSessions]);
  const [selectedFormat, setSelectedFormat] = useState("");

  useEffect(() => {
    if (!selectedFormat && formats.length > 0) {
      setSelectedFormat(formats[0].format);
    }
    if (selectedFormat && !formats.some((f) => f.format === selectedFormat)) {
      setSelectedFormat(formats[0]?.format || "");
    }
  }, [formats, selectedFormat]);

  const data = useMemo(() => {
    if (!selectedFormat) return null;
    return buildPageHeatmap({ sessions: gazeSessions, format: selectedFormat });
  }, [gazeSessions, selectedFormat]);

  if (formats.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography
          sx={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
            fontSize: "1rem",
            mb: 1,
          }}
        >
          Page Aggregate
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No whole-page gaze data found yet. New rating sessions will record
          page-level gaze automatically.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography
          sx={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          Page Aggregate Heatmap
        </Typography>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Page Format</InputLabel>
          <Select
            value={selectedFormat}
            label="Page Format"
            onChange={(e) => setSelectedFormat(e.target.value)}
          >
            {formats.map((f) => (
              <MenuItem key={f.format} value={f.format}>
                {f.format} ({f.pageCount} page{f.pageCount === 1 ? "" : "s"})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
        {data && (
          <>
            <Chip size="small" label={`${data.pageCount} page recordings`} variant="outlined" />
            <Chip
              size="small"
              label={`${data.imageBoxes.length} image position${data.imageBoxes.length === 1 ? "" : "s"}`}
              variant="outlined"
            />
            <Chip
              size="small"
              label={`viewport ≈ ${Math.round(data.viewport.width)}×${Math.round(data.viewport.height)}`}
              variant="outlined"
            />
          </>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      <PageHeatmap data={data} height={420} />

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 1.5, textAlign: "center" }}
      >
        White rectangles show typical image positions for this format
        (median across recorded pages). Heatmap colors show where
        participants looked across the whole viewport.
      </Typography>
    </Paper>
  );
}
