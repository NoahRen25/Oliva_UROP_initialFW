-- Images table for experiment assets
create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  storage_bucket text not null default 'experiment-images',
  storage_path text not null,
  prompt text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.images enable row level security;

create policy "images_select_own"
  on public.images
  for select
  using (auth.uid() = user_id);

create policy "images_insert_own"
  on public.images
  for insert
  with check (auth.uid() = user_id);

create policy "images_update_own"
  on public.images
  for update
  using (auth.uid() = user_id);

create policy "images_delete_own"
  on public.images
  for delete
  using (auth.uid() = user_id);
