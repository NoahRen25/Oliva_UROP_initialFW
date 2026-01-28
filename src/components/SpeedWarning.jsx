import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useResults } from "../Results";

export default function SpeedWarning() {
  const { showSpeedWarning, setShowSpeedWarning } = useResults();

  return (
    <Dialog
      open={showSpeedWarning}
      onClose={() => setShowSpeedWarning(false)}
      aria-labelledby="speed-warning-title"
    >
      <DialogTitle id="speed-warning-title" sx={{ color: "error.main" }}>
        too fast!
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          We noticed that you're moving through the images quite quickly (under 2
          seconds on average).
          <br />
          <br />
          Please carefully look at the prompt and the image
          details before rating. High-quality data depends on your careful
          attention!
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={() => setShowSpeedWarning(false)}
          autoFocus
        >
          I Understand
        </Button>
      </DialogActions>
    </Dialog>
  );
}