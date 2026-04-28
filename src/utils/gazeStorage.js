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
