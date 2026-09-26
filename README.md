# Smart Resume

Tailor a software engineer's resume to any job description **without ever inventing a skill.**

You confirm what you actually know once (yes / some / no against the skills real postings ask for). Every tailored resume is fenced to that list plus your own base resume, and a deterministic honesty guard catches anything Claude tries to sneak in.

## How it works

1. **Sign in with Google** (Supabase Auth).
2. **Onboard:** pick a role pack (Full-stack, Frontend, Backend, AI Engineer, Mobile, DevOps), answer each skill, paste your resume.
3. **Tailor:** paste a job description. A live panel shows which of the pack's skills the job wants, your weighted coverage, and your gaps as you type.
4. **Result:** Claude rewrites the resume for that job, the honesty guard checks it (and forces one rewrite if it claims an unconfirmed skill), then a second Claude pass scores it like the company's resume screener. Everything is saved to your history.

### The parts worth reading

| Where | What |
|---|---|
| `src/lib/scoring.ts` | Deterministic logic: weighted coverage, JD skill extraction (token-boundary matching that handles `C++`, `CI/CD`, `Go`), and the honesty guard. Unit tested in `scoring.test.ts`. |
| `src/lib/claude.ts` | The two Claude calls (Builder + Screener) with structured outputs. |
| `src/app/tailor/new/actions.ts` | The pipeline: match → build → guard → rebuild if needed → screen → save. |
| `data/role-packs/*.json` | Six role packs. Skills and weights come from 19-34 real job postings per role (weight = how often postings list the skill). Sources are in each file. |
| `supabase/migrations/0001_init.sql` | Schema. Row-level security on every table: users only ever see their own rows. |

## Run locally

Requirements: Node 20+, pnpm, a Supabase project with Google auth enabled, an Anthropic API key.

```bash
pnpm install
cp .env.example .env.local   # fill in the three values
pnpm dev                     # http://localhost:3000
pnpm test                    # scoring unit tests
```

Apply the schema by running `supabase/migrations/0001_init.sql` in the Supabase SQL editor (or `supabase db push`).

In Supabase → Authentication → URL Configuration, add `http://localhost:3000/**` as a redirect URL.

## Stack

Next.js 16 (App Router, server actions) · TypeScript · Tailwind v4 · Supabase (Postgres, Auth, RLS) · Claude API (`claude-opus-5`, structured outputs) · Vercel · Vitest
