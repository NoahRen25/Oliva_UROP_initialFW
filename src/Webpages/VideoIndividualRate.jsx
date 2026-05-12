import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useResults } from "../Results";
import {
  Typography, Container, Button, Card, CardContent, Paper, Box,
  Alert, CircularProgress,
} from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import ScoreSlider from "../components/ScoreSlider";
import UsernameEntry from "../components/UsernameEntry";
import ProgressBar from "../components/ProgressBar";
import ModeInstructionScreen from "../components/ModeInstructionScreen";
import PromptDisplay from "../components/PromptDisplay";
import VideoCard from "../components/VideoCard";
import useVideoFleet from "../hooks/useVideoFleet";
import { loadVideoIndex, getVideoIndividualBatch, getVideoCount } from "../utils/VideoLoader";
import collectPageTranscripts from "../utils/collectPageTranscripts";
import GazeTrackingProvider, { useGazeTracking, useGazePage } from "../components/GazeTrackingProvider";
import { nextGuidedNavigation } from "../utils/guidedFlow";
import CalibrationGate from "../components/CalibrationGate";
import GuidedProgress from "../components/GuidedProgress";
import { saveGazeSession } from "../utils/gazeStorage";
import useAutoVoiceRecording from "../hooks/useAutoVoiceRecording";

function VideoIndividualRateInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig || null;

  const {
    addIndividualSession, setActivePrompt, setCurrentRatingPage,
    checkEngagement, resetEngagement,
  } = useResults();
  const { startSession, getGazeData } = useGazeTracking();

  const [activeStep, setActiveStep] = useState(uploadConfig ? 1 : 0);
  const [username, setUsername] = useState(uploadConfig?.username || "");
  const [videosToRate, setVideosToRate] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentRating, setCurrentRating] = useState(3);
  const [scores, setScores] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [interactionCount, setInteractionCount] = useState(0);
  const fleet = useVideoFleet();

  const videoCount = uploadConfig?.count || 5;
  const configPrompt = uploadConfig?.prompt || null;

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        await loadVideoIndex();
        if (getVideoCount() === 0) {
          setLoadError('No videos found. Configure the "videos" Supabase bucket or public/videos/manifest.json.');
        } else {
          const batch = getVideoIndividualBatch(videoCount);
          if (!cancelled) setVideosToRate(batch);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [videoCount]);

  useEffect(() => {
    return () => {
      setActivePrompt(null);
      setCurrentRatingPage(null);
    };
  }, [setActivePrompt, setCurrentRatingPage]);

  useAutoVoiceRecording(activeStep === 2);

  const startTimer = () => {
    setStartTime(performance.now());
    setInteractionCount(0);
  };

  const totalVideos = videoCount;
  const progressValue = activeStep === 2 ? currentIndex + 1 : 0;

  useEffect(() => {
    if (activeStep === 2 && videosToRate[currentIndex]) {
      const v = videosToRate[currentIndex];
      setActivePrompt(configPrompt || v.prompt);
      setCurrentRatingPage(currentIndex + 1);
    } else {
      setActivePrompt(null);
    }
  }, [activeStep, currentIndex, videosToRate, configPrompt, setActivePrompt, setCurrentRatingPage]);

  const currentVideo = videosToRate[currentIndex] || null;
  const videoIdForCurrent = currentVideo ? `vi_${currentIndex}` : null;
  const idsForCurrent = videoIdForCurrent ? [videoIdForCurrent] : [];
  const canProceed = videoIdForCurrent ? fleet.allWatched(idsForCurrent) : false;
  const allEndedNow = videoIdForCurrent ? fleet.allEnded(idsForCurrent) : false;
  const secsRemaining = videoIdForCurrent
    ? Math.ceil(fleet.remainingRuntime(idsForCurrent))
    : 0;

  const pageKey = activeStep === 2 && currentVideo ? `video-${currentIndex + 1}` : null;
  useGazePage(pageKey, "video-individual-1");

  const handleNext = () => {
    const timeSpent = (performance.now() - startTime) / 1000;
    const v = videosToRate[currentIndex];

    const newScore = {
      imageId: v.id,
      imageName: v.filename,
      prompt: configPrompt || v.prompt,
      score: currentRating,
      timeSpent: Number(timeSpent.toFixed(2)),
      interactionCount,
    };

    const updatedScores = [...scores, newScore];
    const times = updatedScores.map((s) => s.timeSpent);
    const isSafe = checkEngagement(times, 1);
    if (!isSafe) return;

    setScores(updatedScores);
    setCurrentRating(3);

    if (currentIndex < videosToRate.length - 1) {
      setCurrentIndex(currentIndex + 1);
      fleet.reset();
    } else {
      const { transcripts: pageTranscripts, audioUrls: pageAudioUrls } = collectPageTranscripts();
      addIndividualSession(username, updatedScores, {
        pageTranscripts,
        pageAudioUrls,
        mediaMode: "video",
      });
      saveGazeSession(Date.now().toString(), "video-individual", username, getGazeData());
      if (uploadConfig?.guided) {
        const next = nextGuidedNavigation(uploadConfig);
        navigate(next.route, {
          state: next.uploadConfig ? { uploadConfig: next.uploadConfig } : undefined,
        });
        return;
      }
      setActiveStep(3);
    }
    startTimer();
  };

  const incrementMoves = () => setInteractionCount((prev) => prev + 1);

  const handleBack = () => {
    if (activeStep !== 2 || currentIndex === 0) return;
    setScores((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setCurrentRating(last.score ?? 3);
      return prev.slice(0, -1);
    });
    setCurrentIndex((idx) => Math.max(0, idx - 1));
    setInteractionCount(0);
    fleet.reset();
    startTimer();
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

  if (videosToRate.length === 0) return null;
  const globalPrompt = configPrompt || "Rate this video";
  const videoPrompt = currentVideo ? currentVideo.prompt : "";

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {activeStep === 0 && (
        <UsernameEntry
          title="Individual Video Rating"
          username={username}
          setUsername={setUsername}
          onStart={() => setActiveStep(1)}
        />
      )}

      {activeStep === 1 && (
        <ModeInstructionScreen
          mode="video_individual"
          prompt={configPrompt || "Per-video prompts will be shown"}
          onNext={() => {
            setActiveStep(2);
            startTimer();
            startSession();
            resetEngagement();
          }}
        />
      )}

      {activeStep === 2 && currentVideo && (
        <>
          {currentIndex > 0 && (
            <Button variant="outlined" onClick={handleBack} sx={{ mb: 2 }}>
              Back
            </Button>
          )}
          <ProgressBar
            current={progressValue}
            total={totalVideos}
            label={`Progress: ${progressValue} / ${totalVideos}`}
          />
          <Card>
            <Box sx={{ p: 2, bgcolor: "#fff3e0", textAlign: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1 }}>
                <VideocamIcon color="error" />
                <Typography variant="h6">
                  {`Video ${currentIndex + 1} of ${videosToRate.length}`}
                </Typography>
              </Box>
              <PromptDisplay
                globalPrompt={configPrompt ? globalPrompt : null}
                itemPrompt={videoPrompt}
              />
            </Box>
            <VideoCard
              videoId={videoIdForCurrent}
              coordinator={fleet}
              src={currentVideo.src}
              showBorder={false}
              height="55vh"
            />
            <CardContent sx={{ textAlign: "center" }}>
              <Typography>Rating: {currentRating}</Typography>
              <ScoreSlider
                value={currentRating}
                setValue={setCurrentRating}
                onInteraction={incrementMoves}
              />
              <Button
                variant="contained"
                fullWidth
                disabled={!canProceed}
                onClick={handleNext}
                sx={{
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(0,0,0,0.12)",
                    color: "rgba(0,0,0,0.26)",
                  },
                }}
              >
                {!canProceed
                  ? allEndedNow && secsRemaining > 0
                    ? `Please wait ${secsRemaining}s…`
                    : "Watch the video to continue"
                  : currentIndex === videosToRate.length - 1
                  ? "Finish"
                  : "Next"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {activeStep === 3 && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5">Success!</Typography>
          <Button
            sx={{ mt: 2 }}
            variant="contained"
            onClick={() => navigate("/mode-results")}
          >
            View Results
          </Button>
        </Paper>
      )}
    </Container>
  );
}

export default function VideoIndividualRate() {
  return (
    <>
      <GuidedProgress />
      <CalibrationGate>
        <GazeTrackingProvider>
          <VideoIndividualRateInner />
        </GazeTrackingProvider>
      </CalibrationGate>
    </>
  );
}
