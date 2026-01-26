# Supabase Setup (Authenticated, Frontend-Only)

This app uses Supabase Auth + Storage + Postgres.
Fill in `.env` after creating a Supabase project.

## 1) Create project
- Create a new Supabase project.
- Copy the Project URL and anon public key.

## 2) Add env vars
Create `.env` in project root:

```
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## 3) Create storage bucket
- Bucket name: `experiment-images`
- Visibility: Private

## 4) Create database table
Run `docs/supabase_schema.sql` in the Supabase SQL editor.

## 5) Storage policies (authenticated only)
Create policies for the `experiment-images` bucket:
- Allow authenticated users to upload and read their own files.
- Use the SQL template in the Supabase dashboard or set via UI:
  - INSERT: `auth.uid() = owner` (owner is auto-set by Supabase)
  - SELECT: `auth.uid() = owner`

## 6) Auth settings
Enable Email auth (magic link).

## 7) Usage
- Open `Dataset Manager` in the app.
- Sign in with email.
- Upload an image with prompt text.
  - A row is created in `images`.
  - The file is stored in `experiment-images`.
