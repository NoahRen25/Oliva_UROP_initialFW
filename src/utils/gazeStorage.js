import { insertGazeSession } from '../services/supabaseResults';

const GAZE_STORAGE_KEY = 'app_gaze_sessions';

export function saveGazeSession(sessionId, mode, username, gazeData) {
  const sessions = getGazeSessions();
  sessions.push({
    sessionId,
    mode,
    username,
    startTime: gazeData.startTime,
    endTime: gazeData.endTime,
    images: gazeData.images,
  });
  localStorage.setItem(GAZE_STORAGE_KEY, JSON.stringify(sessions));

  insertGazeSession(sessionId, mode, username, gazeData).catch((err) => {
    console.warn('Gaze session Supabase upload failed; kept local copy:', err);
  });
}

export function getGazeSessions() {
  try {
    const data = localStorage.getItem(GAZE_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function clearGazeSessions() {
  localStorage.removeItem(GAZE_STORAGE_KEY);
}
