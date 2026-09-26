import "server-only";
import { redirect } from "next/navigation";
import { getPack } from "./role-packs";
import type { Rating, Role, SkillProfile, SkillUse } from "./scoring";

const toUses = (raw: unknown): SkillUse[] =>
  Array.isArray(raw)
    ? raw.map((u) => (typeof u === "string" ? { role: u, what: "" } : (u as SkillUse))).filter((u) => u?.role)
    : [];
import { requireUser } from "./supabase/server";

/** Everything the user has told us about their skills, keyed by skill key. */
export async function loadSkillProfile(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
): Promise<SkillProfile> {
  const { data } = await supabase.from("user_skills").select("skill_key, name, rating, note, used_at");
  return Object.fromEntries(
    (data ?? []).map((r) => [
      r.skill_key,
      { key: r.skill_key, name: r.name, rating: r.rating as Rating, note: r.note, usedAt: toUses(r.used_at) },
    ]),
  );
}

/** Signed-in user who finished onboarding. Sends them to onboarding otherwise. */
export async function requireProfile() {
  const { supabase, user } = await requireUser();

  const [{ data: profile }, skills] = await Promise.all([
    supabase
      .from("profiles")
      .select("role_pack_id, base_resume, onboarded_at, roles")
      .eq("user_id", user.id)
      .maybeSingle(),
    loadSkillProfile(supabase),
  ]);

  const pack = getPack(profile?.role_pack_id);
  if (!profile?.onboarded_at || !profile.base_resume || !pack) redirect("/onboard");

  return {
    supabase,
    user,
    pack,
    skills,
    baseResume: profile.base_resume as string,
    roles: (profile.roles as Role[]) ?? [],
  };
}
