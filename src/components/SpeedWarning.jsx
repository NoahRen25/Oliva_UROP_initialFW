/**
 * SpeedWarning.jsx — Global "slow down" dialog for participants who click
 * through pages too fast. Mounted once in App.jsx; visibility and the
 * per-page threshold live in Results context (checkEngagement sets them
 * when a rating page reports its page times).
 */
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
  const { showSpeedWarning, setShowSpeedWarning, speedThresholdSec } = useResults();
  const threshold = Number.isFinite(speedThresholdSec) ? speedThresholdSec : 2;
  const thresholdLabel = Number.isInteger(threshold) ? threshold : threshold.toFixed(1);

  const dismiss = () => setShowSpeedWarning(false);

  return (
    <Dialog
      open={showSpeedWarning}
      onClose={dismiss}
      aria-labelledby="speed-warning-title"
    >
      <DialogTitle id="speed-warning-title" sx={{ color: "error.main" }}>
        Slow down
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          Please spend at least <strong>{thresholdLabel} seconds</strong>{" "}
          looking at the images on this page before continuing.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={dismiss} autoFocus>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
