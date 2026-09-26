"use server";

import { requireUser } from "@/lib/supabase/server";

export async function updateSkill(input: {
  key: string;
  name: string;
  rating: number;
  note?: string | null;
}): Promise<{ ok: true } | { error: string }> {
  const { supabase, user } = await requireUser();
  if (!(input.rating >= 1 && input.rating <= 5)) return { error: "Rating must be 1 to 5." };
  const { error } = await supabase.from("user_skills").upsert({
    user_id: user.id,
    skill_key: input.key,
    name: input.name.slice(0, 80),
    rating: Math.round(input.rating),
    note: input.note?.trim().slice(0, 500) || null,
    updated_at: new Date().toISOString(),
  });
  return error ? { error: error.message } : { ok: true };
}
