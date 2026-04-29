import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Paper, Typography, Button } from "@mui/material";
import { useResults } from "../Results";
import { getGridConfig } from "../data/gridConstants";
import { getIndividualBatch } from "../utils/ImageLoader";
import { preloadImages } from "../utils/preloadImages";
import collectPageTranscripts from "../utils/collectPageTranscripts";
import GazeTrackingProvider, {
  useGazeTracking, useGazePage,
} from "../components/GazeTrackingProvider";
import CalibrationGate from "../components/CalibrationGate";
import { saveGazeSession } from "../utils/gazeStorage";
import GridRatingStep from "../components/GridRatingStep";
import UsernameEntry from "../components/UsernameEntry";
import ModeInstructionScreen from "../components/ModeInstructionScreen";
import { nextGuidedNavigation } from "../utils/guidedFlow";
import useAutoVoiceRecording from "../hooks/useAutoVoiceRecording";

/**
 * GroupGridRate — multi-page grid rating, configured by uploadConfig:
 *   pageCount  — number of pages (default 2)
 *   layoutId   — grid layout per page (default "3x3-no-center")
 *
 * Used as the final step in the guided "Start Rating" flow:
 * 2 pages of 3x3-no-center = 16 images on a 1–5 scale.
 */
function GroupGridRateInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig || null;
  const guided = !!uploadConfig?.guided;

  const { addFixedSession } = useResults();
  const { startSession, getGazeData, tagImageOnPage } = useGazeTracking();

  const layoutId = uploadConfig?.layoutId || "3x3-no-center";
  const pageCount = uploadConfig?.pageCount || 2;
  const gridCfg = useMemo(() => getGridConfig(layoutId), [layoutId]);
  const pageSize = gridCfg.pageSize;
  const totalImages = pageCount * pageSize;

  // step 0 = username (skipped in guided), 1 = instructions, 2 = rate, 3 = done
  const [step, setStep] = useState(uploadConfig ? 1 : 0);
  const [username, setUsername] = useState(uploadConfig?.username || "");
  const [allImages, setAllImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [ratings, setRatings] = useState({});
  const [moves, setMoves] = useState({});

  useEffect(() => {
    const batch = getIndividualBatch(totalImages);
    setAllImages(batch);
    preloadImages(batch.map((img) => img.src));
    const initial = {};
    const m = {};
    batch.forEach((img) => { initial[img.id] = 3; m[img.id] = 0; });
    setRatings(initial);
    setMoves(m);
  }, [totalImages]);

  const pageImages = useMemo(() => {
    const start = currentPage * pageSize;
    return allImages.slice(start, start + pageSize);
  }, [allImages, currentPage, pageSize]);

  useGazePage(step === 2 ? `group-page-${currentPage + 1}` : null, `group-${layoutId}`);
  useAutoVoiceRecording(step === 2);

  // Drive currentRatingPage so the VoiceRecorder splits audio per page.
  const { setCurrentRatingPage } = useResults();
  useEffect(() => {
    if (step === 2) setCurrentRatingPage(`group-page-${currentPage + 1}`);
    else setCurrentRatingPage(null);
    return () => setCurrentRatingPage(null);
  }, [step, currentPage, setCurrentRatingPage]);

  useEffect(() => {
    if (step !== 2) return;
    for (const img of pageImages) tagImageOnPage(img.id, img.filename || img.alt);
  }, [step, pageImages, tagImageOnPage]);

  const handleInteraction = (id) =>
    setMoves((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));

  const handleNext = () => {
    if (currentPage < pageCount - 1) {
      setCurrentPage((p) => p + 1);
      window.scrollTo(0, 0);
      return;
    }
    // Final page: collect + save
    const scores = allImages.map((img, idx) => ({
      imageId: img.id,
      imageName: img.filename,
      score: ratings[img.id] ?? 3,
      interactionCount: moves[img.id] || 0,
      position: `P${Math.floor(idx / pageSize) + 1}:${(idx % pageSize) + 1}`,
    }));

    const { transcripts: pageTranscripts, audioUrls: pageAudioUrls } = collectPageTranscripts();
    addFixedSession(username, scores, { pageTranscripts, pageAudioUrls });
    saveGazeSession(Date.now().toString(), "group-grid", username, getGazeData());

    if (guided) {
      const next = nextGuidedNavigation(uploadConfig);
      navigate(next.route, {
        state: next.uploadConfig ? { uploadConfig: next.uploadConfig } : undefined,
      });
    } else {
      setStep(3);
    }
  };

  if (step === 0) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <UsernameEntry
          title="Group Image Rating"
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
          mode="individual"
          prompt={`Rate each image on a 1–5 scale. ${pageCount} pages of ${pageSize} images each.`}
          onNext={() => { setStep(2); startSession(); }}
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

  if (allImages.length === 0) return null;

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <GridRatingStep
        title="Group Rating"
        currentPage={currentPage}
        totalPages={pageCount}
        images={pageImages}
        totalImages={totalImages}
        pageSize={pageSize}
        gridColumns={gridCfg.columns}
        imageHeight={gridCfg.imageHeight}
        removeCenter={gridCfg.removeCenter}
        ratings={ratings}
        setRatings={setRatings}
        onInteraction={handleInteraction}
        isLastPage={currentPage === pageCount - 1}
        onNext={handleNext}
      />
    </Container>
  );
}

export default function GroupGridRate() {
  return (
    <CalibrationGate>
      <GazeTrackingProvider>
        <GroupGridRateInner />
      </GazeTrackingProvider>
    </CalibrationGate>
  );
}
