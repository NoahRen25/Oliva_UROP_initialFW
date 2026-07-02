/**
 * gazeStorage.js — Persist a finished gaze-tracking session.
 *
 * Thin wrapper every rating page calls on submit: takes the accumulated
 * per-image/per-page gaze data from useGazeTracker and writes it to the
 * `gaze_sessions` table (originally this saved to localStorage, hence the
 * file name).
 */
import { insertGazeSession } from "../services/supabaseResults";

export function saveGazeSession(sessionId, mode, username, gazeData) {
  return insertGazeSession({
    sessionId,
    mode,
    username,
    startTime: gazeData.startTime,
    endTime: gazeData.endTime,
    images: gazeData.images,
    pages: gazeData.pages || {},
  });
}
