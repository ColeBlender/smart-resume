// Deterministic scoring. No AI here: every number shown next to Claude's score
// comes from these functions, so it is reproducible and unit tested.
import type { Skill } from "./role-packs";

/** 1 never used · 2 tinkered · 3 used at work · 4 strong · 5 expert */
export type Rating = 1 | 2 | 3 | 4 | 5;
export const CLAIMABLE = 3;

export type UserSkill = { key: string; name: string; rating: Rating; note?: string | null };
/** The living profile: everything the user has told us, keyed by skill key. */
export type SkillProfile = Record<string, UserSkill>;

/** A skill a specific job asks for (from a role pack or pulled from the JD by Claude). */
export type JobSkill = { key: string; name: string; weight: number; aliases: string[] };

export const RATING_LABELS: Record<Rating, string> = {
  1: "Never used",
  2: "Tinkered",
  3: "Used at work",
  4: "Strong",
  5: "Expert",
};

const credit = (r: Rating | undefined) => (r ? (r - 1) / 4 : 0);

/** Weighted coverage (0-100) of `skills` given the profile. Unknown skills count as 0. */
export function weightedCoverage(skills: Pick<JobSkill, "key" | "weight">[], profile: SkillProfile): number {
  const total = skills.reduce((sum, s) => sum + s.weight, 0);
  if (total === 0) return 0;
  const earned = skills.reduce((sum, s) => sum + s.weight * credit(profile[s.key]?.rating), 0);
  return Math.round((earned / total) * 100);
}

function escapeRegex(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Does `term` appear in `text` as a whole token? Boundaries are "not a letter or
 * digit" rather than \b, so "C++", "Node.js" and "CI/CD" work. Terms of 3 chars
 * or fewer match case-sensitively, so "Go" doesn't hit "go live".
 */
export function mentions(text: string, term: string): boolean {
  const flags = term.length <= 3 ? "" : "i";
  return new RegExp(`(?<![A-Za-z0-9])${escapeRegex(term)}(?![A-Za-z0-9])`, flags).test(text);
}

export function mentionsSkill(text: string, skill: { name: string; aliases?: string[] }): boolean {
  return [skill.name, ...(skill.aliases ?? [])].some((term) => mentions(text, term));
}

/**
 * Loose key for comparing skill names: "REST API design", "REST APIs" and
 * "rest-api" all become "restapi"; "CI/CD Pipelines" becomes "cicd".
 */
export function normalizeSkill(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b(design|development|developer|engineering|framework|language|programming|pipelines?|services?|platform)\b/g, "")
    .replace(/\bapis\b/g, "api")
    .replace(/[^a-z0-9+#]/g, "")
    .replace(/(?<=[a-z]{3})s$/, "");
}

/**
 * Map a free-text skill name (e.g. from Claude's JD extraction) onto a stable key:
 * a role-pack skill if any pack names it, else a skill the user already told us
 * about, else a new custom key.
 */
export function resolveSkillKey(name: string, packSkills: Skill[], profile: SkillProfile): string {
  const n = normalizeSkill(name);
  const pack = packSkills.find((s) => [s.name, ...s.aliases].some((t) => normalizeSkill(t) === n));
  if (pack) return pack.id;
  const known = Object.values(profile).find((s) => normalizeSkill(s.name) === n);
  if (known) return known.key;
  return `x-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export type ExtractedSkill = { name: string; required: boolean };

/**
 * Every skill this job asks for: the user's own role-pack skills found in the text
 * (deterministic) merged with what Claude extracted, resolved against every pack.
 * Deduped by key; pack weights win.
 */
export function collectJobSkills(
  jd: string,
  extracted: ExtractedSkill[],
  ownPack: Skill[],
  packSkills: Skill[],
  profile: SkillProfile,
): JobSkill[] {
  const byKey = new Map<string, JobSkill>();
  for (const s of ownPack) {
    if (!byKey.has(s.id) && mentionsSkill(jd, s)) {
      byKey.set(s.id, { key: s.id, name: s.name, weight: s.weight, aliases: s.aliases });
    }
  }
  for (const e of extracted) {
    const key = resolveSkillKey(e.name, packSkills, profile);
    if (byKey.has(key)) continue;
    const pack = packSkills.find((s) => s.id === key);
    byKey.set(key, {
      key,
      name: pack?.name ?? profile[key]?.name ?? e.name,
      weight: pack?.weight ?? (e.required ? 4 : 2),
      aliases: pack?.aliases ?? [],
    });
  }
  return [...byKey.values()].sort((a, b) => b.weight - a.weight);
}

export type JobMatch = {
  coveragePct: number;
  /** Rated 3+: the resume may claim these. */
  matched: JobSkill[];
  /** Rated 1-2: left off the resume. */
  gaps: JobSkill[];
  /** Never rated: we have to ask before tailoring. */
  unknown: JobSkill[];
};

export function matchJob(jobSkills: JobSkill[], profile: SkillProfile): JobMatch {
  return {
    coveragePct: weightedCoverage(jobSkills, profile),
    matched: jobSkills.filter((s) => (profile[s.key]?.rating ?? 0) >= CLAIMABLE),
    gaps: jobSkills.filter((s) => profile[s.key] && profile[s.key].rating < CLAIMABLE),
    unknown: jobSkills.filter((s) => !profile[s.key]),
  };
}

/**
 * The honesty guard. A skill is flagged when the tailored resume claims it, the
 * user rated it below 3 (or never rated it), and it isn't in their own base resume.
 */
export function findUnbackedClaims(
  tailored: string,
  baseResume: string,
  skills: { key: string; name: string; aliases?: string[] }[],
  profile: SkillProfile,
): { key: string; name: string }[] {
  return skills.filter(
    (s) =>
      (profile[s.key]?.rating ?? 0) < CLAIMABLE &&
      mentionsSkill(tailored, s) &&
      !mentionsSkill(baseResume, s),
  );
}

/** Up to 3 strong skills (4+) the resume never shows evidence for: worth one line each. */
export function strengthsNeedingNotes(packSkills: Skill[], profile: SkillProfile, resume: string): Skill[] {
  return packSkills
    .filter((s) => (profile[s.id]?.rating ?? 0) >= 4 && !profile[s.id]?.note && !mentionsSkill(resume, s))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);
}
