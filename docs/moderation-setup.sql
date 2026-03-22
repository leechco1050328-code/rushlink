create table if not exists public.user_blocks (
  blocker_user_id uuid not null references auth.users (id) on delete cascade,
  blocked_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (blocker_user_id, blocked_user_id)
);

alter table public.user_blocks enable row level security;

drop policy if exists "user_blocks_select_own" on public.user_blocks;
drop policy if exists "user_blocks_insert_own" on public.user_blocks;
drop policy if exists "user_blocks_delete_own" on public.user_blocks;

create policy "user_blocks_select_own"
on public.user_blocks
for select
to authenticated
using (auth.uid() = blocker_user_id);

create policy "user_blocks_insert_own"
on public.user_blocks
for insert
to authenticated
with check (auth.uid() = blocker_user_id and blocker_user_id <> blocked_user_id);

create policy "user_blocks_delete_own"
on public.user_blocks
for delete
to authenticated
using (auth.uid() = blocker_user_id);

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter_user_id uuid not null references auth.users (id) on delete cascade,
  reporter_name text not null default '',
  target_user_id uuid references auth.users (id) on delete set null,
  target_name text not null default '',
  target_kind text not null default '',
  target_source text not null default '',
  target_id bigint,
  target_title text not null default '',
  reason text not null default '',
  detail text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null
);

alter table public.reports enable row level security;

drop policy if exists "reports_select_own" on public.reports;
drop policy if exists "reports_insert_own" on public.reports;

create policy "reports_select_own"
on public.reports
for select
to authenticated
using (auth.uid() = reporter_user_id);

create policy "reports_insert_own"
on public.reports
for insert
to authenticated
with check (auth.uid() = reporter_user_id);

create table if not exists public.banned_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id) on delete set null
);

alter table public.banned_users enable row level security;

drop policy if exists "banned_users_select_own" on public.banned_users;

create policy "banned_users_select_own"
on public.banned_users
for select
to authenticated
using (auth.uid() = user_id);
