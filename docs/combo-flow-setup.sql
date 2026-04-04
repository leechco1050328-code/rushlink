create table if not exists public.combo_flow_posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default '',
  character_name text not null default '',
  control_scheme text not null default 'classic',
  title text not null default '',
  summary text not null default '',
  flow_nodes jsonb not null default '[]'::jsonb,
  flow_edges jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.combo_flow_posts
  add column if not exists author_name text not null default '',
  add column if not exists character_name text not null default '',
  add column if not exists control_scheme text not null default 'classic',
  add column if not exists title text not null default '',
  add column if not exists summary text not null default '',
  add column if not exists flow_nodes jsonb not null default '[]'::jsonb,
  add column if not exists flow_edges jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.combo_flow_posts enable row level security;

drop policy if exists "combo_flow_posts_select_public" on public.combo_flow_posts;
drop policy if exists "combo_flow_posts_insert_own" on public.combo_flow_posts;
drop policy if exists "combo_flow_posts_update_own" on public.combo_flow_posts;
drop policy if exists "combo_flow_posts_delete_own" on public.combo_flow_posts;

create policy "combo_flow_posts_select_public"
on public.combo_flow_posts
for select
to anon, authenticated
using (true);

create policy "combo_flow_posts_insert_own"
on public.combo_flow_posts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "combo_flow_posts_update_own"
on public.combo_flow_posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "combo_flow_posts_delete_own"
on public.combo_flow_posts
for delete
to authenticated
using (auth.uid() = user_id);
