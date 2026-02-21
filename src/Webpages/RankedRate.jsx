import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useResults } from "../Results";
import {
  Container, Typography, Box, Button, Grid, Card, CardMedia,
  CardContent, MenuItem, Select, FormControl, InputLabel, Alert,
  Chip, Paper,
} from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import UsernameEntry from "../components/UsernameEntry";
import ProgressBar from "../components/ProgressBar";
import ModeInstructionScreen from "../components/ModeInstructionScreen";
import { getRankedBatch } from "../utils/ImageLoader";
import { preloadImages } from "../utils/preloadImages";
import usePageTranscription from "../hooks/usePageTranscription";

// swap mode
function SwapRankPanel({ images, order, setOrder }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const dragNodeRef = useRef(null);

  const RANK_LABELS = ["1st (Best)", "2nd", "3rd"];
  const RANK_COLORS = ["#2e7d32", "#1976d2", "#ed6c02"];
  const RANK_BG     = ["#e8f5e9", "#e3f2fd", "#fff3e0"];

  const handleDragStart = (e, idx) => {
    setDragIdx(idx);
    dragNodeRef.current = e.target;
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => {
      if (dragNodeRef.current) dragNodeRef.current.style.opacity = "0.4";
    }, 0);
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) dragNodeRef.current.style.opacity = "1";
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (idx !== overIdx) setOverIdx(idx);
  };

  const handleDrop = (e, dropIdx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === dropIdx) return;
    const newOrder = [...order];
    const [moved] = newOrder.splice(dragIdx, 1);
    newOrder.splice(dropIdx, 0, moved);
    setOrder(newOrder);
    setDragIdx(null);
    setOverIdx(null);
  };

  // touch-friendly swap by tapping two images
  const [tapFirst, setTapFirst] = useState(null);

  const handleTapSwap = (idx) => {
    if (tapFirst === null) {
      setTapFirst(idx);
    } else if (tapFirst === idx) {
      setTapFirst(null);
    } else {
      const newOrder = [...order];
      [newOrder[tapFirst], newOrder[idx]] = [newOrder[idx], newOrder[tapFirst]];
      setOrder(newOrder);
      setTapFirst(null);
    }
  };

  return (
    <Box>
      <Box sx={{ textAlign: "center", mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          <SwapHorizIcon sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.5 }} />
          Drag to reorder, or tap two images to swap. Left = 1st (Best), Right = 3rd.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 3,
          justifyContent: "center",
        }}
      >
        {order.map((imgIdx, slotIdx) => {
          const img = images[imgIdx];
          const isOver = overIdx === slotIdx && dragIdx !== slotIdx;
          const isTapSelected = tapFirst === slotIdx;

          return (
            <Card
              key={`slot-${slotIdx}-${img.id}`}
              draggable
              onDragStart={(e) => handleDragStart(e, slotIdx)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, slotIdx)}
              onDrop={(e) => handleDrop(e, slotIdx)}
              onClick={() => handleTapSwap(slotIdx)}
              sx={{
                cursor: "grab",
                transition: "all 0.2s ease",
                transform: isOver ? "scale(1.03)" : isTapSelected ? "scale(1.02)" : "scale(1)",
                border: isOver
                  ? `3px dashed ${RANK_COLORS[slotIdx]}`
                  : isTapSelected
                  ? `3px solid ${RANK_COLORS[slotIdx]}`
                  : "3px solid transparent",
                boxShadow: isOver || isTapSelected ? 8 : 2,
                bgcolor: RANK_BG[slotIdx],
                "&:hover": { boxShadow: 6 },
                "&:active": { cursor: "grabbing" },
                position: "relative",
                userSelect: "none",
              }}
            >
              {/* Rank badge */}
              <Box sx={{ position: "absolute", top: 12, left: 12, zIndex: 2 }}>
                <Chip
                  label={RANK_LABELS[slotIdx]}
                  size="small"
                  sx={{
                    bgcolor: RANK_COLORS[slotIdx],
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "0.8rem",
                    boxShadow: 2,
                  }}
                />
              </Box>

              {/* Drag handle */}
              <Box sx={{ position: "absolute", top: 12, right: 12, zIndex: 2, color: "rgba(0,0,0,0.3)" }}>
                <DragIndicatorIcon />
              </Box>

              <CardMedia
                component="img"
                image={img.src}
                sx={{ objectFit: "contain", height: "30vh", pointerEvents: "none" }}
              />

              <CardContent sx={{ textAlign: "center", py: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {img.alt || img.filename}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Visual rank indicators below cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 3,
          mt: 1,
          textAlign: "center",
        }}
      >
        {RANK_LABELS.map((label, i) => (
          <Typography key={i} variant="caption" sx={{ color: RANK_COLORS[i], fontWeight: "bold" }}>
            ▲ {label}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

//Select Mode 
function SelectRankPanel({ images, currentRanks, handleChange, error }) {
  return (
    <>
      <Box
        sx={{
          display: "grid",
          justifyContent: "center",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 3,
        }}
      >
        {images.map((img, index) => (
          <Grid item xs={12} md={4} key={img.id}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <CardMedia
                component="img"
                image={img.src}
                sx={{ objectFit: "contain", height: "30vh" }}
              />
              <CardContent sx={{ textAlign: "center", flexGrow: 1 }}>
                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Rank</InputLabel>
                  <Select
                    value={currentRanks[`img${index}`]}
                    label="Rank"
                    onChange={handleChange(`img${index}`)}
                  >
                    <MenuItem value={1}>1st (Best)</MenuItem>
                    <MenuItem value={2}>2nd</MenuItem>
                    <MenuItem value={3}>3rd</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Box>
      {error && (
        <Box sx={{ maxWidth: 400, mx: "auto", mt: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}
    </>
  );
}

export default function RankedRate() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig || null;

  const { addRankedSession, setActivePrompt } = useResults();

  const [step, setStep] = useState(uploadConfig ? 1 : 0);
  const [username, setUsername] = useState(uploadConfig?.username || "");
  const [rankGroups, setRankGroups] = useState([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [error, setError] = useState("");
  const [currentRanks, setCurrentRanks] = useState({ img0: "", img1: "", img2: "" });
  const [allRankings, setAllRankings] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  // swap mode: order[i] = index into images array
  const [swapOrder, setSwapOrder] = useState([0, 1, 2]);

  const { markPage, stopAndCollect } = usePageTranscription();

  const groupCount = uploadConfig?.count || 3;
  const configPrompt = uploadConfig?.prompt || null;
  // "swap" or "select" — default "select" for backward compatibility
  const rankMode = uploadConfig?.rankMode || "select";

  useEffect(() => {
    const batch = getRankedBatch(groupCount);
    setRankGroups(batch);
    preloadImages(batch.flatMap((g) => g.images.map((img) => img.src)));
  }, []);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setActivePrompt(null);
    };
  }, [setActivePrompt]);

  useEffect(() => {
    if (isFinished || rankGroups.length === 0 || step !== 2) {
      setActivePrompt(null);
      return;
    }
    const prompt = configPrompt || rankGroups[currentGroupIndex].prompt;
    setActivePrompt(prompt);
    markPage(currentGroupIndex + 1);
  }, [step, currentGroupIndex, rankGroups, configPrompt, isFinished, setActivePrompt, markPage]);

  // reset swap order when group changes
  useEffect(() => {
    setSwapOrder([0, 1, 2]);
  }, [currentGroupIndex]);

  const handleChange = (key) => (e) => {
    setCurrentRanks({ ...currentRanks, [key]: e.target.value });
    setError("");
  };

  const handleNextGroup = () => {
    let groupResults;

    if (rankMode === "swap") {
      const currentGroup = rankGroups[currentGroupIndex];
      groupResults = swapOrder.map((imgIdx, slotIdx) => ({
        groupId: currentGroupIndex + 1,
        groupPrompt: configPrompt || currentGroup.prompt,
        imageId: currentGroup.images[imgIdx].id,
        imageName: currentGroup.images[imgIdx].filename,
        rank: slotIdx + 1,
      }));
    } else {
      const values = Object.values(currentRanks);
      if (values.includes("")) {
        setError("Please assign a rank to every image.");
        return;
      }
      if (new Set(values).size !== values.length) {
        setError("Each image must have a unique rank (1st, 2nd, 3rd).");
        return;
      }
      const currentGroup = rankGroups[currentGroupIndex];
      groupResults = currentGroup.images.map((img, idx) => ({
        groupId: currentGroupIndex + 1,
        groupPrompt: configPrompt || currentGroup.prompt,
        imageId: img.id,
        imageName: img.filename,
        rank: currentRanks[`img${idx}`],
      }));
    }

    const updated = [...allRankings, ...groupResults];

    if (currentGroupIndex < rankGroups.length - 1) {
      setAllRankings(updated);
      setCurrentGroupIndex(currentGroupIndex + 1);
      setCurrentRanks({ img0: "", img1: "", img2: "" });
    } else {
      setIsFinished(true);
      window.speechSynthesis.cancel();
      const pageTranscripts = stopAndCollect();
      addRankedSession(username, updated, { pageTranscripts });
      navigate("/mode-results");
    }
  };

  if (rankGroups.length === 0) return null;

  const activeGroup = rankGroups[currentGroupIndex];
  const globalPrompt = configPrompt || "Rank these images";
  const imagePrompt = activeGroup?.prompt || "";

  const handleBackGroup = () => {
    if (currentGroupIndex === 0) return;
    const prevGroup = rankGroups[currentGroupIndex - 1];
    const prevResults = allRankings.filter((r) => r.groupId === currentGroupIndex);
    const remaining = allRankings.filter((r) => r.groupId !== currentGroupIndex);

    if (rankMode === "swap") {
      if (prevResults.length === 3) {
        const sorted = [...prevResults].sort((a, b) => a.rank - b.rank);
        const newOrder = sorted.map((r) =>
          prevGroup.images.findIndex((img) => img.id === r.imageId)
        );
        setSwapOrder(newOrder);
      } else {
        setSwapOrder([0, 1, 2]);
      }
    } else {
      const rankMap = new Map(prevResults.map((r) => [r.imageId, r.rank]));
      setCurrentRanks({
        img0: rankMap.get(prevGroup.images[0].id) ?? "",
        img1: rankMap.get(prevGroup.images[1].id) ?? "",
        img2: rankMap.get(prevGroup.images[2].id) ?? "",
      });
    }

    setAllRankings(remaining);
    setCurrentGroupIndex((i) => Math.max(0, i - 1));
    setError("");
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      {step === 0 && (
        <UsernameEntry
          title="Ranked Image Rating"
          username={username}
          setUsername={setUsername}
          onStart={() => setStep(1)}
          validationRegex={/^\d+$/}
        />
      )}

      {step === 1 && (
        <ModeInstructionScreen
          mode="ranked"
          prompt={configPrompt || "Per-group prompts will be shown"}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <>
          <Button
            variant="outlined"
            onClick={handleBackGroup}
            disabled={currentGroupIndex === 0}
            sx={{ mb: 2 }}
          >
            Back
          </Button>
          <ProgressBar
            current={currentGroupIndex}
            total={rankGroups.length}
            label={`Group ${currentGroupIndex + 1} of ${rankGroups.length}`}
          />

          <Typography variant="h4" align="center" gutterBottom>
            Ranking {currentGroupIndex + 1} of {rankGroups.length}
          </Typography>

          {rankMode === "swap" && (
            <Box sx={{ textAlign: "center", mb: 1 }}>
              <Chip icon={<SwapHorizIcon />} label="Swap Mode" color="secondary" size="small" />
            </Box>
          )}

          {configPrompt && (
            <Typography
              variant="body1" align="center"
              sx={{ mb: 1, fontStyle: "italic", color: "text.secondary" }}
            >
              Task: "{globalPrompt}"
            </Typography>
          )}

          <Typography
            variant="h6" align="center"
            sx={{ mb: 4, color: "primary.main", fontWeight: "medium" }}
          >
            "{imagePrompt}"
          </Typography>

          {rankMode === "swap" ? (
            <SwapRankPanel
              images={activeGroup.images}
              order={swapOrder}
              setOrder={setSwapOrder}
            />
          ) : (
            <SelectRankPanel
              images={activeGroup.images}
              currentRanks={currentRanks}
              handleChange={handleChange}
              error={error}
            />
          )}

          <Box sx={{ maxWidth: 400, mx: "auto", mt: 4, pb: 5 }}>
            <Button variant="contained" size="large" fullWidth onClick={handleNextGroup}>
              {currentGroupIndex === rankGroups.length - 1
                ? "Submit All Rankings"
                : "Next Group"}
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}