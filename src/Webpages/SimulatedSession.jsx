import React, { useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container, Box, Typography, Button, Card, CardMedia,
  CardContent, CardActionArea, Paper, Slider, Grid, Chip,
  IconButton, Tooltip, LinearProgress, FormControl, InputLabel,
  Select, MenuItem, Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ScienceIcon from "@mui/icons-material/Science";

import ImageActionMenu from "../components/ImageActionMenu";
import StatsModal from "../components/StatsModal";
import AudioModal from "../components/AudioModal";

//individual
function IndividualSim({ images, onViewStats, onViewAudio }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [ratings, setRatings] = useState({});

  const img = images[currentIdx];
  if (!img) return null;

  return (
    <Box>
      <LinearProgress
        variant="determinate"
        value={((currentIdx + 1) / images.length) * 100}
        sx={{ height: 8, borderRadius: 4, mb: 2 }}
      />
      <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
        Image {currentIdx + 1} of {images.length}
      </Typography>

      <Card sx={{ maxWidth: 600, mx: "auto", position: "relative" }}>
        <ImageActionMenu
          onViewStats={() => onViewStats(img)}
          onViewAudio={() => onViewAudio(img)}
          hasAudio={img.audioEntries?.some((e) => e.audioUrl)}
        />
        {img.src ? (
          <CardMedia
            component="img"
            image={img.src}
            alt={img.name}
            sx={{ objectFit: "contain", height: "auto", maxHeight: "55vh", bgcolor: "#f5f5f5" }}
          />
        ) : (
          <ImagePlaceholder name={img.name} height="40vh" />
        )}
        <CardContent sx={{ textAlign: "center" }}>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            {img.name}
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            Rating: {ratings[img.name] ?? 3}
          </Typography>
          <Slider
            value={ratings[img.name] ?? 3}
            onChange={(_, v) => setRatings((p) => ({ ...p, [img.name]: v }))}
            min={1}
            max={5}
            step={1}
            marks
          />
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((i) => i - 1)}
        >
          Previous
        </Button>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          disabled={currentIdx === images.length - 1}
          onClick={() => setCurrentIdx((i) => i + 1)}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}

//pairwise
function PairwiseSim({ images, onViewStats, onViewAudio }) {
  // build out pairs based on num of images selected
  const pairs = useMemo(() => {
    const p = [];
    for (let i = 0; i < images.length - 1; i += 2) {
      p.push({ left: images[i], right: images[i + 1] });
    }
    // last and first together to show if odd so not just one showing
    if (images.length % 2 !== 0 && images.length > 1) {
      p.push({ left: images[images.length - 1], right: images[0] });
    }
    return p;
  }, [images]);

  const [currentPairIdx, setCurrentPairIdx] = useState(0);
  const [selections, setSelections] = useState({});

  const pair = pairs[currentPairIdx];
  if (!pair) return null;

  const selected = selections[currentPairIdx] || null;

  return (
    <Box>
      <LinearProgress
        variant="determinate"
        value={((currentPairIdx + 1) / pairs.length) * 100}
        sx={{ height: 8, borderRadius: 4, mb: 2 }}
      />
      <Typography variant="h6" align="center" gutterBottom>
        Pair {currentPairIdx + 1} of {pairs.length}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
          gap: 3,
          height: { sm: "60vh" },
        }}
      >
        {["left", "right"].map((side) => {
          const img = pair[side];
          const isSelected = selected === side;
          return (
            <Card
              key={side}
              sx={{
                border: isSelected ? "4px solid #1976d2" : "4px solid transparent",
                boxShadow: isSelected ? 8 : 2,
                transition: "all 0.2s",
                cursor: "pointer",
                position: "relative",
                "&:hover": { boxShadow: 6 },
              }}
              onClick={() => setSelections((p) => ({ ...p, [currentPairIdx]: side }))}
            >
              <ImageActionMenu
                onViewStats={() => onViewStats(img)}
                onViewAudio={() => onViewAudio(img)}
                hasAudio={img.audioEntries?.some((e) => e.audioUrl)}
              />
              {isSelected && (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Selected"
                  color="primary"
                  size="small"
                  sx={{ position: "absolute", bottom: 8, left: 8, zIndex: 2 }}
                />
              )}
              <CardActionArea>
                {img.src ? (
                  <CardMedia
                    component="img"
                    image={img.src}
                    alt={img.name}
                    sx={{ objectFit: "contain", height: "50vh", bgcolor: "#f5f5f5" }}
                  />
                ) : (
                  <ImagePlaceholder name={img.name} height="50vh" />
                )}
                <CardContent sx={{ textAlign: "center", py: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {img.name}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          disabled={currentPairIdx === 0}
          onClick={() => setCurrentPairIdx((i) => i - 1)}
        >
          Previous
        </Button>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          disabled={currentPairIdx === pairs.length - 1}
          onClick={() => setCurrentPairIdx((i) => i + 1)}
        >
          Next Pair
        </Button>
      </Box>
    </Box>
  );
}

//ranked

function RankedSim({ images, onViewStats, onViewAudio }) {
  const groups = useMemo(() => {
    const g = [];
    for (let i = 0; i < images.length; i += 3) {
      g.push(images.slice(i, i + 3));
    }
    return g;
  }, [images]);

  const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
  const [orders, setOrders] = useState(() =>
    groups.map((g) => g.map((_, i) => i))
  );
  const [tapFirst, setTapFirst] = useState(null);

  const group = groups[currentGroupIdx] || [];
  const order = orders[currentGroupIdx] || group.map((_, i) => i);

  const RANK_LABELS = ["1st (Best)", "2nd", "3rd"];
  const RANK_COLORS = ["#2e7d32", "#1976d2", "#ed6c02"];
  const RANK_BG = ["#e8f5e9", "#e3f2fd", "#fff3e0"];

  const handleTapSwap = (slotIdx) => {
    if (tapFirst === null) {
      setTapFirst(slotIdx);
    } else if (tapFirst === slotIdx) {
      setTapFirst(null);
    } else {
      setOrders((prev) => {
        const copy = [...prev];
        const newOrder = [...copy[currentGroupIdx]];
        [newOrder[tapFirst], newOrder[slotIdx]] = [newOrder[slotIdx], newOrder[tapFirst]];
        copy[currentGroupIdx] = newOrder;
        return copy;
      });
      setTapFirst(null);
    }
  };

  return (
    <Box>
      <LinearProgress
        variant="determinate"
        value={((currentGroupIdx + 1) / groups.length) * 100}
        sx={{ height: 8, borderRadius: 4, mb: 2 }}
      />
      <Typography variant="h6" align="center" gutterBottom>
        Ranking {currentGroupIdx + 1} of {groups.length}
      </Typography>
      <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 2 }}>
        <SwapHorizIcon sx={{ fontSize: 16, verticalAlign: "middle", mr: 0.5 }} />
        Tap two images to swap their rank. Left = 1st (Best).
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: `repeat(${Math.min(group.length, 3)}, 1fr)` },
          gap: 3,
        }}
      >
        {order.map((imgIdx, slotIdx) => {
          const img = group[imgIdx];
          if (!img) return null;
          const isTapSelected = tapFirst === slotIdx;

          return (
            <Card
              key={`${currentGroupIdx}-${slotIdx}`}
              onClick={() => handleTapSwap(slotIdx)}
              sx={{
                cursor: "pointer",
                transition: "all 0.2s",
                transform: isTapSelected ? "scale(1.02)" : "scale(1)",
                border: isTapSelected
                  ? `3px solid ${RANK_COLORS[slotIdx]}`
                  : "3px solid transparent",
                boxShadow: isTapSelected ? 8 : 2,
                bgcolor: RANK_BG[slotIdx] || "#fafafa",
                position: "relative",
                "&:hover": { boxShadow: 6 },
              }}
            >
              <ImageActionMenu
                onViewStats={() => onViewStats(img)}
                onViewAudio={() => onViewAudio(img)}
                hasAudio={img.audioEntries?.some((e) => e.audioUrl)}
              />

              <Chip
                label={RANK_LABELS[slotIdx] || `#${slotIdx + 1}`}
                size="small"
                sx={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  zIndex: 2,
                  bgcolor: RANK_COLORS[slotIdx] || "#757575",
                  color: "white",
                  fontWeight: "bold",
                }}
              />

              <DragIndicatorIcon
                sx={{
                  position: "absolute",
                  top: 14,
                  right: 40,
                  color: "rgba(0,0,0,0.2)",
                  zIndex: 1,
                }}
              />

              {img.src ? (
                <CardMedia
                  component="img"
                  image={img.src}
                  alt={img.name}
                  sx={{ objectFit: "contain", height: "30vh", bgcolor: "#f5f5f5" }}
                />
              ) : (
                <ImagePlaceholder name={img.name} height="30vh" />
              )}

              <CardContent sx={{ textAlign: "center", py: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {img.name}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: `repeat(${Math.min(group.length, 3)}, 1fr)` },
          gap: 3,
          mt: 1,
          textAlign: "center",
        }}
      >
        {order.map((_, i) => (
          <Typography key={i} variant="caption" sx={{ color: RANK_COLORS[i], fontWeight: "bold" }}>
            ▲ {RANK_LABELS[i] || `#${i + 1}`}
          </Typography>
        ))}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          disabled={currentGroupIdx === 0}
          onClick={() => { setCurrentGroupIdx((i) => i - 1); setTapFirst(null); }}
        >
          Previous
        </Button>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          disabled={currentGroupIdx === groups.length - 1}
          onClick={() => { setCurrentGroupIdx((i) => i + 1); setTapFirst(null); }}
        >
          Next Group
        </Button>
      </Box>
    </Box>
  );
}

//selection
function SelectionSim({ images, onViewStats, onViewAudio }) {
  const [selected, setSelected] = useState(new Set());

  const toggleSelect = (name) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 3, textAlign: "center", bgcolor: "#fff3e0" }}>
        <Typography variant="body2" color="text.secondary">
          Click images to select/deselect. ({selected.size} selected)
        </Typography>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            md: images.length > 9 ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
          },
          gap: 2,
        }}
      >
        {images.map((img) => {
          const isSel = selected.has(img.name);
          return (
            <Card
              key={img.name}
              sx={{
                border: isSel ? "4px solid #1976d2" : "4px solid transparent",
                boxShadow: isSel ? 6 : 1,
                transition: "all 0.2s",
                position: "relative",
                cursor: "pointer",
              }}
              onClick={() => toggleSelect(img.name)}
            >
              <ImageActionMenu
                onViewStats={() => onViewStats(img)}
                onViewAudio={() => onViewAudio(img)}
                hasAudio={img.audioEntries?.some((e) => e.audioUrl)}
              />
              {isSel && (
                <Box
                  sx={{
                    position: "absolute",
                    top: 8,
                    left: 8,
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
                    zIndex: 2,
                  }}
                >
                  ✓
                </Box>
              )}
              {img.src ? (
                <CardMedia
                  component="img"
                  image={img.src}
                  alt={img.name}
                  sx={{ height: "22vh", objectFit: "contain", bgcolor: "#f0f0f0" }}
                />
              ) : (
                <ImagePlaceholder name={img.name} height="22vh" />
              )}
              <CardContent sx={{ py: 1, px: 1 }}>
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
                  {img.name}
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}

//group

function GroupSim({ images, onViewStats, onViewAudio }) {
  const [ratings, setRatings] = useState({});
  const columns = images.length <= 4 ? 2 : images.length <= 9 ? 3 : 4;

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        alignItems: "start",
      }}
    >
      {images.map((img) => (
        <Card key={img.name} sx={{ p: 1, position: "relative" }}>
          <ImageActionMenu
            onViewStats={() => onViewStats(img)}
            onViewAudio={() => onViewAudio(img)}
            hasAudio={img.audioEntries?.some((e) => e.audioUrl)}
          />
          {img.src ? (
            <CardMedia
              component="img"
              image={img.src}
              alt={img.name}
              sx={{
                height: columns <= 2 ? "25vh" : columns === 3 ? "15vh" : "8vh",
                width: "100%",
                objectFit: "contain",
                bgcolor: "#f0f0f0",
                borderRadius: 1,
              }}
            />
          ) : (
            <ImagePlaceholder
              name={img.name}
              height={columns <= 2 ? "25vh" : columns === 3 ? "15vh" : "8vh"}
            />
          )}
          <Box sx={{ px: 1, mt: 1 }}>
            <Typography variant="caption" color="text.secondary" align="center" display="block">
              Rating: {ratings[img.name] ?? 5}
            </Typography>
            <Slider
              value={ratings[img.name] ?? 5}
              onChange={(_, v) => setRatings((p) => ({ ...p, [img.name]: v }))}
              min={1}
              max={10}
              step={1}
              marks
              size="small"
            />
          </Box>
        </Card>
      ))}
    </Box>
  );
}

//shared

function ImagePlaceholder({ name, height = "30vh" }) {
  return (
    <Box
      sx={{
        height,
        width: "100%",
        bgcolor: "#e8eaf6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
        borderRadius: 1,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          bgcolor: "#c5cae9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2rem",
          fontWeight: 700,
          color: "#3949ab",
        }}
      >
        {(name || "?").charAt(0).toUpperCase()}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ px: 1, textAlign: "center", fontSize: "0.65rem" }}>
        {name}
      </Typography>
    </Box>
  );
}

//home sim

export default function SimulatedSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, images: passedImages } = location.state || {};

  const [statsModal, setStatsModal] = useState({ open: false, imageName: "", src: "", stats: null, mode: "" });
  const [audioModal, setAudioModal] = useState({ open: false, imageName: "", entries: [] });

  const images = passedImages || [];

  const handleViewStats = useCallback((img) => {
    setStatsModal({
      open: true,
      imageName: img.name,
      src: img.src || "",
      stats: img,
      mode: mode || "individual",
    });
  }, [mode]);

  const handleViewAudio = useCallback((img) => {
    setAudioModal({
      open: true,
      imageName: img.name,
      entries: img.audioEntries || [],
    });
  }, []);

  if (!mode || images.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: "center" }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          No images selected. Go back to Researcher View and select images first.
        </Alert>
        <Button variant="contained" onClick={() => navigate("/researcher")}>
          Back to Researcher View
        </Button>
      </Container>
    );
  }

  const modeLabels = {
    individual: "Individual Rating",
    pairwise: "Pairwise Comparison",
    ranked: "Ranked Comparison",
    selection: "Image Selection",
    group: "Grid Rating",
  };

  const renderSimulation = () => {
    switch (mode) {
      case "individual":
        return <IndividualSim images={images} onViewStats={handleViewStats} onViewAudio={handleViewAudio} />;
      case "pairwise":
        return <PairwiseSim images={images} onViewStats={handleViewStats} onViewAudio={handleViewAudio} />;
      case "ranked":
        return <RankedSim images={images} onViewStats={handleViewStats} onViewAudio={handleViewAudio} />;
      case "selection":
        return <SelectionSim images={images} onViewStats={handleViewStats} onViewAudio={handleViewAudio} />;
      case "group":
        return <GroupSim images={images} onViewStats={handleViewStats} onViewAudio={handleViewAudio} />;
      default:
        return <IndividualSim images={images} onViewStats={handleViewStats} onViewAudio={handleViewAudio} />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 6 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/researcher")}
        >
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ScienceIcon sx={{ color: "#283593" }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a237e" }}>
              Simulated Session
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {modeLabels[mode] || mode} — {images.length} image(s)
          </Typography>
        </Box>
        <Chip
          label={`${mode} mode`}
          color="primary"
          variant="outlined"
        />
      </Box>

     
      <Paper
        sx={{
          p: 1.5,
          mb: 3,
          bgcolor: "#e8eaf6",
          border: "1px solid #c5cae9",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <ScienceIcon sx={{ color: "#3949ab", fontSize: 20 }} />
        <Typography variant="body2" color="text.secondary">
          This is a researcher preview. Use the <strong>⋮</strong> menu on each image for stats and audio.
          {mode === "ranked" && " Tap two images to swap their ranks."}
          {mode === "pairwise" && " Click an image to select it as the winner."}
          {mode === "selection" && " Click images to select/deselect them."}
          {mode === "group" && " Adjust sliders to rate each image."}
        </Typography>
      </Paper>
      {renderSimulation()}

      <StatsModal
        open={statsModal.open}
        onClose={() => setStatsModal({ open: false, imageName: "", src: "", stats: null, mode: "" })}
        imageName={statsModal.imageName}
        imageSrc={statsModal.src}
        stats={statsModal.stats}
        mode={statsModal.mode}
      />

      <AudioModal
        open={audioModal.open}
        onClose={() => setAudioModal({ open: false, imageName: "", entries: [] })}
        imageName={audioModal.imageName}
        audioEntries={audioModal.entries}
      />
    </Container>
  );
}