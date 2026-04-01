-- Migration: Add session-audio storage bucket for persisting per-page recordings
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-audio', 'session-audio', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anon to upload audio (participants save recordings during sessions)
CREATE POLICY "anon_upload_session_audio"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'session-audio');

-- Allow public read access (researcher view needs to fetch audio)
CREATE POLICY "public_read_session_audio"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'session-audio');

-- Allow authenticated users full access (admin can manage audio files)
CREATE POLICY "auth_all_session_audio"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'session-audio')
  WITH CHECK (bucket_id = 'session-audio');