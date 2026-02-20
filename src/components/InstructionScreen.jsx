import React, { useMemo } from "react";
import { Box, Typography, Button, Card, Slider, Grid } from "@mui/material";
import { getGridConfig, LAYOUT_OPTIONS } from "../data/gridConstants"; 
import { useResults } from "../Results";

export default function InstructionScreen({ 
  onNext, 
  showRating = true, 
  layoutId = "2x2",
  variant = "manual" // "manual" | "combo"
}) {
  const { taskPrompt } = useResults();

  // Height configuration for different layouts
  const getPreviewHeight = (id) => {
    const heights = {
      "4x1": "12vh",
      "2x2": "12vh",
      "3x3": "8vh",
      "3x3-small": "6vh",
      "3x3-no-center": "8vh",
      "4x4": "5vh",
    };
    return heights[id] || "10vh";
  };

  // Get layout label for display
  const getLayoutLabel = (id) => {
    const option = LAYOUT_OPTIONS.find(opt => opt.id === id);
    return option ? option.label : id;
  };

  const GridPreview = ({ lId, title }) => {
    const config = getGridConfig(lId);
    const { columns, pageSize, removeCenter } = config;
    const previewHeight = getPreviewHeight(lId);

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
            px: 1,
            maxWidth: columns <= 2 ? 400 : columns === 3 ? 500 : 600,
            mx: "auto",
          }}
        >
          {displaySlots.map((id, index) => (
            <Box key={index}>
              {id ? (
                <Card sx={{ p: 0.5, height: '100%' }}>
                  <Box
                    sx={{ 
                      height: previewHeight, 
                      width: "100%",
                      bgcolor: '#f0f0f0',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ccc',
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      border: "2px dashed #ddd",
                    }}
                  >
                    –
                  </Box>
                  <Box sx={{ px: 0.5, mt: 0.5 }}>
                    <Slider 
                      defaultValue={5} 
                      min={1} 
                      max={10} 
                      step={1} 
                      size="small" 
                      disabled 
                    />
                  </Box>
                </Card>
              ) : (
                <Box sx={{ height: previewHeight }} />
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ width: "90%", mx: "auto", mt: 2, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        {variant === "combo" ? "Combo Protocol" : `${getLayoutLabel(layoutId)} Grid Rating`}
      </Typography>
      <Typography variant="h5" gutterBottom>Instructions</Typography>

      <Box sx={{ textAlign: "left", px: 2, mt: 4, mb: 4 }}>
        <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>
          In the following task, you will see a grid of images. Please rate each image based on the prompt listed below.
          {"\n\n"}
          If you ever want the prompt to be repeated, click the <strong>READ PROMPT</strong> button (microphone icon) in the top right of your screen.
          Clicking it while it is speaking will <strong>STOP</strong> the audio.
          {"\n\n"}
          Each slider is set to a default of 5. 1 is the lowest score, and 10 is the highest score.
          {"\n\n"}
          Scroll down and click "Start Rating" when you are ready to begin.
        </Typography>
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}>
        Prompt: {taskPrompt}
      </Typography>

      {/* Visual Preview */}
      <Box
        sx={{
          p: 2.5,
          mb: 4,
          bgcolor: "#fafafa",
          borderRadius: 2,
          border: "1px solid #e0e0e0",
        }}
      >
        <Typography
          variant="overline"
          display="block"
          sx={{ mb: 1.5, color: "text.secondary", letterSpacing: 1 }}
        >
          Preview – What you will see
        </Typography>

        {variant === "combo" ? (
          <Grid container spacing={4} justifyContent="center">
            <Grid item>
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
          <GridPreview lId={layoutId} title={`${getLayoutLabel(layoutId)} Layout`} />
        )}
      </Box>

      <Button variant="contained" size="large" fullWidth onClick={onNext} sx={{ mb: 10 }}>
        Start Rating
      </Button>
    </Box>
  );
}