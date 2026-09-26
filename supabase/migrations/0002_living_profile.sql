-- Living skills profile: one row per skill the user has told us about, from
-- onboarding or from any job description that asked about something new.
-- Replaces the yes/some/no answers.

drop table public.skill_answers;

alter table public.profiles add column onboarded_at timestamptz;

create table public.user_skills (
  user_id    uuid not null references auth.users (id) on delete cascade,
  skill_key  text not null,
  name       text not null,
  rating     int  not null check (rating between 1 and 5),
  note       text,
  source     text not null default 'onboarding' check (source in ('onboarding', 'job')),
  updated_at timestamptz not null default now(),
  primary key (user_id, skill_key)
);

alter table public.user_skills enable row level security;

create policy "own skills" on public.user_skills
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- JD skills that aren't in a role pack are stored with the tailoring so the
-- result page can name them.
alter table public.tailorings add column skill_names jsonb not null default '{}';
