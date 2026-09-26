import { Header } from "@/components/header";
import { SkillsView } from "@/components/skills-view";
import { requireProfile } from "@/lib/profile";
import { updateSkill } from "./actions";

export default async function SkillsPage() {
  const { user, skills, baseResume, roles } = await requireProfile();
  return (
    <>
      <Header user={user} />
      <SkillsView initial={Object.values(skills)} actions={{ updateSkill }} baseResume={baseResume} roles={roles} />
    </>
  );
}
