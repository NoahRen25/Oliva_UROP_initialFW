import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardMedia,
  CardContent,
} from "@mui/material";
import { supabase } from "../supabaseClient";
import {
  uploadImageToSupabase,
  createImageRecord,
  getSignedImageUrl,
  listImages,
} from "../services/supabaseStorage";

export default function DatasetManager() {
  if (!supabase) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Supabase is not configured. Add VITE_SUPABASE_URL and
          VITE_SUPABASE_ANON_KEY to your .env and restart the dev server.
        </Alert>
      </Container>
    );
  }

  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);

  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const refreshImages = async () => {
    setLoadingImages(true);
    setUploadError("");
    try {
      const rows = await listImages();
      const withUrls = await Promise.all(
        rows.map(async (row) => ({
          ...row,
          signedUrl: await getSignedImageUrl({
            bucket: row.storage_bucket,
            path: row.storage_path,
          }),
        }))
      );
      setImages(withUrls);
    } catch (err) {
      setUploadError(err.message || "Failed to load images.");
    } finally {
      setLoadingImages(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) refreshImages();
  }, [session]);

  const ALLOWED_EMAILS = ["siminiucdenis@gmail.com"];

  const handleLogin = async () => {
    setAuthError("");
    setAuthMessage("");
    if (!email) return;
    if (!ALLOWED_EMAILS.includes(email.toLowerCase().trim())) {
      setAuthError("This email is not authorized to access the Dataset Manager.");
      return;
    }
    setLoadingAuth(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoadingAuth(false);
    if (error) {
      setAuthError(error.message);
    } else {
      setAuthMessage("Check your email for the magic link.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const canUpload = useMemo(
    () => !!file && !!prompt && !!session,
    [file, prompt, session]
  );

  const handleUpload = async () => {
    if (!canUpload) return;
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) throw new Error("No authenticated user.");

      const { path } = await uploadImageToSupabase(file, userId);
      await createImageRecord({
        storagePath: path,
        fileName: file.name,
        prompt,
        notes,
      });

      setFile(null);
      setPrompt("");
      setNotes("");
      setUploadSuccess("Upload complete.");
      refreshImages();
    } catch (err) {
      setUploadError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
        Dataset Manager
      </Typography>

      {!session ? (
        <Paper sx={{ p: 3, maxWidth: 420 }}>
          <Typography variant="h6" gutterBottom>
            Sign in
          </Typography>
          {authError && <Alert severity="error">{authError}</Alert>}
          {authMessage && <Alert severity="success">{authMessage}</Alert>}
          <TextField
            label="Email"
            type="email"
            fullWidth
            sx={{ mt: 2 }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            sx={{ mt: 2 }}
            variant="contained"
            onClick={handleLogin}
            disabled={!email || loadingAuth}
          >
            {loadingAuth ? <CircularProgress size={20} /> : "Send Magic Link"}
          </Button>
        </Paper>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Signed in as {session.user.email}
            </Typography>
            <Button size="small" onClick={handleLogout}>
              Sign out
            </Button>
          </Box>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload image
            </Typography>
            {uploadError && <Alert severity="error">{uploadError}</Alert>}
            {uploadSuccess && <Alert severity="success">{uploadSuccess}</Alert>}
            <Box sx={{ display: "grid", gap: 2, maxWidth: 520 }}>
              <Button variant="outlined" component="label">
                {file ? file.name : "Choose image"}
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </Button>
              <TextField
                label="Prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                fullWidth
              />
              <TextField
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
                multiline
                minRows={2}
              />
              <Button
                variant="contained"
                onClick={handleUpload}
                disabled={!canUpload || uploading}
              >
                {uploading ? <CircularProgress size={20} /> : "Upload"}
              </Button>
            </Box>
          </Paper>

          <Typography variant="h6" gutterBottom>
            Uploaded images
          </Typography>
          {loadingImages ? (
            <CircularProgress />
          ) : (
            <Grid container spacing={2}>
              {images.map((img) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={img.id}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="180"
                      image={img.signedUrl || ""}
                      alt={img.file_name}
                      sx={{ objectFit: "cover" }}
                    />
                    <CardContent>
                      <Typography variant="subtitle2">
                        {img.file_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {img.prompt}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
}
