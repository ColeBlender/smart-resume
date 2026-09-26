import "server-only";
import { redirect } from "next/navigation";
import { getPack } from "./role-packs";
import type { Answer, Answers } from "./scoring";
import { requireUser } from "./supabase/server";

/** Signed-in user with a finished profile. Sends them to onboarding otherwise. */
export async function requireProfile() {
  const { supabase, user } = await requireUser();

  const [{ data: profile }, { data: answerRows }] = await Promise.all([
    supabase.from("profiles").select("role_pack_id, base_resume").eq("user_id", user.id).maybeSingle(),
    supabase.from("skill_answers").select("skill_id, answer").eq("user_id", user.id),
  ]);

  const pack = getPack(profile?.role_pack_id);
  if (!profile?.base_resume || !pack) redirect("/onboard");

  const answers: Answers = Object.fromEntries(
    (answerRows ?? []).map((r) => [r.skill_id, r.answer as Answer]),
  );
  return { supabase, user, pack, answers, baseResume: profile.base_resume as string };
}
