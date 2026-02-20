-- Migration: anon can only INSERT, auth required for SELECT/DELETE/UPDATE
-- Run this in Supabase SQL Editor

-- Drop old permissive policies
DROP POLICY IF EXISTS "anon_all_sessions" ON sessions;
DROP POLICY IF EXISTS "anon_all_rating_scores" ON rating_scores;
DROP POLICY IF EXISTS "anon_all_pairwise_choices" ON pairwise_choices;
DROP POLICY IF EXISTS "anon_all_ranked_results" ON ranked_results;
DROP POLICY IF EXISTS "anon_all_best_worst_trials" ON best_worst_trials;
DROP POLICY IF EXISTS "anon_all_transcripts" ON transcripts;

-- Also drop the SELECT policies if they were already created
DROP POLICY IF EXISTS "anon_select_sessions" ON sessions;
DROP POLICY IF EXISTS "anon_select_rating_scores" ON rating_scores;
DROP POLICY IF EXISTS "anon_select_pairwise_choices" ON pairwise_choices;
DROP POLICY IF EXISTS "anon_select_ranked_results" ON ranked_results;
DROP POLICY IF EXISTS "anon_select_best_worst_trials" ON best_worst_trials;
DROP POLICY IF EXISTS "anon_select_transcripts" ON transcripts;

-- Anon: INSERT only (participants submit results but cannot read them)
CREATE POLICY "anon_insert_sessions" ON sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_rating_scores" ON rating_scores FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_pairwise_choices" ON pairwise_choices FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_ranked_results" ON ranked_results FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_best_worst_trials" ON best_worst_trials FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_transcripts" ON transcripts FOR INSERT TO anon WITH CHECK (true);

-- Authenticated: full access (admin can read, delete, update)
CREATE POLICY "auth_select_sessions" ON sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_delete_sessions" ON sessions FOR DELETE TO authenticated USING (true);
CREATE POLICY "auth_update_sessions" ON sessions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_select_rating_scores" ON rating_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_delete_rating_scores" ON rating_scores FOR DELETE TO authenticated USING (true);
CREATE POLICY "auth_select_pairwise_choices" ON pairwise_choices FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_delete_pairwise_choices" ON pairwise_choices FOR DELETE TO authenticated USING (true);
CREATE POLICY "auth_select_ranked_results" ON ranked_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_delete_ranked_results" ON ranked_results FOR DELETE TO authenticated USING (true);
CREATE POLICY "auth_select_best_worst_trials" ON best_worst_trials FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_delete_best_worst_trials" ON best_worst_trials FOR DELETE TO authenticated USING (true);
CREATE POLICY "auth_select_transcripts" ON transcripts FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_delete_transcripts" ON transcripts FOR DELETE TO authenticated USING (true);
