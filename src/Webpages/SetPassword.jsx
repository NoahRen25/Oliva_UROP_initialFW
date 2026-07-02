/**
 * SetPassword.jsx — "/set-password": landing page for the Supabase invite
 * email. The invite link signs the user in; this page lets them choose a
 * password (supabase.auth.updateUser) and then redirects home. Part of the
 * admin "Invite User" flow.
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container, Paper, Typography, TextField, Button, Alert, Box,
} from "@mui/material";
import { supabase } from "../supabaseClient";
import { useAuth } from "../utils/AuthContext";

const MIN_PASSWORD_LENGTH = 8;

export default function SetPassword() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => navigate("/"), 1500);
      return () => clearTimeout(t);
    }
  }, [done, navigate]);

  if (loading) return null;

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="warning">
          No active session. Open the invitation link from your email to set
          your password.
        </Alert>
      </Container>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Set Your Password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Welcome, {user.email}. Choose a password to finish setting up your
          account. You'll use it to sign in from now on.
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            autoFocus
            fullWidth
            type="password"
            label="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={submitting || done}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="password"
            label="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            disabled={submitting || done}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {done && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Password set. Redirecting…
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={submitting || done || !password || !confirm}
            sx={{ mt: 3 }}
          >
            {submitting ? "Saving…" : "Save password"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
