"use server";

import { cleanUses } from "@/lib/clean-uses";
import mammoth from "mammoth";
import { prefillRatings, resumeFromPdf } from "@/lib/claude";
import { getPack } from "@/lib/role-packs";
import type { Role } from "@/lib/scoring";
import { requireUser } from "@/lib/supabase/server";

const MAX_BYTES = 5 * 1024 * 1024;

export type Prefill = { key: string; rating: number | null; evidence: string | null };
export type PrefillResult = { ratings: Prefill[]; roles: Role[] };

/** Uploaded file -> resume text. PDF goes through Claude; DOCX through mammoth; text as-is. */
export async function extractResume(formData: FormData): Promise<{ text: string } | { error: string }> {
  await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file first." };
  if (file.size > MAX_BYTES) return { error: "That file is over 5 MB." };

  const name = file.name.toLowerCase();
  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    if (name.endsWith(".pdf")) return { text: await resumeFromPdf(bytes.toString("base64")) };
    if (name.endsWith(".docx")) return { text: (await mammoth.extractRawText({ buffer: bytes })).value.trim() };
    if (name.endsWith(".txt") || name.endsWith(".md")) return { text: bytes.toString("utf8").trim() };
    return { error: "Upload a PDF, DOCX, TXT or MD file." };
  } catch (e) {
    console.error("resume extraction failed", e);
    return { error: "Couldn't read that file. Try pasting your resume instead." };
  }
}

/** Claude reads the resume and pre-rates every skill in the chosen role pack. */
export async function prefillSkills(input: {
  resume: string;
  packId: string;
}): Promise<PrefillResult | { error: string }> {
  await requireUser();
  const pack = getPack(input.packId);
  if (!pack) return { error: "Pick a role first." };
  try {
    const { ratings, roles } = await prefillRatings(
      input.resume,
      pack.skills.map((s) => ({ key: s.id, name: s.name })),
    );
    const valid = new Set(pack.skills.map((s) => s.id));
    return {
      roles,
      ratings: ratings
        .filter((r) => valid.has(r.key))
        .map((r) => ({ ...r, rating: r.rating && r.rating >= 1 && r.rating <= 5 ? Math.round(r.rating) : null })),
    };
  } catch (e) {
    console.error("prefill failed", e);
    return { error: "Couldn't pre-rate your skills. You can rate them yourself." };
  }
}

export async function finishOnboarding(input: {
  resume: string;
  packId: string;
  roles: Role[];
  skills: { key: string; name: string; rating: number; note?: string | null; usedAt?: { role: string; what: string }[] }[];
}): Promise<{ error: string } | { ok: true }> {
  const { supabase, user } = await requireUser();
  const pack = getPack(input.packId);
  if (!pack) return { error: "Pick a role first." };
  const resume = input.resume.trim();
  if (resume.length < 200) return { error: "Your resume looks too short. Paste the full thing." };
  if (resume.length > 30000) return { error: "That resume is too long (30,000 characters max)." };

  const { error } = await supabase.from("profiles").upsert({
    user_id: user.id,
    role_pack_id: pack.id,
    base_resume: resume,
    roles: input.roles.slice(0, 30),
    onboarded_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  const rows = input.skills
    .filter((s) => s.rating >= 1 && s.rating <= 5)
    .map((s) => ({
      user_id: user.id,
      skill_key: s.key,
      name: s.name,
      rating: s.rating,
      note: s.note?.trim() || null,
      used_at: cleanUses(s.usedAt),
      source: "onboarding" as const,
      updated_at: new Date().toISOString(),
    }));
  if (rows.length) {
    const { error: skillsError } = await supabase.from("user_skills").upsert(rows);
    if (skillsError) return { error: skillsError.message };
  }
  return { ok: true };
}
