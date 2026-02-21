import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container, Box, Typography, Button, LinearProgress, CircularProgress
} from "@mui/material";
import { useResults } from "../Results";
import { useMemImages } from "../data/UseMemImages";
import { getGridConfig } from "../data/gridConstants";
import UsernameEntry from "./UsernameEntry";
import InstructionScreen from "./InstructionScreen";
import ImageGrid from "./ImageGrid";
import usePageTranscription from "../hooks/usePageTranscription";

export default function LayoutRatingFlow({ mode = "upload" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const uploadConfig = location.state?.uploadConfig || null;

  const { addGroupSessionForLayout, setTaskPrompt, setActivePrompt } = useResults();
  const { ready, sampleInRange } = useMemImages();

  // Determine layout from config
  const layoutId = uploadConfig?.type || "2x2";
  const gridConfig = getGridConfig(layoutId);

  // Steps: 0 = Username (if not provided), 1 = Instructions, 2 = Rating
  const [step, setStep] = useState(uploadConfig?.username ? 1 : 0);
  const [username, setUsername] = useState(uploadConfig?.username || "");

  // Grid state
  const [images, setImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [ratings, setRatings] = useState({});
  const [sliderMoves, setSliderMoves] = useState({});
  const [interactionSequence, setInteractionSequence] = useState([]);
  const [savedClickOrders, setSavedClickOrders] = useState({});

  const { markPage, stopAndCollect } = usePageTranscription();

  const imageCount = uploadConfig?.count || gridConfig.pageSize;
  const minScore = uploadConfig?.minScore || 0;
  const maxScore = uploadConfig?.maxScore || 1;
  const showRating = uploadConfig?.showRating !== false;
  const taskPromptText = uploadConfig?.prompt || "Rate this image";

  // Set task prompt for the context
  useEffect(() => {
    setTaskPrompt(taskPromptText);
    return () => setTaskPrompt("");
  }, [taskPromptText, setTaskPrompt]);

  // Set active prompt for ReadPromptButton when on rating step
  useEffect(() => {
    if (step === 2) {
      setActivePrompt(taskPromptText);
    } else {
      setActivePrompt(null);
    }
    return () => setActivePrompt(null);
  }, [step, taskPromptText, setActivePrompt]);

  // Load images when ready
  useEffect(() => {
    if (ready && images.length === 0) {
      const sampled = sampleInRange(minScore, maxScore, imageCount);
      setImages(sampled);
    }
  }, [ready, sampleInRange, minScore, maxScore, imageCount, images.length]);

  // Pagination
  const totalPages = Math.ceil(images.length / gridConfig.pageSize);
  const currentImages = useMemo(() => {
    const start = currentPage * gridConfig.pageSize;
    return images.slice(start, start + gridConfig.pageSize);
  }, [images, currentPage, gridConfig.pageSize]);

  const isLastPage = currentPage === totalPages - 1;

  // Handlers
  const handleUsernameSubmit = () => setStep(1);

  const handleInstructionsNext = () => {
    window.scrollTo(0, 0);
    setStep(2);
    markPage(1);
  };

  const handleInteraction = (id) => {
    setSliderMoves(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    if (!interactionSequence.includes(id)) {
      const nextOrder = interactionSequence.length + 1;
      setInteractionSequence(prev => [...prev, id]);
      setSavedClickOrders(prev => ({ ...prev, [id]: nextOrder }));
    }
  };

  const handleNext = () => {
    if (isLastPage) {
      // Submit results
      const scores = images.map((img, index) => {
        const pageIndex = Math.floor(index / gridConfig.pageSize);
        const posOnPage = index % gridConfig.pageSize;
        
        let row, col;
        if (gridConfig.removeCenter && gridConfig.columns === 3) {
          const visualIndex = posOnPage < 4 ? posOnPage : posOnPage + 1;
          row = Math.floor(visualIndex / 3) + 1;
          col = (visualIndex % 3) + 1;
        } else {
          row = Math.floor(posOnPage / gridConfig.columns) + 1;
          col = (posOnPage % gridConfig.columns) + 1;
        }

        return {
          imageId: img.id,
          imageName: img.id,
          score: ratings[img.id] ?? 5,
          position: `P${pageIndex + 1}:(${row},${col})`,
          interactionCount: sliderMoves[img.id] || 0,
          clickOrder: savedClickOrders[img.id] ?? "-",
          memorabilityScore: img.score,
        };
      });

      addGroupSessionForLayout(layoutId, username, scores, {
        grid: gridConfig,
        prompt: taskPromptText,
        pageTranscripts: stopAndCollect(),
      });
      navigate("/grid-results");
    } else {
      setCurrentPage(prev => prev + 1);
      markPage(currentPage + 2);
      setInteractionSequence([]);
      window.scrollTo(0, 0);
    }
  };

  // Loading state
  if (!ready) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      {/* Step 0: Username */}
      {step === 0 && (
        <UsernameEntry
          title={`${layoutId.toUpperCase()} Grid Rating`}
          username={username}
          setUsername={setUsername}
          onStart={handleUsernameSubmit}
        />
      )}

      {/* Step 1: Instructions */}
      {step === 1 && (
        <InstructionScreen
          layoutId={layoutId}
          showRating={showRating}
          onNext={handleInstructionsNext}
        />
      )}

      {/* Step 2: Rating Grid */}
      {step === 2 && (
        <Box sx={{ mt: 1, pb: 10 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" align="center" gutterBottom>
              {layoutId.toUpperCase()} Grid: Page {currentPage + 1} of {totalPages}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={((currentPage + 1) / totalPages) * 100}
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography variant="caption" display="block" align="center" sx={{ mt: 1, color: 'text.secondary' }}>
              Images {currentPage * gridConfig.pageSize + 1} - {Math.min((currentPage + 1) * gridConfig.pageSize, images.length)} of {images.length}
            </Typography>
          </Box>

          {/* Task Prompt Display */}
          <Box sx={{ p: 2, mb: 2, bgcolor: "#fff3e0", borderRadius: 2, textAlign: "center" }}>
            <Typography variant="subtitle2" color="text.secondary">
              Task Prompt
            </Typography>
            <Typography variant="h6" color="primary.main">
              {taskPromptText}
            </Typography>
          </Box>

          <ImageGrid
            images={currentImages}
            ratings={ratings}
            setRatings={setRatings}
            trackMove={handleInteraction}
            columns={gridConfig.columns}
            imageHeight={gridConfig.imageHeight}
            removeCenter={gridConfig.removeCenter}
            showRating={showRating}
          />

          <Button
            variant="contained"
            fullWidth
            size="large"
            sx={{ mt: 4 }}
            onClick={handleNext}
          >
            {isLastPage ? "Finish & View Results" : "Next Page"}
          </Button>
        </Box>
      )}
    </Container>
  );
}