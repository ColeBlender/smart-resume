import { Header } from "@/components/header";
import { ROLE_PACKS } from "@/lib/role-packs";
import type { Answer } from "@/lib/scoring";
import { requireUser } from "@/lib/supabase/server";
import { OnboardForm } from "./onboard-form";

export default async function OnboardPage() {
  const { supabase, user } = await requireUser();

  const [{ data: profile }, { data: answerRows }] = await Promise.all([
    supabase.from("profiles").select("role_pack_id, base_resume").eq("user_id", user.id).maybeSingle(),
    supabase.from("skill_answers").select("skill_id, answer").eq("user_id", user.id),
  ]);

  const answers = Object.fromEntries((answerRows ?? []).map((r) => [r.skill_id, r.answer as Answer]));

  return (
    <>
      <Header email={user.email} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="font-serif text-3xl font-semibold">{profile ? "Your skills" : "Set up your profile"}</h1>
        <p className="mt-2 text-muted">
          Be honest: this list is the fence. Tailored resumes can only claim what you confirm here or already
          wrote in your resume.
        </p>
        <OnboardForm
          packs={ROLE_PACKS}
          initialPackId={profile?.role_pack_id ?? ROLE_PACKS[0].id}
          initialResume={profile?.base_resume ?? ""}
          initialAnswers={answers}
        />
      </main>
    </>
  );
}
