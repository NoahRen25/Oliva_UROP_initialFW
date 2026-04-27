-- ============================================================
-- Migration: gaze_sessions table
-- Adds per-session eye-tracking data alongside existing rating tables.
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor).
-- ============================================================

CREATE TABLE IF NOT EXISTS gaze_sessions (
  id          BIGSERIAL PRIMARY KEY,
  session_id  BIGINT NOT NULL,                   -- matches sessions.id (Date.now() from app)
  mode        TEXT NOT NULL,                      -- individual, ranked, pairwise, selection, best-worst, combo, pressure-cooker, grid
  username    TEXT NOT NULL,
  start_time  TIMESTAMPTZ,
  end_time    TIMESTAMPTZ,
  images      JSONB NOT NULL DEFAULT '{}'::jsonb, -- { [imageId]: { firstGazeTime, totalGazeTime, gazeEntries, gazeExits, coordinates: [...] } }
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gaze_sessions_session ON gaze_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_gaze_sessions_mode ON gaze_sessions(mode);

ALTER TABLE gaze_sessions ENABLE ROW LEVEL SECURITY;

-- Anon: INSERT only (participants upload gaze data but cannot read it back)
CREATE POLICY "anon_insert_gaze_sessions" ON gaze_sessions
  FOR INSERT TO anon WITH CHECK (true);

-- Authenticated: full read/delete for admins
CREATE POLICY "auth_select_gaze_sessions" ON gaze_sessions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_delete_gaze_sessions" ON gaze_sessions
  FOR DELETE TO authenticated USING (true);
