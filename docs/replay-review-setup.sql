create table if not exists public.replay_review_posts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default '',
  title text not null default '',
  character_name text not null default '',
  current_rank text not null default '',
  current_mr text not null default '',
  replay_id text not null default '',
  body text not null default '',
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.replay_review_posts
  add column if not exists author_name text not null default '',
  add column if not exists title text not null default '',
  add column if not exists character_name text not null default '',
  add column if not exists current_rank text not null default '',
  add column if not exists current_mr text not null default '',
  add column if not exists replay_id text not null default '',
  add column if not exists body text not null default '',
  add column if not exists status text not null default 'open',
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'replay_review_posts'
      and column_name = 'replay_url'
  ) then
    execute $sql$
      update public.replay_review_posts
      set replay_id = replay_url
      where coalesce(replay_id, '') = ''
        and coalesce(replay_url, '') <> ''
    $sql$;

    execute 'alter table public.replay_review_posts drop column if exists replay_url';
  end if;
end $$;

alter table public.replay_review_posts enable row level security;

drop policy if exists "replay_review_posts_select_public_or_own" on public.replay_review_posts;
drop policy if exists "replay_review_posts_insert_own" on public.replay_review_posts;
drop policy if exists "replay_review_posts_update_own" on public.replay_review_posts;
drop policy if exists "replay_review_posts_delete_own" on public.replay_review_posts;

create policy "replay_review_posts_select_public_or_own"
on public.replay_review_posts
for select
to anon, authenticated
using (status = 'open' or auth.uid() = user_id);

create policy "replay_review_posts_insert_own"
on public.replay_review_posts
for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    select count(*)
    from public.replay_review_posts posts
    where posts.user_id = auth.uid()
      and posts.created_at >= timezone('utc', date_trunc('day', now()))
      and posts.created_at < timezone('utc', date_trunc('day', now()) + interval '1 day')
  ) < 3
);

create policy "replay_review_posts_update_own"
on public.replay_review_posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "replay_review_posts_delete_own"
on public.replay_review_posts
for delete
to authenticated
using (auth.uid() = user_id);

create table if not exists public.replay_review_comments (
  id bigint generated always as identity primary key,
  post_id bigint not null references public.replay_review_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default '',
  body text not null default '',
  reply_to_no bigint,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.replay_review_comments
  add column if not exists author_name text not null default '',
  add column if not exists body text not null default '',
  add column if not exists reply_to_no bigint,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.replay_review_comments enable row level security;

drop policy if exists "replay_review_comments_select_visible_posts" on public.replay_review_comments;
drop policy if exists "replay_review_comments_insert_open_posts" on public.replay_review_comments;
drop policy if exists "replay_review_comments_update_own" on public.replay_review_comments;
drop policy if exists "replay_review_comments_delete_own" on public.replay_review_comments;

create policy "replay_review_comments_select_visible_posts"
on public.replay_review_comments
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.replay_review_posts posts
    where posts.id = post_id
      and (posts.status = 'open' or auth.uid() = posts.user_id)
  )
  or auth.uid() = user_id
);

create policy "replay_review_comments_insert_open_posts"
on public.replay_review_comments
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.replay_review_posts posts
    where posts.id = post_id
      and posts.status = 'open'
  )
);

create policy "replay_review_comments_update_own"
on public.replay_review_comments
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "replay_review_comments_delete_own"
on public.replay_review_comments
for delete
to authenticated
using (auth.uid() = user_id);
