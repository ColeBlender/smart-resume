import { Header } from "@/components/header";
import { SkillsView } from "@/components/skills-view";
import { requireProfile } from "@/lib/profile";
import { extractResume } from "../onboard/actions";
import { replaceResume, updateSkill } from "./actions";

// Replacing the resume reads it with Claude.
export const maxDuration = 120;

export default async function SkillsPage() {
  const { user, skills, baseResume, roles } = await requireProfile();
  return (
    <>
      <Header user={user} />
      <SkillsView initial={Object.values(skills)} actions={{ updateSkill, replaceResume, extractResume }} baseResume={baseResume} roles={roles} />
    </>
  );
}
