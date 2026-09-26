import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { loadSkillProfile } from "@/lib/profile";
import { ROLE_PACKS } from "@/lib/role-packs";
import type { Role } from "@/lib/scoring";
import { requireUser } from "@/lib/supabase/server";
import { extractResume, finishOnboarding, prefillSkills } from "./actions";

// Resume upload (PDF via Claude) and skill pre-rating can take a little while.
export const maxDuration = 120;

export default async function OnboardPage({ searchParams }: PageProps<"/onboard">) {
  const { supabase, user } = await requireUser();
  const { redo } = await searchParams;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role_pack_id, base_resume, onboarded_at, roles")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profile?.onboarded_at && !redo) redirect("/dashboard");
  const skills = await loadSkillProfile(supabase);

  return (
    <>
      <Header user={user} />
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:items-center">
        <OnboardingWizard
          packs={ROLE_PACKS}
          actions={{ extractResume, prefillSkills, finishOnboarding }}
          initial={{
            resume: profile?.base_resume ?? "",
            packId: profile?.role_pack_id ?? undefined,
            ratings: Object.fromEntries(Object.values(skills).map((s) => [s.key, s.rating])),
            notes: Object.fromEntries(Object.values(skills).flatMap((s) => (s.note ? [[s.key, s.note]] : []))),
            usedAt: Object.fromEntries(Object.values(skills).map((s) => [s.key, s.usedAt ?? []])),
            roles: (profile?.roles as Role[] | undefined) ?? [],
          }}
        />
      </main>
    </>
  );
}
