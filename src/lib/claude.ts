import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

const client = new Anthropic();
const MODEL = "claude-opus-5";

// Opus 5's safety classifiers can decline a request; "default" re-runs a
// decline on Anthropic's recommended fallback model inside the same call.
const FALLBACK: Pick<Anthropic.Beta.MessageCreateParams, "betas" | "fallbacks"> = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
};

type Effort = "low" | "medium" | "high";

/** One structured-output call. Throws a user-readable error on refusal, truncation or bad output. */
async function ask<T extends z.ZodType>(opts: {
  schema: T;
  system: string;
  content: Anthropic.Beta.BetaContentBlockParam[] | string;
  effort: Effort;
}): Promise<z.infer<T>> {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    ...FALLBACK,
    thinking: { type: "adaptive" },
    output_config: { effort: opts.effort, format: betaZodOutputFormat(opts.schema) },
    system: opts.system,
    messages: [{ role: "user", content: opts.content }],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined this request. Try editing your input.");
  if (response.stop_reason === "max_tokens") throw new Error("The response was cut off. Try a shorter input.");
  if (!response.parsed_output) throw new Error("Claude returned something unreadable. Please try again.");
  return response.parsed_output as z.infer<T>;
}

/** Turn an uploaded PDF resume into clean Markdown text. */
export async function resumeFromPdf(base64: string): Promise<string> {
  const out = await ask({
    schema: z.object({ resume_md: z.string() }),
    effort: "low",
    system:
      "Transcribe this resume into clean Markdown. Keep every fact, date, number and wording exactly as written. Name as an H1, section titles as H2, roles as H3, bullets as lists. Do not add, remove or rephrase anything.",
    content: [
      { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
      { type: "text", text: "Transcribe this resume." },
    ],
  });
  return out.resume_md;
}

const RoleSchema = z.object({
  company: z.string(),
  title: z.string(),
  dates: z.string().nullable(),
});

/** The work-history entries on a resume, newest first. */
export async function extractRoles(resume: string): Promise<z.infer<typeof RoleSchema>[]> {
  const out = await ask({
    schema: z.object({ roles: z.array(RoleSchema) }),
    effort: "low",
    system: "List every work-history entry on this resume, newest first: company, job title, and dates exactly as written. Include freelance or self-employed entries. Do not include education.",
    content: resume,
  });
  return out.roles;
}

/** Pre-rate role-pack skills from the resume (and list its roles) so onboarding is mostly confirming. */
export async function prefillRatings(
  resume: string,
  skills: { key: string; name: string }[],
): Promise<{
  roles: z.infer<typeof RoleSchema>[];
  ratings: { key: string; rating: number | null; evidence: string | null }[];
}> {
  return ask({
    schema: z.object({
      roles: z.array(RoleSchema).describe("Every work-history entry, newest first. No education."),
      ratings: z.array(
        z.object({
          key: z.string(),
          rating: z.number().nullable().describe("1-5, or null when the resume gives no signal either way"),
          evidence: z.string().nullable().describe("A short exact quote from the resume that supports the rating"),
        }),
      ),
    }),
    effort: "low",
    system: `You estimate how strong a software engineer is at each listed skill, using only their resume.
Scale: 1 never used, 2 tinkered, 3 used at work, 4 strong (years of professional use or ownership), 5 expert.
Only rate a skill when the resume gives real evidence; quote that evidence verbatim. If the resume says nothing about a skill, return rating null and evidence null. Never guess high. Return one entry per listed key.
Also list every work-history entry (company, title, dates exactly as written), newest first.`,
    content: `<resume>\n${resume}\n</resume>\n\n<skills>\n${skills.map((s) => `${s.key}: ${s.name}`).join("\n")}\n</skills>`,
  });
}

export type JobAnalysis = {
  company: string | null;
  role_title: string | null;
  skills: { name: string; required: boolean }[];
};

/** Pull the company, title and every concrete skill a job description asks for. */
export async function analyzeJob(jd: string): Promise<JobAnalysis> {
  return ask({
    schema: z.object({
      company: z.string().nullable(),
      role_title: z.string().nullable(),
      skills: z.array(z.object({ name: z.string(), required: z.boolean() })),
    }),
    effort: "low",
    system: `Extract from a job description: the hiring company, the role title, and every concrete technical skill it asks for (languages, frameworks, databases, cloud and infra tools, practices like CI/CD or system design).
Use the most common short name for each skill ("PostgreSQL", "Kubernetes", "React"). One entry per skill, no duplicates, no soft skills, no years-of-experience lines. required = true when it's listed as a requirement, false when it's a nice-to-have.`,
    content: jd,
  });
}

export type BuilderResult = { resume_md: string; changes: string[] };

/** Rewrite the base resume for one job, fenced to confirmed skills and the user's own notes. */
export async function buildResume(input: {
  baseResume: string;
  jd: string;
  confirmed: { name: string; rating: number; note?: string | null; usedAt?: { role: string; what: string }[] }[];
  mustRemove?: string[];
}): Promise<BuilderResult> {
  const confirmed =
    input.confirmed
      .map(
        (s) =>
          `- ${s.name} (${s.rating}/5)${s.note ? `. Note: "${s.note}"` : ""}${(s.usedAt ?? [])
            .map((u) => `\n    - At ${u.role}${u.what.trim() ? `, in their words: "${u.what.trim()}"` : ""}`)
            .join("")}`,
      )
      .join("\n") ||
    "(none confirmed)";
  const removal = input.mustRemove?.length
    ? `\n\nA previous draft claimed skills the candidate never confirmed. Remove every mention of: ${input.mustRemove.join(", ")}.`
    : "";

  return ask({
    schema: z.object({
      resume_md: z.string().describe("The full tailored resume in Markdown."),
      changes: z.array(z.string()).describe("3-6 short notes on what was changed and why."),
    }),
    effort: "medium",
    system: `You tailor a software engineer's resume to one job description.

Hard rules, in priority order:
1. The fact source is closed. Every claim must trace to the base resume or to the candidate's confirmed skills and their own notes. Never invent employers, projects, dates, degrees, titles, or numbers. Keep every figure at its original magnitude.
2. Never claim a technology that is not in the base resume or the confirmed list. If the job wants something the candidate lacks, leave it out. No "familiar with" or "exposure to" hedges, and never mention gaps.
3. Skills live in context, never as a bare list. When a confirmed skill says where it was used, work it into that experience entry: a bullet or phrase about what they did with it there, grounded in their own words. "Side project" goes in a Projects section. A skill with no place and no note may only appear in the Skills section. Their notes are facts you may reword naturally but never embellish.
4. Keep work-history entries in their original order. Reword, reorder bullets within an entry, and cut weak bullets instead.
5. Lead with the 3-5 job must-haves the candidate honestly has. Mirror the job's terminology where truthful. No keyword stuffing.
6. Bullets describe outcomes, not duties. Plain, specific language. No em-dashes.

Return the full resume as clean Markdown: name as an H1, a one-line headline, a short summary, Skills, Experience, then any remaining sections from the base resume.`,
    content: `<base_resume>\n${input.baseResume}\n</base_resume>\n\n<confirmed_skills>\n${confirmed}\n</confirmed_skills>\n\n<job_description>\n${input.jd}\n</job_description>${removal}`,
  });
}

export type ScreenerResult = { score: number; strengths: string[]; weaknesses: string[] };

/** Score the tailored resume the way the company's resume screener would. */
export async function screenResume(input: { resume: string; jd: string }): Promise<ScreenerResult> {
  const out = await ask({
    schema: z.object({
      score: z.number().describe("Integer from 0 to 100."),
      strengths: z.array(z.string()),
      weaknesses: z.array(z.string()),
    }),
    effort: "low",
    system: `You are the automated resume screener for the company that posted this job. You are not on the candidate's side.

Score the resume 0-100 for this job the way a modern ATS plus a recruiter's 30-second skim would:
- Keyword and semantic match to the job's must-haves (35%)
- Title and seniority alignment (15%)
- Experience fit: years, recency on the primary stack, scale signals (25%)
- Credibility: outcomes over duties, coherent trajectory, no keyword stuffing (25%)

Be honest and unsentimental: a resume missing a core requirement cannot score high. Give 2-4 specific strengths and 2-4 specific weaknesses.`,
    content: `<job_description>\n${input.jd}\n</job_description>\n\n<resume>\n${input.resume}\n</resume>`,
  });
  return { ...out, score: Math.max(0, Math.min(100, Math.round(out.score))) };
}
