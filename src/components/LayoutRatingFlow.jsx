import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, Box, CircularProgress } from "@mui/material";
import { useResults } from "../Results";
import { useMemImages } from "../data/useMemImages";
import { getGridConfig } from "../data/gridConstants";
import UsernameEntry from "./UsernameEntry";
import InstructionScreen from "./InstructionScreen";
import GridRatingStep from "./GridRatingStep";
import useGridRating from "../utils/useGridRating";
import collectPageTranscripts from "../utils/collectPageTranscripts";

export default function LayoutRatingFlow({ mode = "upload" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig || null;

  const { addGroupSessionForLayout, setTaskPrompt, setActivePrompt, setCurrentRatingPage } = useResults();
  const { ready, sampleInRange } = useMemImages();
  const grid = useGridRating();

  const layoutId = uploadConfig?.type || "2x2";
  const gridConfig = getGridConfig(layoutId);

  const [step, setStep] = useState(uploadConfig?.username ? 1 : 0);
  const [username, setUsername] = useState(uploadConfig?.username || "");
  const [images, setImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);

  const imageCount = uploadConfig?.count || gridConfig.pageSize;
  const minScore = uploadConfig?.minScore || 0;
  const maxScore = uploadConfig?.maxScore || 1;
  const showRating = uploadConfig?.showRating !== false;
  const taskPromptText = uploadConfig?.prompt || "Rate this image";

  useEffect(() => {
    setTaskPrompt(taskPromptText);
    return () => setTaskPrompt("");
  }, [taskPromptText, setTaskPrompt]);

  useEffect(() => {
    if (step === 2) setActivePrompt(taskPromptText);
    else setActivePrompt(null);
    return () => setActivePrompt(null);
  }, [step, taskPromptText, setActivePrompt]);

  useEffect(() => {
    if (ready && images.length === 0) {
      setImages(sampleInRange(minScore, maxScore, imageCount));
    }
  }, [ready, sampleInRange, minScore, maxScore, imageCount, images.length]);

  const totalPages = Math.ceil(images.length / gridConfig.pageSize);
  const currentImages = useMemo(() => {
    const start = currentPage * gridConfig.pageSize;
    return images.slice(start, start + gridConfig.pageSize);
  }, [images, currentPage, gridConfig.pageSize]);
  const isLastPage = currentPage === totalPages - 1;

  const handleNext = () => {
    if (isLastPage) {
      const scores = images.map((img, index) => {
        const pageIndex = Math.floor(index / gridConfig.pageSize);
        const posOnPage = index % gridConfig.pageSize;
        let row, col;
        if (gridConfig.removeCenter && gridConfig.columns === 3) {
          const vi = posOnPage < 4 ? posOnPage : posOnPage + 1;
          row = Math.floor(vi / 3) + 1;
          col = (vi % 3) + 1;
        } else {
          row = Math.floor(posOnPage / gridConfig.columns) + 1;
          col = (posOnPage % gridConfig.columns) + 1;
        }
        return {
          imageId: img.id,
          imageName: img.id,
          score: grid.ratings[img.id] ?? 5,
          position: `P${pageIndex + 1}:(${row},${col})`,
          interactionCount: grid.sliderMoves[img.id] || 0,
          clickOrder: grid.savedClickOrders[img.id] ?? "-",
          memorabilityScore: img.score,
        };
      });

      const { transcripts: pageTranscripts, audioUrls: pageAudioUrls } = collectPageTranscripts();
      addGroupSessionForLayout(layoutId, username, scores, {
        grid: gridConfig,
        prompt: taskPromptText,
        pageTranscripts,
        pageAudioUrls,
      });
      navigate("/grid-results");
    } else {
      setCurrentPage((p) => p + 1);
      setCurrentRatingPage(currentPage + 2);
      grid.resetPageInteractions();
      window.scrollTo(0, 0);
    }
  };

  if (!ready) {
    return <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      {step === 0 && (
        <UsernameEntry
          title={`${layoutId.toUpperCase()} Grid Rating`}
          username={username}
          setUsername={setUsername}
          onStart={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <InstructionScreen
          layoutId={layoutId}
          showRating={showRating}
          onNext={() => { window.scrollTo(0, 0); setStep(2); setCurrentRatingPage(1); }}
        />
      )}

      {step === 2 && (
        <GridRatingStep
          title={`${layoutId.toUpperCase()} Grid`}
          currentPage={currentPage}
          totalPages={totalPages}
          images={currentImages}
          totalImages={images.length}
          pageSize={gridConfig.pageSize}
          prompt={taskPromptText}
          gridColumns={gridConfig.columns}
          imageHeight={gridConfig.imageHeight}
          removeCenter={gridConfig.removeCenter}
          showRating={showRating}
          ratings={grid.ratings}
          setRatings={grid.setRatings}
          onInteraction={grid.handleInteraction}
          isLastPage={isLastPage}
          onNext={handleNext}
        />
      )}
    </Container>
  );
}