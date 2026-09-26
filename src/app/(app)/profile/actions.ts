"use server";

import { cleanUses } from "@/lib/clean-uses";
import { extractRoles } from "@/lib/claude";
import { requireUser } from "@/lib/supabase/server";

export async function updateSkill(input: {
  key: string;
  name: string;
  rating: number;
  note?: string | null;
  usedAt?: { role: string; what: string }[];
}): Promise<{ ok: true } | { error: string }> {
  const { supabase, user } = await requireUser();
  if (!(input.rating >= 1 && input.rating <= 5)) return { error: "Rating must be 1 to 5." };
  const { error } = await supabase.from("user_skills").upsert({
    user_id: user.id,
    skill_key: input.key,
    name: input.name.slice(0, 80),
    rating: Math.round(input.rating),
    note: input.note?.trim().slice(0, 500) || null,
    used_at: cleanUses(input.usedAt),
    updated_at: new Date().toISOString(),
  });
  return error ? { error: error.message } : { ok: true };
}

/** Swap the baseline resume. Ratings are about the person, so they stay; the job list is re-read. */
export async function replaceResume(resume: string): Promise<{ ok: true } | { error: string }> {
  const { supabase, user } = await requireUser();
  const text = resume.trim();
  if (text.length < 200) return { error: "Your resume looks too short. Paste the full thing." };
  if (text.length > 30000) return { error: "That resume is too long (30,000 characters max)." };
  try {
    const roles = await extractRoles(text);
    const { error } = await supabase
      .from("profiles")
      .update({ base_resume: text, roles, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    return error ? { error: error.message } : { ok: true };
  } catch (e) {
    console.error("replace resume failed", e);
    return { error: "Couldn't read that resume. Please try again." };
  }
}
