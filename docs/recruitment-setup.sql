create table if not exists public.recruitment_posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default '',
  title text not null default '',
  character_name text not null default '',
  self_rank text not null default '',
  self_mr text not null default '',
  opponent_character_name text not null default '',
  opponent_rank text not null default '',
  opponent_mr text not null default '',
  voice_option text not null default '',
  platform text not null default '',
  availability_start text not null default '何時でも可',
  availability_end text not null default '',
  body text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.recruitment_posts
  add column if not exists author_name text not null default '',
  add column if not exists title text not null default '',
  add column if not exists character_name text not null default '',
  add column if not exists self_rank text not null default '',
  add column if not exists self_mr text not null default '',
  add column if not exists opponent_character_name text not null default '',
  add column if not exists opponent_rank text not null default '',
  add column if not exists opponent_mr text not null default '',
  add column if not exists voice_option text not null default '',
  add column if not exists platform text not null default '',
  add column if not exists availability_start text not null default '何時でも可',
  add column if not exists availability_end text not null default '',
  add column if not exists body text not null default '',
  add column if not exists status text not null default 'open',
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.recruitment_posts
  drop column if exists availability_text;

alter table public.recruitment_posts enable row level security;

drop policy if exists "recruitment_posts_select_public_or_own" on public.recruitment_posts;
drop policy if exists "recruitment_posts_insert_own" on public.recruitment_posts;
drop policy if exists "recruitment_posts_update_own" on public.recruitment_posts;
drop policy if exists "recruitment_posts_delete_own" on public.recruitment_posts;

create policy "recruitment_posts_select_public_or_own"
on public.recruitment_posts
for select
to anon, authenticated
using (status = 'open' or auth.uid() = user_id);

create policy "recruitment_posts_insert_own"
on public.recruitment_posts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "recruitment_posts_update_own"
on public.recruitment_posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "recruitment_posts_delete_own"
on public.recruitment_posts
for delete
to authenticated
using (auth.uid() = user_id);
