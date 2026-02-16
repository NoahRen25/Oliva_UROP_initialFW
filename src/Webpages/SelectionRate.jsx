import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useResults } from "../Results";
import {
  Container, Typography, Box, Button, Card, CardMedia, CardActionArea, Paper
} from "@mui/material";
import UsernameEntry from "../components/UsernameEntry";
import ModeInstructionScreen from "../components/ModeInstructionScreen";
import { getSelectionBatch } from "../utils/ImageLoader";
import { preloadImages } from "../utils/preloadImages";

export default function SelectionRate() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig || null;
  const { addSelectionSession, setActivePrompt } = useResults();

  const [step, setStep] = useState(uploadConfig ? 1 : 0);
  const [username, setUsername] = useState(uploadConfig?.username || "");
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState(new Set());

  const imageCount = uploadConfig?.count || 9;
  const taskPrompt = uploadConfig?.prompt || "Select all images that match the description";

  useEffect(() => {
    const batch = getSelectionBatch(imageCount);
    setImages(batch);
    preloadImages(batch.map((img) => img.src));
  }, []);

  useEffect(() => {
    if (step === 2) {
      setActivePrompt(taskPrompt);
    } else {
      setActivePrompt(null);
    }
    return () => setActivePrompt(null);
  }, [step, taskPrompt, setActivePrompt]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    const selections = images.map((img) => ({
      imageId: img.id,
      imageName: img.filename,
      imagePrompt: img.prompt,
      selected: selected.has(img.id),
    }));
    addSelectionSession(username, taskPrompt, selections);
    navigate("/mode-results");
  };

  if (images.length === 0) return null;

  return (
    <Container maxWidth="lg" sx={{ mt: 2, pb: 10 }}>
      {step === 0 && (
        <UsernameEntry
          title="Image Selection Task"
          username={username}
          setUsername={setUsername}
          onStart={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <ModeInstructionScreen
          mode="selection"
          prompt={taskPrompt}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <>
          <Paper sx={{ p: 2, mb: 3, textAlign: "center", bgcolor: "#fff3e0" }}>
            <Typography variant="subtitle2" color="text.secondary">
              Task Prompt
            </Typography>
            <Typography variant="h6">{taskPrompt}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Click images to select. Click again to deselect. ({selected.size} selected)
            </Typography>
          </Paper>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                sm: "repeat(3, 1fr)",
                md: imageCount > 9 ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            {images.map((img) => {
              const isSel = selected.has(img.id);
              return (
                <Card
                  key={img.id}
                  sx={{
                    border: isSel ? "4px solid #1976d2" : "4px solid transparent",
                    boxShadow: isSel ? 6 : 1,
                    transition: "all 0.2s",
                    position: "relative",
                  }}
                >
                  <CardActionArea onClick={() => toggleSelect(img.id)}>
                    <CardMedia
                      component="img"
                      image={img.src}
                      sx={{
                        height: "22vh",
                        objectFit: "contain",
                        bgcolor: "#f0f0f0",
                      }}
                    />
                    <Box sx={{ p: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          fontSize: "0.7rem",
                        }}
                      >
                        {img.prompt}
                      </Typography>
                    </Box>
                  </CardActionArea>
                  {isSel && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        bgcolor: "#1976d2",
                        color: "white",
                        borderRadius: "50%",
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                      }}
                    >
                      ✓
                    </Box>
                  )}
                </Card>
              );
            })}
          </Box>

          <Button
            variant="contained"
            fullWidth
            size="large"
            sx={{ mt: 4 }}
            onClick={handleSubmit}
          >
            Submit Selections ({selected.size} selected)
          </Button>
        </>
      )}
    </Container>
  );
}