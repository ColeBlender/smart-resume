# Smart Resume

Tailor a software engineer's resume to any job description **without ever inventing a skill.**

You rate what you actually know once (1 to 5, against the skills real job postings ask for) and say which jobs you used each skill at. Every tailored resume is fenced to that, plus your own resume, and a deterministic honesty guard catches anything Claude tries to sneak in.

## How it works

1. **Sign in with Google** (Supabase Auth).
2. **Onboarding, 4 short steps:** upload or paste your current resume (PDFs are read by Claude) → pick a role → rate your skills 1-5 (Claude pre-rates them from your resume and quotes the evidence; you adjust) → one line each on strengths your resume doesn't show.
3. **Home is one box:** paste a job description, press Enter. Claude extracts every skill it asks for. If it mentions something your profile has never seen, a short modal asks you to rate it (and, at 3+, say what you did with it). Answers are saved, so the profile keeps learning and never asks twice.
4. **Result:** Claude rewrites your resume for that job, fenced to skills rated 3+ and your own words about where you used them. A deterministic honesty guard checks it and forces one rewrite if it claims anything unconfirmed. You get one big Download PDF button; every resume is also listed under My resumes.

**UI preview:** `pnpm dev`, then open [localhost:3000/preview](http://localhost:3000/preview). Every screen and state, with fake data, no login or API calls.

### The parts worth reading

| Where | What |
|---|---|
| `src/lib/scoring.ts` | Deterministic logic: rating-weighted coverage, skill-name resolution across role packs, JD skill matching (token-boundary matching that handles `C++`, `CI/CD`, `Go`), and the honesty guard. Unit tested in `scoring.test.ts`. |
| `src/lib/claude.ts` | Every Claude call (PDF transcription, skill pre-rating + job history, job analysis, resume builder), all with structured outputs. |
| `src/app/dashboard/actions.ts` | The pipeline: analyze → ask about unknown skills → build → honesty guard → rebuild if needed → save. |
| `data/role-packs/*.json` | Six role packs. Skills and weights come from 19-34 real job postings per role (weight = how often postings list the skill). Sources are in each file. |
| `supabase/migrations/` | Schema. Row-level security on every table: users only ever see their own rows. |
| `src/lib/resume-pdf.tsx` | Markdown resume to PDF, built in the browser and loaded on demand. |
| `src/app/preview/` | The `/preview` gallery: every screen and state with fake data. |

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

Next.js 16 (App Router, server actions) · TypeScript · Tailwind v4 · shadcn/ui · Supabase (Postgres, Auth, RLS) · Claude API (`claude-opus-5`, structured outputs) · react-pdf · Vercel · Vitest
