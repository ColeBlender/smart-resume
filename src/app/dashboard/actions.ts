"use server";

import { cleanUses } from "@/lib/clean-uses";
import { analyzeJob, buildResume, extractRoles, screenResume, type JobAnalysis } from "@/lib/claude";
import type { ReadyResume } from "@/components/resume-ready-dialog";
import { requireProfile } from "@/lib/profile";
import { ALL_SKILLS } from "@/lib/role-packs";
import { CLAIMABLE, collectJobSkills, findUnbackedClaims, matchJob, type JobSkill, type Role } from "@/lib/scoring";
import { requireUser } from "@/lib/supabase/server";

function validJd(jd: string): string | null {
  const t = jd.trim();
  if (t.length < 200) return "Paste the full job description (a few paragraphs).";
  if (t.length > 30000) return "That job description is too long (30,000 characters max).";
  return null;
}

/** Step 1: what does this job ask for, and what don't we know about the user yet? */
export async function analyzeJobAction(
  jd: string,
): Promise<{ analysis: JobAnalysis; unknown: JobSkill[]; roles: Role[] } | { error: string }> {
  const invalid = validJd(jd);
  if (invalid) return { error: invalid };
  const { supabase, user, skills, pack, baseResume, roles } = await requireProfile();
  try {
    const analysis = await analyzeJob(jd);
    const jobSkills = collectJobSkills(jd, analysis.skills, pack.skills, ALL_SKILLS, skills);
    const unknown = matchJob(jobSkills, skills).unknown;
    // Profiles made before roles existed: parse them once, the first time we need to ask.
    let known = roles;
    if (unknown.length && !known.length) {
      known = await extractRoles(baseResume);
      await supabase.from("profiles").update({ roles: known }).eq("user_id", user.id);
    }
    return { analysis, unknown, roles: known };
  } catch (e) {
    console.error("analyze failed", e);
    return { error: e instanceof Error ? e.message : "Couldn't read that job description." };
  }
}

/** Step 2 (only when needed): the user tells us about skills we hadn't seen. Saved to their profile for good. */
export async function saveJobSkills(
  entries: { key: string; name: string; rating: number; note?: string | null; usedAt?: { role: string; what: string }[] }[],
): Promise<{ ok: true } | { error: string }> {
  const { supabase, user } = await requireUser();
  const rows = entries
    .filter((e) => e.rating >= 1 && e.rating <= 5 && e.key && e.name)
    .map((e) => ({
      user_id: user.id,
      skill_key: e.key,
      name: e.name.slice(0, 80),
      rating: Math.round(e.rating),
      note: e.note?.trim().slice(0, 500) || null,
      used_at: cleanUses(e.usedAt),
      source: "job" as const,
      updated_at: new Date().toISOString(),
    }));
  if (!rows.length) return { ok: true };
  const { error } = await supabase.from("user_skills").upsert(rows);
  return error ? { error: error.message } : { ok: true };
}

/** Step 3: build → honesty guard → (rebuild) → screen → save. */
export async function tailorJob(input: {
  jd: string;
  analysis: JobAnalysis;
}): Promise<ReadyResume | { error: string }> {
  const invalid = validJd(input.jd);
  if (invalid) return { error: invalid };
  const { supabase, user, pack, skills, baseResume } = await requireProfile();
  const jd = input.jd.trim();

  const jobSkills = collectJobSkills(jd, input.analysis.skills, pack.skills, ALL_SKILLS, skills);
  const match = matchJob(jobSkills, skills);
  const confirmed = Object.values(skills).filter((s) => s.rating >= CLAIMABLE);

  // Guard every skill we can name: all role-pack skills, this job's skills, and the user's own.
  const guardable = [
    ...new Map(
      [
        ...ALL_SKILLS.map((s) => ({ key: s.id, name: s.name, aliases: s.aliases })),
        ...jobSkills,
        ...Object.values(skills).map((s) => ({ key: s.key, name: s.name, aliases: [] })),
      ].map((s) => [s.key, s]),
    ).values(),
  ];

  try {
    let draft = await buildResume({ baseResume, jd, confirmed });
    let flagged = findUnbackedClaims(draft.resume_md, baseResume, guardable, skills);
    if (flagged.length) {
      draft = await buildResume({ baseResume, jd, confirmed, mustRemove: flagged.map((s) => s.name) });
      flagged = findUnbackedClaims(draft.resume_md, baseResume, guardable, skills);
    }
    const screen = await screenResume({ resume: draft.resume_md, jd });

    const title = input.analysis.role_title?.slice(0, 120) || "Tailored resume";
    const { data, error } = await supabase
      .from("tailorings")
      .insert({
        user_id: user.id,
        company: input.analysis.company?.slice(0, 120) || null,
        role_title: title,
        jd_text: jd,
        result_md: draft.resume_md,
        changes: draft.changes,
        ai_score: screen.score,
        strengths: screen.strengths,
        weaknesses: screen.weaknesses,
        coverage_pct: match.coveragePct,
        matched: match.matched.map((s) => s.key),
        gaps: [...match.gaps, ...match.unknown].map((s) => s.key),
        flagged: flagged.map((s) => s.key),
        skill_names: Object.fromEntries([...jobSkills, ...flagged].map((s) => [s.key, s.name])),
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    return {
      id: data.id,
      title,
      company: input.analysis.company ?? null,
      score: screen.score,
      coverage: match.coveragePct,
      flagged: flagged.length,
      markdown: draft.resume_md,
    };
  } catch (e) {
    console.error("tailoring failed", e);
    return { error: e instanceof Error ? e.message : "Tailoring failed. Please try again." };
  }
}
