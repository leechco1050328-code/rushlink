create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  main_character text not null default '',
  sub_character text not null default '',
  main_character_rank text not null default '',
  main_character_mr text not null default '',
  sub_character_rank text not null default '',
  sub_character_mr text not null default '',
  platform text not null default '',
  voice_preference text not null default '',
  x_account text not null default '',
  discord_account text not null default '',
  bio text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists main_character_rank text not null default '',
  add column if not exists main_character_mr text not null default '',
  add column if not exists sub_character_rank text not null default '',
  add column if not exists sub_character_mr text not null default '',
  add column if not exists x_account text not null default '',
  add column if not exists discord_account text not null default '';

alter table public.profiles
  drop column if exists skill_level,
  drop column if exists region;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
