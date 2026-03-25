create table if not exists public.community_post_applications (
  id bigint generated always as identity primary key,
  post_source text not null,
  post_id bigint not null,
  post_owner_id uuid not null references auth.users (id) on delete cascade,
  post_title text not null default '',
  post_kind text not null default '',
  post_character_name text not null default '',
  applicant_user_id uuid not null references auth.users (id) on delete cascade,
  applicant_name text not null default '',
  application_type text not null default '',
  message text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  read_at timestamptz
);

alter table public.community_post_applications
  add column if not exists post_source text not null default 'recruitment_posts',
  add column if not exists post_id bigint not null default 0,
  add column if not exists post_owner_id uuid references auth.users (id) on delete cascade,
  add column if not exists post_title text not null default '',
  add column if not exists post_kind text not null default '',
  add column if not exists post_character_name text not null default '',
  add column if not exists applicant_user_id uuid references auth.users (id) on delete cascade,
  add column if not exists applicant_name text not null default '',
  add column if not exists application_type text not null default '',
  add column if not exists message text not null default '',
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists read_at timestamptz;

update public.community_post_applications
set post_source = 'recruitment_posts'
where post_source not in ('recruitment_posts', 'coaching_posts');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'community_post_applications_post_source_check'
  ) then
    alter table public.community_post_applications
      add constraint community_post_applications_post_source_check
      check (post_source in ('recruitment_posts', 'coaching_posts'));
  end if;
end $$;

create unique index if not exists community_post_applications_unique_applicant
on public.community_post_applications (post_source, post_id, applicant_user_id);

create index if not exists community_post_applications_owner_idx
on public.community_post_applications (post_owner_id, created_at desc);

create index if not exists community_post_applications_unread_idx
on public.community_post_applications (post_owner_id, read_at);

alter table public.community_post_applications enable row level security;

drop policy if exists "community_post_applications_select_owner_or_applicant" on public.community_post_applications;
drop policy if exists "community_post_applications_insert_applicant" on public.community_post_applications;
drop policy if exists "community_post_applications_update_owner" on public.community_post_applications;

create policy "community_post_applications_select_owner_or_applicant"
on public.community_post_applications
for select
to authenticated
using (auth.uid() = post_owner_id or auth.uid() = applicant_user_id);

create policy "community_post_applications_insert_applicant"
on public.community_post_applications
for insert
to authenticated
with check (auth.uid() = applicant_user_id and auth.uid() <> post_owner_id);

create policy "community_post_applications_update_owner"
on public.community_post_applications
for update
to authenticated
using (auth.uid() = post_owner_id)
with check (auth.uid() = post_owner_id);
