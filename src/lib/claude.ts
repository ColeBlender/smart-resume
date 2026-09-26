import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Skill } from "./role-packs";

const client = new Anthropic();
const MODEL = "claude-opus-5";

// Opus 5's safety classifiers can decline a request; "default" re-runs a
// decline on Anthropic's recommended fallback model inside the same call.
const FALLBACK: Pick<Anthropic.Beta.MessageCreateParams, "betas" | "fallbacks"> = {
  betas: ["server-side-fallback-2026-07-01"],
  fallbacks: "default",
};

const BuilderOutput = z.object({
  resume_md: z.string().describe("The full tailored resume in Markdown."),
  changes: z.array(z.string()).describe("3-6 short notes on what was changed and why."),
});

const ScreenerOutput = z.object({
  score: z.number().describe("Integer from 0 to 100."),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
});

export type BuilderResult = z.infer<typeof BuilderOutput>;
export type ScreenerResult = z.infer<typeof ScreenerOutput>;

const BUILDER_SYSTEM = `You tailor a software engineer's resume to one job description.

Hard rules, in priority order:
1. The fact source is closed. Every claim must trace to the candidate's base resume or to their confirmed skills list. Never invent employers, projects, dates, degrees, titles, or numbers. Keep every figure at its original magnitude.
2. Never claim a technology the candidate did not confirm or already list. If the job wants something they lack, leave it out. Do not write "familiar with", "exposure to", or any hedge to sneak it in, and never mention gaps.
3. Keep work-history entries in their original order. Reword, reorder bullets within an entry, and cut weak bullets instead.
4. Lead with the 3-5 job must-haves the candidate honestly has. Mirror the job's own terminology where it is truthful. No keyword stuffing.
5. Bullets describe outcomes, not duties. Plain, specific language. No em-dashes.

Return the full resume as clean Markdown: name as an H1, a one-line headline, a short summary, Skills, Experience, then any remaining sections from the base resume.`;

const SCREENER_SYSTEM = `You are the automated resume screener for the company that posted this job. You are not on the candidate's side.

Score the resume 0-100 for this job the way a modern ATS plus a recruiter's 30-second skim would:
- Keyword and semantic match to the job's must-haves (35%)
- Title and seniority alignment (15%)
- Experience fit: years, recency on the primary stack, scale signals (25%)
- Credibility: outcomes over duties, coherent trajectory, no keyword stuffing (25%)

Be honest and unsentimental: a resume missing a core requirement cannot score high. Give 2-4 specific strengths and 2-4 specific weaknesses.`;

function assertUsable(stopReason: string | null) {
  if (stopReason === "refusal") throw new Error("Claude declined this request. Try editing the job description.");
  if (stopReason === "max_tokens") throw new Error("The response was cut off. Try a shorter resume or job description.");
}

export async function buildResume(input: {
  baseResume: string;
  jd: string;
  confirmedSkills: Skill[];
  mustRemove?: Skill[];
}): Promise<BuilderResult> {
  const confirmed = input.confirmedSkills.map((s) => s.name).join(", ") || "(none confirmed)";
  const removal = input.mustRemove?.length
    ? `\n\nA previous draft claimed skills the candidate never confirmed. Remove every mention of: ${input.mustRemove.map((s) => s.name).join(", ")}.`
    : "";

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    ...FALLBACK,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium", format: betaZodOutputFormat(BuilderOutput) },
    system: BUILDER_SYSTEM,
    messages: [
      {
        role: "user",
        content: `<base_resume>\n${input.baseResume}\n</base_resume>\n\n<confirmed_skills>\n${confirmed}\n</confirmed_skills>\n\n<job_description>\n${input.jd}\n</job_description>${removal}`,
      },
    ],
  });
  assertUsable(response.stop_reason);
  if (!response.parsed_output) throw new Error("Claude returned an unreadable resume. Please try again.");
  return response.parsed_output;
}

export async function screenResume(input: { resume: string; jd: string }): Promise<ScreenerResult> {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    ...FALLBACK,
    thinking: { type: "adaptive" },
    output_config: { effort: "low", format: betaZodOutputFormat(ScreenerOutput) },
    system: SCREENER_SYSTEM,
    messages: [
      {
        role: "user",
        content: `<job_description>\n${input.jd}\n</job_description>\n\n<resume>\n${input.resume}\n</resume>`,
      },
    ],
  });
  assertUsable(response.stop_reason);
  const out = response.parsed_output;
  if (!out) throw new Error("The screener returned an unreadable score. Please try again.");
  return { ...out, score: Math.max(0, Math.min(100, Math.round(out.score))) };
}
