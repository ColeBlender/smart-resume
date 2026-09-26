// Deterministic scoring. No AI here: every number the user sees next to
// Claude's score comes from these functions, so it is reproducible and testable.
import type { RolePack, Skill } from "./role-packs";

export type Answer = "yes" | "some" | "no";
export type Answers = Record<string, Answer>;

const CREDIT: Record<Answer, number> = { yes: 1, some: 0.5, no: 0 };

/** Weighted coverage (0-100) of `skills` given the user's answers. Unanswered = 0. */
export function weightedCoverage(skills: Skill[], answers: Answers): number {
  const total = skills.reduce((sum, s) => sum + s.weight, 0);
  if (total === 0) return 0;
  const earned = skills.reduce((sum, s) => sum + s.weight * CREDIT[answers[s.id] ?? "no"], 0);
  return Math.round((earned / total) * 100);
}

function escapeRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Does `term` appear in `text` as a whole token? Boundaries are "not a letter or
 * digit" rather than \b, so terms like "C++", "Node.js" and "CI/CD" work.
 * Terms of 3 chars or fewer match case-sensitively, so "Go" doesn't hit "go live"
 * and "RAG" doesn't hit "rag".
 */
export function mentions(text: string, term: string): boolean {
  const flags = term.length <= 3 ? "" : "i";
  return new RegExp(`(?<![A-Za-z0-9])${escapeRegex(term)}(?![A-Za-z0-9])`, flags).test(text);
}

export function mentionsSkill(text: string, skill: Skill): boolean {
  return [skill.name, ...skill.aliases].some((term) => mentions(text, term));
}

/** Pack skills the job description asks for, heaviest first. */
export function extractJdSkills(jd: string, pack: RolePack): Skill[] {
  return pack.skills.filter((s) => mentionsSkill(jd, s)).sort((a, b) => b.weight - a.weight);
}

/** Skills the resume is allowed to claim: anything the user said yes or some to. */
export function allowedSkillIds(answers: Answers): Set<string> {
  return new Set(Object.entries(answers).filter(([, a]) => a !== "no").map(([id]) => id));
}

export type JdMatch = {
  coveragePct: number;
  matched: Skill[];
  /** JD skills the user answered no (or never answered), heaviest first. */
  gaps: Skill[];
};

export function matchJd(jd: string, pack: RolePack, answers: Answers): JdMatch {
  const jdSkills = extractJdSkills(jd, pack);
  const allowed = allowedSkillIds(answers);
  return {
    coveragePct: weightedCoverage(jdSkills, answers),
    matched: jdSkills.filter((s) => allowed.has(s.id)),
    gaps: jdSkills.filter((s) => !allowed.has(s.id)),
  };
}

/**
 * The honesty guard. A skill is flagged when the tailored resume claims it,
 * the user didn't confirm it, and it wasn't already in their own base resume.
 */
export function findUnbackedClaims(
  tailored: string,
  baseResume: string,
  pack: RolePack,
  answers: Answers,
): Skill[] {
  const allowed = allowedSkillIds(answers);
  return pack.skills.filter(
    (s) => !allowed.has(s.id) && mentionsSkill(tailored, s) && !mentionsSkill(baseResume, s),
  );
}
