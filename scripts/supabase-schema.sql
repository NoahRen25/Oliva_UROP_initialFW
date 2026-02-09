    -- ============================================================
    -- Supabase Schema for Oliva Experiment App
    -- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
    -- ============================================================

    -- =====================
    -- 1. STORAGE BUCKETS
    -- =====================

    -- Create public buckets for images
    INSERT INTO storage.buckets (id, name, public) VALUES ('generated-images', 'generated-images', true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO storage.buckets (id, name, public) VALUES ('mem-images', 'mem-images', true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO storage.buckets (id, name, public) VALUES ('demo-images', 'demo-images', true) ON CONFLICT (id) DO NOTHING;

    -- Allow public read access to all three buckets
    CREATE POLICY "Public read generated-images" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'generated-images');
    CREATE POLICY "Public read mem-images" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'mem-images');
    CREATE POLICY "Public read demo-images" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'demo-images');

    -- Allow service role to upload (used by the migration script)
    CREATE POLICY "Service upload generated-images" ON storage.objects FOR INSERT TO service_role WITH CHECK (bucket_id = 'generated-images');
    CREATE POLICY "Service upload mem-images" ON storage.objects FOR INSERT TO service_role WITH CHECK (bucket_id = 'mem-images');
    CREATE POLICY "Service upload demo-images" ON storage.objects FOR INSERT TO service_role WITH CHECK (bucket_id = 'demo-images');

    -- =====================
    -- 2. DATABASE TABLES
    -- =====================

    -- Parent table for all experiment sessions
    CREATE TABLE IF NOT EXISTS sessions (
      id          BIGINT PRIMARY KEY,            -- matches Date.now() from the app
      type        TEXT NOT NULL,                  -- individual, group, pairwise, ranked, best_worst, pressure_cooker, fixed, layout_group
      username    TEXT NOT NULL,
      timestamp   TIMESTAMPTZ NOT NULL DEFAULT now(),
      meta        JSONB DEFAULT '{}'::jsonb,      -- extra info (mode, layoutId, bestStreak, etc.)
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Rating scores: individual, group, fixed, layout_group sessions
    CREATE TABLE IF NOT EXISTS rating_scores (
      id            BIGSERIAL PRIMARY KEY,
      session_id    BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      image_id      TEXT,                         -- image identifier within the batch
      image_src     TEXT,                         -- full path or URL
      filename      TEXT,
      prompt        TEXT,
      category      TEXT,
      score         REAL,
      time_spent    REAL,                         -- seconds
      interaction_count INTEGER DEFAULT 0,
      extra         JSONB DEFAULT '{}'::jsonb,    -- any extra fields (alt, folderId, etc.)
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Pairwise choices: pairwise and pressure_cooker sessions
    CREATE TABLE IF NOT EXISTS pairwise_choices (
      id            BIGSERIAL PRIMARY KEY,
      session_id    BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      pair_id       INTEGER,
      winner_side   TEXT,                         -- 'left' | 'right' | null (timeout)
      winner_name   TEXT,
      loser_name    TEXT,
      response_time REAL,                         -- milliseconds
      extra         JSONB DEFAULT '{}'::jsonb,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Ranked results: ranked sessions
    CREATE TABLE IF NOT EXISTS ranked_results (
      id            BIGSERIAL PRIMARY KEY,
      session_id    BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      group_id      INTEGER,
      prompt        TEXT,
      rank          INTEGER,
      image_id      TEXT,
      image_src     TEXT,
      filename      TEXT,
      folder_id     INTEGER,
      extra         JSONB DEFAULT '{}'::jsonb,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Best-worst trials: best_worst sessions
    CREATE TABLE IF NOT EXISTS best_worst_trials (
      id              BIGSERIAL PRIMARY KEY,
      session_id      BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      trial_id        INTEGER,
      prompt          TEXT,
      best_id         TEXT,
      best_name       TEXT,
      worst_id        TEXT,
      worst_name      TEXT,
      response_time   REAL,                       -- seconds
      extra           JSONB DEFAULT '{}'::jsonb,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Transcripts: voice recordings
    CREATE TABLE IF NOT EXISTS transcripts (
      id            BIGINT PRIMARY KEY,            -- matches Date.now() from the app
      text          TEXT NOT NULL,
      duration      REAL,
      timestamp     TEXT,                          -- formatted locale string from the app
      length        INTEGER,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- =====================
    -- 3. INDEXES
    -- =====================

    CREATE INDEX IF NOT EXISTS idx_rating_scores_session ON rating_scores(session_id);
    CREATE INDEX IF NOT EXISTS idx_pairwise_choices_session ON pairwise_choices(session_id);
    CREATE INDEX IF NOT EXISTS idx_ranked_results_session ON ranked_results(session_id);
    CREATE INDEX IF NOT EXISTS idx_best_worst_trials_session ON best_worst_trials(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(type);

    -- =====================
    -- 4. ROW LEVEL SECURITY
    -- =====================

    -- Enable RLS on all tables
    ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE rating_scores ENABLE ROW LEVEL SECURITY;
    ALTER TABLE pairwise_choices ENABLE ROW LEVEL SECURITY;
    ALTER TABLE ranked_results ENABLE ROW LEVEL SECURITY;
    ALTER TABLE best_worst_trials ENABLE ROW LEVEL SECURITY;
    ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;

    -- Anon can read and insert (participants submit results)
    CREATE POLICY "anon_select_sessions" ON sessions FOR SELECT TO anon USING (true);
    CREATE POLICY "anon_insert_sessions" ON sessions FOR INSERT TO anon WITH CHECK (true);
    CREATE POLICY "anon_select_rating_scores" ON rating_scores FOR SELECT TO anon USING (true);
    CREATE POLICY "anon_insert_rating_scores" ON rating_scores FOR INSERT TO anon WITH CHECK (true);
    CREATE POLICY "anon_select_pairwise_choices" ON pairwise_choices FOR SELECT TO anon USING (true);
    CREATE POLICY "anon_insert_pairwise_choices" ON pairwise_choices FOR INSERT TO anon WITH CHECK (true);
    CREATE POLICY "anon_select_ranked_results" ON ranked_results FOR SELECT TO anon USING (true);
    CREATE POLICY "anon_insert_ranked_results" ON ranked_results FOR INSERT TO anon WITH CHECK (true);
    CREATE POLICY "anon_select_best_worst_trials" ON best_worst_trials FOR SELECT TO anon USING (true);
    CREATE POLICY "anon_insert_best_worst_trials" ON best_worst_trials FOR INSERT TO anon WITH CHECK (true);
    CREATE POLICY "anon_select_transcripts" ON transcripts FOR SELECT TO anon USING (true);
    CREATE POLICY "anon_insert_transcripts" ON transcripts FOR INSERT TO anon WITH CHECK (true);

    -- Only authenticated users can update/delete
    CREATE POLICY "auth_delete_sessions" ON sessions FOR DELETE TO authenticated USING (true);
    CREATE POLICY "auth_update_sessions" ON sessions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    CREATE POLICY "auth_delete_rating_scores" ON rating_scores FOR DELETE TO authenticated USING (true);
    CREATE POLICY "auth_delete_pairwise_choices" ON pairwise_choices FOR DELETE TO authenticated USING (true);
    CREATE POLICY "auth_delete_ranked_results" ON ranked_results FOR DELETE TO authenticated USING (true);
    CREATE POLICY "auth_delete_best_worst_trials" ON best_worst_trials FOR DELETE TO authenticated USING (true);
    CREATE POLICY "auth_delete_transcripts" ON transcripts FOR DELETE TO authenticated USING (true);
