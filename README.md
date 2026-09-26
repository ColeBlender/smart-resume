# Smart Resume

Tailor a software engineer's resume to any job description **without ever inventing a skill.**

You confirm what you actually know once (yes / some / no against the skills real postings ask for). Every tailored resume is fenced to that list plus your own base resume, and a deterministic honesty guard catches anything Claude tries to sneak in.

## How it works

1. **Sign in with Google** (Supabase Auth).
2. **Onboarding, 4 short steps:** upload or paste your current resume (PDFs are read by Claude) → pick a role → rate your skills 1-5 (Claude pre-rates them from your resume and quotes the evidence; you adjust) → one line each on strengths your resume doesn't show.
3. **Home is one box:** paste a job description, press Enter. Claude extracts every skill it asks for. If it mentions something your profile has never seen, a short modal asks you to rate it (and, at 3+, say what you did with it). Answers are saved, so the profile keeps learning and never asks twice.
4. **Result:** Claude rewrites your resume for that job, fenced to skills rated 3+ and your own notes. A deterministic honesty guard checks it (and forces one rewrite if it claims anything unconfirmed), then a second Claude pass scores it like the company's screener. A toast links you to the result.

**UI preview:** `pnpm dev`, then open [localhost:3000/preview](http://localhost:3000/preview). Every screen and state, with fake data, no login or API calls.

### The parts worth reading

| Where | What |
|---|---|
| `src/lib/scoring.ts` | Deterministic logic: rating-weighted coverage, skill-name resolution across role packs, JD skill matching (token-boundary matching that handles `C++`, `CI/CD`, `Go`), and the honesty guard. Unit tested in `scoring.test.ts`. |
| `src/lib/claude.ts` | Every Claude call (PDF transcription, skill pre-rating, job analysis, Builder, Screener), all with structured outputs. |
| `src/app/dashboard/actions.ts` | The pipeline: analyze → ask about unknown skills → build → guard → rebuild if needed → screen → save. |
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

Apply the schema by running the files in `supabase/migrations/` in order (or `supabase db push`).

In Supabase → Authentication → URL Configuration, add `http://localhost:3000/**` as a redirect URL.

## Stack

Next.js 16 (App Router, server actions) · TypeScript · Tailwind v4 · Supabase (Postgres, Auth, RLS) · Claude API (`claude-opus-5`, structured outputs) · Vercel · Vitest
