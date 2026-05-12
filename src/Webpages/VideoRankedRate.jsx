import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useResults } from "../Results";
import {
  Container, Typography, Box, Button, Card, CardContent,
  Alert, CircularProgress, Chip,
} from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import VideocamIcon from "@mui/icons-material/Videocam";
import UsernameEntry from "../components/UsernameEntry";
import ProgressBar from "../components/ProgressBar";
import ModeInstructionScreen from "../components/ModeInstructionScreen";
import PromptDisplay from "../components/PromptDisplay";
import VideoCard from "../components/VideoCard";
import useVideoFleet from "../hooks/useVideoFleet";
import { loadVideoIndex, getVideoRankedBatch, getVideoCount } from "../utils/VideoLoader";
import collectPageTranscripts from "../utils/collectPageTranscripts";
import GazeTrackingProvider, { useGazeTracking, useGazePage } from "../components/GazeTrackingProvider";
import { nextGuidedNavigation } from "../utils/guidedFlow";
import useAutoVoiceRecording from "../hooks/useAutoVoiceRecording";
import CalibrationGate from "../components/CalibrationGate";
import GuidedProgress from "../components/GuidedProgress";
import { saveGazeSession } from "../utils/gazeStorage";

const RANK_LABELS = ["1st (Best)", "2nd", "3rd"];
const RANK_COLORS = ["#2e7d32", "#1976d2", "#ed6c02"];
const RANK_BG = ["#e8f5e9", "#e3f2fd", "#fff3e0"];

function SwapVideoPanel({ videos, order, setOrder, fleet }) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const dragNodeRef = useRef(null);

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

  const [tapFirst, setTapFirst] = useState(null);
  const handleTapSwap = (idx) => {
    if (tapFirst === null) setTapFirst(idx);
    else if (tapFirst === idx) setTapFirst(null);
    else {
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
          Drag to reorder, or tap two videos to swap. Left = 1st (Best), Right = 3rd.
        </Typography>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 3,
        }}
      >
        {order.map((vIdx, slotIdx) => {
          const v = videos[vIdx];
          const isOver = overIdx === slotIdx && dragIdx !== slotIdx;
          const isTapSelected = tapFirst === slotIdx;
          return (
            <Box
              key={`slot-${slotIdx}-${v.id}`}
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
                borderRadius: 2,
                boxShadow: isOver || isTapSelected ? 8 : 2,
                bgcolor: RANK_BG[slotIdx],
                position: "relative",
                userSelect: "none",
                p: 1,
              }}
            >
              <Box sx={{ position: "absolute", top: 16, left: 16, zIndex: 2 }}>
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
              <Box sx={{ position: "absolute", top: 16, right: 16, zIndex: 2, color: "rgba(0,0,0,0.4)" }}>
                <DragIndicatorIcon />
              </Box>
              <VideoCard
                videoId={v.id}
                coordinator={fleet}
                src={v.src}
                showBorder={false}
                height="32vh"
              />
              <CardContent sx={{ textAlign: "center", py: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {v.alt || v.filename}
                </Typography>
              </CardContent>
            </Box>
          );
        })}
      </Box>
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

function VideoRankedRateInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig || null;

  const {
    addRankedSession, setActivePrompt, setCurrentRatingPage,
    checkEngagement, resetEngagement,
  } = useResults();
  const { startSession, getGazeData } = useGazeTracking();

  const [step, setStep] = useState(uploadConfig ? 1 : 0);
  const [username, setUsername] = useState(uploadConfig?.username || "");
  const [groups, setGroups] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [allRankings, setAllRankings] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [swapOrder, setSwapOrder] = useState([0, 1, 2]);
  const [groupTimes, setGroupTimes] = useState([]);
  const groupStartTimeRef = useRef(0);
  const fleet = useVideoFleet();
  const fleetReset = fleet.reset;

  const groupCount = uploadConfig?.count || 3;
  const configPrompt = uploadConfig?.prompt || null;

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        await loadVideoIndex();
        if (getVideoCount() === 0) {
          setLoadError('No videos found. Configure the "videos" Supabase bucket or public/videos/manifest.json.');
        } else {
          const batch = getVideoRankedBatch(groupCount);
          if (batch.length === 0) {
            setLoadError("Need the same filename in at least 2 folders for ranked comparisons.");
          } else if (!cancelled) {
            setGroups(batch);
          }
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [groupCount]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setActivePrompt(null);
      setCurrentRatingPage(null);
    };
  }, [setActivePrompt, setCurrentRatingPage]);

  useEffect(() => {
    if (isFinished || groups.length === 0 || step !== 2) {
      setActivePrompt(null);
      return;
    }
    const prompt = configPrompt || groups[currentGroupIndex].prompt;
    setActivePrompt(prompt);
    setCurrentRatingPage(currentGroupIndex + 1);
  }, [step, currentGroupIndex, groups, configPrompt, isFinished, setActivePrompt, setCurrentRatingPage]);

  useEffect(() => {
    setSwapOrder(groups[currentGroupIndex] ? groups[currentGroupIndex].images.map((_, i) => i) : [0, 1, 2]);
    fleetReset();
  }, [currentGroupIndex, groups, fleetReset]);

  useEffect(() => {
    if (step === 2 && !isFinished) {
      groupStartTimeRef.current = performance.now();
    }
  }, [step, currentGroupIndex, isFinished]);

  useGazePage(
    step === 2 && groups.length > 0 && !isFinished
      ? `group-${currentGroupIndex + 1}`
      : null,
    "video-ranked-3"
  );

  useAutoVoiceRecording(step === 2 && !isFinished);

  const activeGroup = groups[currentGroupIndex];
  const groupIds = activeGroup ? activeGroup.images.map((v) => v.id) : [];
  const allWatched = activeGroup ? fleet.allWatched(groupIds) : false;
  const allEndedNow = activeGroup ? fleet.allEnded(groupIds) : false;
  const secsRemaining = activeGroup ? Math.ceil(fleet.remainingRuntime(groupIds)) : 0;

  const handleNext = () => {
    const elapsed = groupStartTimeRef.current
      ? (performance.now() - groupStartTimeRef.current) / 1000
      : 0;
    const newTimes = [...groupTimes, Number(elapsed.toFixed(2))];
    const isSafe = checkEngagement(newTimes, 3);
    if (!isSafe) return;
    setGroupTimes(newTimes);

    const ranks = swapOrder.map((idx, slot) => ({
      groupId: currentGroupIndex + 1,
      groupPrompt: configPrompt || activeGroup.prompt,
      imageId: activeGroup.images[idx].id,
      imageName: activeGroup.images[idx].filename,
      rank: slot + 1,
    }));
    const updated = [...allRankings, ...ranks];

    if (currentGroupIndex < groups.length - 1) {
      setAllRankings(updated);
      setCurrentGroupIndex(currentGroupIndex + 1);
    } else {
      setIsFinished(true);
      window.speechSynthesis.cancel();
      const { transcripts: pageTranscripts, audioUrls: pageAudioUrls } = collectPageTranscripts();
      addRankedSession(username, updated, {
        pageTranscripts,
        pageAudioUrls,
        mediaMode: "video",
      });
      saveGazeSession(Date.now().toString(), "video-ranked", username, getGazeData());
      if (uploadConfig?.guided) {
        const next = nextGuidedNavigation(uploadConfig);
        navigate(next.route, {
          state: next.uploadConfig ? { uploadConfig: next.uploadConfig } : undefined,
        });
      } else {
        navigate("/mode-results");
      }
    }
  };

  const handleBack = () => {
    if (currentGroupIndex === 0) return;
    const remaining = allRankings.filter((r) => r.groupId !== currentGroupIndex);
    setAllRankings(remaining);
    setCurrentGroupIndex((i) => Math.max(0, i - 1));
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: "center" }}>
        <CircularProgress size={48} />
        <Typography sx={{ mt: 2 }}>Loading videos…</Typography>
      </Container>
    );
  }

  if (loadError) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>Video Loading Error:</strong> {loadError}
        </Alert>
        <Button variant="outlined" onClick={() => navigate("/")}>Back to Home</Button>
      </Container>
    );
  }

  if (groups.length === 0) return null;

  const globalPrompt = configPrompt || "Rank these videos";
  const groupPrompt = activeGroup?.prompt || "";

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      {step === 0 && (
        <UsernameEntry
          title="Ranked Video Rating"
          username={username}
          setUsername={setUsername}
          onStart={() => setStep(1)}
          validationRegex={/^\d+$/}
        />
      )}

      {step === 1 && (
        <ModeInstructionScreen
          mode="video_ranked"
          prompt={configPrompt || "Per-group prompts will be shown"}
          onNext={() => { setStep(2); startSession(); resetEngagement(); }}
        />
      )}

      {step === 2 && activeGroup && (
        <>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={currentGroupIndex === 0}
            sx={{ mb: 2 }}
          >
            Back
          </Button>
          <ProgressBar
            current={currentGroupIndex}
            total={groups.length}
            label={`Group ${currentGroupIndex + 1} of ${groups.length}`}
          />
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1 }}>
            <VideocamIcon color="error" />
            <Typography variant="h5" align="center">
              Ranking {currentGroupIndex + 1} of {groups.length}
            </Typography>
          </Box>
          <PromptDisplay
            globalPrompt={configPrompt ? globalPrompt : null}
            itemPrompt={groupPrompt}
          />
          <SwapVideoPanel
            videos={activeGroup.images}
            order={swapOrder}
            setOrder={setSwapOrder}
            fleet={fleet}
          />
          <Box sx={{ maxWidth: 400, mx: "auto", mt: 4, pb: 5 }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!allWatched}
              onClick={handleNext}
            >
              {!allWatched
                ? allEndedNow && secsRemaining > 0
                  ? `Please wait ${secsRemaining}s…`
                  : "Watch every video to continue"
                : currentGroupIndex === groups.length - 1
                ? "Submit All Rankings"
                : "Next Group"}
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}

export default function VideoRankedRate() {
  return (
    <>
      <GuidedProgress />
      <CalibrationGate>
        <GazeTrackingProvider>
          <VideoRankedRateInner />
        </GazeTrackingProvider>
      </CalibrationGate>
    </>
  );
}
