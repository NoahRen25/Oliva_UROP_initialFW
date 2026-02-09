import React, { useMemo } from "react";
import { Box, Typography, Button, Card, Slider, Grid } from "@mui/material";
import { getGridConfig } from "../data/gridConstants"; 
import { useResults } from "../Results";

export default function InstructionScreen({ 
  onNext, 
  showRating = true, 
  layoutId = "2x2",
  variant = "manual" // "manual" | "combo"
}) {
  const { taskPrompt } = useResults();

  // --- HEIGHT CONFIGURATION ---
  // Synchronized the 3x3 variants to 10vh to ensure identical item sizes
  const instructionHeights = {
    "4x1": "50vh",
    "2x2": "20vh",
    "3x3": "10vh",
    "3x3-no-center": "10vh",
    "4x4": "4vh",
    "default": "10vh"
  };

  const getHeight = (id) => instructionHeights[id] || instructionHeights["default"];

  const GridPreview = ({ lId, title }) => {
    const config = getGridConfig(lId);
    const { columns, pageSize, removeCenter } = config;
    const activeHeight = getHeight(lId);

    const displaySlots = useMemo(() => {
      const items = Array.from({ length: pageSize }, (_, i) => i + 1);
      if (removeCenter && columns === 3) {
        const copy = [...items];
        copy.splice(4, 0, null); 
        return copy;
      }
      return items;
    }, [pageSize, removeCenter, columns]);

    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            alignItems: "start",
            mb: 2,
            px: 1
          }}
        >
          {displaySlots.map((id, index) => (
            <Box key={index}>
              {id ? (
                <Card sx={{ p: 0.5, height: '100%' }}>
                  <Box
                    sx={{ 
                      height: activeHeight, 
                      width: "100%",
                      bgcolor: '#f0f0f0',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ccc',
                      fontSize: '1.5rem',
                      fontWeight: 'bold'
                    }}
                  >
                    -
                  </Box>
                  <Box sx={{ px: 0.5, mt: 0.5 }}>
                    <Slider defaultValue={5} min={1} max={10} step={1} size="small" />
                  </Box>
                </Card>
              ) : (
                <Box sx={{ height: activeHeight }} />
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", mt: 2, textAlign: "center" }}>
      <Typography variant="h5" gutterBottom>Instructions</Typography>

      <Typography variant="body1" sx={{ 
        whiteSpace: "pre-line", 
        mb: 4, 
        textAlign: "left", 
        px: 2,
        mt: 6 
      }}>
        In the following task, you will see a grid of images. Please rate each image based on the prompt listed below.
        If you ever want the prompt to be repeated, click the <strong>READ PROMPT</strong> button in the top right of your screen.
        Clicking it while it is speaking will <strong>STOP</strong> the audio. 
        Each slider is set to a default 5. 1 is the lowest score, and 10 is the highest score. 
        Scroll down and click "Start Rating" when you are ready to begin.
      </Typography>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
          Prompt: {taskPrompt}
      </Typography>

      {variant === "combo" ? (
        <Grid container spacing={4} justifyContent="center" sx={{ mb: 6 }}>
          <Grid item>
            {/* Standardized width 300 matches both previews */}
            <Box sx={{ width: 300 }}>
              <GridPreview lId="3x3-no-center" title="Pages 1-3 (8 Images)" />
            </Box>
          </Grid>
          <Grid item>
            <Box sx={{ width: 300 }}>
              <GridPreview lId="3x3" title="Page 4 (9 Images)" />
            </Box>
          </Grid>
        </Grid>
      ) : (
        <Box sx={{ mb: 6, px: 2, maxWidth: 600, mx: 'auto' }}>
           <GridPreview lId={layoutId} title={`${layoutId} Layout Example`} />
        </Box>
      )}

      <Button variant="contained" size="large" fullWidth onClick={onNext} sx={{ mb: 10 }}>
        Start Rating
      </Button>
    </Box>
  );
}