import React, { useState, useMemo } from "react";
import { Container, Box, Typography, Button, LinearProgress, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useResults } from "../Results";
import { getGridConfig } from "../data/gridConstants";
import UsernameEntry from "../components/UsernameEntry";
import ImageGrid from "../components/ImageGrid";
import InstructionScreen from "../components/InstructionScreen"; 
import { useMemImages } from "../data/UseMemImages";
import GazeTrackingProvider, { useGazeTracking } from "../components/GazeTrackingProvider";
import CalibrationGate from "../components/CalibrationGate";
import { saveGazeSession } from "../utils/gazeStorage";

//fisher-yates alg is optimal
const shuffleArray = (array) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };
function ComboRatingFlowInner() {
  const navigate = useNavigate();
  const { addFixedSession } = useResults();
  const { rows, ready } = useMemImages();
  const { startSession, getGazeData } = useGazeTracking();

  // Step 0: User, 1: Instructions, 2: Grid
  const [step, setStep] = useState(0); 
  const [username, setUsername] = useState("");
  
  // Grid State
  const [currentPage, setCurrentPage] = useState(0);
  const [ratings, setRatings] = useState({});
  const [sliderMoves, setSliderMoves] = useState({});
  const [interactionSequence, setInteractionSequence] = useState([]);
  const [savedClickOrders, setSavedClickOrders] = useState({});

  // --- Logic to select 33 images (Custom Placement with Safety Checks) ---
  const fixedImageSequence = useMemo(() => {
    // Return empty if data isn't ready or we don't have enough images to create extremes
    if (!ready || !rows || rows.length < 4) return [];

    // 1. Sort by score to find Extremes (High/Low)
    const sortedByScoreDesc = [...rows].sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // Safely grab extremes
    const high1 = sortedByScoreDesc[0]; 
    const high2 = sortedByScoreDesc[1];
    const low1 = sortedByScoreDesc[sortedByScoreDesc.length - 1];
    const low2 = sortedByScoreDesc[sortedByScoreDesc.length - 2];

    // Create a set of IDs to exclude from the "average" pool
    // We use ?.id to be safe, though the length check above usually prevents issues
    const usedIds = new Set([high1?.id, high2?.id, low1?.id, low2?.id].filter(Boolean));

    // 2. Prepare Average List (sorted by distance from average score)
    const totalScore = rows.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
    const avgScore = totalScore / rows.length;
    
    const sortedByDist = [...rows]
      .filter(r => r && !usedIds.has(r.id)) // Ensure r exists and isn't a used extreme
      .sort((a, b) => Math.abs((a.score || 0) - avgScore) - Math.abs((b.score || 0) - avgScore));

    const selection = [];
    let distIdx = 0;

    // Helper to safely add from sorted list
    const addNextAverage = () => {
        if (distIdx < sortedByDist.length) {
            selection.push(sortedByDist[distIdx++]);
        }
    };

    // --- Page 1 (8 Images): All Average ---
    for(let i=0; i<8; i++) addNextAverage();

    // --- Page 2 (8 Images): All Average ---
    for(let i=0; i<8; i++) addNextAverage();

    // --- Page 3 (8 Images): High Top-Left, Low Top-Mid ---
    // We strictly check if high1/low1 exist before pushing
    if (high1) selection.push(high1); // Index 16
    if (low1)  selection.push(low1);  // Index 17
    
    // Fill remaining spots (goal is 24 total after this page)
    while (selection.length < 24) addNextAverage();

    // --- Page 4 (9 Images): Low Top-Left, High Top-Mid (FLIPPED) ---
    if (low2)  selection.push(low2);  // Index 24
    if (high2) selection.push(high2); // Index 25

    // Fill remaining spots (goal is 33 total)
    while (selection.length < 33 && distIdx < sortedByDist.length) {
        addNextAverage();
    }

    return selection;
  }, [ready, rows]);

  const displaySequence = useMemo(() => {
    if (fixedImageSequence.length === 0) return [];

    // Slice out the specific batches for each page
    const page1 = fixedImageSequence.slice(0, 8);
    const page2 = fixedImageSequence.slice(8, 16);
    const page3 = fixedImageSequence.slice(16, 24);
    const page4 = fixedImageSequence.slice(24); // The rest (usually 9)

    // Shuffle each batch individually
    // This ensures Page 1 images stay on Page 1, but positions are random
    return [
      ...shuffleArray(page1),
      ...shuffleArray(page2),
      ...shuffleArray(page3),
      ...shuffleArray(page4)
    ];
  }, [fixedImageSequence]);

  // --- Page Configuration ---
  const pageConfig = useMemo(() => {
    // CHANGED: Check displaySequence instead of fixedImageSequence
    if (displaySequence.length === 0) {
        return { layoutId: "3x3", grid: getGridConfig("3x3"), images: [], isLastPage: false };
    }

    const isLastPage = currentPage === 3;
    const layoutId = isLastPage ? "3x3" : "3x3-no-center";
    const grid = getGridConfig(layoutId);
    
    const startIdx = currentPage * 8;
    // Safety clamp for end index
    // CHANGED: Use displaySequence length
    const endIdx = isLastPage ? 33 : Math.min(startIdx + 8, displaySequence.length);
    
    return {
      layoutId,
      grid,
      // CHANGED: Slice from the randomized displaySequence
      images: displaySequence.slice(startIdx, endIdx),
      isLastPage
    };
  }, [currentPage, displaySequence]);
  // --- Handlers ---

  const handleUsernameSubmit = () => {
    setStep(1); 
  };

  const handleInstructionsNext = () => {
    window.scrollTo(0, 0);
    setStep(2);
    startSession();
  };

  const handleInteraction = (id) => {
    setSliderMoves(prev => ({...prev, [id]: (prev[id] || 0) + 1}));
    if (!interactionSequence.includes(id)) {
      const nextOrder = interactionSequence.length + 1;
      setInteractionSequence(prev => [...prev, id]);
      setSavedClickOrders(prev => ({ ...prev, [id]: nextOrder }));
    }
  };

  const handleNext = () => {
    if (pageConfig.isLastPage) {
      // CHANGED: Iterate over displaySequence (the randomized order)
      // This ensures the "Position" recorded in results matches what the user actually saw
      const scores = displaySequence.map((img, index) => {
        // Safety check if an img is undefined in the final map
        if (!img) return null;

        let pageIndex, posOnPage;
        if (index < 24) {
            pageIndex = Math.floor(index / 8);
            posOnPage = index % 8;
        } else {
            pageIndex = 3;
            posOnPage = index - 24;
        }

        let row, col;
        if (pageIndex < 3) {
            const visualIndex = posOnPage < 4 ? posOnPage : posOnPage + 1;
            row = Math.floor(visualIndex / 3) + 1;
            col = (visualIndex % 3) + 1;
        } else {
            row = Math.floor(posOnPage / 3) + 1;
            col = (posOnPage % 3) + 1;
        }

        return {
            imageId: img.id,
            imageName: img.id,
            score: ratings[img.id] ?? 5,
            position: `P${pageIndex+1}:(${row},${col})`,
            interactionCount: sliderMoves[img.id] || 0,
            clickOrder: savedClickOrders[img.id] ?? "-",
            actualMemScore: img.score 
        };
      }).filter(Boolean); // Filter out any nulls

      addFixedSession(username, scores);
      saveGazeSession(Date.now().toString(), "combo", username, getGazeData());
      navigate("/grid-results");
    } else {
      setCurrentPage(prev => prev + 1);
      setInteractionSequence([]); 
      window.scrollTo(0, 0);
    }
  };

  if (!ready) return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 8 }} />;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {step === 0 && (
        <UsernameEntry 
          title="Combo Protocol (33)" 
          username={username} 
          setUsername={setUsername} 
          onStart={handleUsernameSubmit} 
        />
      )}

      {step === 1 && (
        <InstructionScreen 
          variant="combo"
          onNext={handleInstructionsNext} 
        />
      )}

      {step === 2 && (
        <Box sx={{ mt: 1, pb: 10 }}>
          <Box sx={{ mb: 1 }}>
            <Typography variant="h5" align="center" gutterBottom>
              Combo Protocol: Page {currentPage + 1} of 4
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={((currentPage + 1) / 4) * 100} 
              sx={{ height: 10, borderRadius: 5 }} 
            />
            <Typography variant="caption" display="block" align="center" sx={{ mt: 1, color: 'text.secondary' }}>
               Images {currentPage * 8 + 1} - {pageConfig.isLastPage ? 33 : (currentPage + 1) * 8}
            </Typography>
          </Box>

          <ImageGrid 
            images={pageConfig.images}
            ratings={ratings}
            setRatings={setRatings}
            trackMove={handleInteraction}
            columns={pageConfig.grid.columns}
            imageHeight={pageConfig.grid.imageHeight}
            removeCenter={pageConfig.grid.removeCenter}
          />

          <Button variant="contained" fullWidth size="large" sx={{ mt: 6 }} onClick={handleNext}>
            {pageConfig.isLastPage ? "Finish & View Results" : "Next Page"}
          </Button>
        </Box>
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