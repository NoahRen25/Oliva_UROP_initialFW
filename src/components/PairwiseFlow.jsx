import React, { useState, useEffect } from "react";
import { Container, Typography, Box, Button } from "@mui/material";
import UsernameEntry from "./UsernameEntry";
import ProgressBar from "./ProgressBar";
import ModeInstructionScreen from "./ModeInstructionScreen";
import PromptDisplay from "./PromptDisplay";
import useRatingFlow from "../utils/useRatingFlow";

/**
 * PairwiseFlow — Generic pairwise comparison component.
 *
 * Works for both images and videos. The caller provides:
 *   - pairs: the batch of pairs from a loader
 *   - renderMedia: a function (pair, side, selected, onSelect) => JSX
 *   - onSubmit: (username, choices, pageTranscripts) => void
 *   - mode: instruction mode key (e.g., "pairwise", "video_pairwise")
 *   - navigateTo: where to go after submit (default: "/mode-results")
 *   - title: optional title prefix
 *   - headerContent: optional JSX above prompt (e.g., video icon)
 */
export default function PairwiseFlow({
  pairs,
  renderMedia,
  onSubmit,
  mode = "pairwise",
  navigateTo = "/mode-results",
  title,
  headerContent,
  canProceed = true,
  onPairChange,
}) {
  const flow = useRatingFlow({ mode });

  const [currentPairIndex, setCurrentPairIndex] = useState(0);
  const [selectedSide, setSelectedSide] = useState(null);
  const [choices, setChoices] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  // Track active prompt & page
  useEffect(() => {
    if (isFinished || pairs.length === 0 || flow.step !== 2) {
      flow.clearPrompt();
      return;
    }
    const prompt = flow.configPrompt || pairs[currentPairIndex].prompt;
    flow.updatePromptAndPage(prompt, currentPairIndex + 1);
  }, [flow.step, currentPairIndex, pairs, flow.configPrompt, isFinished]);

  const handleNext = () => {
    const currentPair = pairs[currentPairIndex];
    const choiceData = {
      pairId: currentPairIndex + 1,
      prompt: flow.configPrompt || currentPair.prompt,
      winnerSide: selectedSide,
      winnerName: selectedSide === "left" ? currentPair.left.filename : currentPair.right.filename,
      loserName: selectedSide === "left" ? currentPair.right.filename : currentPair.left.filename,
    };

    const newChoices = [...choices, choiceData];
    setChoices(newChoices);
    setSelectedSide(null);

    if (currentPairIndex < pairs.length - 1) {
      setCurrentPairIndex(currentPairIndex + 1);
      if (onPairChange) onPairChange();
    } else {
      setIsFinished(true);
      const { transcripts: pageTranscripts, audioUrls: pageAudioUrls } = flow.finishSession();
      onSubmit(flow.username, newChoices, { pageTranscripts, pageAudioUrls });
      flow.navigate(navigateTo);
    }
  };

  const handleBack = () => {
    if (currentPairIndex === 0) return;
    setChoices((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setSelectedSide(last.winnerSide || null);
      return prev.slice(0, -1);
    });
    setCurrentPairIndex((idx) => Math.max(0, idx - 1));
    if (onPairChange) onPairChange();
  };

  if (pairs.length === 0) return null;

  const currentPair = pairs[currentPairIndex];
  const globalPrompt = flow.configPrompt || null;
  const itemPrompt = currentPair?.prompt || "";

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      {/* Step 0: Username */}
      {flow.step === 0 && (
        <UsernameEntry
          title={title || "Pairwise Rating"}
          username={flow.username}
          setUsername={flow.setUsername}
          onStart={() => flow.setStep(1)}
          validationRegex={flow.usernameRegex}
        />
      )}

      {/* Step 1: Instructions */}
      {flow.step === 1 && (
        <ModeInstructionScreen
          mode={mode}
          prompt={flow.configPrompt || "Per-pair prompts will be shown"}
          onNext={() => flow.setStep(2)}
        />
      )}

      {/* Step 2: Pairs */}
      {flow.step === 2 && (
        <>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={currentPairIndex === 0}
            sx={{ mb: 2 }}
          >
            Back
          </Button>
          <ProgressBar
            current={currentPairIndex}
            total={pairs.length}
            label={`Pair ${currentPairIndex + 1} of ${pairs.length}`}
          />

          {headerContent}

          <Typography variant="h5" align="center" gutterBottom>
            Pair {currentPairIndex + 1} of {pairs.length}
          </Typography>

          <PromptDisplay
            globalPrompt={globalPrompt}
            itemPrompt={itemPrompt}
          />

          <Box
            sx={{
              mt: 1,
              display: "grid",
              justifyContent: "center",
              height: "65vh",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 3,
            }}
          >
            {renderMedia(currentPair, "left", selectedSide === "left", () =>
              setSelectedSide("left")
            )}
            {renderMedia(currentPair, "right", selectedSide === "right", () =>
              setSelectedSide("right")
            )}
          </Box>

          <Box sx={{ mt: 4, textAlign: "center" }}>
            <Button
              variant="contained"
              size="large"
              disabled={!selectedSide || !canProceed}
              onClick={handleNext}
            >
              {currentPairIndex === pairs.length - 1 ? "Submit All" : "Next Pair"}
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}