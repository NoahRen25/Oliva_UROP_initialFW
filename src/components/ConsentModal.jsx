import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
} from "@mui/material";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import StorageIcon from "@mui/icons-material/Storage";
import PersonIcon from "@mui/icons-material/Person";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TouchAppIcon from "@mui/icons-material/TouchApp";

export default function ConsentModal({ open, onAccept }) {
  return (
    <Dialog
      open={open}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "#f5f5f5" }}>
        <PrivacyTipIcon color="primary" />
        <Typography variant="h6" fontWeight="bold">
          Privacy & Data Collection Notice
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Typography variant="body1" paragraph>
          Before using this application, please review how we collect and store your data.
        </Typography>

        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Data We Collect:
        </Typography>

        <List dense>
          <ListItem>
            <ListItemIcon><PersonIcon color="action" /></ListItemIcon>
            <ListItemText
              primary="User ID"
              secondary="The numeric identifier you provide when starting a session"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><StorageIcon color="action" /></ListItemIcon>
            <ListItemText
              primary="Rating Data"
              secondary="Your scores, rankings, and pairwise choices for images"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><AccessTimeIcon color="action" /></ListItemIcon>
            <ListItemText
              primary="Timestamps"
              secondary="When you completed each rating session"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon><TouchAppIcon color="action" /></ListItemIcon>
            <ListItemText
              primary="Interaction Counts"
              secondary="Number of slider movements and response times"
            />
          </ListItem>
        </List>

        <Box sx={{ mt: 2, p: 2, bgcolor: "#e3f2fd", borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            How We Store Your Data:
          </Typography>
          <Typography variant="body2">
            All data is stored locally in your browser (localStorage) and never leaves your device.
            No data is sent to external servers. You can delete all your data at any time from
            the Privacy Settings page.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, bgcolor: "#f5f5f5" }}>
        <Button
          variant="contained"
          size="large"
          onClick={onAccept}
          fullWidth
        >
          I Understand & Agree
        </Button>
      </DialogActions>
    </Dialog>
  );
}
