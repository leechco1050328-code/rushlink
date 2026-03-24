create table if not exists public.feedback_requests (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  user_email text not null default '',
  category text not null default '',
  title text not null default '',
  detail text not null default '',
  contact text not null default '',
  status text not null default 'new',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.feedback_requests
  add column if not exists user_id uuid references auth.users (id) on delete set null,
  add column if not exists user_email text not null default '',
  add column if not exists category text not null default '',
  add column if not exists title text not null default '',
  add column if not exists detail text not null default '',
  add column if not exists contact text not null default '',
  add column if not exists status text not null default 'new',
  add column if not exists created_at timestamptz not null default timezone('utc', now());

alter table public.feedback_requests enable row level security;

drop policy if exists "feedback_requests_insert_public" on public.feedback_requests;
drop policy if exists "feedback_requests_select_own" on public.feedback_requests;

create policy "feedback_requests_insert_public"
on public.feedback_requests
for insert
to anon, authenticated
with check (user_id is null or auth.uid() = user_id);

create policy "feedback_requests_select_own"
on public.feedback_requests
for select
to authenticated
using (auth.uid() = user_id);
