import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container, Paper, Typography, Button, Box, Slider, Card, CardContent,
  LinearProgress, Alert, CircularProgress,
} from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import { useResults } from "../Results";
import { getGridConfig } from "../data/gridConstants";
import VideoCard from "../components/VideoCard";
import useVideoFleet from "../hooks/useVideoFleet";
import { loadVideoIndex, getVideoGroupBatch, getVideoCount } from "../utils/VideoLoader";
import collectPageTranscripts from "../utils/collectPageTranscripts";
import GazeTrackingProvider, {
  useGazeTracking, useGazePage,
} from "../components/GazeTrackingProvider";
import CalibrationGate from "../components/CalibrationGate";
import GuidedProgress from "../components/GuidedProgress";
import { saveGazeSession } from "../utils/gazeStorage";
import UsernameEntry from "../components/UsernameEntry";
import ModeInstructionScreen from "../components/ModeInstructionScreen";
import { nextGuidedNavigation } from "../utils/guidedFlow";
import useAutoVoiceRecording from "../hooks/useAutoVoiceRecording";

function VideoGroupGridRateInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig || null;
  const guided = !!uploadConfig?.guided;

  const {
    addFixedSession, setCurrentRatingPage,
    checkEngagement, resetEngagement,
  } = useResults();
  const { startSession, getGazeData } = useGazeTracking();
  const fleet = useVideoFleet();
  const fleetReset = fleet.reset;

  const layoutId = uploadConfig?.layoutId || "3x3-no-center";
  const pageCount = uploadConfig?.pageCount || 2;
  const gridCfg = useMemo(() => getGridConfig(layoutId), [layoutId]);
  const pageSize = gridCfg.pageSize;
  const totalVideos = pageCount * pageSize;

  const [step, setStep] = useState(uploadConfig ? 1 : 0);
  const [username, setUsername] = useState(uploadConfig?.username || "");
  const [allVideos, setAllVideos] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [ratings, setRatings] = useState({});
  const [moves, setMoves] = useState({});
  const [pageTimes, setPageTimes] = useState([]);
  const pageStartTimeRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        await loadVideoIndex();
        if (getVideoCount() === 0) {
          setLoadError('No videos found. Configure the "videos" Supabase bucket or public/videos/manifest.json.');
        } else {
          const batch = getVideoGroupBatch(totalVideos);
          if (cancelled) return;
          setAllVideos(batch);
          const initial = {};
          const m = {};
          batch.forEach((v) => { initial[v.id] = 5; m[v.id] = 0; });
          setRatings(initial);
          setMoves(m);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [totalVideos]);

  const pageVideos = useMemo(() => {
    const start = currentPage * pageSize;
    return allVideos.slice(start, start + pageSize);
  }, [allVideos, currentPage, pageSize]);

  useGazePage(step === 2 ? `group-page-${currentPage + 1}` : null, `video-group-${layoutId}`);
  useAutoVoiceRecording(step === 2);

  useEffect(() => {
    if (step === 2) setCurrentRatingPage(`group-page-${currentPage + 1}`);
    else setCurrentRatingPage(null);
    return () => setCurrentRatingPage(null);
  }, [step, currentPage, setCurrentRatingPage]);

  useEffect(() => {
    fleetReset();
  }, [currentPage, fleetReset]);

  useEffect(() => {
    if (step === 2) {
      pageStartTimeRef.current = performance.now();
    }
  }, [step, currentPage]);

  const handleSliderChange = (id, value) =>
    setRatings((prev) => ({ ...prev, [id]: value }));
  const handleSliderCommit = (id) =>
    setMoves((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));

  const pageIds = pageVideos.map((v) => v.id);
  const allWatched = pageVideos.length > 0 && fleet.allWatched(pageIds);
  const allEndedNow = pageVideos.length > 0 && fleet.allEnded(pageIds);
  const secsRemaining = pageVideos.length > 0 ? Math.ceil(fleet.remainingRuntime(pageIds)) : 0;

  const handleNext = () => {
    const elapsed = pageStartTimeRef.current
      ? (performance.now() - pageStartTimeRef.current) / 1000
      : 0;
    const newTimes = [...pageTimes, Number(elapsed.toFixed(2))];
    const isSafe = checkEngagement(newTimes, pageSize);
    if (!isSafe) return;
    setPageTimes(newTimes);

    if (currentPage < pageCount - 1) {
      setCurrentPage((p) => p + 1);
      window.scrollTo(0, 0);
      return;
    }
    const scores = allVideos.map((v, idx) => ({
      imageId: v.id,
      imageName: v.filename,
      score: ratings[v.id] ?? 5,
      interactionCount: moves[v.id] || 0,
      position: `P${Math.floor(idx / pageSize) + 1}:${(idx % pageSize) + 1}`,
    }));

    const { transcripts: pageTranscripts, audioUrls: pageAudioUrls } = collectPageTranscripts();
    addFixedSession(username, scores, {
      pageTranscripts,
      pageAudioUrls,
      mediaMode: "video",
    });
    saveGazeSession(Date.now().toString(), "video-group-grid", username, getGazeData());

    if (guided) {
      const next = nextGuidedNavigation(uploadConfig);
      navigate(next.route, {
        state: next.uploadConfig ? { uploadConfig: next.uploadConfig } : undefined,
      });
    } else {
      setStep(3);
    }
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

  if (step === 0) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <UsernameEntry
          title="Group Video Rating"
          username={username}
          setUsername={setUsername}
          onStart={() => setStep(1)}
        />
      </Container>
    );
  }

  if (step === 1) {
    return (
      <Container maxWidth="md">
        <ModeInstructionScreen
          mode="video_group"
          prompt={`Watch each video, then rate it on a 1–${10} scale. ${pageCount} pages of ${pageSize} videos each.`}
          onNext={() => { setStep(2); startSession(); resetEngagement(); }}
        />
      </Container>
    );
  }

  if (step === 3) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>Success!</Typography>
          <Button variant="contained" onClick={() => navigate("/grid-results")}>
            View Results
          </Button>
        </Paper>
      </Container>
    );
  }

  if (allVideos.length === 0) return null;

  const startIdx = currentPage * pageSize + 1;
  const endIdx = Math.min((currentPage + 1) * pageSize, totalVideos);
  const slots = gridCfg.removeCenter && gridCfg.columns === 3
    ? [...pageVideos.slice(0, 4), null, ...pageVideos.slice(4)]
    : pageVideos;

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <Box sx={{ mt: 1, pb: 10 }}>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
            <VideocamIcon color="error" />
            <Typography variant="h5" align="center">
              Group Rating: Page {currentPage + 1} of {pageCount}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={((currentPage + 1) / pageCount) * 100}
            sx={{ height: 10, borderRadius: 5, mt: 1 }}
          />
          <Typography
            variant="caption"
            display="block"
            align="center"
            sx={{ mt: 1, color: "text.secondary" }}
          >
            Videos {startIdx} – {endIdx} of {totalVideos}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: `repeat(${gridCfg.columns}, 1fr)`,
            alignItems: "start",
          }}
        >
          {slots.map((v, idx) => (
            <Box key={v ? v.id : `spacer-${idx}`}>
              {v ? (
                <Card sx={{ p: 1, height: "100%", display: "flex", flexDirection: "column" }}>
                  {v.prompt && (
                    <Typography
                      variant="caption"
                      align="center"
                      sx={{
                        display: "block",
                        mb: 0.75,
                        px: 0.5,
                        fontStyle: "italic",
                        color: "primary.main",
                        lineHeight: 1.3,
                      }}
                    >
                      &ldquo;{v.prompt}&rdquo;
                    </Typography>
                  )}
                  <VideoCard
                    videoId={v.id}
                    coordinator={fleet}
                    src={v.src}
                    showBorder={false}
                    height={gridCfg.imageHeight || "25vh"}
                  />
                  <CardContent sx={{ px: 1, mt: 1, "&:last-child": { pb: 1 } }}>
                    <Typography variant="caption" color="text.secondary" align="center" display="block">
                      Rating: {ratings[v.id] ?? 5}
                    </Typography>
                    <Slider
                      value={ratings[v.id] ?? 5}
                      min={1}
                      max={10}
                      step={1}
                      marks
                      onChange={(_e, val) => handleSliderChange(v.id, val)}
                      onChangeCommitted={() => handleSliderCommit(v.id)}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Box sx={{ height: gridCfg.imageHeight || "25vh" }} />
              )}
            </Box>
          ))}
        </Box>

        <Button
          variant="contained"
          fullWidth
          size="large"
          sx={{ mt: 4 }}
          disabled={!allWatched}
          onClick={handleNext}
        >
          {!allWatched
            ? allEndedNow && secsRemaining > 0
              ? `Please wait ${secsRemaining}s…`
              : "Watch every video to continue"
            : currentPage === pageCount - 1
            ? "Finish & View Results"
            : "Next Page"}
        </Button>
      </Box>
    </Container>
  );
}

export default function VideoGroupGridRate() {
  return (
    <>
      <GuidedProgress />
      <CalibrationGate>
        <GazeTrackingProvider>
          <VideoGroupGridRateInner />
        </GazeTrackingProvider>
      </CalibrationGate>
    </>
  );
}
