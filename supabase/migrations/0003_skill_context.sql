-- Skills live in context: which job on your resume you used each one at.
-- profiles.roles: the work-history entries parsed from the base resume.
-- user_skills.used_at: labels of the roles (or "Side project") where the skill was used.

alter table public.profiles add column roles jsonb not null default '[]';
alter table public.user_skills add column used_at jsonb not null default '[]';
