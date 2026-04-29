import React, { useState } from "react";
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, Typography, Box,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import { supabase } from "../supabaseClient";
import { useAuth } from "../utils/AuthContext";

export default function LoginButton() {
  const { user, role, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {user.email}{role ? ` (${role})` : ""}
        </Typography>
        <Button
          startIcon={<LogoutIcon />}
          color="inherit"
          onClick={signOut}
        >
          Log out
        </Button>
      </Box>
    );
  }

  const handleClose = () => {
    setOpen(false);
    setEmail("");
    setPassword("");
    setError("");
    setSubmitting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }
    setError("");
    setSubmitting(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    handleClose();
  };

  return (
    <>
      <Button
        startIcon={<LoginIcon />}
        color="inherit"
        onClick={() => setOpen(true)}
      >
        Log in
      </Button>
      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Log In</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Admin and researcher accounts only. If you were just invited,
              check your email for the invitation link to set your password.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
            />
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !email || !password}
            >
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
