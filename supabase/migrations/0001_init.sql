-- Smart Resume schema. Every row belongs to one user; RLS keeps it that way.

create table public.profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  role_pack_id text,
  base_resume  text,
  updated_at   timestamptz not null default now()
);

create table public.skill_answers (
  user_id  uuid not null references auth.users (id) on delete cascade,
  skill_id text not null,
  answer   text not null check (answer in ('yes', 'some', 'no')),
  primary key (user_id, skill_id)
);

create table public.tailorings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  company      text,
  role_title   text,
  jd_text      text not null,
  result_md    text not null,
  changes      jsonb not null default '[]',
  ai_score     int,
  strengths    jsonb not null default '[]',
  weaknesses   jsonb not null default '[]',
  coverage_pct int not null,
  matched      jsonb not null default '[]',
  gaps         jsonb not null default '[]',
  flagged      jsonb not null default '[]',
  created_at   timestamptz not null default now()
);

create index tailorings_user_created_idx on public.tailorings (user_id, created_at desc);

alter table public.profiles      enable row level security;
alter table public.skill_answers enable row level security;
alter table public.tailorings    enable row level security;

create policy "own profile" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own skill answers" on public.skill_answers
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own tailorings" on public.tailorings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
