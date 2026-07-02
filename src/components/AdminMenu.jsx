/**
 * AdminMenu.jsx — App-bar dropdown for signed-in researchers/admins.
 *
 * Hidden for participants (no role). Links to the results dashboards,
 * researcher view, transcripts, and privacy settings; admins additionally
 * get the Control Panel link and an "Invite User" dialog that calls the
 * `invite-user` Supabase edge function to email a new researcher/admin.
 */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Button, Menu, MenuItem, ListItemIcon, ListItemText, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, Typography,
  FormControl, InputLabel, Select,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import InsightsIcon from "@mui/icons-material/Insights";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import ScienceIcon from "@mui/icons-material/Science";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import PrivacyTipIcon from "@mui/icons-material/PrivacyTip";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import TuneIcon from "@mui/icons-material/Tune";
import { supabase } from "../supabaseClient";
import { useAuth } from "../utils/AuthContext";

const ADMIN_LINKS = [
  { label: "Mode Results", to: "/mode-results", icon: <CompareArrowsIcon fontSize="small" /> },
  { label: "Grid Results", to: "/grid-results", icon: <InsightsIcon fontSize="small" /> },
  { label: "Researcher View", to: "/researcher", icon: <ScienceIcon fontSize="small" /> },
  { label: "Transcripts", to: "/transcripts", icon: <HistoryEduIcon fontSize="small" /> },
  { label: "Privacy Settings", to: "/privacy", icon: <PrivacyTipIcon fontSize="small" /> },
];

export default function AdminMenu() {
  const { role, isAdmin } = useAuth();
  const [anchor, setAnchor] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  if (!role) return null;

  return (
    <>
      <Button
        startIcon={<AdminPanelSettingsIcon />}
        color="inherit"
        onClick={(e) => setAnchor(e.currentTarget)}
        sx={{ mr: 1 }}
      >
        Admin
      </Button>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {ADMIN_LINKS.map((link) => (
          <MenuItem
            key={link.to}
            component={Link}
            to={link.to}
            onClick={() => setAnchor(null)}
          >
            <ListItemIcon>{link.icon}</ListItemIcon>
            <ListItemText>{link.label}</ListItemText>
          </MenuItem>
        ))}
        {isAdmin && [
          <Divider key="divider" />,
          <MenuItem
            key="control-panel"
            component={Link}
            to="/admin/control-panel"
            onClick={() => setAnchor(null)}
          >
            <ListItemIcon><TuneIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Control Panel</ListItemText>
          </MenuItem>,
          <MenuItem
            key="invite"
            onClick={() => { setAnchor(null); setInviteOpen(true); }}
          >
            <ListItemIcon><PersonAddIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Invite User</ListItemText>
          </MenuItem>,
        ]}
      </Menu>
      <InviteUserDialog open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}

function InviteUserDialog({ open, onClose }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("researcher");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    setEmail("");
    setRole("researcher");
    setSuccess("");
    setError("");
    setSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }
    const normalized = email.trim().toLowerCase();
    if (!normalized) return;

    setError("");
    setSuccess("");
    setSubmitting(true);

    const { error: roleErr } = await supabase
      .from("user_roles")
      .upsert({ email: normalized, role });
    if (roleErr) {
      setSubmitting(false);
      setError(roleErr.message);
      return;
    }

    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email: normalized,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/set-password`,
      },
    });
    setSubmitting(false);

    if (otpErr) {
      setError(otpErr.message);
      return;
    }
    setSuccess(
      `Invitation sent to ${normalized}. They'll receive an email with a link to set their password.`
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Invite User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sends an invitation email. The recipient clicks the link and sets
            their own password to finish account setup.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting || !!success}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth disabled={submitting || !!success}>
            <InputLabel id="invite-role-label">Role</InputLabel>
            <Select
              labelId="invite-role-label"
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="researcher">Researcher</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting || !email || !!success}
          >
            {submitting ? "Sending…" : "Send invite"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
