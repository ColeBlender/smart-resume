import { Header } from "@/components/header";
import { JobComposer } from "@/components/job-composer";
import { requireProfile } from "@/lib/profile";
import { analyzeJobAction, saveJobSkills, tailorJob } from "./actions";

// Analyze + build + screen (+ a guard rebuild) run inside server actions on this page.
export const maxDuration = 300;

export default async function Dashboard() {
  const { user } = await requireProfile();
  return (
    <>
      <Header user={user} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10">
        <JobComposer actions={{ analyzeJobAction, saveJobSkills, tailorJob }} />
      </main>
    </>
  );
}
