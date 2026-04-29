import React, { useState, useMemo } from "react";
import { Container, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useResults } from "../Results";
import { getGridConfig } from "../data/gridConstants";
import UsernameEntry from "../components/UsernameEntry";
import InstructionScreen from "../components/InstructionScreen";
import GridRatingStep from "../components/GridRatingStep";
import useGridRating from "../utils/useGridRating";
import collectPageTranscripts from "../utils/collectPageTranscripts";
import { useMemImages } from "../data/useMemImages";
import GazeTrackingProvider, { useGazeTracking, useGazePage } from "../components/GazeTrackingProvider";
import useAutoVoiceRecording from "../hooks/useAutoVoiceRecording";
import CalibrationGate from "../components/CalibrationGate";
import { saveGazeSession } from "../utils/gazeStorage";

const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function ComboRatingFlowInner() {
  const navigate = useNavigate();
  const { addFixedSession, setCurrentRatingPage } = useResults();
  const { rows, ready } = useMemImages();
  const grid = useGridRating();
  const { startSession, getGazeData, tagImageOnPage } = useGazeTracking();

  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [currentPage, setCurrentPage] = useState(0);

  useGazePage(
    step === 2 ? `combo-page-${currentPage + 1}` : null,
    `combo-${currentPage === 3 ? "3x3" : "3x3-no-center"}`
  );
  useAutoVoiceRecording(step === 2);

  // --- 33-image selection logic (unchanged, just uses grid hook) ---
  const fixedImageSequence = useMemo(() => {
    if (!ready || !rows || rows.length < 4) return [];
    const sorted = [...rows].sort((a, b) => (b.score || 0) - (a.score || 0));
    const high1 = sorted[0], high2 = sorted[1];
    const low1 = sorted[sorted.length - 1], low2 = sorted[sorted.length - 2];
    const usedIds = new Set([high1?.id, high2?.id, low1?.id, low2?.id].filter(Boolean));

    const totalScore = rows.reduce((s, r) => s + (Number(r.score) || 0), 0);
    const avgScore = totalScore / rows.length;
    const byDist = [...rows].filter((r) => r && !usedIds.has(r.id))
      .sort((a, b) => Math.abs((a.score || 0) - avgScore) - Math.abs((b.score || 0) - avgScore));

    const sel = [];
    let idx = 0;
    const addAvg = () => { if (idx < byDist.length) sel.push(byDist[idx++]); };

    for (let i = 0; i < 8; i++) addAvg(); // Page 1
    for (let i = 0; i < 8; i++) addAvg(); // Page 2
    if (high1) sel.push(high1);
    if (low1) sel.push(low1);
    while (sel.length < 24) addAvg(); // Page 3
    if (low2) sel.push(low2);
    if (high2) sel.push(high2);
    while (sel.length < 33 && idx < byDist.length) addAvg(); // Page 4

    return sel;
  }, [ready, rows]);

  const displaySequence = useMemo(() => {
    if (fixedImageSequence.length === 0) return [];
    return [
      ...shuffleArray(fixedImageSequence.slice(0, 8)),
      ...shuffleArray(fixedImageSequence.slice(8, 16)),
      ...shuffleArray(fixedImageSequence.slice(16, 24)),
      ...shuffleArray(fixedImageSequence.slice(24)),
    ];
  }, [fixedImageSequence]);

  // Tag images on the current combo page so aggregate gaze views can label boxes.
  // Note: ComboRatingFlow uses GridRatingStep which doesn't currently use
  // GazeTrackedImage, so per-image AOI gaze data won't exist for combo —
  // but page-level gaze + image-box snapshots still do.
  const pageImagesForTagging = useMemo(() => {
    if (displaySequence.length === 0) return [];
    const isLast = currentPage === 3;
    const startIdx = currentPage * 8;
    const endIdx = isLast ? 33 : Math.min(startIdx + 8, displaySequence.length);
    return displaySequence.slice(startIdx, endIdx);
  }, [currentPage, displaySequence]);

  useEffect(() => {
    if (step !== 2) return;
    for (const img of pageImagesForTagging) {
      if (img) tagImageOnPage(img.id, img.id);
    }
  }, [step, pageImagesForTagging, tagImageOnPage]);

  const pageConfig = useMemo(() => {
    if (displaySequence.length === 0) {
      return { layoutId: "3x3", gridCfg: getGridConfig("3x3"), images: [], isLastPage: false };
    }
    const isLast = currentPage === 3;
    const lid = isLast ? "3x3" : "3x3-no-center";
    const startIdx = currentPage * 8;
    const endIdx = isLast ? 33 : Math.min(startIdx + 8, displaySequence.length);
    return {
      layoutId: lid,
      gridCfg: getGridConfig(lid),
      images: displaySequence.slice(startIdx, endIdx),
      isLastPage: isLast,
    };
  }, [currentPage, displaySequence]);

  const handleNext = () => {
    if (pageConfig.isLastPage) {
      const scores = displaySequence.map((img, index) => {
        if (!img) return null;
        let pageIndex, posOnPage;
        if (index < 24) { pageIndex = Math.floor(index / 8); posOnPage = index % 8; }
        else { pageIndex = 3; posOnPage = index - 24; }

        let row, col;
        if (pageIndex < 3) {
          const vi = posOnPage < 4 ? posOnPage : posOnPage + 1;
          row = Math.floor(vi / 3) + 1;
          col = (vi % 3) + 1;
        } else {
          row = Math.floor(posOnPage / 3) + 1;
          col = (posOnPage % 3) + 1;
        }

        return {
          imageId: img.id, imageName: img.id,
          score: grid.ratings[img.id] ?? 5,
          position: `P${pageIndex + 1}:(${row},${col})`,
          interactionCount: grid.sliderMoves[img.id] || 0,
          clickOrder: grid.savedClickOrders[img.id] ?? "-",
          actualMemScore: img.score,
        };
      }).filter(Boolean);

      const { transcripts: pageTranscripts, audioUrls: pageAudioUrls } = collectPageTranscripts();
      addFixedSession(username, scores, { pageTranscripts, pageAudioUrls });
      saveGazeSession(Date.now().toString(), "combo", username, getGazeData());
      navigate("/grid-results");
    } else {
      setCurrentPage((p) => p + 1);
      setCurrentRatingPage(currentPage + 2);
      grid.resetPageInteractions();
      window.scrollTo(0, 0);
    }
  };

  if (!ready) return <CircularProgress sx={{ display: "block", mx: "auto", mt: 8 }} />;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {step === 0 && (
        <UsernameEntry
          title="Combo Protocol (33)"
          username={username}
          setUsername={setUsername}
          onStart={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <InstructionScreen
          variant="combo"
          onNext={() => { window.scrollTo(0, 0); setStep(2); setCurrentRatingPage(1); startSession(); }}
        />
      )}

      {step === 2 && (
        <GridRatingStep
          title="Combo Protocol"
          currentPage={currentPage}
          totalPages={4}
          images={pageConfig.images}
          totalImages={displaySequence.length}
          pageSize={8}
          gridColumns={pageConfig.gridCfg.columns}
          imageHeight={pageConfig.gridCfg.imageHeight}
          removeCenter={pageConfig.gridCfg.removeCenter}
          ratings={grid.ratings}
          setRatings={grid.setRatings}
          onInteraction={grid.handleInteraction}
          isLastPage={pageConfig.isLastPage}
          onNext={handleNext}
        />
      )}
    </Container>
  );
}

export default function ComboRatingFlow() {
  return (
    <CalibrationGate>
      <GazeTrackingProvider>
        <ComboRatingFlowInner />
      </GazeTrackingProvider>
    </CalibrationGate>
  );
}