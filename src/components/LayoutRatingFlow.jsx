import React, { useMemo, useState } from "react";
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  LinearProgress, 
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useResults } from "../Results";
import { useMemImages } from "../data/UseMemImages";
import { getGridConfig, LAYOUT_OPTIONS } from "../data/gridConstants";

// Sub-components
import UsernameEntry from "./UsernameEntry";
import SelectionScreen from "./SelectionScreen";
import ConfigSelectionScreen from "./ConfigSelectionScreen";
import ImageGrid from "./ImageGrid";
import InstructionScreen from "./InstructionScreen"; // Import the new screen

export default function LayoutRatingFlow({ 
  mode = "manual", 
  layoutId: initialLayoutId,
  defaultCount = 4 
}) {
  const navigate = useNavigate();
  const { addGroupSessionForLayout, setTaskPrompt } = useResults();
  const { ready, countInRange, sampleInRange } = useMemImages();

  // --- Session State ---
  // 0: User, 1: Config, 2: Instructions, 3: Rating (Grid)
  const [step, setStep] = useState(0); 
  const [username, setUsername] = useState("");
  
  // --- Configuration State ---
  const [config, setConfig] = useState({
    layoutId: initialLayoutId || "2x2",
    range: [0.0, 1.0],
    count: defaultCount,
    showRating: true // Default for manual mode
  });

  // --- Runtime State (The Grid) ---
  const [currentPage, setCurrentPage] = useState(0);
  const [selected, setSelected] = useState([]);
  const [ratings, setRatings] = useState({});
  const [sliderMoves, setSliderMoves] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [interactionSequence, setInteractionSequence] = useState([]);
  const [savedClickOrders, setSavedClickOrders] = useState({});

  const gridSettings = useMemo(() => getGridConfig(config.layoutId), [config.layoutId]);
  const pageSize = gridSettings.pageSize;

  const availableCount = useMemo(() => {
    if (!ready) return 0;
    return countInRange(config.range[0], config.range[1]);
  }, [ready, config.range, countInRange]);

  const totalPages = Math.ceil(selected.length / pageSize);
  const isLastPage = currentPage === totalPages - 1;

  const currentImages = useMemo(() => {
    const start = currentPage * pageSize;
    return selected.slice(start, start + pageSize);
  }, [selected, currentPage, pageSize]);

  // --- Actions ---

  // 1. Prepare data, but go to Instructions (Step 2)
  const prepareSession = (overrideCount) => {
    const finalCount = overrideCount || config.count;
    const imgs = sampleInRange(config.range[0], config.range[1], finalCount);
    setSelected(imgs);
    setCurrentPage(0);
    setStep(2); // Go to Instructions
  };

  const handleConfigUpload = (loadedData) => {
    if (loadedData.prompt) {
      setTaskPrompt(loadedData.prompt);
    }
    setConfig({
      layoutId: loadedData.layout,
      range: loadedData.range,
      count: loadedData.count,
      showRating: loadedData.showRating // Load boolean from JSON
    });
    // Wait for state update then prepare
    setTimeout(() => prepareSession(loadedData.count), 0);
  };

  // 2. Actually start the timer and show Grid (Step 3)
  const handleStartGrid = () => {
    setStartTime(performance.now());
    setStep(3);
  };

  const handleInteraction = (id) => {
    setSliderMoves(prev => ({...prev, [id]: (prev[id] || 0) + 1}));
    if (!interactionSequence.includes(id)) {
      const nextOrder = interactionSequence.length + 1;
      setInteractionSequence(prev => [...prev, id]);
      setSavedClickOrders(prev => ({
        ...prev,
        [id]: nextOrder
      }));
    }
  };

  const handleNext = () => {
    if (isLastPage) submit();
    else {
      setCurrentPage((p) => p + 1);
      window.scrollTo(0, 0);
      setInteractionSequence([]);
    }
  };

  const submit = () => {
    const totalTime = startTime ? (performance.now() - startTime) / 1000 : 0;
    
    const scores = selected.map((img, index) => {
      const posInPage = index % pageSize; 
      let row, col;
  
      if (config.layoutId === "3x3-no-center") {
        const visualIndex = posInPage < 4 ? posInPage : posInPage + 1;
        row = Math.floor(visualIndex / 3) + 1;
        col = (visualIndex % 3) + 1;
      } else {
        row = Math.floor(posInPage / gridSettings.columns) + 1;
        col = (posInPage % gridSettings.columns) + 1;
      }
  
      const clickOrder = savedClickOrders[img.id] ?? "-";

      return {
        imageId: img.id,
        imageName: img.id,
        score: ratings[img.id] ?? 3,
        position: `(${row}, ${col})`,
        timeSpent: (totalTime / Math.max(1, selected.length)).toFixed(2),
        interactionCount: sliderMoves[img.id] || 0,
        clickOrder: clickOrder,
      };
    });
  
    addGroupSessionForLayout(config.layoutId, username, scores, { grid: gridSettings });
    navigate(`/results`);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      {/* STEP 0: Username */}
      {step === 0 && (
        <UsernameEntry 
          title={mode === 'upload' ? "Upload Configuration" : "New Rating Session"} 
          username={username} 
          setUsername={setUsername} 
          onStart={() => setStep(1)} 
        />
      )}

      {/* STEP 1: Configuration */}
      {step === 1 && (
        <Box sx={{ maxWidth: 600, mx: "auto", mt: 4 }}>
          {!ready ? (
            <CircularProgress sx={{ display: "block", mx: "auto" }} />
          ) : (
            <>
              {mode === "manual" ? (
                <>
                  <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Session Settings</Typography>
                    
                    <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                      <InputLabel>Grid Layout</InputLabel>
                      <Select
                        value={config.layoutId}
                        label="Grid Layout"
                        onChange={(e) => setConfig(prev => ({ ...prev, layoutId: e.target.value }))}
                      >
                        {LAYOUT_OPTIONS.map((opt) => (
                          <MenuItem key={opt.id} value={opt.id}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <SelectionScreen
                      range={config.range}
                      setRange={(r) => setConfig(prev => ({ ...prev, range: r }))}
                      count={config.count}
                      setCount={(c) => setConfig(prev => ({ ...prev, count: c }))}
                      availableCount={availableCount}
                      pageSize={pageSize} 
                    />
                  </Paper>

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{ py: 1.5 }}
                    disabled={availableCount === 0 || config.count < 1 || config.count % pageSize !== 0}
                    onClick={() => prepareSession()}
                  >
                    Next: Instructions
                  </Button>
                </>
              ) : (
                <ConfigSelectionScreen 
                  onConfigLoaded={handleConfigUpload}
                  ready={ready}
                  countInRange={countInRange}
                />
              )}
            </>
          )}
        </Box>
      )}

      {/* STEP 2: Instructions */}
      {step === 2 && (
        <InstructionScreen 
          onNext={handleStartGrid} 
          showRating={config.showRating}
          layoutId={config.layoutId}
        />
      )}

      {/* STEP 3: Rating Grid */}
      {step === 3 && (
        <Box sx={{ mt: 2, pb: 10 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" color="text.secondary" align="center" gutterBottom>
              Page {currentPage + 1} of {totalPages}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={((currentPage + 1) / totalPages) * 100} 
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>

          <ImageGrid 
            images={currentImages} 
            ratings={ratings} 
            setRatings={setRatings} 
            trackMove={handleInteraction} 
            columns={gridSettings.columns} 
            imageHeight={gridSettings.imageHeight} 
            removeCenter={gridSettings.removeCenter}
            showRating={config.showRating} // Pass the config setting
          />

          <Button 
            sx={{ mt: 6 }} 
            variant="contained" 
            size="large" 
            fullWidth 
            onClick={handleNext}
          >
            {isLastPage ? "Finish & Submit Results" : "Next Page"}
          </Button>
        </Box>
      )}
    </Container>
  );
}