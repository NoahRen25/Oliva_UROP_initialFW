# Supabase Integration Documentation

This document explains how Supabase is used in the Oliva Experiment App — covering the database, storage, authentication, and how to extend each.

---

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [Row Level Security (RLS)](#row-level-security-rls)
6. [Storage Buckets](#storage-buckets)
7. [Authentication](#authentication)
8. [Services API Reference](#services-api-reference)
9. [Data Flow](#data-flow)
10. [How to Extend](#how-to-extend)

---

## Overview

The app uses [Supabase](https://supabase.com) as its backend-as-a-service, providing:

- **Postgres Database** — stores experiment sessions, scores, pairwise choices, rankings, best-worst trials, and transcripts.
- **Storage** — hosts experiment images in public buckets (generated, memorability, demo).
- **Auth** — magic-link email authentication for admin operations (reading/deleting results, uploading images).

The app is **frontend-only** (no server). All Supabase calls happen client-side via `@supabase/supabase-js`. When Supabase credentials are missing, the app degrades gracefully to `localStorage`.

---

## Setup

### 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com), create a project, and note the **Project URL** and **anon public key** from Settings > API.

### 2. Set Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

These are Vite env vars — they must start with `VITE_` to be exposed to the client.

### 3. Run the Database Schema

Open the Supabase SQL Editor and run:

```
scripts/supabase-schema.sql
```

This creates all tables, indexes, storage buckets, storage policies, and RLS policies in one go.

### 4. (Optional) Images Table for Dataset Manager

If you need the authenticated image upload feature, also run:

```
docs/supabase_schema.sql
```

This creates the `images` table with per-user RLS.

### 5. Enable Auth

In Supabase Dashboard > Authentication > Providers, enable **Email** with magic links.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│                                                      │
│  Results.jsx (context)                               │
│    ├── hydrates from Supabase on mount               │
│    ├── falls back to localStorage                    │
│    └── write-through: saves to both on every change  │
│                                                      │
│  Services                                            │
│    ├── supabaseResults.js  → database CRUD           │
│    └── supabaseStorage.js  → file upload + records   │
│                                                      │
│  Utils                                               │
│    └── supabaseImageUrl.js → public URL generation   │
│                                                      │
│  Client                                              │
│    └── supabaseClient.js   → createClient()          │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS (anon key)
                   ▼
┌──────────────────────────────────────────────────────┐
│                   Supabase                            │
│                                                      │
│  Postgres         Storage          Auth              │
│  ┌──────────┐    ┌─────────────┐  ┌──────────┐      │
│  │ sessions │    │ generated-  │  │ Magic    │      │
│  │ rating_  │    │  images     │  │  link    │      │
│  │  scores  │    │ mem-images  │  │  email   │      │
│  │ pairwise_│    │ demo-images │  │          │      │
│  │  choices │    └─────────────┘  └──────────┘      │
│  │ ranked_  │                                        │
│  │  results │    RLS Policies                        │
│  │ best_    │    ┌─────────────┐                     │
│  │  worst_  │    │ anon: INSERT│                     │
│  │  trials  │    │ auth: ALL   │                     │
│  │ trans-   │    └─────────────┘                     │
│  │  cripts  │                                        │
│  └──────────┘                                        │
└──────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `src/supabaseClient.js` | Creates and exports the Supabase client (or `null` if unconfigured) |
| `src/services/supabaseResults.js` | All database read/write operations for experiment results |
| `src/services/supabaseStorage.js` | Image upload, image record creation, signed URL generation |
| `src/utils/supabaseImageUrl.js` | Generates public storage URLs with local fallback |
| `src/Results.jsx` | Global React context that hydrates from Supabase and syncs to localStorage |
| `scripts/supabase-schema.sql` | Full schema: tables, indexes, buckets, policies |
| `scripts/migrate-rls-policies.sql` | RLS migration script (tightened anon from full access to INSERT-only) |
| `docs/supabase_schema.sql` | Images table schema (for Dataset Manager) |

---

## Database Schema

All experiment data follows a **parent-child** pattern: one `sessions` row per experiment run, with child rows in the appropriate detail table.

### `sessions` (parent)

| Column | Type | Description |
|--------|------|-------------|
| `id` | `BIGINT` PK | `Date.now()` from the browser |
| `type` | `TEXT` | Session type: `individual`, `group`, `pairwise`, `ranked`, `best_worst`, `pressure_cooker`, `fixed`, `layout_group` |
| `username` | `TEXT` | Participant name |
| `timestamp` | `TIMESTAMPTZ` | When the session started |
| `meta` | `JSONB` | Extra info (mode, layoutId, bestStreak, etc.) |
| `created_at` | `TIMESTAMPTZ` | Auto-set on insert |

### `rating_scores` (child of sessions)

Used by: `individual`, `group`, `fixed`, `layout_group` sessions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `BIGSERIAL` PK | Auto-increment |
| `session_id` | `BIGINT` FK | References `sessions(id)` with CASCADE delete |
| `image_id` | `TEXT` | Image identifier within the batch |
| `image_src` | `TEXT` | Full path or URL |
| `filename` | `TEXT` | Original filename |
| `prompt` | `TEXT` | Prompt text shown |
| `category` | `TEXT` | Image category |
| `score` | `REAL` | Rating value |
| `time_spent` | `REAL` | Seconds spent on this image |
| `interaction_count` | `INTEGER` | Number of slider interactions |
| `extra` | `JSONB` | Overflow fields (alt, folderId, etc.) |

### `pairwise_choices` (child of sessions)

Used by: `pairwise`, `pressure_cooker` sessions.

| Column | Type | Description |
|--------|------|-------------|
| `session_id` | `BIGINT` FK | References `sessions(id)` |
| `pair_id` | `INTEGER` | Index of the pair |
| `winner_side` | `TEXT` | `'left'`, `'right'`, or `null` (timeout) |
| `winner_name` | `TEXT` | Filename of the chosen image |
| `loser_name` | `TEXT` | Filename of the rejected image |
| `response_time` | `REAL` | Milliseconds to decide |
| `extra` | `JSONB` | Overflow fields |

### `ranked_results` (child of sessions)

Used by: `ranked` sessions.

| Column | Type | Description |
|--------|------|-------------|
| `session_id` | `BIGINT` FK | References `sessions(id)` |
| `group_id` | `INTEGER` | Which group of images |
| `prompt` | `TEXT` | Prompt text |
| `rank` | `INTEGER` | Position in the ranking |
| `image_id` | `TEXT` | Image identifier |
| `image_src` | `TEXT` | Image URL |
| `filename` | `TEXT` | Filename |
| `folder_id` | `INTEGER` | Folder index |

### `best_worst_trials` (child of sessions)

Used by: `best_worst` sessions.

| Column | Type | Description |
|--------|------|-------------|
| `session_id` | `BIGINT` FK | References `sessions(id)` |
| `trial_id` | `INTEGER` | Trial index |
| `prompt` | `TEXT` | Prompt text |
| `best_id` | `TEXT` | Image chosen as best |
| `best_name` | `TEXT` | Filename of best |
| `worst_id` | `TEXT` | Image chosen as worst |
| `worst_name` | `TEXT` | Filename of worst |
| `response_time` | `REAL` | Seconds to decide |

### `transcripts`

Standalone table for voice recording transcripts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `BIGINT` PK | `Date.now()` from the browser |
| `text` | `TEXT` | Transcribed text |
| `duration` | `REAL` | Audio duration |
| `timestamp` | `TEXT` | Formatted locale string |
| `length` | `INTEGER` | Text length |

### `images` (Dataset Manager)

Authenticated image upload records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `UUID` PK | Auto-generated |
| `user_id` | `UUID` FK | References `auth.users(id)` |
| `file_name` | `TEXT` | Original filename |
| `storage_bucket` | `TEXT` | Bucket name (default: `experiment-images`) |
| `storage_path` | `TEXT` | Path within the bucket |
| `prompt` | `TEXT` | Associated prompt text |
| `notes` | `TEXT` | Optional notes |

### Entity Relationship

```
sessions (1) ──► (N) rating_scores
sessions (1) ──► (N) pairwise_choices
sessions (1) ──► (N) ranked_results
sessions (1) ──► (N) best_worst_trials

auth.users (1) ──► (N) images
```

---

## Row Level Security (RLS)

RLS is enabled on every table to control who can read and write data.

### Result Tables (sessions, rating_scores, pairwise_choices, ranked_results, best_worst_trials, transcripts)

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| `anon` (anonymous participants) | -- | Yes | -- | -- |
| `authenticated` (admin) | Yes | Yes | Yes | Yes |

**Why this matters:**
- Experiment participants (unauthenticated) can **submit** their results but **cannot read** anyone else's data.
- Only authenticated admin users can view, export, or delete results.
- This prevents participants from seeing each other's answers or biasing their own responses.

### Images Table

| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| `authenticated` (own rows only) | Yes | Yes | Yes | Yes |

The `images` table uses `auth.uid() = user_id` so each user can only access their own uploaded images.

### Storage Buckets

| Bucket | anon SELECT | service_role INSERT |
|--------|-------------|---------------------|
| `generated-images` | Yes (public read) | Yes |
| `mem-images` | Yes (public read) | Yes |
| `demo-images` | Yes (public read) | Yes |

All three image buckets are publicly readable so images can be displayed without authentication.

---

## Storage Buckets

The app uses three public storage buckets for images:

| Bucket | Contents | Used By |
|--------|----------|---------|
| `generated-images` | LLM-generated images organized by model (e.g., `flux_2_pro/`, `gptimage15/`, `nano_banana_pro/`) | Experiment rating pages, results display |
| `mem-images` | Memorability benchmark images (e.g., `target_000000.jpg`) | `useMemImages.js` hook |
| `demo-images` | Demo images for testing (e.g., `GPTMoonFlags.png`) | PressureCooker, BestWorstRate pages |

### URL Pattern

Public storage URLs follow this pattern:

```
https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
```

Example:
```
https://mknndzyrbrdumbgxleul.supabase.co/storage/v1/object/public/generated-images/flux_2_pro/generated_001.png
```

The `getImageUrl()` utility in `src/utils/supabaseImageUrl.js` generates these URLs and falls back to local paths when Supabase is not configured.

---

## Authentication

The app uses **Supabase Auth with magic links** (passwordless email login). Authentication is only needed for admin operations — participants don't need to log in.

### Who needs auth?

| Action | Auth Required? |
|--------|---------------|
| Completing an experiment (submitting results) | No |
| Viewing images during experiments | No |
| Reading/exporting results | Yes |
| Deleting sessions or transcripts | Yes |
| Uploading images via Dataset Manager | Yes |

### How it works

The Dataset Manager component (`src/Webpages/DatasetManager.jsx`) handles login:

```js
// Sign in with magic link
await supabase.auth.signInWithOtp({ email });
```

The user receives an email with a login link. After clicking it, `supabase.auth.getUser()` returns the authenticated user, and all RLS policies for `authenticated` role apply.

---

## Services API Reference

### `supabaseResults.js` — Database Operations

#### Insert Functions (used by experiment pages)

```js
import { insertSession, insertRatingScores, insertPairwiseChoices,
         insertRankedResults, insertBestWorstTrials, insertTranscript
} from "./services/supabaseResults";

// Create a session (always call this first)
await insertSession({
  id: Date.now(),
  type: "individual",       // session type
  username: "participant1",
  timestamp: new Date().toISOString(),
  meta: { mode: "sequential" }
});

// Insert child rows (pick the right function for the session type)
await insertRatingScores(sessionId, [
  { id: "img1", src: "/images/img1.png", score: 4.5, timeSpent: 3.2 }
]);

await insertPairwiseChoices(sessionId, [
  { pairId: 0, winnerSide: "left", winnerName: "a.png", loserName: "b.png", responseTime: 1200 }
]);

await insertRankedResults(sessionId, [
  { groupId: 0, prompt: "a flag on the moon", rank: 1, imageId: "img1", src: "..." }
]);

await insertBestWorstTrials(sessionId, [
  { trialId: 0, prompt: "a ship", bestId: "img2", bestName: "b.png", worstId: "img3", worstName: "c.png" }
]);

await insertTranscript({ id: Date.now(), text: "...", duration: 5.3 });
```

#### Fetch Functions (used by Results.jsx on mount, require auth)

```js
import { fetchSessionsWithScores, fetchSessionsWithChoices,
         fetchSessionsWithRankings, fetchSessionsWithBestWorst,
         fetchTranscripts } from "./services/supabaseResults";

// These return the same shape the app uses in localStorage
const individualSessions = await fetchSessionsWithScores("individual");
const groupSessions      = await fetchSessionsWithScores("group");
const fixedSessions      = await fetchSessionsWithScores("fixed");
const pairwiseSessions   = await fetchSessionsWithChoices("pairwise");
const pressureSessions   = await fetchSessionsWithChoices("pressure_cooker");
const rankedSessions     = await fetchSessionsWithRankings();
const bestWorstSessions  = await fetchSessionsWithBestWorst();
const transcripts        = await fetchTranscripts();
```

#### Delete Functions (require auth)

```js
import { deleteSession, deleteSessionsByType, deleteTranscript,
         deleteAllTranscripts } from "./services/supabaseResults";

await deleteSession(sessionId);           // deletes session + cascades to children
await deleteSessionsByType("individual"); // deletes all sessions of a type
await deleteTranscript(transcriptId);
await deleteAllTranscripts();
```

### `supabaseStorage.js` — Image Storage

```js
import { uploadImageToSupabase, createImageRecord,
         listImages, getSignedImageUrl } from "./services/supabaseStorage";

// Upload a file (requires auth)
const { path } = await uploadImageToSupabase(file, userId, "generated-images");

// Create a database record linking to the upload
const record = await createImageRecord({
  storagePath: path,
  fileName: file.name,
  prompt: "a flag on the moon",
  notes: "generated with Flux",
  bucket: "generated-images"
});

// List all image records for the current user
const images = await listImages();

// Get a temporary signed URL (for private buckets)
const url = await getSignedImageUrl({
  bucket: "generated-images",
  path: "userId/123_image.png",
  expiresIn: 3600  // seconds
});
```

### `supabaseImageUrl.js` — Public URL Helper

```js
import { getImageUrl } from "./utils/supabaseImageUrl";

// Returns a full Supabase public URL, or a local fallback if unconfigured
const url = getImageUrl("generated-images", "flux_2_pro/generated_001.png");
// → "https://<project>.supabase.co/storage/v1/object/public/generated-images/flux_2_pro/generated_001.png"

// With explicit local fallback
const url = getImageUrl("demo-images", "GPTFlag.png", "/src/images/GPTFlag.png");
```

---

## Data Flow

### When a Participant Completes an Experiment

```
1. User finishes rating/ranking/comparing images
2. Component calls insertSession() + insertRatingScores() (or equivalent)
3. Data is inserted into Supabase via anon key (no auth needed)
4. Simultaneously, data is saved to localStorage (write-through cache)
5. Supabase errors are logged but don't break the app
```

### When the App Loads (Admin View)

```
1. Results.jsx mounts
2. Hydrate function fires, calling all fetchSessionsWith*() functions in parallel
3. Supabase returns data (requires authenticated session)
4. If Supabase returns data, it overwrites localStorage state
5. If Supabase is unavailable, localStorage state is used as-is
6. All state changes are written back to localStorage (sync)
```

### Graceful Degradation

Every function in `supabaseResults.js` checks `isConfigured()` first:

```js
const isConfigured = () => !!supabase;

export async function insertSession(...) {
  if (!isConfigured()) return null;  // no-op if Supabase is missing
  // ...
}
```

This means the app works fully offline with just `localStorage`. Supabase is an **enhancement layer**, not a hard dependency.

---

## How to Extend

### Adding a New Experiment Type

1. **Decide which child table fits** your data shape:
   - Likert/slider ratings → `rating_scores`
   - A vs B comparisons → `pairwise_choices`
   - Ordered rankings → `ranked_results`
   - Best + worst selection → `best_worst_trials`
   - Something else → create a new child table (see step 2)

2. **If you need a new child table**, add it to `scripts/supabase-schema.sql`:

   ```sql
   CREATE TABLE IF NOT EXISTS my_new_results (
     id            BIGSERIAL PRIMARY KEY,
     session_id    BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
     -- your columns here
     extra         JSONB DEFAULT '{}'::jsonb,
     created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
   );

   CREATE INDEX IF NOT EXISTS idx_my_new_results_session ON my_new_results(session_id);

   ALTER TABLE my_new_results ENABLE ROW LEVEL SECURITY;

   -- Anon: INSERT only
   CREATE POLICY "anon_insert_my_new_results" ON my_new_results
     FOR INSERT TO anon WITH CHECK (true);

   -- Auth: full access
   CREATE POLICY "auth_select_my_new_results" ON my_new_results
     FOR SELECT TO authenticated USING (true);
   CREATE POLICY "auth_delete_my_new_results" ON my_new_results
     FOR DELETE TO authenticated USING (true);
   ```

3. **Add service functions** in `supabaseResults.js`:

   ```js
   export async function insertMyNewResults(sessionId, rows) {
     if (!isConfigured() || !rows?.length) return;
     const mapped = rows.map(r => ({
       session_id: sessionId,
       // map your fields from camelCase → snake_case
     }));
     const { error } = await supabase.from("my_new_results").insert(mapped);
     if (error) console.error("insertMyNewResults error:", error.message);
   }

   export async function fetchMyNewResults(sessionId) {
     if (!isConfigured()) return [];
     const { data, error } = await supabase
       .from("my_new_results")
       .select("*")
       .eq("session_id", sessionId)
       .order("id", { ascending: true });
     if (error) { console.error(error.message); return []; }
     return data || [];
   }
   ```

4. **Add a composite fetcher** that joins sessions with your new table.

5. **Register the new type** in `Results.jsx` hydration and localStorage sync.

### Adding a New Storage Bucket

1. Add the bucket in `scripts/supabase-schema.sql`:

   ```sql
   INSERT INTO storage.buckets (id, name, public)
     VALUES ('my-bucket', 'my-bucket', true)
     ON CONFLICT (id) DO NOTHING;

   CREATE POLICY "Public read my-bucket" ON storage.objects
     FOR SELECT TO anon USING (bucket_id = 'my-bucket');
   ```

2. Use `getImageUrl("my-bucket", "path/to/file.png")` to generate URLs.

3. Add a local fallback mapping in `supabaseImageUrl.js` if needed:

   ```js
   if (bucket === "my-bucket") return `/my_local_images/${path}`;
   ```

### Adding Authenticated Operations

For any new operation that should only be available to logged-in admins:

1. Create an RLS policy with `TO authenticated`.
2. Use `supabase.auth.getUser()` to check auth status before calling.
3. Handle the case where the user is not authenticated.

---

## SQL Files Reference

| File | When to Run | Purpose |
|------|-------------|---------|
| `scripts/supabase-schema.sql` | Initial setup | Creates everything: buckets, tables, indexes, RLS policies |
| `scripts/migrate-rls-policies.sql` | One-time migration | Tightens anon from full access to INSERT-only (already applied) |
| `docs/supabase_schema.sql` | If using Dataset Manager | Creates the `images` table with per-user RLS |

Run these in the Supabase Dashboard under **SQL Editor**.
