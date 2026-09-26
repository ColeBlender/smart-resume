"use server";

import { redirect } from "next/navigation";
import { buildResume, screenResume } from "@/lib/claude";
import { requireProfile } from "@/lib/profile";
import { allowedSkillIds, findUnbackedClaims, matchJd } from "@/lib/scoring";

export async function runTailoring(input: {
  jd: string;
  company: string;
  roleTitle: string;
}): Promise<{ error: string } | void> {
  const { supabase, user, pack, answers, baseResume } = await requireProfile();

  const jd = input.jd.trim();
  if (jd.length < 200) return { error: "Paste the full job description (at least a few lines)." };
  if (jd.length > 30000) return { error: "That job description is too long (30,000 characters max)." };

  const match = matchJd(jd, pack, answers);
  const allowed = allowedSkillIds(answers);
  const confirmedSkills = pack.skills.filter((s) => allowed.has(s.id));

  let id: string;
  try {
    let draft = await buildResume({ baseResume, jd, confirmedSkills });

    // Honesty guard: one rewrite if the draft claims skills nobody confirmed.
    let flagged = findUnbackedClaims(draft.resume_md, baseResume, pack, answers);
    if (flagged.length) {
      draft = await buildResume({ baseResume, jd, confirmedSkills, mustRemove: flagged });
      flagged = findUnbackedClaims(draft.resume_md, baseResume, pack, answers);
    }

    const screen = await screenResume({ resume: draft.resume_md, jd });

    const { data, error } = await supabase
      .from("tailorings")
      .insert({
        user_id: user.id,
        company: input.company.trim() || null,
        role_title: input.roleTitle.trim() || null,
        jd_text: jd,
        result_md: draft.resume_md,
        changes: draft.changes,
        ai_score: screen.score,
        strengths: screen.strengths,
        weaknesses: screen.weaknesses,
        coverage_pct: match.coveragePct,
        matched: match.matched.map((s) => s.id),
        gaps: match.gaps.map((s) => s.id),
        flagged: flagged.map((s) => s.id),
      })
      .select("id")
      .single();
    if (error) return { error: error.message };
    id = data.id;
  } catch (e) {
    console.error("tailoring failed", e);
    return { error: e instanceof Error ? e.message : "Tailoring failed. Please try again." };
  }

  redirect(`/tailor/${id}`);
}
