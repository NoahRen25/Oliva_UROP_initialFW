import React, { useState } from "react";
import {
  IconButton, Menu, MenuItem, ListItemIcon, ListItemText,
  Tooltip,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import BarChartIcon from "@mui/icons-material/BarChart";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";

/**
 * ImageActionMenu — Dropdown on each image card in ResearcherView.
 *
 * Props:
 *   onViewAudio    — () => void
 *   onViewStats    — () => void
 *   onCompare      — () => void (optional)
 *   hasAudio       — boolean (dim the audio option if false)
 */
export default function ImageActionMenu({ onViewAudio, onViewStats, onCompare, hasAudio = true }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleAction = (fn) => () => {
    handleClose();
    if (fn) fn();
  };

  return (
    <>
      <Tooltip title="Image actions">
        <IconButton
          size="small"
          onClick={handleClick}
          sx={{
            position: "absolute",
            top: 6,
            right: 6,
            bgcolor: "rgba(255,255,255,0.9)",
            boxShadow: 1,
            zIndex: 2,
            "&:hover": { bgcolor: "white", boxShadow: 3 },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            minWidth: 180,
          },
        }}
      >
        <MenuItem onClick={handleAction(onViewAudio)} disabled={!hasAudio}>
          <ListItemIcon>
            <GraphicEqIcon fontSize="small" sx={{ color: hasAudio ? "#e94560" : "action.disabled" }} />
          </ListItemIcon>
          <ListItemText
            primary="View Audio"
            secondary={!hasAudio ? "No recordings" : undefined}
            primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
            secondaryTypographyProps={{ variant: "caption" }}
          />
        </MenuItem>

        <MenuItem onClick={handleAction(onViewStats)}>
          <ListItemIcon>
            <BarChartIcon fontSize="small" sx={{ color: "#1976d2" }} />
          </ListItemIcon>
          <ListItemText
            primary="View Stats"
            primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
          />
        </MenuItem>

        {onCompare && (
          <MenuItem onClick={handleAction(onCompare)}>
            <ListItemIcon>
              <CompareArrowsIcon fontSize="small" sx={{ color: "#7b1fa2" }} />
            </ListItemIcon>
            <ListItemText
              primary="Compare..."
              primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
            />
          </MenuItem>
        )}
      </Menu>
    </>
  );
}