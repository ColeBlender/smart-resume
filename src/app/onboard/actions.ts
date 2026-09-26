"use server";

import { redirect } from "next/navigation";
import { getPack } from "@/lib/role-packs";
import type { Answer } from "@/lib/scoring";
import { requireUser } from "@/lib/supabase/server";

const ANSWERS = new Set<Answer>(["yes", "some", "no"]);

export async function saveProfile(input: {
  rolePackId: string;
  baseResume: string;
  answers: Record<string, Answer>;
}): Promise<{ error: string } | void> {
  const { supabase, user } = await requireUser();

  const pack = getPack(input.rolePackId);
  if (!pack) return { error: "Pick a role." };
  const baseResume = input.baseResume.trim();
  if (baseResume.length < 200) return { error: "Paste your full resume (at least a few lines)." };
  if (baseResume.length > 30000) return { error: "That resume is too long (30,000 characters max)." };

  // Answers are keyed by skill id, and ids are shared across packs, so answers
  // survive switching roles. Only ids from real packs are stored.
  const known = new Set(pack.skills.map((s) => s.id));
  const rows = Object.entries(input.answers)
    .filter(([id, a]) => known.has(id) && ANSWERS.has(a))
    .map(([skill_id, answer]) => ({ user_id: user.id, skill_id, answer }));

  const { error: profileError } = await supabase.from("profiles").upsert({
    user_id: user.id,
    role_pack_id: pack.id,
    base_resume: baseResume,
    updated_at: new Date().toISOString(),
  });
  if (profileError) return { error: profileError.message };

  if (rows.length) {
    const { error } = await supabase.from("skill_answers").upsert(rows);
    if (error) return { error: error.message };
  }

  redirect("/dashboard");
}
